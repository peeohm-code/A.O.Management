CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableTaskDeadlineReminders` boolean NOT NULL DEFAULT true,
	`taskDeadlineDaysAdvance` int NOT NULL DEFAULT 3,
	`enableDefectOverdueReminders` boolean NOT NULL DEFAULT true,
	`defectOverdueDaysThreshold` int NOT NULL DEFAULT 7,
	`enableDailySummary` boolean NOT NULL DEFAULT false,
	`dailySummaryTime` varchar(5) DEFAULT '08:00',
	`enableInAppNotifications` boolean NOT NULL DEFAULT true,
	`enableEmailNotifications` boolean NOT NULL DEFAULT true,
	`enablePushNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `scheduledNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('task_deadline_reminder','defect_overdue_reminder','inspection_reminder','daily_summary') NOT NULL,
	`userId` int NOT NULL,
	`relatedTaskId` int,
	`relatedDefectId` int,
	`relatedProjectId` int,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`title` varchar(255) NOT NULL,
	`content` text,
	`priority` enum('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userIdx` ON `notificationSettings` (`userId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `scheduledNotifications` (`userId`);--> statement-breakpoint
CREATE INDEX `scheduledForIdx` ON `scheduledNotifications` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `scheduledNotifications` (`status`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `scheduledNotifications` (`type`);--> statement-breakpoint
CREATE INDEX `relatedTaskIdx` ON `scheduledNotifications` (`relatedTaskId`);--> statement-breakpoint
CREATE INDEX `relatedDefectIdx` ON `scheduledNotifications` (`relatedDefectId`);