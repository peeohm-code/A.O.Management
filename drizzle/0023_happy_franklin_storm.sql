CREATE INDEX `actionIdx` ON `activityLog` (`action`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `activityLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `relatedTaskIdx` ON `notifications` (`relatedTaskId`);--> statement-breakpoint
CREATE INDEX `relatedProjectIdx` ON `notifications` (`relatedProjectId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `taskComments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `tasks` (`category`);--> statement-breakpoint
CREATE INDEX `startDateIdx` ON `tasks` (`startDate`);--> statement-breakpoint
CREATE INDEX `endDateIdx` ON `tasks` (`endDate`);