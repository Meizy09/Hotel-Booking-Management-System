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

describe("Users API Integration Tests", () => {

  describe("POST /api/users", () => {
    it("should create a user successfully", async () => {
      const newUser = {
        First_name: "Jane",
        Last_name: "Smith",
        Email: "jane.smith@test.com",
        Password: "hashedPassword456",
        Contact_phone: 555555555,
        Address: "789 New Street",
        Role: "user" as const,
        isVerified: false,
        verificationCode: "DEF456"
      };

      const response = await request(app)
        .post("/api/users")
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('user_id');
      expect(response.body[0]).toHaveProperty('First_name', 'Jane');
      expect(response.body[0]).toHaveProperty('Last_name', 'Smith');
      expect(response.body[0]).toHaveProperty('Email', 'jane.smith@test.com');
      expect(response.body[0]).toHaveProperty('Role', 'user');

      // Clean up the created user
      const createdUserId = response.body[0].user_id;
      await db.delete(users).where(eq(users.user_id, createdUserId));
    });

    it("should fail to create user with missing required fields", async () => {
      const invalidUser = {
        First_name: "John",
        Last_name: "Doe"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/users")
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Missing required fields');
    });

    it("should fail to create user with invalid role", async () => {
      const invalidUser = {
        First_name: "John",
        Last_name: "Doe",
        Email: "john@test.com",
        Password: "password123",
        Contact_phone: 1234567890,
        Address: "123 Test St",
        Role: "invalid_role" as any
      };

      const response = await request(app)
        .post("/api/users")
        .send(invalidUser);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating user');
    });
  });

  describe("GET /api/users", () => {
    it("should get all users with joined data", async () => {
      const response = await request(app)
        .get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    //   console.log(JSON.stringify(response.body, null, 2));

      


      // Find our test user
      const testUserResponse = response.body.find((u: any) =>
        u.Users?.user_id === userId
      );

      expect(testUserResponse).toBeDefined();
      expect(testUserResponse.Users).toBeDefined();
      expect(testUserResponse.Payments).toBeDefined();
      expect(testUserResponse.Bookings).toBeDefined();
      expect(testUserResponse.Rooms).toBeDefined();
      expect(testUserResponse.Users).toHaveProperty('First_name', 'John');
      expect(testUserResponse.Users).toHaveProperty('Last_name', 'Doe');
      expect(testUserResponse.Users).toHaveProperty('Email', 'john.doe@test.com');
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get a specific user by ID with joined data", async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.Users).toHaveProperty('user_id', userId);
      expect(response.body.Users).toHaveProperty('First_name', 'John');
      expect(response.body.Users).toHaveProperty('Last_name', 'Doe');
      expect(response.body.Users).toHaveProperty('Email', 'john.doe@test.com');
      expect(response.body.Payments).toBeDefined();
      expect(response.body.Bookings).toBeDefined();
      expect(response.body.Rooms).toBeDefined();
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/users/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("should handle invalid user ID format", async () => {
      const response = await request(app)
        .get("/api/users/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching user');
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("should update a user successfully", async () => {
      const updateData = {
        First_name: "Johnny",
        Last_name: "Smith",
        Contact_phone: 999999999,
        Address: "456 Updated Street"
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('First_name', 'Johnny');
      expect(response.body[0]).toHaveProperty('Last_name', 'Smith');
      expect(response.body[0]).toHaveProperty('Contact_phone', 999999999);
      expect(response.body[0]).toHaveProperty('Address', '456 Updated Street');
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        First_name: "UpdatedJohn"
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('First_name', 'UpdatedJohn');
      // Other fields should remain unchanged
      expect(response.body[0]).toHaveProperty('Email', 'john.doe@test.com');
    });

    it("should return empty array when updating non-existent user", async () => {
      const updateData = {
        First_name: "NonExistent"
      };

      const response = await request(app)
        .patch("/api/users/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid update data", async () => {
      const updateData = {
        Role: "invalid_role" as any
      };

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating user');
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete a user successfully", async () => {
      // Create a user specifically for deletion test
      const userToDelete = {
        First_name: "ToDelete",
        Last_name: "User",
        Email: "delete@test.com",
        Password: "password123",
        Contact_phone: 111111111,
        Address: "Delete Street",
        Role: "user" as const
      };

      const createResponse = await request(app)
        .post("/api/users")
        .send(userToDelete);

      const userIdToDelete = createResponse.body[0].user_id;

      const deleteResponse = await request(app)
        .delete(`/api/users/${userIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion by trying to fetch the user
      const getResponse = await request(app)
        .get(`/api/users/${userIdToDelete}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent user", async () => {
      const response = await request(app)
        .delete("/api/users/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid user ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/users/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting user');
    });
  });

  describe("Business Logic Tests", () => {
    it("should handle user creation with minimal required data", async () => {
      const minimalUser = {
        First_name: "Minimal",
        Last_name: "User",
        Email: "minimal@test.com",
        Password: "password123",
        Contact_phone: 222222222,
        Address: "Minimal Street",
        Role: "user" as const
      };

      const response = await request(app)
        .post("/api/users")
        .send(minimalUser);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('user_id');
      expect(response.body[0]).toHaveProperty('First_name', 'Minimal');
      expect(response.body[0]).toHaveProperty('Role', 'user');
      expect(response.body[0]).toHaveProperty('isVerified', false);
      expect(response.body[0]).toHaveProperty('Created_at');
      expect(response.body[0]).toHaveProperty('Updated_at');

      // Clean up
      const createdUserId = response.body[0].user_id;
      await db.delete(users).where(eq(users.user_id, createdUserId));
    });

    it("should create admin user successfully", async () => {
      const adminUser = {
        First_name: "Admin",
        Last_name: "User",
        Email: "admin@test.com",
        Password: "adminpassword123",
        Contact_phone: 333333333,
        Address: "Admin Street",
        Role: "admin" as const,
        isVerified: true
      };

      const response = await request(app)
        .post("/api/users")
        .send(adminUser);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Role', 'admin');
      expect(response.body[0]).toHaveProperty('isVerified', true);

      // Clean up
      const createdUserId = response.body[0].user_id;
      await db.delete(users).where(eq(users.user_id, createdUserId));
    });

    // it("should handle user update with verification code", async () => {
    //   const updateData = {
    //     isVerified: true,
    //     verificationCode: "VERIFIED123"
    //   };

    //   const response = await request(app)
    //     .patch(`/api/users/${userId}`)
    //     .send(updateData);

    //   expect(response.status).toBe(200);
    //   expect(response.body[0]).toHaveProperty('isVerified', true);
    //   expect(response.body[0]).toHaveProperty('verificationCode', 'VERIFIED123');
    // });

   
  });

  describe("Error Handling Tests", () => {
    it("should handle database connection errors gracefully", async () => {
      // This test would require mocking the database connection
      // For now, we'll test general error handling
      const response = await request(app)
        .get("/api/users/0");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/users")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});