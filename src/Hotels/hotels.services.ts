import db from "../Drizzle/db";
import { hotels, rooms} from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { HotelInsert } from "../Drizzle/schema";
//Get all hotels with their rooms
export const getAllHotels = async () => {
  return await db
  .select()
  .from(hotels)
  .leftJoin(rooms, eq(hotels.Hotel_id, rooms.Hotel_id));
};

export const getHotelById = async (id: number) => {
  const result = await db
  .select()
  .from(hotels)
  .leftJoin(rooms, eq(hotels.Hotel_id, rooms.Hotel_id))
  .where(eq(hotels.Hotel_id, id));
  return result[0];
};

export const createHotel = async (hotel: HotelInsert) => {
  const[newHotel]= await db.insert(hotels).values(hotel).returning();
  return newHotel;
};

export const updateHotel = async (id: number, hotel: Partial<HotelInsert>) => {
  return await db
    .update(hotels)
    .set(hotel)
    .where(eq(hotels.Hotel_id, id))
    .returning();
};

export const deleteHotel = async (id: number) => {
  return await db.delete(hotels).where(eq(hotels.Hotel_id, id));
};
