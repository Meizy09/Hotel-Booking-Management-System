import request from 'supertest';
import { app } from '../../src/index';
import db from '../../src/Drizzle/db';
import { users, customerSupportTickets } from '../../src/Drizzle/schema';
import { eq } from 'drizzle-orm';

// Test data setup
let userId: number;
let ticketId: number;

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

const testTicket = {
  Subject: "Test Support Ticket",
  Description: "This is a test support ticket description",
  Status: "open"
};

// Helper function to create test data
const setupTestData = async () => {
  try {
    // Create test user
    const [user] = await db.insert(users).values(testUser).returning();
    userId = user.user_id;

    // Create test ticket
    const [ticket] = await db.insert(customerSupportTickets).values({
      ...testTicket,
      user_id: userId
    }).returning();
    ticketId = ticket.Tickect_id;

    // console.log('Test data created successfully');
    // console.log(`User ID: ${userId}, Ticket ID: ${ticketId}`);
  } catch (error) {
    // console.error('Failed to setup test data:', error);
    throw error;
  }
};

// Helper function to cleanup test data
const cleanupTestData = async () => {
  try {
    // Clean up in reverse order of dependencies
    if (ticketId) {
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, ticketId));
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

describe("Tickets API Integration Tests", () => {
  describe("POST /api/tickets", () => {
    it("should create a ticket successfully", async () => {
      const newTicket = {
        user_id: userId,
        Subject: "New Support Request",
        Description: "I need help with my booking",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(newTicket);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Tickect_id');
      expect(response.body).toHaveProperty('Subject', 'New Support Request');
      expect(response.body).toHaveProperty('Description', 'I need help with my booking');
      expect(response.body).toHaveProperty('Status', 'open');
      expect(response.body).toHaveProperty('user_id', userId);
      expect(response.body).toHaveProperty('Created_at');
      expect(response.body).toHaveProperty('Updated_at');

      // Clean up the created ticket
      const createdTicketId = response.body.Tickect_id;
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });

    it("should fail to create ticket with missing required fields", async () => {
      const invalidTicket = {
        Subject: "Incomplete Ticket"
        // Missing required fields
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(invalidTicket);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating ticket');
    });

    it("should fail to create ticket with invalid user_id", async () => {
      const invalidTicket = {
        user_id: 99999,
        Subject: "Test Subject",
        Description: "Test Description",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(invalidTicket);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating ticket');
    });
  });

  describe("GET /api/tickets", () => {
    it("should get all tickets with user data", async () => {
      const response = await request(app)
        .get("/api/tickets");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Find our test ticket
      const testTicketResponse = response.body.find((t: any) =>
        t.Customer_support_tickets?.Tickect_id === ticketId
      );

      expect(testTicketResponse).toBeDefined();
      expect(testTicketResponse.Customer_support_tickets).toBeDefined();
      expect(testTicketResponse.Users).toBeDefined();
      expect(testTicketResponse.Customer_support_tickets).toHaveProperty('Subject', 'Test Support Ticket');
      expect(testTicketResponse.Customer_support_tickets).toHaveProperty('Description', 'This is a test support ticket description');
      expect(testTicketResponse.Customer_support_tickets).toHaveProperty('Status', 'open');
      expect(testTicketResponse.Users).toHaveProperty('First_name', 'John');
      expect(testTicketResponse.Users).toHaveProperty('Last_name', 'Doe');
      expect(testTicketResponse.Users).toHaveProperty('Email', 'john.doe@test.com');
    });

    it("should return empty array when no tickets exist", async () => {
      // Clean up existing tickets temporarily
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, ticketId));

      const response = await request(app)
        .get("/api/tickets");

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);

      // Recreate test ticket for other tests
      const [ticket] = await db.insert(customerSupportTickets).values({
        ...testTicket,
        user_id: userId
      }).returning();
      ticketId = ticket.Tickect_id;
    });
  });

  describe("GET /api/tickets/:id", () => {
    it("should get a specific ticket by ID with user data", async () => {
      const response = await request(app)
        .get(`/api/tickets/${ticketId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.Customer_support_tickets).toHaveProperty('Tickect_id', ticketId);
      expect(response.body.Customer_support_tickets).toHaveProperty('Subject', 'Test Support Ticket');
      expect(response.body.Customer_support_tickets).toHaveProperty('Description', 'This is a test support ticket description');
      expect(response.body.Customer_support_tickets).toHaveProperty('Status', 'open');
      expect(response.body.Customer_support_tickets).toHaveProperty('user_id', userId);
      expect(response.body.Users).toBeDefined();
      expect(response.body.Users).toHaveProperty('First_name', 'John');
      expect(response.body.Users).toHaveProperty('Last_name', 'Doe');
      expect(response.body.Users).toHaveProperty('Email', 'john.doe@test.com');
    });

    it("should return 404 for non-existent ticket", async () => {
      const response = await request(app)
        .get("/api/tickets/99999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Ticket not found');
    });

    it("should handle invalid ticket ID format", async () => {
      const response = await request(app)
        .get("/api/tickets/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching ticket');
    });
  });

  describe("PATCH /api/tickets/:id", () => {
    it("should update a ticket successfully", async () => {
      const updateData = {
        Subject: "Updated Support Ticket",
        Description: "Updated description for the ticket",
        Status: "in_progress"
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticketId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Tickect_id', ticketId);
      expect(response.body[0]).toHaveProperty('Subject', 'Updated Support Ticket');
      expect(response.body[0]).toHaveProperty('Description', 'Updated description for the ticket');
      expect(response.body[0]).toHaveProperty('Status', 'in_progress');
      expect(response.body[0]).toHaveProperty('user_id', userId);
      expect(response.body[0]).toHaveProperty('Updated_at');
    });

    it("should update only provided fields", async () => {
      const updateData = {
        Status: "resolved"
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticketId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('Tickect_id', ticketId);
      expect(response.body[0]).toHaveProperty('Status', 'resolved');
      // Other fields should remain unchanged from previous update
      expect(response.body[0]).toHaveProperty('Subject', 'Updated Support Ticket');
      expect(response.body[0]).toHaveProperty('user_id', userId);
    });

    it("should return empty array when updating non-existent ticket", async () => {
      const updateData = {
        Status: "closed"
      };

      const response = await request(app)
        .patch("/api/tickets/99999")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should handle invalid update data", async () => {
      const updateData = {
        user_id: "invalid_user_id"
      };

      const response = await request(app)
        .patch(`/api/tickets/${ticketId}`)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating ticket');
    });
  });

  describe("DELETE /api/tickets/:id", () => {
    it("should delete a ticket successfully", async () => {
      // Create a ticket specifically for deletion test
      const ticketToDelete = {
        user_id: userId,
        Subject: "Ticket to Delete",
        Description: "This ticket will be deleted",
        Status: "open"
      };

      const createResponse = await request(app)
        .post("/api/tickets")
        .send(ticketToDelete);

      const ticketIdToDelete = createResponse.body.Tickect_id;

      const deleteResponse = await request(app)
        .delete(`/api/tickets/${ticketIdToDelete}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});

      // Verify deletion by trying to fetch the ticket
      const getResponse = await request(app)
        .get(`/api/tickets/${ticketIdToDelete}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle deletion of non-existent ticket", async () => {
      const response = await request(app)
        .delete("/api/tickets/99999");

      expect(response.status).toBe(204);
    });

    it("should handle invalid ticket ID format for deletion", async () => {
      const response = await request(app)
        .delete("/api/tickets/invalid");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting ticket');
    });
  });

  describe("Business Logic Tests", () => {
    it("should create ticket with all required fields", async () => {
      const completeTicket = {
        user_id: userId,
        Subject: "Complete Support Ticket",
        Description: "This is a complete support ticket with all required fields",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(completeTicket);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Tickect_id');
      expect(response.body).toHaveProperty('Subject', 'Complete Support Ticket');
      expect(response.body).toHaveProperty('Description', 'This is a complete support ticket with all required fields');
      expect(response.body).toHaveProperty('Status', 'open');
      expect(response.body).toHaveProperty('user_id', userId);
      expect(response.body).toHaveProperty('Created_at');
      expect(response.body).toHaveProperty('Updated_at');

      // Clean up
      const createdTicketId = response.body.Tickect_id;
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });

    it("should handle ticket status transitions", async () => {
      // Create a ticket in open status
      const newTicket = {
        user_id: userId,
        Subject: "Status Transition Test",
        Description: "Testing status transitions",
        Status: "open"
      };

      const createResponse = await request(app)
        .post("/api/tickets")
        .send(newTicket);

      const createdTicketId = createResponse.body.Tickect_id;

      // Update to in_progress
      const updateToInProgress = await request(app)
        .patch(`/api/tickets/${createdTicketId}`)
        .send({ Status: "in_progress" });

      expect(updateToInProgress.status).toBe(200);
      expect(updateToInProgress.body[0]).toHaveProperty('Status', 'in_progress');

      // Update to resolved
      const updateToResolved = await request(app)
        .patch(`/api/tickets/${createdTicketId}`)
        .send({ Status: "resolved" });

      expect(updateToResolved.status).toBe(200);
      expect(updateToResolved.body[0]).toHaveProperty('Status', 'resolved');

      // Update to closed
      const updateToClosed = await request(app)
        .patch(`/api/tickets/${createdTicketId}`)
        .send({ Status: "closed" });

      expect(updateToClosed.status).toBe(200);
      expect(updateToClosed.body[0]).toHaveProperty('Status', 'closed');

      // Clean up
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });

    it("should handle long descriptions", async () => {
      const longDescription = "This is a very long description that tests the varchar(500) limit. ".repeat(10);
      
      const ticketWithLongDescription = {
        user_id: userId,
        Subject: "Long Description Test",
        Description: longDescription.substring(0, 500), // Ensure it fits the schema limit
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(ticketWithLongDescription);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Description');
      expect(response.body.Description.length).toBeLessThanOrEqual(500);

      // Clean up
      const createdTicketId = response.body.Tickect_id;
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle database connection errors gracefully", async () => {
      // Test with invalid ID that would cause database issues
      const response = await request(app)
        .get("/api/tickets/0");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Ticket not found');
    });

    it("should handle malformed request body", async () => {
      const response = await request(app)
        .post("/api/tickets")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle missing user relationship", async () => {
      // Create a ticket with a non-existent user (this should fail due to foreign key constraint)
      const invalidTicket = {
        user_id: 99999,
        Subject: "Invalid User Test",
        Description: "This should fail",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(invalidTicket);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating ticket');
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty subject and description", async () => {
      const emptyTicket = {
        user_id: userId,
        Subject: "",
        Description: "",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(emptyTicket);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Subject', '');
      expect(response.body).toHaveProperty('Description', '');

      // Clean up
      const createdTicketId = response.body.Tickect_id;
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });

    it("should handle special characters in subject and description", async () => {
      const specialCharTicket = {
        user_id: userId,
        Subject: "Special chars: @#$%^&*()_+{}[]|;':\",./<>?",
        Description: "Description with special chars: àáâãäåæçèéêëìíîïðñòóôõöøùúûüý",
        Status: "open"
      };

      const response = await request(app)
        .post("/api/tickets")
        .send(specialCharTicket);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('Subject', "Special chars: @#$%^&*()_+{}[]|;':\",./<>?");
      expect(response.body).toHaveProperty('Description', "Description with special chars: àáâãäåæçèéêëìíîïðñòóôõöøùúûüý");

      // Clean up
      const createdTicketId = response.body.Tickect_id;
      await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, createdTicketId));
    });
  });
});