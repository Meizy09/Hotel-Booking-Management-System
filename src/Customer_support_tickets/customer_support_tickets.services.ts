import  db  from "../Drizzle/db";
import { customerSupportTickets, users} from "../Drizzle/schema";
import { eq, SQL } from "drizzle-orm";
import type { TicketInsert } from "../Drizzle/schema";

export const getAllTickets = async () => {
  return await db
  .select()
  .from(customerSupportTickets)
  .innerJoin(users, eq(customerSupportTickets.user_id, users.user_id));
};

export const getTicketById = async (id: number) => {
  const result = await db
  .select()
  .from(customerSupportTickets)
  .innerJoin(users, eq(customerSupportTickets.user_id, users.user_id))
  .where(eq(customerSupportTickets.Tickect_id, id));
  return result[0];
};

export const createTicket = async (ticket: TicketInsert) => {
  const [newTicket] = await db.insert(customerSupportTickets).values(ticket).returning();
  return newTicket;
};


export const updateTicket = async (id: number, ticket: Partial<TicketInsert>) => {
  return await db
    .update(customerSupportTickets)
    .set(ticket)
    .where(eq(customerSupportTickets.Tickect_id, id))
    .returning();
};

export const deleteTicket = async (id: number) => {
  return await db.delete(customerSupportTickets).where(eq(customerSupportTickets.Tickect_id, id));
};
function where(arg0: SQL<unknown>) {
  throw new Error("Function not implemented.");
}

