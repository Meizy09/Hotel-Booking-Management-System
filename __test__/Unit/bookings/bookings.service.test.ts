import * as bookingsService from "../../../src/Bookings/bookings.services";
import db from "../../../src/Drizzle/db";

jest.mock("../../../src/Drizzle/db", () => {
  const mockQueryResult = Promise.resolve([
    {
      bookings: { Booking_id: 2, user_id: 1 },
      users: { First_name: "Alice" },
      rooms: { Room_id: 3 },
      hotels: { Hotel_id: 4, Name: "Hotel Plaza" }
    }
  ]);

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: typeof mockQueryResult.then;
  }

  const mockJoinChain: MockJoinChain = {
    innerJoin: jest.fn(() => mockJoinChain),
    where: jest.fn(() => mockJoinChain),
    then: mockQueryResult.then.bind(mockQueryResult)
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
              Booking_id: 3,
              user_id: 1,
              Room_id: 2,
              Check_in_date: "2025-07-10",
              Check_out_date: "2025-07-12",
              Total_amount: 450.0,
              Booking_status: "confirmed",
              Created_at: "2025-07-10T08:00:00Z",
              Updated_at: "2025-07-10T08:00:00Z"
            }
          ])
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              {
                Booking_id: 1,
                Booking_status: "cancelled"
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

describe("Booking Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get all bookings with joins", async () => {
    const result = await bookingsService.getAllBookings();
    expect(result).toEqual([
      {
        bookings: { Booking_id: 2, user_id: 1 },
        users: { First_name: "Alice" },
        rooms: { Room_id: 3 },
        hotels: { Hotel_id: 4, Name: "Hotel Plaza" }
      }
    ]);
  });

  it("should get a booking by ID with joins", async () => {
    const result = await bookingsService.getBookingById(2);
    expect(result).toEqual({
      bookings: { Booking_id: 2, user_id: 1 },
      users: { First_name: "Alice" },
      rooms: { Room_id: 3 },
      hotels: { Hotel_id: 4, Name: "Hotel Plaza" }
    });
  });

  it("should create a booking", async () => {
  const expected = [
    {
      Booking_id: 3,
      user_id: 1,
      Room_id: 2,
      Check_in_date: "2025-07-10",
      Check_out_date: "2025-07-12",
      Total_amount: 450.0, // number
      Booking_status: "confirmed",
      Created_at: "2025-07-10T08:00:00Z", // string
      Updated_at: "2025-07-10T08:00:00Z"
    }
  ];
  const result = await bookingsService.createBooking({} as any); // input can be mocked
  expect(result).toEqual(expected);
});


  it("should update a booking", async () => {
    const updates = { Booking_status: "cancelled" };
    const result = await bookingsService.updateBooking(1, updates);
    expect(result).toEqual([{ Booking_id: 1, Booking_status: "cancelled" }]);
  });

  it("should delete a booking", async () => {
    const result = await bookingsService.deleteBooking(1);
    expect(result).toEqual("deleted");
  });
});

describe("Negative tests", () => {
  test("getBookingById should return undefined if booking not found", async () => {
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

    const result = await bookingsService.getBookingById(999);
    expect(result).toBeUndefined();
  });

  test("createBooking should return empty array if no booking created", async () => {
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([]), // simulate failure
      })),
    });

    const result = await bookingsService.createBooking({} as any);
    expect(result).toEqual([]);
  });

  test("updateBooking should return empty array if no booking updated", async () => {
    (db.update as jest.Mock).mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([]),
        })),
      })),
    });

    const result = await bookingsService.updateBooking(999, { Booking_status: "cancelled" });
    expect(result).toEqual([]);
  });

  test("deleteBooking should return undefined if no booking matched", async () => {
    (db.delete as jest.Mock).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const result = await bookingsService.deleteBooking(999);
    expect(result).toBeUndefined();
  });
});

