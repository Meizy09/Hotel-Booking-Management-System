import db from "../Drizzle/db";
import { users } from "../Drizzle/schema";
import { eq } from "drizzle-orm";
import type { UserInsert } from "../Drizzle/schema";

export const createUserService = async (user: UserInsert) => {
  const [newUser] = await db.insert(users).values(user).returning();
  return newUser;
};

export const getUserByEmailService = async (email: string) => {
  const result = await db.select().from(users).where(eq(users.Email, email));
    return result[0];
};

export const verifyUserService = async (email: string) => {
  return await db.update(users)
    .set({ isVerified: true, verificationCode: null })
    .where(eq(users.Email, email));
};

export const userLoginService = async (email: string) => {
  const result = await db.select().from(users).where(eq(users.Email, email));
  return result[0];
};
