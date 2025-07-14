import { Request, Response } from "express";
import * as paymentController from "../../../src/Payments/payments.controller";
import * as paymentService from "../../../src/Payments/payments.services";

jest.mock("../../../src/Payments/payments.services");

describe("Payment Controller", () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  
  test("getAllPayments should return payments", async () => {
    const res = mockResponse();
    const payments = [{ Payment_id: 1 }, { Payment_id: 2 }];
    (paymentService.getAllPayments as jest.Mock).mockResolvedValue(payments);

    await paymentController.getAllPayments({} as Request, res);

    expect(paymentService.getAllPayments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(payments);
  });

  
  test("getPaymentById should return a payment", async () => {
    const res = mockResponse();
    const req = { params: { id: "1" } } as unknown as Request;
    const payment = { Payment_id: 1 };
    (paymentService.getPaymentById as jest.Mock).mockResolvedValue(payment);

    await paymentController.getPaymentById(req, res);

    expect(paymentService.getPaymentById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(payment);
  });

 
  test("getPaymentById should return 404 if not found", async () => {
    const res = mockResponse();
    const req = { params: { id: "1" } } as unknown as Request;
    (paymentService.getPaymentById as jest.Mock).mockResolvedValue(null);

    await paymentController.getPaymentById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Payment not found" });
  });

  
  it("should return 201 with new payment", async () => {
  const req = {
    body: {
      Booking_id: 1,
      user_id: 1,
      Amount: 1000,
      Payment_status: "paid",
      Payment_date: "2025-07-14",
      Payment_method: "mpesa",
      Transaction_id: "ABC123"
    }
  } as any;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as any;

  const newPayment = { payment_id: 1, ...req.body };

  (paymentService.createPayment as jest.Mock).mockResolvedValue(newPayment);

  await paymentController.createPayment(req, res);

  expect(paymentService.createPayment).toHaveBeenCalledWith(req.body);
  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(newPayment);
});

 
  test("updatePayment should return updated payment", async () => {
    const res = mockResponse();
    const req = {
      params: { id: "1" },
      body: { amount: 2000 },
    } as unknown as Request;
    const updatedPayment = { Payment_id: 1, amount: 2000 };
    (paymentService.updatePayment as jest.Mock).mockResolvedValue(updatedPayment);

    await paymentController.updatePayment(req, res);

    expect(paymentService.updatePayment).toHaveBeenCalledWith(1, req.body);
    expect(res.json).toHaveBeenCalledWith(updatedPayment);
  });

  
  test("deletePayment should return 204", async () => {
    const res = mockResponse();
    const req = { params: { id: "1" } } as unknown as Request;
    (paymentService.deletePayment as jest.Mock).mockResolvedValue(undefined);

    await paymentController.deletePayment(req, res);

    expect(paymentService.deletePayment).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
