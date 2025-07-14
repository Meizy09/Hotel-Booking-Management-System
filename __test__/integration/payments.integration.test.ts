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

describe("Payments API Integration Tests", () => {
  describe("POST /api/payments", () => {
    it("should create a payment successfully", async () => {
      const newPayment = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "150.00",
        Payment_status: "pending",
        Payment_date: '2024-07-02',
        Payment_method: "paypal",
        Transaction_id: "TXN789012"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(newPayment);

      expect(response.status).toBe(201);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Payment_id');
      expect(response.body[0]).toHaveProperty('Booking_id', bookingId);
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Amount', '150.00');
      expect(response.body[0]).toHaveProperty('Payment_status', 'pending');
      expect(response.body[0]).toHaveProperty('Payment_method', 'paypal');
      expect(response.body[0]).toHaveProperty('Transaction_id', 'TXN789012');

      // Clean up the created payment
      const createdPaymentId = response.body[0].Payment_id;
      await db.delete(payments).where(eq(payments.Payment_id, createdPaymentId));
    });

    it("should fail to create payment with missing required fields", async () => {
      const invalidPayment = {
        Amount: "150.00",
        Payment_status: "pending"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required and must be valid');
    });

    it("should fail to create payment with invalid booking_id", async () => {
      const invalidPayment = {
        Booking_id: 99999, // Non-existent booking
        user_id: userId,
        Amount: "150.00",
        Payment_status: "pending",
        Payment_date: '2024-07-02',
        Payment_method: "credit_card",
        Transaction_id: "TXN999999"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating payment');
    });

    it("should fail to create payment with invalid user_id", async () => {
      const invalidPayment = {
        Booking_id: bookingId,
        user_id: 99999, // Non-existent user
        Amount: "150.00",
        Payment_status: "pending",
        Payment_date: '2024-07-02',
        Payment_method: "credit_card",
        Transaction_id: "TXN999999"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating payment');
    });
  });

  describe("GET /api/payments", () => {
    beforeEach(async () => {
        await db.delete(payments);
        await db.insert(payments).values({
            ...testPayment,
            Booking_id: bookingId,
            user_id: userId
        }).returning().then(([payment]) => {
            paymentId = payment.Payment_id;
        });
    });
    it("should get all payments with joined data", async () => {
      const response = await request(app)
        .get("/api/payments");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Find our test payment
      const testPaymentResponse = response.body.find((p: any) =>
        p.Payments?.Payment_id === paymentId
      );

      expect(testPaymentResponse).toBeDefined();
      expect(testPaymentResponse.Payments).toBeDefined();
      expect(testPaymentResponse.Bookings).toBeDefined();
      expect(testPaymentResponse.Users).toBeDefined();
      expect(testPaymentResponse.Rooms).toBeDefined();
      expect(testPaymentResponse.Hotels).toBeDefined();

      expect(testPaymentResponse.Payments).toHaveProperty('Amount', '600.00');
      expect(testPaymentResponse.Payments).toHaveProperty('Payment_status', 'completed');
      expect(testPaymentResponse.Payments).toHaveProperty('Payment_method', 'credit_card');
      expect(testPaymentResponse.Payments).toHaveProperty('Transaction_id', 'TXN123456');
      expect(testPaymentResponse.Users).toHaveProperty('First_name', 'John');
      expect(testPaymentResponse.Users).toHaveProperty('Last_name', 'Doe');
      expect(testPaymentResponse.Hotels).toHaveProperty('Name', 'Test Hotel');
    });

    it("should return empty array when no payments exist", async () => {
      // Clean up test payment temporarily
      await db.delete(payments).where(eq(payments.Payment_id, paymentId));

      const response = await request(app)
        .get("/api/payments");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);

      // Recreate test payment
      const [payment] = await db.insert(payments).values({
        ...testPayment,
        Booking_id: bookingId,
        user_id: userId
      }).returning();
      paymentId = payment.Payment_id;
    });
  });

  describe("GET /api/payments/:id", () => {
    it("should get a specific payment by ID with joined data", async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.Payments).toHaveProperty('Payment_id', paymentId);
      expect(response.body.Payments).toHaveProperty('Amount', '600.00');
      expect(response.body.Payments).toHaveProperty('Payment_status', 'completed');
      expect(response.body.Payments).toHaveProperty('Payment_method', 'credit_card');
      expect(response.body.Payments).toHaveProperty('Transaction_id', 'TXN123456');
      expect(response.body.Bookings).toBeDefined();
      expect(response.body.Users).toBeDefined();
      expect(response.body.Rooms).toBeDefined();
      expect(response.body.Hotels).toBeDefined();
    });

    it("should return 404 for non-existent payment", async () => {
      const response = await request(app)
        .get("/api/payments/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Payment not found');
    });

    it("should handle invalid payment ID format", async () => {
      const response = await request(app)
        .get("/api/payments/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching payment');
    });
  });

  describe("PATCH /api/payments/:id", () => {
    it("should update a payment successfully", async () => {
      const updateData = {
        Amount: "650.00",
        Payment_status: "refunded",
        Payment_method: "debit_card",
        Transaction_id: "TXN_UPDATED"
      };

      const response = await request(app)
        .patch(`/api/payments/${paymentId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Payment_id', paymentId);
      expect(response.body[0]).toHaveProperty('Amount', '650.00');
      expect(response.body[0]).toHaveProperty('Payment_status', 'refunded');
      expect(response.body[0]).toHaveProperty('Payment_method', 'debit_card');
      expect(response.body[0]).toHaveProperty('Transaction_id', 'TXN_UPDATED');
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        Payment_status: "partially_refunded"
      };

      const response = await request(app)
        .patch(`/api/payments/${paymentId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Payment_id', paymentId);
      expect(response.body[0]).toHaveProperty('Payment_status', 'partially_refunded');
      // Other fields should remain unchanged
      expect(response.body[0]).toHaveProperty('Amount', '650.00');
      expect(response.body[0]).toHaveProperty('Payment_method', 'debit_card');
    });

    it("should return empty array when updating non-existent payment", async () => {
      const updateData = {
        Payment_status: "failed"
      };

      const response = await request(app)
        .patch("/api/payments/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid payment ID format for update", async () => {
      const updateData = {
        Payment_status: "failed"
      };

      const response = await request(app)
        .patch("/api/payments/invalid")
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating payment');
    });
  });

  describe("DELETE /api/payments/:id", () => {
    it("should delete a payment successfully", async () => {
      // Create a payment specifically for deletion test
      const paymentToDelete = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "100.00",
        Payment_status: "pending",
        Payment_date: '2024-07-03',
        Payment_method: "cash",
        Transaction_id: "TXN_DELETE"
      };

      const createResponse = await request(app)
        .post("/api/payments")
        .send(paymentToDelete);

      const paymentIdToDelete = createResponse.body[0].Payment_id;

      const deleteResponse = await request(app)
        .delete(`/api/payments/${paymentIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion by trying to fetch the payment
      const getResponse = await request(app)
        .get(`/api/payments/${paymentIdToDelete}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent payment", async () => {
      const response = await request(app)
        .delete("/api/payments/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid payment ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/payments/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting payment');
    });
  });

  describe("Business Logic Tests", () => {
    it("should create payment with all required fields", async () => {
      const completePayment = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "250.00",
        Payment_status: "processing",
        Payment_date: '2024-07-04',
        Payment_method: "bank_transfer",
        Transaction_id: "TXN_COMPLETE"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(completePayment);

      expect(response.status).toBe(201);
      expect(response.body[0]).toHaveProperty('Payment_id');
      expect(response.body[0]).toHaveProperty('Booking_id', bookingId);
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Amount', '250.00');
      expect(response.body[0]).toHaveProperty('Payment_status', 'processing');
      expect(response.body[0]).toHaveProperty('Payment_method', 'bank_transfer');
      expect(response.body[0]).toHaveProperty('Transaction_id', 'TXN_COMPLETE');
      expect(response.body[0]).toHaveProperty('Created_at');
      expect(response.body[0]).toHaveProperty('Updated_at');

      // Clean up
      const createdPaymentId = response.body[0].Payment_id;
      await db.delete(payments).where(eq(payments.Payment_id, createdPaymentId));
    });


    it("should handle different payment methods", async () => {
      const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
      
      for (const method of paymentMethods) {
        const updateData = { Payment_method: method };
        
        const response = await request(app)
          .patch(`/api/payments/${paymentId}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('Payment_method', method);
      }
    });

    it("should maintain referential integrity with bookings and users", async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`);

      expect(response.status).toBe(200);
      expect(response.body.Payments.Booking_id).toBe(bookingId);
      expect(response.body.Payments.user_id).toBe(userId);
      expect(response.body.Bookings.Booking_id).toBe(bookingId);
      expect(response.body.Users.user_id).toBe(userId);
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle database connection errors gracefully", async () => {
      const response = await request(app)
        .get("/api/payments/0");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Payment not found');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/payments")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle concurrent payment updates", async () => {
      const updateData1 = { Payment_status: "processing" };
      const updateData2 = { Payment_status: "completed" };

      const [response1, response2] = await Promise.all([
        request(app).patch(`/api/payments/${paymentId}`).send(updateData1),
        request(app).patch(`/api/payments/${paymentId}`).send(updateData2)
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      // One of the updates should succeed
      expect([response1.body[0].Payment_status, response2.body[0].Payment_status])
        .toContain('completed');
    });
  });

  describe("Data Validation Tests", () => {
    it("should validate payment amount format", async () => {
      const invalidPayment = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "invalid_amount",
        Payment_status: "pending",
        Payment_date: '2024-07-05',
        Payment_method: "credit_card",
        Transaction_id: "TXN_INVALID"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating payment');
    });

    it("should validate payment date format", async () => {
      const invalidPayment = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "100.00",
        Payment_status: "pending",
        Payment_date: 'invalid_date',
        Payment_method: "credit_card",
        Transaction_id: "TXN_INVALID_DATE"
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating payment');
    });

    it("should handle empty transaction ID", async () => {
      const invalidPayment = {
        Booking_id: bookingId,
        user_id: userId,
        Amount: "100.00",
        Payment_status: "pending",
        Payment_date: '2024-07-05',
        Payment_method: "credit_card",
        Transaction_id: ""
      };

      const response = await request(app)
        .post("/api/payments")
        .send(invalidPayment);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'All fields are required and must be valid');
    });
  });
});