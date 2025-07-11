import  db  from "../Drizzle/db";
import { users, payments, bookings, rooms } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { UserInsert } from "../Drizzle/schema";

export const getAllUsers = async () => {
  return await db
  .select()
  .from(users) 
  .innerJoin(payments, eq(users.user_id, payments.user_id))
  .innerJoin(bookings, eq(users.user_id, bookings.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id));;
};

export const getUserById = async (id: number) => {
  const result = await db
  .select()
  .from(users)
  .innerJoin(payments, eq(users.user_id, payments.user_id))
  .innerJoin(bookings, eq(users.user_id, bookings.user_id))
  .innerJoin(rooms, eq(bookings.Room_id, rooms.Room_id))
  .where(eq(users.user_id, id));
  return result[0];
};

export const createUser = async (user: UserInsert) => {
  return await db.insert(users).values(user).returning();
};

export const updateUser = async (id: number, user: Partial<UserInsert>) => {
  return await db
    .update(users)
    .set(user)
    .where(eq(users.user_id, id))
    .returning();
};

export const deleteUser = async (id: number) => {
  return await db.delete(users).where(eq(users.user_id, id));
};
