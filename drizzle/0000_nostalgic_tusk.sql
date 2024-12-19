CREATE TYPE "public"."attendance_status" AS ENUM('going', 'not_going', 'maybe', 'RSVP');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'RSVP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verification_token" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private_events_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"location" text,
	"attendance_limit" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_image_key" text NOT NULL,
	"small_image_key" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public_events_data" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"event_name" text NOT NULL,
	"description" text,
	"start_time" text NOT NULL,
	"end_time" text,
	"style" text,
	"overlay_color" text,
	"overlay_opacity" integer,
	"num_attendees" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signin" (
	"id" serial PRIMARY KEY NOT NULL,
	"logged_in_at" timestamp NOT NULL,
	"ip_address" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean,
	"num_logs" integer DEFAULT 3,
	"username" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_public_events_data_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."public_events_data"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendees" ADD CONSTRAINT "attendees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_events_data" ADD CONSTRAINT "private_events_data_event_id_public_events_data_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."public_events_data"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_images" ADD CONSTRAINT "profile_images_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_events_data" ADD CONSTRAINT "public_events_data_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
