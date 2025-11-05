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
CREATE INDEX `projectCategoryIdx` ON `categoryColors` (`projectId`,`category`);