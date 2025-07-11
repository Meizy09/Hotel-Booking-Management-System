import * as userService from "../../../src/Users/users.services";
import db from "../../../src/Drizzle/db";

jest.mock("../../../src/Drizzle/db", () => {
  // 👇 Declare the promise INSIDE the mock block
  const mockUserDataPromise = Promise.resolve([
    {
      users: {
        user_id: 1,
        First_name: "John",
        Last_name: "Doe",
        Email: "john@example.com"
      },
      payments: {
        Payment_id: 10,
        user_id: 1,
        Amount: 500
      },
      bookings: {
        Booking_id: 20,
        user_id: 1,
        Room_id: 3
      },
      rooms: {
        Room_id: 3,
        Room_type: "Deluxe"
      }
    }
  ]);

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: typeof mockUserDataPromise.then;
  }

  const mockJoinChain: MockJoinChain = {
    innerJoin: jest.fn(() => mockJoinChain),
    where: jest.fn(() => mockJoinChain),
    then: mockUserDataPromise.then.bind(mockUserDataPromise) // ✅ no ReferenceError now
  };

  const mockFrom = jest.fn(() => mockJoinChain);

  const mockSelect = jest.fn(() => ({
    from: mockFrom
  }));

  return {
    __esModule: true,
    default: {
      select: mockSelect,
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([
            {
              user_id: 2,
              First_name: "Alice",
              Last_name: "Smith",
              Email: "alice@example.com"
            }
          ])
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              {
                user_id: 1,
                First_name: "Updated"
              }
            ])
          }))
        }))
      })),
      delete: jest.fn(() => ({
        where: jest.fn().mockResolvedValue("deleted")
      }))
    }
  };
});


describe("Users Service with Joins", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllUsers should return users with payments, bookings and rooms", async () => {
    const result = await userService.getAllUsers();
    expect(result).toEqual([
      {
        users: expect.objectContaining({ user_id: 1 }),
        payments: expect.objectContaining({ user_id: 1 }),
        bookings: expect.objectContaining({ user_id: 1 }),
        rooms: expect.objectContaining({ Room_id: 3 })
      }
    ]);
  });

  test("getUserById should return user by ID with joins", async () => {
    const result = await userService.getUserById(1);
    expect(result).toEqual(
      expect.objectContaining({
        users: expect.objectContaining({ user_id: 1 }),
        payments: expect.any(Object),
        bookings: expect.any(Object),
        rooms: expect.any(Object)
      })
    );
  });

  test("createUser should return inserted user", async () => {
    const newUser = {
      user_id: 2,
      First_name: "Alice",
      Last_name: "Smith",
      Email: "alice@example.com"
    };

    const result = await userService.createUser(newUser as any);
    expect(result).toEqual([newUser]);
  });

  test("updateUser should return updated user", async () => {
    const updates = { First_name: "Updated" };
    const result = await userService.updateUser(1, updates);
    expect(result).toEqual([
      {
        user_id: 1,
        First_name: "Updated"
      }
    ]);
  });

  test("deleteUser should return 'deleted'", async () => {
    const result = await userService.deleteUser(1);
    expect(result).toBe("deleted");
  });
});

describe("Negative tests", () => {
  test("getUserById should return undefined if no user is found", async () => {
    interface MockJoinChain {
      innerJoin: jest.Mock;
      where: jest.Mock;
      then: jest.Mock;
    }

    const mockJoinChain = {} as MockJoinChain;

    mockJoinChain.innerJoin = jest.fn(() => mockJoinChain);
    mockJoinChain.where = jest.fn(() => mockJoinChain);
    mockJoinChain.then = jest.fn().mockImplementation(cb => Promise.resolve([]).then(cb));

    const mockFrom = jest.fn(() => mockJoinChain);
    (db.select as jest.Mock).mockReturnValueOnce({ from: mockFrom });

    const result = await userService.getUserById(999);
    expect(result).toBeUndefined();
  });

  test("createUser should return undefined if insert fails", async () => {
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([])
      }))
    });

    const result = await userService.createUser({} as any);
    expect(result).toEqual([]);
  });

  test("updateUser should return empty array if update fails", async () => {
    (db.update as jest.Mock).mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([])
        }))
      }))
    });

    const result = await userService.updateUser(999, { First_name: "Ghost" });
    expect(result).toEqual([]);
  });

  test("deleteUser should return undefined if no user deleted", async () => {
    (db.delete as jest.Mock).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue(undefined)
    });

    const result = await userService.deleteUser(999);
    expect(result).toBeUndefined();
  });
});

