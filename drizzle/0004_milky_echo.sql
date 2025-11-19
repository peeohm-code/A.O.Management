CREATE TABLE `roleTemplatePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roleTemplateId` int NOT NULL,
	`permissionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roleTemplatePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roleTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`roleType` enum('project_manager','qc_inspector','worker') NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roleTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `templatePermissionIdx` ON `roleTemplatePermissions` (`roleTemplateId`,`permissionId`);--> statement-breakpoint
CREATE INDEX `roleTypeIdx` ON `roleTemplates` (`roleType`);--> statement-breakpoint
CREATE INDEX `isDefaultIdx` ON `roleTemplates` (`isDefault`);