ALTER TABLE "Bookings" ALTER COLUMN "Created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Bookings" ALTER COLUMN "Updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Customer_support_tickets" ALTER COLUMN "Created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Customer_support_tickets" ALTER COLUMN "Created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Customer_support_tickets" ALTER COLUMN "Updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Customer_support_tickets" ALTER COLUMN "Updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Payments" ALTER COLUMN "Created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Payments" ALTER COLUMN "Updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Rooms" ALTER COLUMN "Created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Rooms" ALTER COLUMN "Updated_at" SET DEFAULT now();