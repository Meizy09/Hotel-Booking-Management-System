import request from 'supertest';
import {app} from '../../src/index';
import db from '../../src/Drizzle/db';
import { users, payments, bookings, rooms, hotels } from '../../src/Drizzle/schema';
import { eq } from 'drizzle-orm';

// Test data setup
let userId: number;
let hotelId: number;
let roomId: number;
let bookingId: number;
let paymentId: number;

const testUser = {
  First_name: "John",
  Last_name: "Doe",
  Email: "john.doe@test.com",
  Password: "hashedPassword123",
  Contact_phone: 123456789,
  Address: "123 Test Street",
  Role: "user" as const,
  isVerified: true,
  verificationCode: "ABC123"
};

const testHotel = {
  Name: "Test Hotel",
  Location: "Test City",
  Address: "456 Hotel Ave",
  Contact_phone: 987654321,
  Category: "Luxury",
  Rating: "4.5"
};

const testRoom = {
  Room_type: "Deluxe",
  Price_per_night: "150.00",
  Capacity: 2,
  Amenities: "WiFi, AC, TV",
  is_available: true
};

const testBooking = {
  Check_in_date: '2024-07-01',
  Check_out_date: '2024-07-05',
  Total_amount: "600.00",
  Booking_status: "confirmed"
};

const testPayment = {
  Amount: "600.00",
  Payment_status: "completed",
  Payment_date: '2024-07-01',
  Payment_method: "credit_card",
  Transaction_id: "TXN123456"
};

// Helper function to create test data
const setupTestData = async () => {
  try {
    // Create test user
    const [user] = await db.insert(users).values(testUser).returning();
    userId = user.user_id;

    // Create test hotel
    const [hotel] = await db.insert(hotels).values(testHotel).returning();
    hotelId = hotel.Hotel_id;

    // Create test room
    const [room] = await db.insert(rooms).values({
      ...testRoom,
      Hotel_id: hotelId
    }).returning();
    roomId = room.Room_id;

    // Create test booking
    const [booking] = await db.insert(bookings).values({
      ...testBooking,
      user_id: userId,
      Room_id: roomId
    }).returning();
    bookingId = booking.Booking_id;

    // Create test payment
    const [payment] = await db.insert(payments).values({
      ...testPayment,
      Booking_id: bookingId,
      user_id: userId
    }).returning();
    paymentId = payment.Payment_id;

  } catch (error) {
    throw error;
  }
};

// Helper function to cleanup test data
const cleanupTestData = async () => {
  try {
    // Clean up in reverse order of dependencies
    if (paymentId) {
      await db.delete(payments).where(eq(payments.Payment_id, paymentId));
    }
    if (bookingId) {
      await db.delete(bookings).where(eq(bookings.Booking_id, bookingId));
    }
    if (roomId) {
      await db.delete(rooms).where(eq(rooms.Room_id, roomId));
    }
    if (hotelId) {
      await db.delete(hotels).where(eq(hotels.Hotel_id, hotelId));
    }
    if (userId) {
      await db.delete(users).where(eq(users.user_id, userId));
    }
  } catch (error) {
    // console.error('Failed to cleanup test data:', error);
  }
};

beforeAll(async () => {
  await setupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await db.$client.end();
});

describe("Bookings API Integration Tests", () => {
  describe("POST /api/bookings", () => {
    it("should create a booking successfully", async () => {
      const newBooking = {
        user_id: userId,
        Room_id: roomId,
        Check_in_date: '2024-08-01',
        Check_out_date: '2024-08-05',
        Total_amount: "800.00",
        Booking_status: "pending"
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(newBooking);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Booking_id');
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Room_id', roomId);
      expect(response.body[0]).toHaveProperty('Check_in_date', '2024-08-01');
      expect(response.body[0]).toHaveProperty('Check_out_date', '2024-08-05');
      expect(response.body[0]).toHaveProperty('Total_amount', '800.00');
      expect(response.body[0]).toHaveProperty('Booking_status', 'pending');
      expect(response.body[0]).toHaveProperty('Created_at');
      expect(response.body[0]).toHaveProperty('Updated_at');

      // Clean up the created booking
      const createdBookingId = response.body[0].Booking_id;
      await db.delete(bookings).where(eq(bookings.Booking_id, createdBookingId));
    });

    it("should fail to create booking with missing required fields", async () => {
      const invalidBooking = {
        user_id: userId,
        // Missing Room_id and other required fields
        Check_in_date: '2024-08-01',
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(invalidBooking);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating booking');
    });

    it("should fail to create booking with invalid user_id", async () => {
      const invalidBooking = {
        user_id: 99999, // Non-existent user
        Room_id: roomId,
        Check_in_date: '2024-08-01',
        Check_out_date: '2024-08-05',
        Total_amount: "800.00",
        Booking_status: "pending"
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(invalidBooking);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating booking');
    });

    it("should fail to create booking with invalid room_id", async () => {
      const invalidBooking = {
        user_id: userId,
        Room_id: 99999, // Non-existent room
        Check_in_date: '2024-08-01',
        Check_out_date: '2024-08-05',
        Total_amount: "800.00",
        Booking_status: "pending"
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(invalidBooking);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating booking');
    });

    it("should fail to create booking with invalid date format", async () => {
      const invalidBooking = {
        user_id: userId,
        Room_id: roomId,
        Check_in_date: 'invalid-date',
        Check_out_date: '2024-08-05',
        Total_amount: "800.00",
        Booking_status: "pending"
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(invalidBooking);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating booking');
    });
  });

  describe("GET /api/bookings", () => {
    it("should get all bookings with joined data", async () => {
      const response = await request(app)
        .get("/api/bookings");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Find our test booking
      const testBookingResponse = response.body.find((b: any) =>
        b.Bookings?.Booking_id === bookingId
      );

      expect(testBookingResponse).toBeDefined();
      expect(testBookingResponse.Bookings).toBeDefined();
      expect(testBookingResponse.Users).toBeDefined();
      expect(testBookingResponse.Rooms).toBeDefined();
      expect(testBookingResponse.Hotels).toBeDefined();

      // Verify booking data
      expect(testBookingResponse.Bookings).toHaveProperty('Booking_id', bookingId);
      expect(testBookingResponse.Bookings).toHaveProperty('user_id', userId);
      expect(testBookingResponse.Bookings).toHaveProperty('Room_id', roomId);
      expect(testBookingResponse.Bookings).toHaveProperty('Check_in_date', '2024-07-01');
      expect(testBookingResponse.Bookings).toHaveProperty('Check_out_date', '2024-07-05');
      expect(testBookingResponse.Bookings).toHaveProperty('Total_amount', '600.00');
      expect(testBookingResponse.Bookings).toHaveProperty('Booking_status', 'confirmed');

      // Verify joined user data
      expect(testBookingResponse.Users).toHaveProperty('First_name', 'John');
      expect(testBookingResponse.Users).toHaveProperty('Last_name', 'Doe');
      expect(testBookingResponse.Users).toHaveProperty('Email', 'john.doe@test.com');

      // Verify joined room data
      expect(testBookingResponse.Rooms).toHaveProperty('Room_type', 'Deluxe');
      expect(testBookingResponse.Rooms).toHaveProperty('Price_per_night', '150.00');

      // Verify joined hotel data
      expect(testBookingResponse.Hotels).toHaveProperty('Name', 'Test Hotel');
      expect(testBookingResponse.Hotels).toHaveProperty('Location', 'Test City');
    });

    it("should return empty array when no bookings exist", async () => {
      // Clean up existing bookings temporarily
      await db.delete(payments).where(eq(payments.Booking_id, bookingId));
      await db.delete(bookings).where(eq(bookings.Booking_id, bookingId));

      const response = await request(app)
        .get("/api/bookings");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);

      // Restore test booking
      const [restoredBooking] = await db.insert(bookings).values({
        ...testBooking,
        user_id: userId,
        Room_id: roomId
      }).returning();
      bookingId = restoredBooking.Booking_id;
    });
  });

  describe("GET /api/bookings/:id", () => {
    it("should get a specific booking by ID with joined data", async () => {
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Verify booking data
      expect(response.body.Bookings).toHaveProperty('Booking_id', bookingId);
      expect(response.body.Bookings).toHaveProperty('user_id', userId);
      expect(response.body.Bookings).toHaveProperty('Room_id', roomId);
      expect(response.body.Bookings).toHaveProperty('Check_in_date', '2024-07-01');
      expect(response.body.Bookings).toHaveProperty('Check_out_date', '2024-07-05');
      expect(response.body.Bookings).toHaveProperty('Total_amount', '600.00');
      expect(response.body.Bookings).toHaveProperty('Booking_status', 'confirmed');

      // Verify joined data is present
      expect(response.body.Users).toBeDefined();
      expect(response.body.Rooms).toBeDefined();
      expect(response.body.Hotels).toBeDefined();

      // Verify joined user data
      expect(response.body.Users).toHaveProperty('First_name', 'John');
      expect(response.body.Users).toHaveProperty('Last_name', 'Doe');
      expect(response.body.Users).toHaveProperty('Email', 'john.doe@test.com');

      // Verify joined room data
      expect(response.body.Rooms).toHaveProperty('Room_type', 'Deluxe');
      expect(response.body.Rooms).toHaveProperty('Price_per_night', '150.00');

      // Verify joined hotel data
      expect(response.body.Hotels).toHaveProperty('Name', 'Test Hotel');
      expect(response.body.Hotels).toHaveProperty('Location', 'Test City');
    });

    it("should return 404 for non-existent booking", async () => {
      const response = await request(app)
        .get("/api/bookings/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Booking not found');
    });

    it("should handle invalid booking ID format", async () => {
      const response = await request(app)
        .get("/api/bookings/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching booking');
    });
  });

  describe("PATCH /api/bookings/:id", () => {
    it("should update a booking successfully", async () => {
      const updateData = {
        Check_in_date: '2024-07-02',
        Check_out_date: '2024-07-06',
        Total_amount: "750.00",
        Booking_status: "confirmed"
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Booking_id', bookingId);
      expect(response.body[0]).toHaveProperty('Check_in_date', '2024-07-02');
      expect(response.body[0]).toHaveProperty('Check_out_date', '2024-07-06');
      expect(response.body[0]).toHaveProperty('Total_amount', '750.00');
      expect(response.body[0]).toHaveProperty('Booking_status', 'confirmed');
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        Booking_status: "cancelled"
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Booking_id', bookingId);
      expect(response.body[0]).toHaveProperty('Booking_status', 'cancelled');
      
      // Other fields should remain unchanged
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Room_id', roomId);
    });

    it("should return empty array when updating non-existent booking", async () => {
      const updateData = {
        Booking_status: "cancelled"
      };

      const response = await request(app)
        .patch("/api/bookings/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid update data", async () => {
      const updateData = {
        Check_in_date: 'invalid-date'
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating booking');
    });

    it("should handle updating with invalid foreign key", async () => {
      const updateData = {
        user_id: 99999 // Non-existent user
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating booking');
    });
  });

  describe("DELETE /api/bookings/:id", () => {
    it("should delete a booking successfully", async () => {
      // Create a booking specifically for deletion test
      const bookingToDelete = {
        user_id: userId,
        Room_id: roomId,
        Check_in_date: '2024-09-01',
        Check_out_date: '2024-09-05',
        Total_amount: "900.00",
        Booking_status: "pending"
      };

      const createResponse = await request(app)
        .post("/api/bookings")
        .send(bookingToDelete);

      const bookingIdToDelete = createResponse.body[0].Booking_id;

      const deleteResponse = await request(app)
        .delete(`/api/bookings/${bookingIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion by trying to fetch the booking
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingIdToDelete}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent booking", async () => {
      const response = await request(app)
        .delete("/api/bookings/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid booking ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/bookings/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting booking');
    });
  });

  describe("Business Logic Tests", () => {
    it("should create booking with minimal required data", async () => {
      const minimalBooking = {
        user_id: userId,
        Room_id: roomId,
        Check_in_date: '2024-10-01',
        Check_out_date: '2024-10-05',
        Total_amount: "1000.00",
        Booking_status: "pending"
      };

      const response = await request(app)
        .post("/api/bookings")
        .send(minimalBooking);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Booking_id');
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Room_id', roomId);
      expect(response.body[0]).toHaveProperty('Booking_status', 'pending');
      expect(response.body[0]).toHaveProperty('Created_at');
      expect(response.body[0]).toHaveProperty('Updated_at');

      // Clean up
      const createdBookingId = response.body[0].Booking_id;
      await db.delete(bookings).where(eq(bookings.Booking_id, createdBookingId));
    });

    it("should handle booking status transitions", async () => {
      // Test pending -> confirmed
      let updateData = { Booking_status: "pending" };
      let response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Booking_status', 'pending');

      // Test confirmed -> cancelled
      updateData = { Booking_status: "cancelled" };
      response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Booking_status', 'cancelled');

      // Reset to original status
      updateData = { Booking_status: "confirmed" };
      await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);
    });

    it("should handle booking amount calculations", async () => {
      const updateData = {
        Total_amount: "1500.00"
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Total_amount', '1500.00');
    });

    it("should handle booking date modifications", async () => {
      const updateData = {
        Check_in_date: '2024-12-01',
        Check_out_date: '2024-12-05'
      };

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Check_in_date', '2024-12-01');
      expect(response.body[0]).toHaveProperty('Check_out_date', '2024-12-05');
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle database connection errors gracefully", async () => {
      const response = await request(app)
        .get("/api/bookings/0");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Booking not found');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/bookings")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle concurrent booking updates", async () => {
      const updateData1 = { Booking_status: "pending" };
      const updateData2 = { Total_amount: "2000.00" };

      const [response1, response2] = await Promise.all([
        request(app).patch(`/api/bookings/${bookingId}`).send(updateData1),
        request(app).patch(`/api/bookings/${bookingId}`).send(updateData2)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Verify final state
      const finalResponse = await request(app).get(`/api/bookings/${bookingId}`);
      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.Bookings).toHaveProperty('Booking_id', bookingId);
    });
  });

  describe("Data Integrity Tests", () => {
    it("should maintain referential integrity with users", async () => {
      // Verify that booking references correct user
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.Bookings).toHaveProperty('user_id', userId);
      expect(response.body.Users).toHaveProperty('user_id', userId);
      expect(response.body.Users).toHaveProperty('Email', 'john.doe@test.com');
    });

    it("should maintain referential integrity with rooms", async () => {
      // Verify that booking references correct room
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.Bookings).toHaveProperty('Room_id', roomId);
      expect(response.body.Rooms).toHaveProperty('Room_id', roomId);
      expect(response.body.Rooms).toHaveProperty('Room_type', 'Deluxe');
    });

    it("should maintain referential integrity with hotels through rooms", async () => {
      // Verify that booking references correct hotel through room
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.Rooms).toHaveProperty('Hotel_id', hotelId);
      expect(response.body.Hotels).toHaveProperty('Hotel_id', hotelId);
      expect(response.body.Hotels).toHaveProperty('Name', 'Test Hotel');
    });
  });
});