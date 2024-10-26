CREATE TABLE `belief_rating` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thought_id` integer NOT NULL,
	`belief_rating` integer NOT NULL,
	`rated_at` integer NOT NULL,
	FOREIGN KEY (`thought_id`) REFERENCES `thought`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `belief_target_rating` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thought_id` integer NOT NULL,
	`belief_target_rating` integer NOT NULL,
	`rated_at` integer NOT NULL,
	FOREIGN KEY (`thought_id`) REFERENCES `thought`(`id`) ON UPDATE no action ON DELETE no action
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
	`cognitive_distortion` text NOT NULL,
	`rating` integer NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`thought_id`) REFERENCES `thought`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `thought` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
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
--> statement-breakpoint
CREATE UNIQUE INDEX `belief_target_rating_thought_id_unique` ON `belief_target_rating` (`thought_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `thought_distortion_thought_id_cognitive_distortion_unique` ON `thought_distortion` (`thought_id`,`cognitive_distortion`);