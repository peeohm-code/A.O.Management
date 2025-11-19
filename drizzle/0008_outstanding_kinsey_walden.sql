CREATE TABLE `archiveHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`action` enum('archived','unarchived') NOT NULL,
	`performedBy` int NOT NULL,
	`reason` text,
	`ruleId` int,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `archiveHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archiveRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`projectStatus` enum('planning','active','on_hold','completed','cancelled'),
	`daysAfterCompletion` int,
	`daysAfterEndDate` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastRunAt` timestamp,
	CONSTRAINT `archiveRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `projectIdIdx` ON `archiveHistory` (`projectId`);--> statement-breakpoint
CREATE INDEX `performedAtIdx` ON `archiveHistory` (`performedAt`);