import * as ticketService from "../../../src/Customer_support_tickets/customer_support_tickets.services";
import db from "../../../src/Drizzle/db";

jest.mock("../../../src/Drizzle/db", () => {
  const mockTicketDataPromise = Promise.resolve([
    {
      customerSupportTickets: {
        Tickect_id: 1,
        user_id: 1,
        Subject: "Login Issue",
        Description: "Can't log in",
        Status: "open"
      },
      users: {
        user_id: 1,
        First_name: "John",
        Last_name: "Doe",
        Email: "john@example.com"
      }
    }
  ]);

  interface MockJoinChain {
    innerJoin: jest.Mock<MockJoinChain, any>;
    where: jest.Mock<MockJoinChain, any>;
    then: typeof mockTicketDataPromise.then;
  }

  const mockJoinChain: MockJoinChain = {
    innerJoin: jest.fn(() => mockJoinChain),
    where: jest.fn(() => mockJoinChain),
    then: mockTicketDataPromise.then.bind(mockTicketDataPromise)
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
              Tickect_id: 2,
              user_id: 1,
              Subject: "Payment not working",
              Description: "I can't make a payment.",
              Status: "open"
            }
          ])
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              {
                Tickect_id: 1,
                Status: "resolved"
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

describe("Customer Support Ticket Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllTickets should return all tickets with users", async () => {
    const result = await ticketService.getAllTickets();
    expect(result).toEqual([
      {
        customerSupportTickets: expect.objectContaining({ Tickect_id: 1 }),
        users: expect.objectContaining({ user_id: 1 })
      }
    ]);
  });

  test("getTicketById should return ticket with user by ID", async () => {
    const result = await ticketService.getTicketById(1);
    expect(result).toEqual(
      expect.objectContaining({
        customerSupportTickets: expect.objectContaining({ Tickect_id: 1 }),
        users: expect.any(Object)
      })
    );
  });

  test("createTicket should return inserted ticket", async () => {
    const newTicket = {
      Tickect_id: 2,
      user_id: 1,
      Subject: "Payment not working",
      Description: "I can't make a payment.",
      Status: "open"
    };

    const result = await ticketService.createTicket(newTicket as any);
    expect(result).toEqual(newTicket);
  });

  test("updateTicket should return updated ticket", async () => {
    const updates = { Status: "resolved" };
    const result = await ticketService.updateTicket(1, updates);
    expect(result).toEqual([{ Tickect_id: 1, Status: "resolved" }]);
  });

  test("deleteTicket should return 'deleted'", async () => {
    const result = await ticketService.deleteTicket(1);
    expect(result).toBe("deleted");
  });
});

describe("Negative tests", () => {
  test("getTicketById should return undefined if ticket not found", async () => {
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

    const result = await ticketService.getTicketById(999);
    expect(result).toBeUndefined();
  });

  test("createTicket should return undefined if no ticket was created", async () => {
    (db.insert as jest.Mock).mockReturnValueOnce({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([]) 
      }))
    });

    const result = await ticketService.createTicket({} as any);
    expect(result).toBeUndefined();
  });

  test("updateTicket should return empty array if no ticket was updated", async () => {
    (db.update as jest.Mock).mockReturnValueOnce({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn().mockResolvedValue([]) 
        }))
      }))
    });

    const result = await ticketService.updateTicket(999, { Status: "closed" });
    expect(result).toEqual([]);
  });

  test("deleteTicket should return undefined if ticket was not deleted", async () => {
    (db.delete as jest.Mock).mockReturnValueOnce({
      where: jest.fn().mockResolvedValue(undefined)
    });

    const result = await ticketService.deleteTicket(999);
    expect(result).toBeUndefined();
  });
});

