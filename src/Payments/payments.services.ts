import  db  from "../Drizzle/db";
import { payments, bookings, users, rooms, hotels } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { PaymentInsert } from "../Drizzle/schema";

export const getAllPayments = async () => {
  return await db
  .select()
  .from(payments)
  .innerJoin(bookings, eq(payments.Booking_id, bookings.Booking_id))
  .innerJoin(users, eq(payments.user_id, users.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id))
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id));;
};

export const getPaymentById = async (id: number) => {
  const result = await db
  .select()
  .from(payments)
  .innerJoin(bookings, eq(payments.Booking_id, bookings.Booking_id))
  .innerJoin(users, eq(payments.user_id, users.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id))
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id))
  .where(eq(payments.Payment_id, id));
  return result[0];
};

export const createPayment = async (payment: PaymentInsert) => {
  return await db.insert(payments).values(payment).returning();
};

export const updatePayment = async (id: number, payment: Partial<PaymentInsert>) => {
  return await db
    .update(payments)
    .set(payment)
    .where(eq(payments.Payment_id, id))
    .returning();
};

export const deletePayment = async (id: number) => {
  return await db.delete(payments).where(eq(payments.Payment_id, id));
};
