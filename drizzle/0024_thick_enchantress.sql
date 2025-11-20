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
CREATE INDEX `timestampIdx` ON `memoryLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `usagePercentageIdx` ON `memoryLogs` (`usagePercentage`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `oomEvents` (`timestamp`);--> statement-breakpoint
CREATE INDEX `severityIdx` ON `oomEvents` (`severity`);--> statement-breakpoint
CREATE INDEX `resolvedIdx` ON `oomEvents` (`resolved`);