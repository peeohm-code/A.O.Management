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
CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metricType` enum('cpu','memory') NOT NULL,
	`threshold` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertThresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalId` int NOT NULL,
	`approverId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`signatureData` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('defect','checklist') NOT NULL,
	`entityId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `categoryColors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` enum('preparation','structure','architecture','mep','other') NOT NULL,
	`color` varchar(7) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categoryColors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItemResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskChecklistId` int NOT NULL,
	`templateItemId` int NOT NULL,
	`result` enum('pass','fail','na') NOT NULL,
	`photoUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistItemResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`itemId` int NOT NULL,
	`result` enum('pass','fail','na') NOT NULL,
	`comment` text,
	`photoUrls` text,
	`inspectedBy` int NOT NULL,
	`inspectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklistResults_id` PRIMARY KEY(`id`)
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
CREATE TABLE `dbStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableName` varchar(100) NOT NULL,
	`rowCount` int NOT NULL,
	`dataSize` int NOT NULL,
	`indexSize` int NOT NULL,
	`avgQueryTime` int,
	`queryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dbStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defectAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`attachmentType` enum('before','after','supporting') NOT NULL,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `defectAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defect_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`inspectorId` int NOT NULL,
	`inspectionType` varchar(20) NOT NULL,
	`result` varchar(20) NOT NULL DEFAULT 'pending',
	`comments` text,
	`photoUrls` text,
	`inspectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `defect_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`checklistItemResultId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`photoUrls` text,
	`status` enum('reported','analysis','in_progress','resolved','pending_reinspection','closed') NOT NULL DEFAULT 'reported',
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`reportedBy` int NOT NULL,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionPhotoUrls` text,
	`resolutionComment` text,
	`type` enum('CAR','PAR','NCR') NOT NULL DEFAULT 'CAR',
	`checklistId` int,
	`rootCause` text,
	`correctiveAction` text,
	`preventiveAction` text,
	`dueDate` timestamp,
	`actionMethod` text,
	`actionResponsible` varchar(255),
	`actionDeadline` timestamp,
	`actionNotes` text,
	`ncrLevel` enum('major','minor'),
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`verificationComment` text,
	`resolutionNotes` text,
	`implementationMethod` text,
	`beforePhotos` text,
	`afterPhotos` text,
	`closureNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memoryLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`totalMemoryMB` int NOT NULL,
	`usedMemoryMB` int NOT NULL,
	`freeMemoryMB` int NOT NULL,
	`usagePercentage` int NOT NULL,
	`buffersCacheMB` int,
	`availableMemoryMB` int,
	`swapTotalMB` int,
	`swapUsedMB` int,
	`swapFreePercentage` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoryLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('task_assigned','task_status_changed','task_deadline_approaching','task_overdue','task_progress_updated','task_comment_mention','inspection_requested','inspection_completed','inspection_passed','inspection_failed','checklist_assigned','checklist_reminder','reinspection_required','defect_assigned','defect_created','defect_status_changed','defect_resolved','defect_reinspected','defect_deadline_approaching','project_member_added','project_milestone_reached','project_status_changed','file_uploaded','comment_added','dependency_blocked','comment_mention','task_updated','deadline_reminder','system_health_warning','system_health_critical','system_health_info') NOT NULL,
	`priority` enum('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
	`title` varchar(255) NOT NULL,
	`content` text,
	`relatedTaskId` int,
	`relatedProjectId` int,
	`relatedDefectId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oomEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`processName` varchar(255),
	`processId` int,
	`killedProcessName` varchar(255),
	`killedProcessId` int,
	`memoryUsedMB` int,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`logMessage` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oomEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('project_manager','qc_inspector','worker') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100),
	`location` text,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`ownerName` varchar(255),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`budget` int,
	`status` enum('draft','planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'draft',
	`completionPercentage` int DEFAULT 0,
	`color` varchar(7) DEFAULT '#3B82F6',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`archivedAt` timestamp,
	`archivedBy` int,
	`archivedReason` text,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `queryLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryText` text NOT NULL,
	`executionTime` int NOT NULL,
	`tableName` varchar(100),
	`operationType` enum('SELECT','INSERT','UPDATE','DELETE','OTHER') NOT NULL,
	`userId` int,
	`endpoint` varchar(255),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queryLogs_id` PRIMARY KEY(`id`)
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
CREATE TABLE `signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`signatureData` text NOT NULL,
	`signedBy` int NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('error','warning','info','performance','security') NOT NULL,
	`category` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`userId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskAssignments_id` PRIMARY KEY(`id`)
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
	`originalInspectionId` int,
	`reinspectionCount` int NOT NULL DEFAULT 0,
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
	`startDate` varchar(10),
	`endDate` varchar(10),
	`progress` int NOT NULL DEFAULT 0,
	`status` enum('todo','pending_pre_inspection','ready_to_start','in_progress','pending_final_inspection','rectification_needed','completed','not_started','delayed') NOT NULL DEFAULT 'todo',
	`assigneeId` int,
	`category` varchar(50),
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`order` int NOT NULL DEFAULT 0,
	`photoUrls` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','admin','project_manager','qc_inspector','worker') NOT NULL DEFAULT 'worker';--> statement-breakpoint
ALTER TABLE `users` ADD `notificationDaysAdvance` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableInAppNotifications` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableEmailNotifications` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableDailySummaryEmail` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dailySummaryTime` varchar(5) DEFAULT '08:00';--> statement-breakpoint
CREATE INDEX `userIdx` ON `activityLog` (`userId`);--> statement-breakpoint
CREATE INDEX `projectIdx` ON `activityLog` (`projectId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `activityLog` (`taskId`);--> statement-breakpoint
CREATE INDEX `actionIdx` ON `activityLog` (`action`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `activityLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userMetricIdx` ON `alertThresholds` (`userId`,`metricType`);--> statement-breakpoint
CREATE INDEX `approvalIdx` ON `approvalSteps` (`approvalId`);--> statement-breakpoint
CREATE INDEX `approverIdx` ON `approvalSteps` (`approverId`);--> statement-breakpoint
CREATE INDEX `entityIdx` ON `approvals` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `projectIdIdx` ON `archiveHistory` (`projectId`);--> statement-breakpoint
CREATE INDEX `performedAtIdx` ON `archiveHistory` (`performedAt`);--> statement-breakpoint
CREATE INDEX `projectCategoryIdx` ON `categoryColors` (`projectId`,`category`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `checklistItemResults` (`taskChecklistId`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `checklistResults` (`checklistId`);--> statement-breakpoint
CREATE INDEX `itemIdx` ON `checklistResults` (`itemId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `checklistTemplateItems` (`templateId`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `checklistTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `stageIdx` ON `checklistTemplates` (`stage`);--> statement-breakpoint
CREATE INDEX `tableNameIdx` ON `dbStatistics` (`tableName`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `dbStatistics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `defectIdx` ON `defectAttachments` (`defectId`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defectAttachments` (`attachmentType`);--> statement-breakpoint
CREATE INDEX `defectIdx` ON `defect_inspections` (`defectId`);--> statement-breakpoint
CREATE INDEX `inspectorIdx` ON `defect_inspections` (`inspectorId`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defect_inspections` (`inspectionType`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `defects` (`taskId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `defects` (`status`);--> statement-breakpoint
CREATE INDEX `assignedToIdx` ON `defects` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defects` (`type`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `defects` (`checklistId`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `memoryLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `usagePercentageIdx` ON `memoryLogs` (`usagePercentage`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `notificationSettings` (`userId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `isReadIdx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `relatedTaskIdx` ON `notifications` (`relatedTaskId`);--> statement-breakpoint
CREATE INDEX `relatedProjectIdx` ON `notifications` (`relatedProjectId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `oomEvents` (`timestamp`);--> statement-breakpoint
CREATE INDEX `severityIdx` ON `oomEvents` (`severity`);--> statement-breakpoint
CREATE INDEX `resolvedIdx` ON `oomEvents` (`resolved`);--> statement-breakpoint
CREATE INDEX `projectUserIdx` ON `projectMembers` (`projectId`,`userId`);--> statement-breakpoint
CREATE INDEX `createdByIdx` ON `projects` (`createdBy`);--> statement-breakpoint
CREATE INDEX `archivedAtIdx` ON `projects` (`archivedAt`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `pushSubscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `executionTimeIdx` ON `queryLogs` (`executionTime`);--> statement-breakpoint
CREATE INDEX `tableNameIdx` ON `queryLogs` (`tableName`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `queryLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `scheduledNotifications` (`userId`);--> statement-breakpoint
CREATE INDEX `scheduledForIdx` ON `scheduledNotifications` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `scheduledNotifications` (`status`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `scheduledNotifications` (`type`);--> statement-breakpoint
CREATE INDEX `relatedTaskIdx` ON `scheduledNotifications` (`relatedTaskId`);--> statement-breakpoint
CREATE INDEX `relatedDefectIdx` ON `scheduledNotifications` (`relatedDefectId`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `signatures` (`checklistId`);--> statement-breakpoint
CREATE INDEX `signedByIdx` ON `signatures` (`signedBy`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `systemLogs` (`type`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `systemLogs` (`category`);--> statement-breakpoint
CREATE INDEX `severityIdx` ON `systemLogs` (`severity`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `systemLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `resolvedIdx` ON `systemLogs` (`resolved`);--> statement-breakpoint
CREATE INDEX `taskUserIdx` ON `taskAssignments` (`taskId`,`userId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskAttachments` (`taskId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskChecklists` (`taskId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `taskChecklists` (`templateId`);--> statement-breakpoint
CREATE INDEX `originalInspectionIdx` ON `taskChecklists` (`originalInspectionId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskComments` (`taskId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `taskComments` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `taskComments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `taskDependencies` (`taskId`);--> statement-breakpoint
CREATE INDEX `dependsOnIdx` ON `taskDependencies` (`dependsOnTaskId`);--> statement-breakpoint
CREATE INDEX `taskUserIdx` ON `taskFollowers` (`taskId`,`userId`);--> statement-breakpoint
CREATE INDEX `projectIdx` ON `tasks` (`projectId`);--> statement-breakpoint
CREATE INDEX `assigneeIdx` ON `tasks` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `parentIdx` ON `tasks` (`parentTaskId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `tasks` (`category`);--> statement-breakpoint
CREATE INDEX `startDateIdx` ON `tasks` (`startDate`);--> statement-breakpoint
CREATE INDEX `endDateIdx` ON `tasks` (`endDate`);