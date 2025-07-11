import * as roomService from "../../../src/Rooms/rooms.services";
import db from "../../../src/Drizzle/db";

jest.mock("../../../src/Drizzle/db", () => {
  const mockRoomData = [
    {
      rooms: {
        Room_id: 1,
        Hotel_id: 2,
        Room_type: "Deluxe",
        Price_per_night: 150,
        Capacity: 2,
        Amenities: "Wi-Fi, TV, AC",
        is_available: true,
        Created_at: "2025-07-10T12:00:00Z",
        Updated_at: "2025-07-10T12:00:00Z"
      },
      hotels: {
        Hotel_id: 2,
        Name: "Hotel Plaza"
      },
      bookings: {
        Booking_id: 5,
        Room_id: 1,
        user_id: 3
      },
      users: {
        user_id: 3,
        First_name: "Alice"
      }
    }
  ];

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: Promise<any>['then'];
  }

  const mockJoinChain: MockJoinChain = {
    innerJoin: jest.fn(() => mockJoinChain),
    where: jest.fn(() => mockJoinChain),
    then: Promise.resolve(mockRoomData).then.bind(Promise.resolve(mockRoomData))
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
              Room_id: 2,
              Hotel_id: 2,
              Room_type: "Suite",
              Price_per_night: 200,
              Capacity: 4,
              Amenities: "TV, AC",
              is_available: true,
              Created_at: "2025-07-12T08:00:00Z",
              Updated_at: "2025-07-12T08:00:00Z"
            }
          ])
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              {
                Room_id: 1,
                Room_type: "Updated Suite"
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

describe("Rooms Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllRooms should return all rooms with joins", async () => {
    const result = await roomService.getAllRooms();
    expect(result).toEqual([
      {
        rooms: expect.objectContaining({ Room_id: 1 }),
        hotels: expect.objectContaining({ Name: "Hotel Plaza" }),
        bookings: expect.objectContaining({ Room_id: 1 }),
        users: expect.objectContaining({ First_name: "Alice" })
      }
    ]);
  });

  test("getRoomById should return one room with joins", async () => {
    const result = await roomService.getRoomById(1);
    expect(result).toEqual(
      expect.objectContaining({
        rooms: expect.objectContaining({ Room_id: 1 }),
        hotels: expect.any(Object),
        bookings: expect.any(Object),
        users: expect.any(Object)
      })
    );
  });

  test("createRoom should return the new room", async () => {
    const newRoom = {
      Room_id: 2,
      Hotel_id: 2,
      Room_type: "Suite",
      Price_per_night: 200,
      Capacity: 4,
      Amenities: "TV, AC",
      is_available: true,
      Created_at: "2025-07-12T08:00:00Z",
      Updated_at: "2025-07-12T08:00:00Z"
    };

    const result = await roomService.createRoom(newRoom as any);
    expect(result).toEqual([newRoom]);
  });

  test("updateRoom should return updated room", async () => {
    const updates = { Room_type: "Updated Suite" };
    const result = await roomService.updateRoom(1, updates);
    expect(result).toEqual([
      {
        Room_id: 1,
        Room_type: "Updated Suite"
      }
    ]);
  });

  test("deleteRoom should return 'deleted'", async () => {
    const result = await roomService.deleteRoom(1);
    expect(result).toBe("deleted");
  });
});

describe("Negative tests", () => {
  test("getRoomById should return undefined if room not found", async () => {
  const mockSelect = db.select as jest.Mock;

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: jest.Mock;
  }

 
  const mockJoinChain = {} as MockJoinChain;

 
  mockJoinChain.innerJoin = jest.fn(() => mockJoinChain);
  mockJoinChain.where = jest.fn(() => mockJoinChain);
  mockJoinChain.then = jest.fn().mockImplementation(cb => Promise.resolve([]).then(cb));

  const mockFrom = jest.fn(() => mockJoinChain);

  mockSelect.mockReturnValue({
    from: mockFrom
  });

  const result = await roomService.getRoomById(999);
  expect(result).toBeUndefined();
});


  test("createRoom should return empty array when insert fails", async () => {
    const mockInsert = db.insert as jest.Mock;

    mockInsert.mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([]) // simulate failure
      }))
    });

    const result = await roomService.createRoom({
      Room_id: 0,
      Hotel_id: 0,
      Room_type: "",
      Price_per_night: 0,
      Capacity: 0,
      Amenities: "",
      is_available: false,
      Created_at: "2025-07-01T00:00:00Z",
      Updated_at: "2025-07-01T00:00:00Z"
    } as any);

    expect(result).toEqual([]);
  });

  test("updateRoom should return empty array when no room matches", async () => {
    const mockUpdate = db.update as jest.Mock;

    mockUpdate.mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([]) // no match
        }))
      }))
    });

    const result = await roomService.updateRoom(999, {
      Room_type: "Fake"
    });

    expect(result).toEqual([]);
  });

  test("deleteRoom should return undefined when no match", async () => {
    const mockDelete = db.delete as jest.Mock;

    mockDelete.mockReturnValueOnce({
      where: jest.fn().mockResolvedValue(undefined) // not found
    });

    const result = await roomService.deleteRoom(999);
    expect(result).toBeUndefined();
  });
});

