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
CREATE TABLE `inspectionRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`inspectorId` int,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectionRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('task_assigned','task_status_changed','task_deadline_approaching','task_overdue','task_progress_updated','task_comment_mention','inspection_requested','inspection_completed','inspection_passed','inspection_failed','checklist_assigned','reinspection_required','defect_assigned','defect_created','defect_status_changed','defect_resolved','defect_reinspected','defect_deadline_approaching','project_member_added','project_milestone_reached','project_status_changed','file_uploaded','comment_added','dependency_blocked','comment_mention','task_updated','deadline_reminder') NOT NULL,
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
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('project_manager','qc_inspector','field_engineer') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100),
	`location` text,
	`ownerName` varchar(255),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`budget` int,
	`status` enum('draft','planning','active','on_hold','completed','cancelled') NOT NULL DEFAULT 'draft',
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
CREATE TABLE `signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`signatureData` text NOT NULL,
	`signedBy` int NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatures_id` PRIMARY KEY(`id`)
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
ALTER TABLE `users` MODIFY COLUMN `role` enum('owner','admin','project_manager','qc_inspector','field_engineer') NOT NULL DEFAULT 'field_engineer';--> statement-breakpoint
CREATE INDEX `userIdx` ON `activityLog` (`userId`);--> statement-breakpoint
CREATE INDEX `projectIdx` ON `activityLog` (`projectId`);--> statement-breakpoint
CREATE INDEX `taskIdx` ON `activityLog` (`taskId`);--> statement-breakpoint
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
CREATE INDEX `taskIdIdx` ON `inspectionRequests` (`taskId`);--> statement-breakpoint
CREATE INDEX `requestedByIdx` ON `inspectionRequests` (`requestedBy`);--> statement-breakpoint
CREATE INDEX `inspectorIdIdx` ON `inspectionRequests` (`inspectorId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `inspectionRequests` (`status`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `isReadIdx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `projectUserIdx` ON `projectMembers` (`projectId`,`userId`);--> statement-breakpoint
CREATE INDEX `createdByIdx` ON `projects` (`createdBy`);--> statement-breakpoint
CREATE INDEX `archivedAtIdx` ON `projects` (`archivedAt`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `signatures` (`checklistId`);--> statement-breakpoint
CREATE INDEX `signedByIdx` ON `signatures` (`signedBy`);--> statement-breakpoint
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