DROP INDEX `defectIdx` ON `activityLog`;--> statement-breakpoint
ALTER TABLE `projects` ADD `ownerName` varchar(255);--> statement-breakpoint
ALTER TABLE `activityLog` DROP COLUMN `defectId`;