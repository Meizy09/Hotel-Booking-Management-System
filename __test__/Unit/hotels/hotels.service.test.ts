import * as hotelService from "../../../src/Hotels/hotels.services";
import { hotels } from "../../../src/Drizzle/schema";
import db from "../../../src/Drizzle/db";
import { eq } from "drizzle-orm";

const mockHotelWithRoom = {
  Hotels: {
    Hotel_id: 1,
    Name: "Palm Breeze Hotel",
    Location: "Nairobi",
    Address: "123 Westlands Rd",
    Contact_phone: 700123456,
    Category: "Luxury",
    Rating: "4.5",
    Created_at: new Date("2025-07-09T10:00:00Z"),
    Updated_at: new Date("2025-07-09T10:00:00Z"),
  },
  Rooms: {
    Room_id: 1,
    Hotel_id: 1,
    Room_type: "Deluxe",
    Price_per_night: "100.00",
    Capacity: 2,
    Amenities: "WiFi, TV",
    is_available: true,
    Created_at: new Date("2025-07-09T10:00:00Z"),
    Updated_at: new Date("2025-07-09T10:00:00Z"),
  },
};

jest.mock("../../../src/Drizzle/db", () => {
  const mockReturnValue = {
    from: jest.fn(() => ({
      leftJoin: jest.fn(() => [mockHotelWithRoom]), 
    })),
  };

  return {
    select: jest.fn(() => mockReturnValue),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn().mockReturnValue([{ Hotel_id: 1 }]),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockReturnValue([{ Hotel_id: 1 }]),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn().mockReturnValue("deleted"),
    })),
  };
});

describe("Hotel Service", () => {
  const mockHotel = {
    Hotel_id: 1,
    Name: "Palm Breeze Hotel",
    Location: "Nairobi",
    Address: "123 Westlands Rd",
    Contact_phone: 700123456,
    Category: "Luxury",
    Rating: "4.5",
    Created_at: new Date("2025-07-09T10:00:00Z"),
    Updated_at: new Date("2025-07-09T10:00:00Z"),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllHotels should return all hotels", async () => {
    const result = await hotelService.getAllHotels();
    expect(result).toEqual([mockHotelWithRoom]);
  });

  test("getHotelById should return one hotel by ID", async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({
        leftJoin: jest.fn(() => ({
          where: jest.fn().mockReturnValueOnce([mockHotelWithRoom]),
        })),
      })),
    });

    const result = await hotelService.getHotelById(1);
    expect(result).toEqual(mockHotelWithRoom);
  });

  test("createHotel should return the new hotel", async () => {
    const result = await hotelService.createHotel(mockHotel);
    expect(result).toEqual({ Hotel_id: 1 });
  });

  test("updateHotel should return the updated hotel", async () => {
    const result = await hotelService.updateHotel(1, { Name: "Updated Name" });
    expect(result).toEqual([{ Hotel_id: 1 }]);
  });

  test("deleteHotel should return deletion result", async () => {
    const result = await hotelService.deleteHotel(1);
    expect(result).toBe("deleted");
  });
});

describe("Negative tests", () => {
  test("getHotelById should return undefined if hotel not found", async () => {
    interface MockJoinChain {
      leftJoin: jest.Mock;
      where: jest.Mock;
    }

    const mockJoinChain = {} as MockJoinChain;

    mockJoinChain.leftJoin = jest.fn(() => mockJoinChain);
    mockJoinChain.where = jest.fn(() => []);

    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => mockJoinChain),
    });

    const result = await hotelService.getHotelById(999);
    expect(result).toBeUndefined();
  });

  test("createHotel should return empty array if nothing is inserted", async () => {
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockReturnValue([]),
      })),
    });

    const result = await hotelService.createHotel({
      Hotel_id: 2,
      Name: "Ocean Breeze",
      Location: "Mombasa",
      Address: "456 Beach Ave",
      Contact_phone: 711000111,
      Category: "Budget",
      Rating: "3.2",
      Created_at: new Date("2025-07-01T10:00:00Z"),
      Updated_at: new Date("2025-07-01T10:00:00Z"),
    });

    expect(result).toBeUndefined();
  });

  test("updateHotel should return empty array if hotel not found", async () => {
    (db.update as jest.Mock).mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockReturnValue([]), 
        })),
      })),
    });

    const result = await hotelService.updateHotel(999, { Name: "Ghost Hotel" });
    expect(result).toEqual([]);
  });

  test("deleteHotel should return undefined if nothing is deleted", async () => {
    (db.delete as jest.Mock).mockReturnValueOnce({
      where: jest.fn().mockReturnValue(undefined),
    });

    const result = await hotelService.deleteHotel(999);
    expect(result).toBeUndefined();
  });
});

