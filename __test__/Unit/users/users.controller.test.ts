import { Request, Response } from "express";
import * as userController from "../../../src/Users/users.controller";
import * as userService from "../../../src/Users/users.services";

jest.mock("../../../src/Users/users.services");

const mockRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res as Response;
};

describe("User Controller", () => {
  const mockUser = {
    user_id: 1,
    First_name: "John",
    Last_name: "Doe",
    Email: "john@example.com",
    Password: "hashedpassword",
    Contact_phone: 712345678,
    Address: "Nairobi",
    Role: "user",
    isVerified: true,
    verificationCode: "1234",
    Created_at: "2025-07-10T12:00:00Z",
    Updated_at: "2025-07-10T12:00:00Z"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllUsers should return all users", async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValue([mockUser]);

    const req = {} as Request;
    const res = mockRes();

    await userController.getAllUsers(req, res);

    expect(res.json).toHaveBeenCalledWith([mockUser]);
  });

  test("getUserById should return user if found", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

    await userController.getUserById(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  test("getUserById should return 404 if user not found", async () => {
    const req = { params: { id: "99" } } as unknown as Request;
    const res = mockRes();
    (userService.getUserById as jest.Mock).mockResolvedValue(undefined);

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("createUser should return 201 and created user", async () => {
    const req = { body: mockUser } as Request;
    const res = mockRes();
    (userService.createUser as jest.Mock).mockResolvedValue(mockUser);

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  test("updateUser should return updated user", async () => {
    const req = {
      params: { id: "1" },
      body: { First_name: "Updated", Updated_at: Date.now() }
    } as unknown as Request;
    const res = mockRes();
    const updatedUser = { ...mockUser, First_name: "Updated" };

    (userService.updateUser as jest.Mock).mockResolvedValue(updatedUser);

    await userController.updateUser(req, res);

    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  test("deleteUser should return 204 on success", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (userService.deleteUser as jest.Mock).mockResolvedValue(undefined);

    await userController.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
