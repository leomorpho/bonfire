PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`encryption_salt` text
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "email", "email_verified", "encryption_salt") SELECT "id", "email", "email_verified", "encryption_salt" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;