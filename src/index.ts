import express from "express";
import hotelRoutes from "./Hotels/hotels.router";
import bookingRoutes from "./Bookings/bookings.router";
import paymentRoutes from "./Payments/payments.router";
import roomRoutes from "./Rooms/rooms.router";
import userRoutes from "./Users/users.router";
import authRoutes from "./Auth/auth.router";
import ticketRoutes from "./Customer_support_tickets/customer_support_tickets.router"

const app = express();
app.use(express.json());

app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));
