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
CREATE INDEX `defectIdx` ON `defectAttachments` (`defectId`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defectAttachments` (`attachmentType`);