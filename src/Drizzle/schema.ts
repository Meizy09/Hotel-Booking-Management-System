import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  decimal,
  integer,
  timestamp,
  date,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "user"]);


// Users
export const users = pgTable("Users", {
  user_id: serial("user_id").primaryKey(),
  First_name: varchar("First_name", { length: 500 }).notNull(),
  Last_name: varchar("Last_name", { length: 500 }).notNull(),
  Email: varchar("Email", { length: 500 }).notNull().unique(),
  Password: varchar("Password", { length: 500 }).notNull(),
  Contact_phone: integer("Contact_phone").notNull(),
  Address: varchar("Address", { length: 500 }).notNull(),
  Role: roleEnum("Role").notNull(),
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code", {length: 10}),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// Hotels
export const hotels = pgTable("Hotels", {
  Hotel_id: serial("Hotel_id").primaryKey(),
  Name: varchar("Name", { length: 500 }).notNull(),
  Location: varchar("Location", { length: 500 }).notNull(),
  Address: varchar("Address", { length: 500 }).notNull(),
  Contact_phone: integer("Contact_phone").notNull(),
  Category: varchar("Category", { length: 500 }).notNull(),
  Rating: decimal("Rating").notNull(),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// Rooms
export const rooms = pgTable("Rooms", {
  Room_id: serial("Room_id").primaryKey(),
  Hotel_id: integer("Hotel_id").notNull().references(() => hotels.Hotel_id),
  Room_type: varchar("Room_type", { length: 500 }).notNull(),
  Price_per_night: decimal("Price_per_night").notNull(),
  Capacity: integer("Capacity").notNull(),
  Amenities: varchar("Amenities", { length: 500 }).notNull(),
  is_available: boolean("ia_available").notNull(),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// Bookings
export const bookings = pgTable("Bookings", {
  Booking_id: serial("Booking_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.user_id),
  Room_id: integer("Room_id").notNull().references(() => rooms.Room_id),
  Check_in_date: date("Check_in_date").notNull(),
  Check_out_date: date("Check_out_date").notNull(),
  Total_amount: decimal("Total_amount").notNull(),
  Booking_status: text("Booking_status").notNull(),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("Payments", {
  Payment_id: serial("Payment_id").primaryKey(),
  Booking_id: integer("Booking_id").notNull().references(() => bookings.Booking_id),
  user_id: integer("user_id").notNull().references(() => users.user_id),
  Amount: decimal("Amount").notNull(),
  Payment_status: text("Payment_status").notNull(),
  Payment_date: date("Payment_date").notNull(),
  Payment_method: varchar("Payment_method", { length: 500 }).notNull(),
  Transaction_id: varchar("Transaction_id", { length: 500 }).notNull(),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// Customer Support Tickets
export const customerSupportTickets = pgTable("Customer_support_tickets", {
  Tickect_id: serial("Tickect_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.user_id),
  Subject: varchar("Subject", { length: 500 }).notNull(),
  Description: varchar("Description", { length: 500 }).notNull(),
  Status: text("Status").notNull(),
  Created_at: timestamp("Created_at").defaultNow().notNull(),
  Updated_at: timestamp("Updated_at").defaultNow().notNull(),
});

// ===================
// RELATIONSHIPS
// ===================

export const UserRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  payments: many(payments),
  tickets: many(customerSupportTickets)
}));

export const HotelRelations = relations(hotels, ({ many }) => ({
  rooms: many(rooms)
}));

export const RoomRelations = relations(rooms, ({ one, many }) => ({
  hotel: one(hotels, {
    fields: [rooms.Hotel_id],
    references: [hotels.Hotel_id]
  }),
  bookings: many(bookings)
}));

export const BookingRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.user_id],
    references: [users.user_id]
  }),
  room: one(rooms, {
    fields: [bookings.Room_id],
    references: [rooms.Room_id]
  }),
}));

export const PaymentRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.Booking_id],
    references: [bookings.Booking_id]
  }),
  user: one(users, {
    fields: [payments.user_id],
    references: [users.user_id]
  }),
}));

export const TicketRelations = relations(customerSupportTickets, ({ one }) => ({
  user: one(users, {
    fields: [customerSupportTickets.user_id],
    references: [users.user_id]
  })
}));

//Infer Types
export type UserSelect = typeof users.$inferSelect;
export type HotelSelect = typeof hotels.$inferSelect;
export type RoomSelect = typeof rooms.$inferSelect;
export type BookingSelect = typeof bookings.$inferSelect;
export type PaymentSelect = typeof payments.$inferSelect;
export type TicketSelect = typeof customerSupportTickets.$inferSelect;

export type UserInsert = typeof users.$inferInsert;
export type HotelInsert = typeof hotels.$inferInsert;
export type RoomInsert = typeof rooms.$inferInsert;
export type BookingInsert = typeof bookings.$inferInsert;
export type PaymentInsert = typeof payments.$inferInsert;
export type TicketInsert = typeof customerSupportTickets.$inferInsert;



