CREATE TABLE `project_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','member','viewer') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(500),
	`status` enum('planning','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`startDate` timestamp,
	`endDate` timestamp,
	`budget` int,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qc_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qc_checklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qc_inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`inspectedBy` int NOT NULL,
	`status` enum('pass','fail','pending') NOT NULL DEFAULT 'pending',
	`notes` text,
	`inspectionDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qc_inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qc_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inspectionId` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`caption` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qc_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','review','completed') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
