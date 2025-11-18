ALTER TABLE `projects` ADD `latitude` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `longitude` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `completionPercentage` int DEFAULT 0;