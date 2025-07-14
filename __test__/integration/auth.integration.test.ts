import request from 'supertest';
import { app } from '../../src/index';
import db from '../../src/Drizzle/db';
import { users } from '../../src/Drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


jest.mock('../../src/mailer/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));


let testUserId: number;
let verificationCode: string;
let testUserEmail: string;

const testUser = {
  First_name: "John",
  Last_name: "Doe",
  Email: "john.doe@test.com",
  Password: "password123",
  Contact_phone: 123456789,
  Address: "123 Test Street",
  Role: "user" as const
};

const verifiedUser = {
  First_name: "Jane",
  Last_name: "Smith",
  Email: "jane.smith@test.com",
  Password: "password123",
  Contact_phone: 987654321,
  Address: "456 Test Avenue",
  Role: "user" as const,
  isVerified: true,
  verificationCode: null
};


const createVerifiedUser = async () => {
  const hashedPassword = bcrypt.hashSync(verifiedUser.Password, 10);
  const [user] = await db.insert(users).values({
    ...verifiedUser,
    Password: hashedPassword
  }).returning();
  return user;
};


const cleanupTestData = async () => {
  try {
    
    await db.delete(users).where(eq(users.Email, testUser.Email));
    await db.delete(users).where(eq(users.Email, verifiedUser.Email));
    await db.delete(users).where(eq(users.Email, "admin@test.com"));
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
};

afterEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await db.$client.end();
});

describe("Auth API Integration Tests", () => {
  
  describe("POST /api/auth/register", () => {
    beforeEach(async () => {
        await db.delete(users).where(eq(users.Email, testUser.Email));
    })
    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created. Verification code sent to email.');

      
      const createdUser = await db.select().from(users).where(eq(users.Email, testUser.Email));
      expect(createdUser).toHaveLength(1);
      expect(createdUser[0]).toHaveProperty('First_name', testUser.First_name);
      expect(createdUser[0]).toHaveProperty('Last_name', testUser.Last_name);
      expect(createdUser[0]).toHaveProperty('Email', testUser.Email);
      expect(createdUser[0]).toHaveProperty('Role', testUser.Role);
      expect(createdUser[0]).toHaveProperty('isVerified', false);
      expect(createdUser[0]).toHaveProperty('verificationCode');
      expect(createdUser[0].verificationCode).toBeTruthy();
      
      expect(createdUser[0].Password).not.toBe(testUser.Password);
      expect(bcrypt.compareSync(testUser.Password, createdUser[0].Password)).toBe(true);

     
      testUserId = createdUser[0].user_id;
      verificationCode = createdUser[0].verificationCode!;
      testUserEmail = createdUser[0].Email;
    });

    it("should handle missing required fields", async () => {
      const incompleteUser = {
        First_name: "John",
        Last_name: "Doe"

      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(incompleteUser);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it("should handle duplicate email registration", async () => {
      
      await request(app)
        .post("/api/auth/register")
        .send(testUser);

     
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Email already in use');
    });

    it("should create admin user successfully", async () => {
      const adminUser = {
        ...testUser,
        Email: "admin@test.com",
        Role: "admin" as const
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(adminUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created. Verification code sent to email.');

      /
      const createdUser = await db.select().from(users).where(eq(users.Email, adminUser.Email));
      expect(createdUser[0]).toHaveProperty('Role', 'admin');
    });

    it("should generate verification code with correct format", async () => {
        const uniqueEmail =`verification_${Date.now()}@test.com`;
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          Email: uniqueEmail
        });

      expect(response.status).toBe(201);

      const createdUser = await db.select().from(users).where(eq(users.Email, uniqueEmail));
      const code = createdUser[0].verificationCode;
      
      expect(code).toBeTruthy();
      expect(code!.length).toBeGreaterThanOrEqual(4);
      expect(parseInt(code!)).toBeGreaterThan(3800);
      expect(parseInt(code!)).toBeLessThan(12688);
    });
  });

  describe("POST /api/auth/verify", () => {
    beforeEach(async () => {
      
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      const createdUser = await db.select().from(users).where(eq(users.Email, testUser.Email));
      testUserId = createdUser[0].user_id;
      verificationCode = createdUser[0].verificationCode!;
      testUserEmail = createdUser[0].Email;
    });

    it("should verify user successfully with correct code", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .send({
          email: testUserEmail,
          code: verificationCode
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User verified successfully');

      
      const verifiedUser = await db.select().from(users).where(eq(users.Email, testUserEmail));
      expect(verifiedUser[0]).toHaveProperty('isVerified', true);
    });

    it("should reject verification with invalid code", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .send({
          email: testUserEmail,
          code: "INVALID_CODE"
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid verification code');

      
      const user = await db.select().from(users).where(eq(users.Email, testUserEmail));
      expect(user[0]).toHaveProperty('isVerified', false);
    });

    it("should handle verification for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .send({
          email: "nonexistent@test.com",
          code: "12345"
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("should handle missing email in verification request", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .send({
          code: verificationCode
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Email and code are required");
    });

    it("should handle missing code in verification request", async () => {
      const response = await request(app)
        .post("/api/auth/verify")
        .send({
          email: testUserEmail
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error',"Email and code are required");
    });
  });

  describe("POST /api/auth/login", () => {
    let verifiedTestUser: any;

    beforeEach(async () => {
    
      verifiedTestUser = await createVerifiedUser();
    });

    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: verifiedUser.Email,
          Password: verifiedUser.Password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');

      
      const token = response.body.token;
      expect(token).toBeTruthy();
      
     
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded).toHaveProperty('user_id', verifiedTestUser.user_id);
      expect(decoded).toHaveProperty('first_name', verifiedTestUser.First_name);
      expect(decoded).toHaveProperty('last_name', verifiedTestUser.Last_name);
      expect(decoded).toHaveProperty('role', verifiedTestUser.Role);
      expect(decoded).toHaveProperty('exp');

      
      expect(response.body.user).toHaveProperty('user_id', verifiedTestUser.user_id);
      expect(response.body.user).toHaveProperty('first_name', verifiedTestUser.First_name);
      expect(response.body.user).toHaveProperty('last_name', verifiedTestUser.Last_name);
      expect(response.body.user).toHaveProperty('email', verifiedTestUser.Email);
      expect(response.body.user).toHaveProperty('role', verifiedTestUser.Role);
      expect(response.body.user).not.toHaveProperty('Password');
    });

    it("should reject login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: verifiedUser.Email,
          Password: "wrongpassword"
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
      expect(response.body).not.toHaveProperty('token');
    });

    it("should reject login for non-existent user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@test.com",
          Password: "password123"
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it("should reject login for unverified user", async () => {
      
      const hashedPassword = bcrypt.hashSync("password123", 10);
      const [unverifiedUser] = await db.insert(users).values({
        First_name: "Unverified",
        Last_name: "User",
        Email: "unverified@test.com",
        Password: hashedPassword,
        Contact_phone: 555555555,
        Address: "Unverified Street",
        Role: "user",
        isVerified: false,
        verificationCode: "12345"
      }).returning();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "unverified@test.com",
          Password: "password123"
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Account not verified');

      
      await db.delete(users).where(eq(users.user_id, unverifiedUser.user_id));
    });

    it("should handle missing email in login request", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          Password: "password123"
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', "Email and password are required");
    });

    it("should handle missing password in login request", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: verifiedUser.Email
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it("should login admin user successfully", async () => {
      
      const adminUser = {
        First_name: "Admin",
        Last_name: "User",
        Email: "admin@test.com",
        Password: bcrypt.hashSync("adminpass123", 10),
        Contact_phone: 111111111,
        Address: "Admin Street",
        Role: "admin" as const,
        isVerified: true,
        verificationCode: null
      };

      const [createdAdmin] = await db.insert(users).values(adminUser).returning();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "admin@test.com",
          Password: "adminpass123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('role', 'admin');

      
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as any;
      expect(decoded).toHaveProperty('role', 'admin');
    });

    it("should generate JWT token with correct expiration", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: verifiedUser.Email,
          Password: verifiedUser.Password
        });

      expect(response.status).toBe(200);
      
      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (24 * 60 * 60); 
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 60); 
    });
  });

  describe("Auth Flow Integration Tests", () => {
    it("should complete full registration and login flow", async () => {
     
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(registerResponse.status).toBe(201);

      
      const createdUser = await db.select().from(users).where(eq(users.Email, testUser.Email));
      const verificationCode = createdUser[0].verificationCode!;

      
      const verifyResponse = await request(app)
        .post("/api/auth/verify")
        .send({
          email: testUser.Email,
          code: verificationCode
        });

      expect(verifyResponse.status).toBe(200);

      
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.Email,
          Password: testUser.Password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
    });

    it("should prevent login before verification", async () => {
     
      await request(app)
        .post("/api/auth/register")
        .send(testUser);

      
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.Email,
          Password: testUser.Password
        });

      expect(loginResponse.status).toBe(403);
      expect(loginResponse.body).toHaveProperty('message', 'Account not verified');
    });
  });

  describe("Security Tests", () => {
    it("should hash passwords correctly", async () => {
      await request(app)
        .post("/api/auth/register")
        .send(testUser);

      const createdUser = await db.select().from(users).where(eq(users.Email, testUser.Email));
      
      
      expect(createdUser[0].Password).not.toBe(testUser.Password);
      
      
      expect(bcrypt.compareSync(testUser.Password, createdUser[0].Password)).toBe(true);
      
     
      const anotherUser = { ...testUser, Email: "another@test.com" };
      await request(app)
        .post("/api/auth/register")
        .send(anotherUser);

      const anotherCreatedUser = await db.select().from(users).where(eq(users.Email, anotherUser.Email));
      expect(createdUser[0].Password).not.toBe(anotherCreatedUser[0].Password);
    });

    it("should generate unique verification codes", async () => {
      // Register multiple users
      const testUsers = [
        { ...testUser, Email: "user1@test.com" },
        { ...testUser, Email: "user2@test.com" },
        { ...testUser, Email: "user3@test.com" }
      ];

      const codes = [];
      for (const user of testUsers) {
        await request(app)
          .post("/api/auth/register")
          .send(user);

        const createdUser = await db.select().from(users).where(eq(users.Email, user.Email));
        codes.push(createdUser[0].verificationCode);
      }

      // Codes should be unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should validate JWT secret exists", async () => {
      
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const verifiedTestUser = await createVerifiedUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: verifiedUser.Email,
          Password: verifiedUser.Password
        });

      expect(response.status).toBe(500);

      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle database errors gracefully", async () => {
      
      
      const invalidUser = {
        First_name: "A".repeat(1000), 
        Last_name: "Doe",
        Email: "test@test.com",
        Password: "password123",
        Contact_phone: 123456789,
        Address: "Test Address",
        Role: "user" as const
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidUser);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it("should handle malformed request bodies", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send("invalid json");

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should handle empty request bodies", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({});

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});