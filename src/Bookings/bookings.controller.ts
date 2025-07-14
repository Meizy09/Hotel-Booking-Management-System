import { Request, Response } from "express";
import * as bookingService from "../Bookings/bookings.services";

export const getAllBookings = async (_req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getAllBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingById(Number(req.params.id));
    if (!booking) {
     res.status(404).json({ message: "Booking not found" });
     return;
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking", error });
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const newBooking = await bookingService.createBooking(req.body);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    const errorMessage = typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : String(error);
    res.status(500).json({ message: "Error creating booking", error: errorMessage });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  try {
    const updatedBooking = await bookingService.updateBooking(Number(req.params.id), req.body);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: "Error updating booking", error });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    await bookingService.deleteBooking(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting booking", error });
  }
};
