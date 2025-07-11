import db from "../Drizzle/db";
import { bookings, users, rooms, hotels } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { BookingInsert } from "../Drizzle/schema";

export const getAllBookings = async () => {
  return await db
  .select()
  .from(bookings)
  .innerJoin(users, eq(bookings.user_id, users.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id))
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id));;
};

export const getBookingById = async (id: number) => {
  const result = await db
  .select()
  .from(bookings)
  .innerJoin(users, eq(bookings.user_id, users.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id))
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id))
  .where(eq(bookings.Booking_id, id));
  return result[0];
};

export const createBooking = async (booking: BookingInsert) => {
  return await db.insert(bookings).values(booking).returning();
};

export const updateBooking = async (id: number, booking: Partial<BookingInsert>) => {
  return await db
    .update(bookings)
    .set(booking)
    .where(eq(bookings.Booking_id, id))
    .returning();
};

export const deleteBooking = async (id: number) => {
  return await db.delete(bookings).where(eq(bookings.Booking_id, id));
};
