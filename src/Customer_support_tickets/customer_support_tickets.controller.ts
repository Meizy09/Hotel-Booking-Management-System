import { Request, Response } from "express";
import * as ticketService from "../Customer_support_tickets/customer_support_tickets.services";

export const getAllTickets = async (_req: Request, res: Response) => {
  try {
    const tickets = await ticketService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tickets", error });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const ticket = await ticketService.getTicketById(Number(req.params.id));
    if (!ticket) {
       res.status(404).json({ message: "Ticket not found" });
       return;
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket", error });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const newTicket = await ticketService.createTicket(req.body);
    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: "Error creating ticket", error });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const updatedTicket = await ticketService.updateTicket(Number(req.params.id), req.body);
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: "Error updating ticket", error });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    await ticketService.deleteTicket(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting ticket", error });
  }
};
