ALTER TABLE `taskChecklists` ADD `notificationSent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `notifiedAt` timestamp;