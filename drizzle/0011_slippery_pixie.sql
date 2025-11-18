DROP TABLE `activityLog`;--> statement-breakpoint
DROP TABLE `alertThresholds`;--> statement-breakpoint
DROP TABLE `approvalSteps`;--> statement-breakpoint
DROP TABLE `approvals`;--> statement-breakpoint
DROP TABLE `archiveHistory`;--> statement-breakpoint
DROP TABLE `archiveRules`;--> statement-breakpoint
DROP TABLE `bulkImportLogs`;--> statement-breakpoint
DROP TABLE `categoryColors`;--> statement-breakpoint
DROP TABLE `checklistItemResults`;--> statement-breakpoint
DROP TABLE `checklistResults`;--> statement-breakpoint
DROP TABLE `checklistTemplateItems`;--> statement-breakpoint
DROP TABLE `checklistTemplates`;--> statement-breakpoint
DROP TABLE `dbStatistics`;--> statement-breakpoint
DROP TABLE `defectAttachments`;--> statement-breakpoint
DROP TABLE `defect_inspections`;--> statement-breakpoint
DROP TABLE `defects`;--> statement-breakpoint
DROP TABLE `errorLogs`;--> statement-breakpoint
DROP TABLE `escalationLogs`;--> statement-breakpoint
DROP TABLE `escalationRules`;--> statement-breakpoint
DROP TABLE `memoryLogs`;--> statement-breakpoint
DROP TABLE `notificationSettings`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `oomEvents`;--> statement-breakpoint
DROP TABLE `permissions`;--> statement-breakpoint
DROP TABLE `projectMembers`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
DROP TABLE `pushSubscriptions`;--> statement-breakpoint
DROP TABLE `queryLogs`;--> statement-breakpoint
DROP TABLE `roleTemplatePermissions`;--> statement-breakpoint
DROP TABLE `roleTemplates`;--> statement-breakpoint
DROP TABLE `scheduledNotifications`;--> statement-breakpoint
DROP TABLE `signatures`;--> statement-breakpoint
DROP TABLE `systemLogs`;--> statement-breakpoint
DROP TABLE `taskAssignments`;--> statement-breakpoint
DROP TABLE `taskAttachments`;--> statement-breakpoint
DROP TABLE `taskChecklists`;--> statement-breakpoint
DROP TABLE `taskComments`;--> statement-breakpoint
DROP TABLE `taskDependencies`;--> statement-breakpoint
DROP TABLE `taskFollowers`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
DROP TABLE `userActivityLogs`;--> statement-breakpoint
DROP TABLE `userPermissions`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `notificationDaysAdvance`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `enableInAppNotifications`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `enableEmailNotifications`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `enableDailySummaryEmail`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `dailySummaryTime`;