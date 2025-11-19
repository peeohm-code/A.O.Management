CREATE TABLE `escalationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`entityType` enum('defect','inspection','task') NOT NULL,
	`entityId` int NOT NULL,
	`projectId` int,
	`taskId` int,
	`escalatedAt` timestamp NOT NULL DEFAULT (now()),
	`escalatedToUserIds` text,
	`notificationsSent` int NOT NULL DEFAULT 0,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`triggerType` enum('defect','inspection_failed','task_overdue') NOT NULL,
	`severityLevel` enum('low','medium','high','critical'),
	`hoursUntilEscalation` int NOT NULL,
	`escalateToRoles` text,
	`escalateToUserIds` text,
	`notificationChannels` text,
	`notificationTemplate` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escalationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `escalationTriggered` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `escalationTriggeredAt` timestamp;--> statement-breakpoint
CREATE INDEX `ruleIdIdx` ON `escalationLogs` (`ruleId`);--> statement-breakpoint
CREATE INDEX `entityIdx` ON `escalationLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `projectIdIdx` ON `escalationLogs` (`projectId`);--> statement-breakpoint
CREATE INDEX `escalatedAtIdx` ON `escalationLogs` (`escalatedAt`);--> statement-breakpoint
CREATE INDEX `resolvedIdx` ON `escalationLogs` (`resolved`);--> statement-breakpoint
CREATE INDEX `triggerTypeIdx` ON `escalationRules` (`triggerType`);--> statement-breakpoint
CREATE INDEX `enabledIdx` ON `escalationRules` (`enabled`);