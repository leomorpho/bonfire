CREATE TABLE `email_verification_otp` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`otp` text NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`expires_at` integer NOT NULL
);
