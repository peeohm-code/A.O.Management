ALTER TABLE `taskChecklists` ADD `originalInspectionId` int;--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `reinspectionCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `originalInspectionIdx` ON `taskChecklists` (`originalInspectionId`);