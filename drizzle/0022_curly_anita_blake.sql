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
CREATE INDEX `tableNameIdx` ON `dbStatistics` (`tableName`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `dbStatistics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `executionTimeIdx` ON `queryLogs` (`executionTime`);--> statement-breakpoint
CREATE INDEX `tableNameIdx` ON `queryLogs` (`tableName`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `queryLogs` (`createdAt`);