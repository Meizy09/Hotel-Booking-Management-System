import { Request, Response } from "express";
import * as paymentService from "../Payments/payments.services";

export const getAllPayments = async (_req: Request, res: Response) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.getPaymentById(Number(req.params.id));
    if (!payment) {
       res.status(404).json({ message: "Payment not found" });
       return;
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment", error });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const newPayment = await paymentService.createPayment(req.body);
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({ message: "Error creating payment", error });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const updatedPayment = await paymentService.updatePayment(Number(req.params.id), req.body);
    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: "Error updating payment", error });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    await paymentService.deletePayment(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting payment", error });
  }
};
