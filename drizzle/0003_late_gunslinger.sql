CREATE TABLE `bulkImportLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text,
	`totalRows` int NOT NULL,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorDetails` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `bulkImportLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` enum('projects','tasks','inspections','defects','reports','users','settings','dashboard') NOT NULL,
	`action` enum('view','create','edit','delete') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`module` varchar(50),
	`entityType` varchar(50),
	`entityId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`permissionId` int NOT NULL,
	`granted` boolean NOT NULL DEFAULT true,
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `importedByIdx` ON `bulkImportLogs` (`importedBy`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `bulkImportLogs` (`status`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `bulkImportLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `moduleActionIdx` ON `permissions` (`module`,`action`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `userActivityLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `actionIdx` ON `userActivityLogs` (`action`);--> statement-breakpoint
CREATE INDEX `moduleIdx` ON `userActivityLogs` (`module`);--> statement-breakpoint
CREATE INDEX `entityIdx` ON `userActivityLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `userActivityLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userPermissionIdx` ON `userPermissions` (`userId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `userPermissions` (`userId`);