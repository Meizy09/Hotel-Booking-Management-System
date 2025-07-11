CREATE TYPE "public"."role" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "Users" ALTER COLUMN "Role" SET DATA TYPE "public"."role" USING "Role"::"public"."role";--> statement-breakpoint
ALTER TABLE "Users" ALTER COLUMN "Created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Users" ALTER COLUMN "Updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Payments" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Users" ADD COLUMN "verification_code" varchar(10);--> statement-breakpoint
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_user_id_Users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE no action ON UPDATE no action;