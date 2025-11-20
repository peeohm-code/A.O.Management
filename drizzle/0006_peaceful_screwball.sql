ALTER TABLE `activityLog` ADD `defectId` int;--> statement-breakpoint
CREATE INDEX `defectIdx` ON `activityLog` (`defectId`);