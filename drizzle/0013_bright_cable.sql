ALTER TABLE `defects` ADD `actionMethod` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `actionResponsible` varchar(255);--> statement-breakpoint
ALTER TABLE `defects` ADD `actionDeadline` timestamp;--> statement-breakpoint
ALTER TABLE `defects` ADD `actionNotes` text;