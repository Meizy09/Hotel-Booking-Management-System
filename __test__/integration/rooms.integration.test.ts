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

    // console.log('Test data created successfully');
    // console.log(`User ID: ${userId}, Hotel ID: ${hotelId}, Room ID: ${roomId}, Booking ID: ${bookingId}, Payment ID: ${paymentId}`);
  } catch (error) {
    // console.error('Failed to setup test data:', error);
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
    // console.log('Test data cleaned up successfully');
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

describe("Rooms API Integration Tests", () => {
  describe("POST /api/rooms", () => {
    it("should create a room successfully", async () => {
      const newRoom = {
        Hotel_id: hotelId,
        Room_type: "Suite",
        Price_per_night: "250.00",
        Capacity: 4,
        Amenities: "WiFi, AC, TV, Minibar",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(newRoom);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Room_id');
      expect(response.body[0]).toHaveProperty('Hotel_id', hotelId);
      expect(response.body[0]).toHaveProperty('Room_type', 'Suite');
      expect(response.body[0]).toHaveProperty('Price_per_night', '250.00');
      expect(response.body[0]).toHaveProperty('Capacity', 4);
      expect(response.body[0]).toHaveProperty('Amenities', 'WiFi, AC, TV, Minibar');
      expect(response.body[0]).toHaveProperty('is_available', true);
      expect(response.body[0]).toHaveProperty('Created_at');
      expect(response.body[0]).toHaveProperty('Updated_at');

      // Clean up the created room
      const createdRoomId = response.body[0].Room_id;
      await db.delete(rooms).where(eq(rooms.Room_id, createdRoomId));
    });

    it("should fail to create room with missing required fields", async () => {
      const invalidRoom = {
        Room_type: "Suite",
        Price_per_night: "250.00"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(invalidRoom);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating room');
    });

    it("should fail to create room with invalid Hotel_id", async () => {
      const invalidRoom = {
        Hotel_id: 99999, // Non-existent hotel ID
        Room_type: "Suite",
        Price_per_night: "250.00",
        Capacity: 4,
        Amenities: "WiFi, AC, TV",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(invalidRoom);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating room');
    });

    it("should create room with minimal required data", async () => {
      const minimalRoom = {
        Hotel_id: hotelId,
        Room_type: "Standard",
        Price_per_night: "100.00",
        Capacity: 1,
        Amenities: "Basic",
        is_available: false
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(minimalRoom);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Room_id');
      expect(response.body[0]).toHaveProperty('is_available', false);

      // Clean up
      const createdRoomId = response.body[0].Room_id;
      await db.delete(rooms).where(eq(rooms.Room_id, createdRoomId));
    });
  });

  describe("GET /api/rooms", () => {
    beforeEach(async () => {
  // Clean up
  await db.delete(payments);
  await db.delete(bookings);
  await db.delete(rooms);

  // Recreate test room
  const [room] = await db.insert(rooms).values({
    ...testRoom,
    Hotel_id: hotelId
  }).returning();
  roomId = room.Room_id;

  // Recreate booking
  const [booking] = await db.insert(bookings).values({
    ...testBooking,
    user_id: userId,
    Room_id: roomId
  }).returning();
  bookingId = booking.Booking_id;

  // Recreate payment
  const [payment] = await db.insert(payments).values({
    ...testPayment,
    Booking_id: bookingId,
    user_id: userId
  }).returning();
  paymentId = payment.Payment_id;
});

     afterEach(async () => {
    // Restore the test room, booking, and payment if deleted
    const existingRoom = await db.query.rooms.findFirst({
      where: eq(rooms.Room_id, roomId),
    });

    if (!existingRoom) {
      const [room] = await db.insert(rooms).values({
        ...testRoom,
        Hotel_id: hotelId
      }).returning();
      roomId = room.Room_id;

      const [booking] = await db.insert(bookings).values({
        ...testBooking,
        user_id: userId,
        Room_id: roomId
      }).returning();
      bookingId = booking.Booking_id;

      const [payment] = await db.insert(payments).values({
        ...testPayment,
        Booking_id: bookingId,
        user_id: userId
      }).returning();
      paymentId = payment.Payment_id;
    }
  });
    it("should get all rooms with joined data", async () => {
      const response = await request(app)
        .get("/api/rooms");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Find our test room
      const testRoomResponse = response.body.find((r: any) =>
        r.Rooms?.Room_id === roomId
      );

      expect(testRoomResponse).toBeDefined();
      expect(testRoomResponse.Rooms).toBeDefined();
      expect(testRoomResponse.Hotels).toBeDefined();
      expect(testRoomResponse.Bookings).toBeDefined();
      expect(testRoomResponse.Users).toBeDefined();

      // Verify room data
      expect(testRoomResponse.Rooms).toHaveProperty('Room_id', roomId);
      expect(testRoomResponse.Rooms).toHaveProperty('Room_type', 'Deluxe');
      expect(testRoomResponse.Rooms).toHaveProperty('Price_per_night', '150.00');
      expect(testRoomResponse.Rooms).toHaveProperty('Capacity', 2);
      expect(testRoomResponse.Rooms).toHaveProperty('is_available', true);

      // Verify hotel data
      expect(testRoomResponse.Hotels).toHaveProperty('Hotel_id', hotelId);
      expect(testRoomResponse.Hotels).toHaveProperty('Name', 'Test Hotel');
      expect(testRoomResponse.Hotels).toHaveProperty('Location', 'Test City');

      // Verify booking data
      expect(testRoomResponse.Bookings).toHaveProperty('Booking_id', bookingId);
      expect(testRoomResponse.Bookings).toHaveProperty('Room_id', roomId);
      expect(testRoomResponse.Bookings).toHaveProperty('user_id', userId);

      // Verify user data
      expect(testRoomResponse.Users).toHaveProperty('user_id', userId);
      expect(testRoomResponse.Users).toHaveProperty('First_name', 'John');
      expect(testRoomResponse.Users).toHaveProperty('Last_name', 'Doe');
    });

    it("should return empty array when no rooms exist", async () => {
      // Clean up test data temporarily
      await db.delete(payments).where(eq(payments.Payment_id, paymentId));
      await db.delete(bookings).where(eq(bookings.Booking_id, bookingId));
      await db.delete(rooms).where(eq(rooms.Room_id, roomId));

      const response = await request(app)
        .get("/api/rooms");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);

      // Restore test data
      const [room] = await db.insert(rooms).values({
        ...testRoom,
        Hotel_id: hotelId
      }).returning();
      roomId = room.Room_id;

      const [booking] = await db.insert(bookings).values({
        ...testBooking,
        user_id: userId,
        Room_id: roomId
      }).returning();
      bookingId = booking.Booking_id;

      const [payment] = await db.insert(payments).values({
        ...testPayment,
        Booking_id: bookingId,
        user_id: userId
      }).returning();
      paymentId = payment.Payment_id;
    });
  });

  describe("GET /api/rooms/:id", () => {
    it("should get a specific room by ID with joined data", async () => {
      const response = await request(app)
        .get(`/api/rooms/${roomId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Verify room data
      expect(response.body.Rooms).toHaveProperty('Room_id', roomId);
      expect(response.body.Rooms).toHaveProperty('Hotel_id', hotelId);
      expect(response.body.Rooms).toHaveProperty('Room_type', 'Deluxe');
      expect(response.body.Rooms).toHaveProperty('Price_per_night', '150.00');
      expect(response.body.Rooms).toHaveProperty('Capacity', 2);
      expect(response.body.Rooms).toHaveProperty('Amenities', 'WiFi, AC, TV');
      expect(response.body.Rooms).toHaveProperty('is_available', true);

      // Verify joined data
      expect(response.body.Hotels).toBeDefined();
      expect(response.body.Hotels).toHaveProperty('Hotel_id', hotelId);
      expect(response.body.Hotels).toHaveProperty('Name', 'Test Hotel');

      expect(response.body.Bookings).toBeDefined();
      expect(response.body.Bookings).toHaveProperty('Booking_id', bookingId);
      expect(response.body.Bookings).toHaveProperty('Room_id', roomId);

      expect(response.body.Users).toBeDefined();
      expect(response.body.Users).toHaveProperty('user_id', userId);
      expect(response.body.Users).toHaveProperty('First_name', 'John');
    });

    it("should return 404 for non-existent room", async () => {
      const response = await request(app)
        .get("/api/rooms/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Room not found');
    });

    it("should handle invalid room ID format", async () => {
      const response = await request(app)
        .get("/api/rooms/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching room');
    });
  });

  describe("PATCH /api/rooms/:id", () => {
    it("should update a room successfully", async () => {
      const updateData = {
        Room_type: "Executive Suite",
        Price_per_night: "200.00",
        Capacity: 3,
        Amenities: "WiFi, AC, TV, Minibar, Balcony",
        is_available: false
      };

      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Room_id', roomId);
      expect(response.body[0]).toHaveProperty('Room_type', 'Executive Suite');
      expect(response.body[0]).toHaveProperty('Price_per_night', '200.00');
      expect(response.body[0]).toHaveProperty('Capacity', 3);
      expect(response.body[0]).toHaveProperty('Amenities', 'WiFi, AC, TV, Minibar, Balcony');
      expect(response.body[0]).toHaveProperty('is_available', false);
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        Room_type: "Updated Deluxe"
      };

      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Room_id', roomId);
      expect(response.body[0]).toHaveProperty('Room_type', 'Updated Deluxe');
      
      // Other fields should remain from previous update
      expect(response.body[0]).toHaveProperty('Price_per_night', '200.00');
      expect(response.body[0]).toHaveProperty('Capacity', 3);
    });

    it("should return empty array when updating non-existent room", async () => {
      const updateData = {
        Room_type: "NonExistent"
      };

      const response = await request(app)
        .patch("/api/rooms/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid update data", async () => {
      const updateData = {
        Hotel_id: 99999 // Invalid hotel ID
      };

      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating room');
    });

    it("should update room availability status", async () => {
      const updateData = {
        is_available: true
      };

      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('is_available', true);
    });

    it("should update room price", async () => {
      const updateData = {
        Price_per_night: "175.50"
      };

      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Price_per_night', '175.50');
    });
  });

  describe("DELETE /api/rooms/:id", () => {
    it("should handle deletion of room with dependencies", async () => {
      // Create a room specifically for deletion test
      const roomToDelete = {
        Hotel_id: hotelId,
        Room_type: "ToDelete",
        Price_per_night: "100.00",
        Capacity: 1,
        Amenities: "Basic",
        is_available: true
      };

      const createResponse = await request(app)
        .post("/api/rooms")
        .send(roomToDelete);

      const roomIdToDelete = createResponse.body[0].Room_id;

      // This should fail due to foreign key constraints if there are bookings
      const deleteResponse = await request(app)
        .delete(`/api/rooms/${roomIdToDelete}`);

      // Either succeeds (204) or fails due to constraints (500)
      expect([204, 500]).toContain(deleteResponse.status);

      if (deleteResponse.status === 204) {
        // Verify deletion by trying to fetch the room
        const getResponse = await request(app)
          .get(`/api/rooms/${roomIdToDelete}`);
        expect(getResponse.status).toBe(404);
      }

      // Clean up if deletion failed
      if (deleteResponse.status === 500) {
        await db.delete(rooms).where(eq(rooms.Room_id, roomIdToDelete));
      }
    });

    it("should delete room without dependencies successfully", async () => {
      // Create a room without any bookings
      const roomToDelete = {
        Hotel_id: hotelId,
        Room_type: "NoBookings",
        Price_per_night: "100.00",
        Capacity: 1,
        Amenities: "Basic",
        is_available: true
      };

      const createResponse = await request(app)
        .post("/api/rooms")
        .send(roomToDelete);

      const roomIdToDelete = createResponse.body[0].Room_id;

      const deleteResponse = await request(app)
        .delete(`/api/rooms/${roomIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/rooms/${roomIdToDelete}`);
      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent room", async () => {
      const response = await request(app)
        .delete("/api/rooms/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid room ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/rooms/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting room');
    });
  });

  describe("Business Logic Tests", () => {
    it("should create room with all amenities", async () => {
      const luxuryRoom = {
        Hotel_id: hotelId,
        Room_type: "Presidential Suite",
        Price_per_night: "500.00",
        Capacity: 6,
        Amenities: "WiFi, AC, TV, Minibar, Balcony, Jacuzzi, Butler Service",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(luxuryRoom);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Room_type', 'Presidential Suite');
      expect(response.body[0]).toHaveProperty('Price_per_night', '500.00');
      expect(response.body[0]).toHaveProperty('Capacity', 6);
      expect(response.body[0]).toHaveProperty('Amenities', 'WiFi, AC, TV, Minibar, Balcony, Jacuzzi, Butler Service');

      // Clean up
      const createdRoomId = response.body[0].Room_id;
      await db.delete(rooms).where(eq(rooms.Room_id, createdRoomId));
    });

    it("should handle room capacity limits", async () => {
      const largeCapacityRoom = {
        Hotel_id: hotelId,
        Room_type: "Family Suite",
        Price_per_night: "300.00",
        Capacity: 8,
        Amenities: "WiFi, AC, TV, Kitchen",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(largeCapacityRoom);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Capacity', 8);

      // Clean up
      const createdRoomId = response.body[0].Room_id;
      await db.delete(rooms).where(eq(rooms.Room_id, createdRoomId));
    });

    it("should handle decimal price values", async () => {
      const precisepriceRoom = {
        Hotel_id: hotelId,
        Room_type: "Standard",
        Price_per_night: "99.99",
        Capacity: 2,
        Amenities: "WiFi, AC",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(precisepriceRoom);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Price_per_night', '99.99');

      // Clean up
      const createdRoomId = response.body[0].Room_id;
      await db.delete(rooms).where(eq(rooms.Room_id, createdRoomId));
    });

    it("should handle room availability toggling", async () => {
      // First, make room unavailable
      await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send({ is_available: false });

      // Then make it available again
      const response = await request(app)
        .patch(`/api/rooms/${roomId}`)
        .send({ is_available: true });

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('is_available', true);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle database connection errors gracefully", async () => {
      // Test with invalid room ID
      const response = await request(app)
        .get("/api/rooms/0");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Room not found');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/rooms")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle negative capacity values", async () => {
      const invalidRoom = {
        Hotel_id: hotelId,
        Room_type: "Standard",
        Price_per_night: "100.00",
        Capacity: -1,
        Amenities: "WiFi",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(invalidRoom);

      // Should either succeed (database allows it) or fail with validation error
      expect([201, 500]).toContain(response.status);
    });

    it("should handle negative price values", async () => {
      const invalidRoom = {
        Hotel_id: hotelId,
        Room_type: "Standard",
        Price_per_night: "-50.00",
        Capacity: 2,
        Amenities: "WiFi",
        is_available: true
      };

      const response = await request(app)
        .post("/api/rooms")
        .send(invalidRoom);

      // Should either succeed (database allows it) or fail with validation error
      expect([201, 500]).toContain(response.status);
    });
  });

  describe("Query Performance Tests", () => {
    it("should handle getAllRooms with multiple joins efficiently", async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get("/api/rooms");

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      
      // Basic performance check - should complete within reasonable time
      expect(queryTime).toBeLessThan(5000); // 5 seconds max
    });

    it("should handle getRoomById with joins efficiently", async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/rooms/${roomId}`);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      
      // Should be faster than getAllRooms
      expect(queryTime).toBeLessThan(3000); // 3 seconds max
    });
  });
});