import  db  from "../Drizzle/db";
import { rooms,hotels, bookings, users } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { RoomInsert } from "../Drizzle/schema";

export const getAllRooms = async () => {
  return await db
  .select()
  .from(rooms)
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id))
  .innerJoin(bookings, eq(rooms.Room_id, bookings.Room_id))
  .innerJoin(users, eq(bookings.user_id, users.user_id));;
};

export const getRoomById = async (id: number) => {
  const result = await db
  .select()
  .from(rooms)
  .innerJoin(hotels, eq(rooms.Hotel_id, hotels.Hotel_id))
  .innerJoin(bookings, eq(rooms.Room_id, bookings.Room_id))
  .innerJoin(users, eq(bookings.user_id, users.user_id))
  .where(eq(rooms.Room_id, id));
  return result[0];
};

export const createRoom = async (room: RoomInsert) => {
  return await db.insert(rooms).values(room).returning();
};

export const updateRoom = async (id: number, room: Partial<RoomInsert>) => {
  return await db
    .update(rooms)
    .set(room)
    .where(eq(rooms.Room_id, id))
    .returning();
};

export const deleteRoom = async (id: number) => {
  return await db.delete(rooms).where(eq(rooms.Room_id, id));
};
