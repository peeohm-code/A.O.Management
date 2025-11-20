CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`errorMessage` text NOT NULL,
	`stackTrace` text,
	`errorCode` varchar(100),
	`severity` enum('critical','error','warning','info') NOT NULL DEFAULT 'error',
	`category` enum('frontend','backend','database','external_api','auth','file_upload','other') NOT NULL DEFAULT 'other',
	`url` varchar(500),
	`method` varchar(10),
	`userAgent` text,
	`userId` int,
	`sessionId` varchar(100),
	`metadata` text,
	`status` enum('new','investigating','resolved','ignored') NOT NULL DEFAULT 'new',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`occurrenceCount` int NOT NULL DEFAULT 1,
	`firstOccurredAt` timestamp NOT NULL DEFAULT (now()),
	`lastOccurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `severityIdx` ON `errorLogs` (`severity`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `errorLogs` (`category`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `errorLogs` (`status`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `errorLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `errorLogs` (`createdAt`);