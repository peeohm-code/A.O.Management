CREATE TABLE `activityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`taskId` int,
	`action` varchar(100) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItemResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskChecklistId` int NOT NULL,
	`templateItemId` int NOT NULL,
	`result` enum('pass','fail','na') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistItemResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistTemplateItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`itemText` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklistTemplateItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`stage` enum('pre_execution','in_progress','post_execution') NOT NULL,
	`description` text,
	`allowGeneralComments` boolean NOT NULL DEFAULT true,
	`allowPhotos` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`checklistItemResultId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`photoUrls` text,
	`status` enum('open','in_progress','resolved','verified') NOT NULL DEFAULT 'open',
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`reportedBy` int NOT NULL,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionPhotoUrls` text,
	`resolutionComment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('task_assigned','inspection_requested','inspection_completed','defect_assigned','defect_resolved','comment_mention','task_updated','deadline_reminder') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedTaskId` int,
	`relatedProjectId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','pm','engineer','qc','viewer') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100),
	`location` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`budget` int,
	`status` enum('planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`templateId` int NOT NULL,
	`stage` enum('pre_execution','in_progress','post_execution') NOT NULL,
	`status` enum('not_started','pending_inspection','in_progress','completed','failed') NOT NULL DEFAULT 'not_started',
	`inspectedBy` int,
	`inspectedAt` timestamp,
	`generalComments` text,
	`photoUrls` text,
	`signature` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskChecklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`mentions` text,
	`attachmentUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskDependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`dependsOnTaskId` int NOT NULL,
	`type` enum('finish_to_start','start_to_start','finish_to_finish') NOT NULL DEFAULT 'finish_to_start',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskDependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskFollowers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskFollowers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`parentTaskId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`progress` int NOT NULL DEFAULT 0,
	`status` enum('todo','pending_pre_inspection','ready_to_start','in_progress','pending_final_inspection','rectification_needed','completed','not_started','delayed') NOT NULL DEFAULT 'todo',
	`assigneeId` int,
	`order` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','pm','engineer','qc') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `userIdx` ON `activityLog` (`userId`);--> statement-breakpoint
CREATE INDEX `projectIdx` ON `activityLog` (`projectId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `activityLog` (`taskId`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `checklistItemResults` (`taskChecklistId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `checklistTemplateItems` (`templateId`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `checklistTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `stageIdx` ON `checklistTemplates` (`stage`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `defects` (`taskId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `defects` (`status`);--> statement-breakpoint
CREATE INDEX `assignedToIdx` ON `defects` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `isReadIdx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `projectUserIdx` ON `projectMembers` (`projectId`,`userId`);--> statement-breakpoint
CREATE INDEX `createdByIdx` ON `projects` (`createdBy`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskAttachments` (`taskId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskChecklists` (`taskId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `taskChecklists` (`templateId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskComments` (`taskId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `taskComments` (`userId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskDependencies` (`taskId`);--> statement-breakpoint
CREATE INDEX `dependsOnIdx` ON `taskDependencies` (`dependsOnTaskId`);--> statement-breakpoint
CREATE INDEX `taskUserIdx` ON `taskFollowers` (`taskId`,`userId`);--> statement-breakpoint
CREATE INDEX `projectIdx` ON `tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `assigneeIdx` ON `tasks` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `parentIdx` ON `tasks` (`parentTaskId`);