CREATE TABLE `belief_rating` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thought_id` integer NOT NULL,
	`belief_rating` integer NOT NULL,
	`rated_at` integer NOT NULL,
	FOREIGN KEY (`thought_id`) REFERENCES `thought`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cognitive_distortion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_verification_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `signin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`logged_in_at` integer NOT NULL,
	`ip_address` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thought_distortion` (
	`thought_id` integer NOT NULL,
	`cognitive_distortion_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`thought_id`) REFERENCES `thought`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cognitive_distortion_id`) REFERENCES `cognitive_distortion`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `thought` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`thought` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer
);
