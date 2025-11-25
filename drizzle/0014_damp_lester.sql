CREATE TABLE `defectInspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`inspectorId` int NOT NULL,
	`inspectionType` enum('initial','reinspection') NOT NULL,
	`result` enum('passed','failed','pending') NOT NULL DEFAULT 'pending',
	`comments` text,
	`photoUrls` text,
	`inspectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `defectInspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `defects` MODIFY COLUMN `status` enum('reported','analysis','in_progress','resolved','pending_reinspection','closed') NOT NULL DEFAULT 'reported';--> statement-breakpoint
CREATE INDEX `defectIdx` ON `defectInspections` (`defectId`);--> statement-breakpoint
CREATE INDEX `inspectorIdx` ON `defectInspections` (`inspectorId`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defectInspections` (`inspectionType`);