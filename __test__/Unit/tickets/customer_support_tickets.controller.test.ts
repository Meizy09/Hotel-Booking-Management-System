import { Request, Response } from "express";
import * as ticketController from "../../../src/Customer_support_tickets/customer_support_tickets.controller";
import * as ticketService from "../../../src/Customer_support_tickets/customer_support_tickets.services";

jest.mock("../../../src/Customer_support_tickets/customer_support_tickets.services");

const mockRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res as Response;
};

describe("Customer Support Ticket Controller", () => {
  const mockTicket = {
    Tickect_id: 1,
    user_id: 1,
    Subject: "Login Issue",
    Description: "Cannot log into my account.",
    Status: "open",
    Created_at: "2025-07-10T12:00:00Z",
    Updated_at: "2025-07-10T12:00:00Z"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllTickets should return all tickets", async () => {
    (ticketService.getAllTickets as jest.Mock).mockResolvedValue([mockTicket]);

    const req = {} as Request;
    const res = mockRes();

    await ticketController.getAllTickets(req, res);

    expect(res.json).toHaveBeenCalledWith([mockTicket]);
  });

  test("getTicketById should return ticket if found", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (ticketService.getTicketById as jest.Mock).mockResolvedValue(mockTicket);

    await ticketController.getTicketById(req, res);

    expect(res.json).toHaveBeenCalledWith(mockTicket);
  });

  test("getTicketById should return 404 if ticket not found", async () => {
    const req = { params: { id: "99" } } as unknown as Request;
    const res = mockRes();
    (ticketService.getTicketById as jest.Mock).mockResolvedValue(undefined);

    await ticketController.getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Ticket not found" });
  });

  test("createTicket should return 201 and created ticket", async () => {
    const req = { body: mockTicket } as Request;
    const res = mockRes();
    (ticketService.createTicket as jest.Mock).mockResolvedValue(mockTicket);

    await ticketController.createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockTicket);
  });

  test("updateTicket should return updated ticket", async () => {
    const updated = { ...mockTicket, Status: "closed" };
    const req = { params: { id: "1" }, body: { Status: "closed" } } as unknown as Request;
    const res = mockRes();
    (ticketService.updateTicket as jest.Mock).mockResolvedValue(updated);

    await ticketController.updateTicket(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test("deleteTicket should return 204", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (ticketService.deleteTicket as jest.Mock).mockResolvedValue(undefined);

    await ticketController.deleteTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
