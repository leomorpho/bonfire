ALTER TABLE `thought` RENAME COLUMN "areDistortionsDone" TO "are_distortions_done";--> statement-breakpoint
ALTER TABLE `thought` ADD `are_emotions_identified` integer;