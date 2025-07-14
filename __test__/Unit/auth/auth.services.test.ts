
import * as authServices from "../../../src/Auth/auth.services";
import db from "../../../src/Drizzle/db";
import { eq } from "drizzle-orm";
import { users } from "../../../src/Drizzle/schema";


const mockWhere = jest.fn().mockResolvedValue([{ user_id: 1, Email: "test@example.com", verificationCode: "1234" }]);
const mockReturning = jest.fn().mockResolvedValue([{ user_id: 1, Email: "test@example.com" }]);
const mockUpdateWhere = jest.fn().mockResolvedValue([{ user_id: 1, isVerified: true }]);

jest.mock("../../../src/Drizzle/db", () => ({
  __esModule: true,
  default: {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: mockReturning
      }))
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: mockWhere
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: mockUpdateWhere
      }))
    }))
  }
}));


describe("Auth Services", () => {
  afterEach(() => jest.clearAllMocks());

  test("createUserService should insert and return user", async () => {
    const user = { Email: "test@example.com", Password: "123" } as any;
    const result = await authServices.createUserService(user);
    expect(result).toEqual({ user_id: 1, Email: "test@example.com" });
  });

  test("getUserByEmailService should return user by email", async () => {
    const result = await authServices.getUserByEmailService("test@example.com");
    expect(result).toEqual(expect.objectContaining({ Email: "test@example.com" }));
  });

  test("verifyUserService should update user verification fields", async () => {
    const result = await authServices.verifyUserService("test@example.com");
    expect(result).toEqual([{ user_id: 1, isVerified: true }]);
  });

  test("userLoginService should return user by email", async () => {
    const result = await authServices.userLoginService("test@example.com");
    expect(result).toEqual(expect.objectContaining({ Email: "test@example.com" }));
  });

  test("createUserService should return undefined if nothing inserted", async () => {
  mockReturning.mockResolvedValueOnce([]); 
  const result = await authServices.createUserService({} as any);
  expect(result).toBeUndefined();
});


  test("getUserByEmailService should return undefined if no match", async () => {
  mockWhere.mockResolvedValueOnce([]); 
  const result = await authServices.getUserByEmailService("unknown@example.com");
  expect(result).toBeUndefined();
});


  test("userLoginService should return undefined if no match", async () => {
    (db.select().from(users).where as jest.Mock).mockResolvedValueOnce([]);
    const result = await authServices.userLoginService("notfound@example.com");
    expect(result).toBeUndefined();
  });
});
