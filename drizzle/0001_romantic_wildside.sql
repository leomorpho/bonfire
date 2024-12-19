CREATE TABLE IF NOT EXISTS "attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'RSVP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private_events_data" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
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
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
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
