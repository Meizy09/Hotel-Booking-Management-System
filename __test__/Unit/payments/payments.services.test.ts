import * as paymentService from "../../../src/Payments/payments.services";
import db from "../../../src/Drizzle/db";

jest.mock("../../../src/Drizzle/db", () => {
  const mockPaymentDataPromise = Promise.resolve([
    {
      payments: {
        Payment_id: 1,
        Booking_id: 1,
        user_id: 1,
        Amount: 500,
        Payment_status: "paid",
        Payment_date: "2025-07-12",
        Payment_method: "Mpesa",
        Transaction_id: "TX123",
        Created_at: "2025-07-12T08:00:00Z",
        Updated_at: "2025-07-12T08:00:00Z"
      },
      bookings: {
        Booking_id: 1,
        Room_id: 3,
        user_id: 1
      },
      users: {
        user_id: 1,
        First_name: "John"
      },
      rooms: {
        Room_id: 3,
        Hotel_id: 2,
        Room_type: "Deluxe"
      },
      hotels: {
        Hotel_id: 2,
        Name: "Hotel Plaza"
      }
    }
  ]);

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: typeof mockPaymentDataPromise.then;
  }

  const mockJoinChain: MockJoinChain = {
    innerJoin: jest.fn(() => mockJoinChain),
    where: jest.fn(() => mockJoinChain),
    then: mockPaymentDataPromise.then.bind(mockPaymentDataPromise)
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
              Payment_id: 2,
              Booking_id: 2,
              user_id: 2,
              Amount: 300,
              Payment_status: "pending",
              Payment_date: "2025-07-15",
              Payment_method: "Card",
              Transaction_id: "TX456",
              Created_at: "2025-07-15T10:00:00Z",
              Updated_at: "2025-07-15T10:00:00Z"
            }
          ])
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              {
                Payment_id: 1,
                Payment_status: "refunded"
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

describe("Payment Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllPayments should return payments with joins", async () => {
    const result = await paymentService.getAllPayments();
    expect(result).toEqual([
      {
        payments: expect.objectContaining({ Payment_id: 1 }),
        bookings: expect.objectContaining({ Booking_id: 1 }),
        users: expect.any(Object),
        rooms: expect.any(Object),
        hotels: expect.any(Object)
      }
    ]);
  });

  test("getPaymentById should return one payment by ID with joins", async () => {
    const result = await paymentService.getPaymentById(1);
    expect(result).toEqual(
      expect.objectContaining({
        payments: expect.objectContaining({ Payment_id: 1 }),
        bookings: expect.any(Object),
        users: expect.any(Object),
        rooms: expect.any(Object),
        hotels: expect.any(Object)
      })
    );
  });

  test("createPayment should return new payment", async () => {
    const newPayment = {
      Payment_id: 2,
      Booking_id: 2,
      user_id: 2,
      Amount: 300,
      Payment_status: "pending",
      Payment_date: "2025-07-15",
      Payment_method: "Card",
      Transaction_id: "TX456",
      Created_at: "2025-07-15T10:00:00Z",
      Updated_at: "2025-07-15T10:00:00Z"
    };

    const result = await paymentService.createPayment(newPayment as any);
    expect(result).toEqual([newPayment]);
  });

  test("updatePayment should return updated payment", async () => {
    const updates = { Payment_status: "refunded" };
    const result = await paymentService.updatePayment(1, updates);
    expect(result).toEqual([
      {
        Payment_id: 1,
        Payment_status: "refunded"
      }
    ]);
  });

  test("deletePayment should return 'deleted'", async () => {
    const result = await paymentService.deletePayment(1);
    expect(result).toBe("deleted");
  });
});

describe("Negative tests", () => {
  test("getPaymentById should return undefined if no payment is found", async () => {
    const mockSelect = db.select as jest.Mock;
    interface MockJoinChain {
  innerJoin: jest.Mock<MockJoinChain, any>;
  where: jest.Mock<MockJoinChain, any>;
  then: jest.Mock;
}

const mockJoinChain: MockJoinChain = {
  innerJoin: jest.fn(),
  where: jest.fn(),
  then: jest.fn()
};

// Now assign methods after mockJoinChain is initialized
mockJoinChain.innerJoin.mockImplementation(() => mockJoinChain);
mockJoinChain.where.mockImplementation(() => mockJoinChain);
mockJoinChain.then.mockImplementation(
  (cb: any) => Promise.resolve([]).then(cb)
);

    mockSelect.mockReturnValue({ from: jest.fn(() => mockJoinChain) });

    const result = await paymentService.getPaymentById(999);
    expect(result).toBeUndefined();
  });

  test("createPayment should return empty array when no insert happens", async () => {
    const mockInsert = db.insert as jest.Mock;
    mockInsert.mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([])
      }))
    });

    const result = await paymentService.createPayment({
      Booking_id: 0,
      user_id: 0,
      Amount: 0,
      Payment_status: "failed",
      Payment_date: "2025-07-01",
      Payment_method: "Mpesa",
      Transaction_id: "FAIL",
      Created_at: "2025-07-01T00:00:00Z",
      Updated_at: "2025-07-01T00:00:00Z"
    } as any);

    expect(result).toEqual([]);
  });

  test("updatePayment should return empty array when update does not match", async () => {
    const mockUpdate = db.update as jest.Mock;
    mockUpdate.mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([])
        }))
      }))
    });

    const result = await paymentService.updatePayment(999, {
      Payment_status: "unknown"
    });

    expect(result).toEqual([]);
  });

  test("deletePayment should return undefined when delete doesn't match", async () => {
    const mockDelete = db.delete as jest.Mock;
    mockDelete.mockReturnValueOnce({
      where: jest.fn().mockResolvedValue(undefined)
    });

    const result = await paymentService.deletePayment(999);
    expect(result).toBeUndefined();
  });
});

