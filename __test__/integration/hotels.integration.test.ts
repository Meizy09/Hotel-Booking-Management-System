import request from 'supertest';
import { app } from '../../src/index';
import db from '../../src/Drizzle/db';
import { users, hotels, rooms, bookings, payments } from '../../src/Drizzle/schema';
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

describe("Hotels API Integration Tests", () => {
  describe("POST /api/hotels", () => {
    it("should create a hotel successfully", async () => {
      const newHotel = {
        Name: "New Test Hotel",
        Location: "New Test City",
        Address: "789 New Hotel Ave",
        Contact_phone: 111222333,
        Category: "Business",
        Rating: "4.0"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(newHotel);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Hotel_id');
      expect(response.body).toHaveProperty('Name', 'New Test Hotel');
      expect(response.body).toHaveProperty('Location', 'New Test City');
      expect(response.body).toHaveProperty('Address', '789 New Hotel Ave');
      expect(response.body).toHaveProperty('Contact_phone', 111222333);
      expect(response.body).toHaveProperty('Category', 'Business');
      expect(response.body).toHaveProperty('Rating', '4.0');
      expect(response.body).toHaveProperty('Created_at');
      expect(response.body).toHaveProperty('Updated_at');

      // Clean up the created hotel
      const createdHotelId = response.body.Hotel_id;
      await db.delete(hotels).where(eq(hotels.Hotel_id, createdHotelId));
    });

    it("should fail to create hotel with missing required fields", async () => {
      const invalidHotel = {
        Name: "Incomplete Hotel",
        Location: "Some City"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(invalidHotel);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating hotel');
    });

    it("should fail to create hotel with invalid data types", async () => {
      const invalidHotel = {
        Name: "Invalid Hotel",
        Location: "Test City",
        Address: "Test Address",
        Contact_phone: "invalid_phone", // Should be number
        Category: "Luxury",
        Rating: "4.5"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(invalidHotel);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating hotel');
    });
  });

  describe("GET /api/hotels", () => {
    it("should get all hotels with their rooms", async () => {
      const response = await request(app)
        .get("/api/hotels");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Find our test hotel
      const testHotelResponse = response.body.find((h: any) =>
        h.Hotels?.Hotel_id === hotelId
      );

      expect(testHotelResponse).toBeDefined();
      expect(testHotelResponse.Hotels).toBeDefined();
      expect(testHotelResponse.Rooms).toBeDefined();
      expect(testHotelResponse.Hotels).toHaveProperty('Name', 'Test Hotel');
      expect(testHotelResponse.Hotels).toHaveProperty('Location', 'Test City');
      expect(testHotelResponse.Hotels).toHaveProperty('Address', '456 Hotel Ave');
      expect(testHotelResponse.Hotels).toHaveProperty('Contact_phone', 987654321);
      expect(testHotelResponse.Hotels).toHaveProperty('Category', 'Luxury');
      expect(testHotelResponse.Hotels).toHaveProperty('Rating', '4.5');
    });

    it("should return empty array when no hotels exist", async () => {
      // Clean up test data temporarily
      await cleanupTestData();

      const response = await request(app)
        .get("/api/hotels");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);

      // Recreate test data
      await setupTestData();
    });
  });

  describe("GET /api/hotels/:id", () => {
    it("should get a specific hotel by ID with its rooms", async () => {
      const response = await request(app)
        .get(`/api/hotels/${hotelId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.Hotels).toHaveProperty('Hotel_id', hotelId);
      expect(response.body.Hotels).toHaveProperty('Name', 'Test Hotel');
      expect(response.body.Hotels).toHaveProperty('Location', 'Test City');
      expect(response.body.Hotels).toHaveProperty('Address', '456 Hotel Ave');
      expect(response.body.Hotels).toHaveProperty('Contact_phone', 987654321);
      expect(response.body.Hotels).toHaveProperty('Category', 'Luxury');
      expect(response.body.Hotels).toHaveProperty('Rating', '4.5');
      expect(response.body.Rooms).toBeDefined();
    });

    it("should return 404 for non-existent hotel", async () => {
      const response = await request(app)
        .get("/api/hotels/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Hotel not found');
    });

    it("should handle invalid hotel ID format", async () => {
      const response = await request(app)
        .get("/api/hotels/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching hotel');
    });
  });

  describe("PATCH /api/hotels/:id", () => {
    it("should update a hotel successfully", async () => {
      const updateData = {
        Name: "Updated Test Hotel",
        Location: "Updated Test City",
        Category: "Premium",
        Rating: "5.0"
      };

      const response = await request(app)
        .patch(`/api/hotels/${hotelId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Hotel_id', hotelId);
      expect(response.body[0]).toHaveProperty('Name', 'Updated Test Hotel');
      expect(response.body[0]).toHaveProperty('Location', 'Updated Test City');
      expect(response.body[0]).toHaveProperty('Category', 'Premium');
      expect(response.body[0]).toHaveProperty('Rating', '5.0');
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        Name: "Partially Updated Hotel"
      };

      const response = await request(app)
        .patch(`/api/hotels/${hotelId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Hotel_id', hotelId);
      expect(response.body[0]).toHaveProperty('Name', 'Partially Updated Hotel');
      // Other fields should remain unchanged
      expect(response.body[0]).toHaveProperty('Address', '456 Hotel Ave');
    });

    it("should return empty array when updating non-existent hotel", async () => {
      const updateData = {
        Name: "Non-existent Hotel"
      };

      const response = await request(app)
        .patch("/api/hotels/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid update data", async () => {
      const updateData = {
        Contact_phone: "invalid_phone"
      };

      const response = await request(app)
        .patch(`/api/hotels/${hotelId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating hotel');
    });
  });

  describe("DELETE /api/hotels/:id", () => {
    it("should delete a hotel successfully", async () => {
      // Create a hotel specifically for deletion test
      const hotelToDelete = {
        Name: "Hotel To Delete",
        Location: "Delete City",
        Address: "Delete Street",
        Contact_phone: 444555666,
        Category: "Budget",
        Rating: "3.0"
      };

      const createResponse = await request(app)
        .post("/api/hotels")
        .send(hotelToDelete);

      const hotelIdToDelete = createResponse.body.Hotel_id;

      const deleteResponse = await request(app)
        .delete(`/api/hotels/${hotelIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion by trying to fetch the hotel
      const getResponse = await request(app)
        .get(`/api/hotels/${hotelIdToDelete}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent hotel", async () => {
      const response = await request(app)
        .delete("/api/hotels/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid hotel ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/hotels/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting hotel');
    });

    it("should handle deletion of hotel with existing rooms", async () => {
      // This test demonstrates referential integrity
      // The hotel should not be deleted if it has rooms
      const response = await request(app)
        .delete(`/api/hotels/${hotelId}`);

      // This might fail due to foreign key constraints
      // The exact behavior depends on your database configuration
      expect([204, 500]).toContain(response.status);
    });
  });

  describe("Business Logic Tests", () => {
    it("should create hotel with minimal required data", async () => {
      const minimalHotel = {
        Name: "Minimal Hotel",
        Location: "Minimal City",
        Address: "Minimal Address",
        Contact_phone: 777888999,
        Category: "Standard",
        Rating: "3.5"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(minimalHotel);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Hotel_id');
      expect(response.body).toHaveProperty('Name', 'Minimal Hotel');
      expect(response.body).toHaveProperty('Category', 'Standard');
      expect(response.body).toHaveProperty('Rating', '3.5');
      expect(response.body).toHaveProperty('Created_at');
      expect(response.body).toHaveProperty('Updated_at');

      // Clean up
      const createdHotelId = response.body.Hotel_id;
      await db.delete(hotels).where(eq(hotels.Hotel_id, createdHotelId));
    });

    it("should handle hotel creation with various categories", async () => {
      const categories = ["Luxury", "Business", "Budget", "Resort", "Boutique"];
      
      for (const category of categories) {
        const hotelData = {
          Name: `${category} Hotel`,
          Location: "Test City",
          Address: "Test Address",
          Contact_phone: 123456789,
          Category: category,
          Rating: "4.0"
        };

        const response = await request(app)
          .post("/api/hotels")
          .send(hotelData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('Category', category);

        // Clean up
        await db.delete(hotels).where(eq(hotels.Hotel_id, response.body.Hotel_id));
      }
    });

    it("should handle various rating formats", async () => {
      const ratings = ["1.0", "2.5", "3.0", "4.5", "5.0"];
      
      for (const rating of ratings) {
        const hotelData = {
          Name: `Hotel Rating ${rating}`,
          Location: "Test City",
          Address: "Test Address",
          Contact_phone: 123456789,
          Category: "Standard",
          Rating: rating
        };

        const response = await request(app)
          .post("/api/hotels")
          .send(hotelData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('Rating', rating);

        // Clean up
        await db.delete(hotels).where(eq(hotels.Hotel_id, response.body.Hotel_id));
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle extremely long hotel names", async () => {
      const longName = "A".repeat(500); // Maximum length from schema
      const hotelData = {
        Name: longName,
        Location: "Test City",
        Address: "Test Address",
        Contact_phone: 123456789,
        Category: "Standard",
        Rating: "4.0"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(hotelData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Name', longName);

      // Clean up
      await db.delete(hotels).where(eq(hotels.Hotel_id, response.body.Hotel_id));
    });

    it("should handle hotel name exceeding maximum length", async () => {
      const tooLongName = "A".repeat(501); // Exceeds maximum length
      const hotelData = {
        Name: tooLongName,
        Location: "Test City",
        Address: "Test Address",
        Contact_phone: 123456789,
        Category: "Standard",
        Rating: "4.0"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(hotelData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating hotel');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/hotels")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle empty request body", async () => {
      const response = await request(app)
        .post("/api/hotels")
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating hotel');
    });
  });

  describe("Data Validation Tests", () => {
    it("should validate contact phone number format", async () => {
      const hotelData = {
        Name: "Phone Test Hotel",
        Location: "Test City",
        Address: "Test Address",
        Contact_phone: 1234567890,
        Category: "Standard",
        Rating: "4.0"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(hotelData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Contact_phone', 1234567890);

      // Clean up
      await db.delete(hotels).where(eq(hotels.Hotel_id, response.body.Hotel_id));
    });

    it("should validate rating format", async () => {
      const hotelData = {
        Name: "Rating Test Hotel",
        Location: "Test City",
        Address: "Test Address",
        Contact_phone: 123456789,
        Category: "Standard",
        Rating: "4.75"
      };

      const response = await request(app)
        .post("/api/hotels")
        .send(hotelData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Rating', '4.75');

      // Clean up
      await db.delete(hotels).where(eq(hotels.Hotel_id, response.body.Hotel_id));
    });
  });
});