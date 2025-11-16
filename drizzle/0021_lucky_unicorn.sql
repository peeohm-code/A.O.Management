ALTER TABLE `users` ADD `notificationDaysAdvance` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableInAppNotifications` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableEmailNotifications` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `enableDailySummaryEmail` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `dailySummaryTime` varchar(5) DEFAULT '08:00';