ALTER TABLE `projects` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `archivedReason` text;--> statement-breakpoint
CREATE INDEX `archivedAtIdx` ON `projects` (`archivedAt`);