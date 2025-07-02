CREATE TABLE "Bookings" (
	"Booking_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"Room_id" integer NOT NULL,
	"Check_in_date" date NOT NULL,
	"Check_out_date" date NOT NULL,
	"Total_amount" numeric NOT NULL,
	"Booking_status" text NOT NULL,
	"Created_at" timestamp NOT NULL,
	"Updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Customer_support_tickets" (
	"Tickect_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"Subject" varchar(500) NOT NULL,
	"Description" varchar(500) NOT NULL,
	"Status" text NOT NULL,
	"Created_at" timestamp,
	"Updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "Hotels" (
	"Hotel_id" serial PRIMARY KEY NOT NULL,
	"Name" varchar(500) NOT NULL,
	"Location" varchar(500) NOT NULL,
	"Address" varchar(500) NOT NULL,
	"Contact_phone" integer NOT NULL,
	"Category" varchar(500) NOT NULL,
	"Rating" numeric NOT NULL,
	"Created_at" timestamp NOT NULL,
	"Updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payments" (
	"Payment_id" serial PRIMARY KEY NOT NULL,
	"Booking_id" integer NOT NULL,
	"Amount" numeric NOT NULL,
	"Payment_status" text NOT NULL,
	"Payment_date" date NOT NULL,
	"Payment_method" varchar(500) NOT NULL,
	"Transaction_id" varchar(500) NOT NULL,
	"Created_at" timestamp NOT NULL,
	"Updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Rooms" (
	"Room_id" serial PRIMARY KEY NOT NULL,
	"Hotel_id" integer NOT NULL,
	"Room_type" varchar(500) NOT NULL,
	"Price_per_night" numeric NOT NULL,
	"Capacity" integer NOT NULL,
	"Amenities" varchar(500) NOT NULL,
	"ia_available" boolean NOT NULL,
	"Created_at" timestamp NOT NULL,
	"Updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"First_name" varchar(500) NOT NULL,
	"Last_name" varchar(500) NOT NULL,
	"Email" varchar(500) NOT NULL,
	"Password" varchar(500) NOT NULL,
	"Contact_phone" integer NOT NULL,
	"Address" varchar(500) NOT NULL,
	"Role" text NOT NULL,
	"Created_at" timestamp NOT NULL,
	"Updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_user_id_Users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_Room_id_Rooms_Room_id_fk" FOREIGN KEY ("Room_id") REFERENCES "public"."Rooms"("Room_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Customer_support_tickets" ADD CONSTRAINT "Customer_support_tickets_user_id_Users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_Booking_id_Bookings_Booking_id_fk" FOREIGN KEY ("Booking_id") REFERENCES "public"."Bookings"("Booking_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_Hotel_id_Hotels_Hotel_id_fk" FOREIGN KEY ("Hotel_id") REFERENCES "public"."Hotels"("Hotel_id") ON DELETE no action ON UPDATE no action;