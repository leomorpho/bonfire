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
CREATE TABLE `cognitive_distortion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
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
	`user_id` text NOT NULL,
	`thought` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `belief_target_rating_thought_id_unique` ON `belief_target_rating` (`thought_id`);