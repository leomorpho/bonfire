PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`email` text,
	`email_verified` integer,
	`num_logs` integer DEFAULT 3,
	`is_event_styles_admin` integer DEFAULT false
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "timestamp", "email", "email_verified", "num_logs", "is_event_styles_admin") SELECT "id", "timestamp", "email", "email_verified", "num_logs", "is_event_styles_admin" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);