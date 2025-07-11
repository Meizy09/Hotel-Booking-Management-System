import { Router } from "express";
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../Customer_support_tickets/customer_support_tickets.controller";

const router = Router();

router.get("/", getAllTickets);
router.get("/:id", getTicketById);
router.post("/", createTicket);
router.patch("/:id", updateTicket);
router.delete("/:id", deleteTicket);

export default router;
