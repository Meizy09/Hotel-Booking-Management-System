// __tests__/auth.controller.test.ts
import request from "supertest";
import express, { Request, Response } from "express";
import * as authController from "../../../src/Auth/auth.controller";
import * as authServices from "../../../src/Auth/auth.services";
import * as mailer from "../../../src/mailer/mailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../../src/Auth/auth.services");
jest.mock("../../../src/mailer/mailer");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

const app = express();
app.use(express.json());
app.post("/register", authController.createUserController);
app.post("/verify", authController.verifyUserController);
app.post("/login", authController.loginUserController);

describe("Auth Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("createUserController", () => {
    it("should create user and send verification email", async () => {
      (authServices.createUserService as jest.Mock).mockResolvedValue(true);
      (mailer.sendEmail as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.hashSync as jest.Mock).mockReturnValue("hashedPassword");

      const response = await request(app).post("/register").send({
        Email: "test@example.com",
        Password: "test123",
        Last_name: "Test"
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toMatch(/verification code sent/i);
    });

    it("should return 400 if user not created", async () => {
      (authServices.createUserService as jest.Mock).mockResolvedValue(null);

      const response = await request(app).post("/register").send({});
      expect(response.status).toBe(400);
    });
  });

  describe("verifyUserController", () => {
    it("should verify user if code matches", async () => {
      const mockUser = { verificationCode: "1234", Last_name: "Doe", Email: "test@example.com" };
      (authServices.getUserByEmailService as jest.Mock).mockResolvedValue(mockUser);
      (authServices.verifyUserService as jest.Mock).mockResolvedValue(true);
      (mailer.sendEmail as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).post("/verify").send({ email: "test@example.com", code: "1234" });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verified successfully/i);
    });

    it("should return 400 if code does not match", async () => {
      const mockUser = { verificationCode: "9999", Last_name: "Doe", Email: "test@example.com" };
      (authServices.getUserByEmailService as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app).post("/verify").send({ email: "test@example.com", code: "1234" });
      expect(res.status).toBe(400);
    });

    it("should return 404 if user not found", async () => {
      (authServices.getUserByEmailService as jest.Mock).mockResolvedValue(null);

      const res = await request(app).post("/verify").send({ email: "unknown@example.com", code: "1234" });
      expect(res.status).toBe(404);
    });
  });

  describe("loginUserController", () => {
    it("should login verified user with valid credentials", async () => {
      const mockUser = {
        user_id: 1,
        First_name: "John",
        Last_name: "Doe",
        Email: "john@example.com",
        Password: "hashedPassword",
        Role: "user",
        isVerified: true
      };

      (authServices.userLoginService as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mockToken");

      const res = await request(app).post("/login").send({
        email: "john@example.com",
        Password: "plainPassword"
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("mockToken");
      expect(res.body.user.email).toBe("john@example.com");
    });

    it("should return 403 if user is not verified", async () => {
      const mockUser = { ...{}, isVerified: false, Password: "hash" };
      (authServices.userLoginService as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app).post("/login").send({ email: "a", Password: "a" });
      expect(res.status).toBe(403);
    });

    it("should return 401 if password mismatch", async () => {
      const mockUser = { Password: "hash", isVerified: true };
      (authServices.userLoginService as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

      const res = await request(app).post("/login").send({ email: "a", Password: "wrong" });
      expect(res.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
      (authServices.userLoginService as jest.Mock).mockResolvedValue(null);
      const res = await request(app).post("/login").send({ email: "missing", Password: "123" });
      expect(res.status).toBe(404);
    });
  });
});
