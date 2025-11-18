CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metricType` enum('cpu','memory') NOT NULL,
	`threshold` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertThresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userMetricIdx` ON `alertThresholds` (`userId`,`metricType`);