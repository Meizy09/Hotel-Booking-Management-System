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
} from "drizzle-orm/pg-core";

// Users
export const users = pgTable("Users", {
  user_id: serial("user_id").primaryKey(),
  First_name: varchar("First_name", { length: 500 }).notNull(),
  Last_name: varchar("Last_name", { length: 500 }).notNull(),
  Email: varchar("Email", { length: 500 }).notNull(),
  Password: varchar("Password", { length: 500 }).notNull(),
  Contact_phone: integer("Contact_phone").notNull(),
  Address: varchar("Address", { length: 500 }).notNull(),
  Role: text("Role").notNull(),
  Created_at: timestamp("Created_at").notNull(),
  Updated_at: timestamp("Updated_at").notNull(),
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
  Created_at: timestamp("Created_at").notNull(),
  Updated_at: timestamp("Updated_at").notNull(),
});

// Rooms
export const rooms = pgTable("Rooms", {
  Room_id: serial("Room_id").primaryKey(),
  Hotel_id: integer("Hotel_id").notNull().references(() => hotels.Hotel_id),
  Room_type: varchar("Room_type", { length: 500 }).notNull(),
  Price_per_night: decimal("Price_per_night").notNull(),
  Capacity: integer("Capacity").notNull(),
  Amenities: varchar("Amenities", { length: 500 }).notNull(),
  ia_available: boolean("ia_available").notNull(),
  Created_at: timestamp("Created_at").notNull(),
  Updated_at: timestamp("Updated_at").notNull(),
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
  Created_at: timestamp("Created_at").notNull(),
  Updated_at: timestamp("Updated_at").notNull(),
});

// Payments
export const payments = pgTable("Payments", {
  Payment_id: serial("Payment_id").primaryKey(),
  Booking_id: integer("Booking_id").notNull().references(() => bookings.Booking_id),
  Amount: decimal("Amount").notNull(),
  Payment_status: text("Payment_status").notNull(),
  Payment_date: date("Payment_date").notNull(),
  Payment_method: varchar("Payment_method", { length: 500 }).notNull(),
  Transaction_id: varchar("Transaction_id", { length: 500 }).notNull(),
  Created_at: timestamp("Created_at").notNull(),
  Updated_at: timestamp("Updated_at").notNull(),
});

// Customer Support Tickets
export const customerSupportTickets = pgTable("Customer_support_tickets", {
  Tickect_id: serial("Tickect_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.user_id),
  Subject: varchar("Subject", { length: 500 }).notNull(),
  Description: varchar("Description", { length: 500 }).notNull(),
  Status: text("Status").notNull(),
  Created_at: timestamp("Created_at"),
  Updated_at: timestamp("Updated_at"),
});
