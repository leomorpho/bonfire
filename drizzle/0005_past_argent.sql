CREATE TABLE `deleted_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`deleted_at` text DEFAULT (current_timestamp) NOT NULL
);
