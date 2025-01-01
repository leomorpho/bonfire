CREATE TABLE `task_locks` (
	`task_name` text PRIMARY KEY NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL
);
