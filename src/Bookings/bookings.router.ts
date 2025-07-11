import { Router } from "express";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../Bookings/bookings.controller";

const router = Router();

router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.patch("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
