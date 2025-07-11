import { Request, Response } from "express";
import * as bookingController from "../../../src/Bookings/bookings.controller";
import * as bookingService from "../../../src/Bookings/bookings.services";

jest.mock("../../../src/Bookings/bookings.services");

const mockRes = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res as Response;
};

describe("Booking Controller", () => {
  const mockBooking = {
    Booking_id: 1,
    user_id: 1,
    Room_id: 2,
    Check_in_date: "2025-07-10",
    Check_out_date: "2025-07-14",
    Total_amount: 450.00,
    Booking_status: "confirmed",
    Created_at: "2025-07-09T10:00:00Z",
    Updated_at: "2025-07-09T10:00:00Z"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllBookings should return all bookings", async () => {
    const req = {} as Request;
    const res = mockRes();
    (bookingService.getAllBookings as jest.Mock).mockResolvedValue([mockBooking]);

    await bookingController.getAllBookings(req, res);

    expect(res.json).toHaveBeenCalledWith([mockBooking]);
  });

  test("getBookingById should return a booking if found", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (bookingService.getBookingById as jest.Mock).mockResolvedValue(mockBooking);

    await bookingController.getBookingById(req, res);

    expect(res.json).toHaveBeenCalledWith(mockBooking);
  });

  test("getBookingById should return 404 if not found", async () => {
    const req = { params: { id: "99" } } as unknown as Request;
    const res = mockRes();
    (bookingService.getBookingById as jest.Mock).mockResolvedValue(undefined);

    await bookingController.getBookingById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Booking not found" });
  });

  test("createBooking should return 201 and created booking", async () => {
    const req = { body: mockBooking } as Request;
    const res = mockRes();
    (bookingService.createBooking as jest.Mock).mockResolvedValue(mockBooking);

    await bookingController.createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockBooking);
  });

  test("updateBooking should return updated booking", async () => {
    const req = { params: { id: "1" }, body: { Booking_status: "cancelled" } } as unknown as Request;
    const res = mockRes();
    const updated = { ...mockBooking, Booking_status: "cancelled" };
    (bookingService.updateBooking as jest.Mock).mockResolvedValue(updated);

    await bookingController.updateBooking(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test("deleteBooking should return 204 on success", async () => {
    const req = { params: { id: "1" } } as unknown as Request;
    const res = mockRes();
    (bookingService.deleteBooking as jest.Mock).mockResolvedValue(undefined);

    await bookingController.deleteBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
