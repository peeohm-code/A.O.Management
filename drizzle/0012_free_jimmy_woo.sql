ALTER TABLE `defects` MODIFY COLUMN `status` enum('reported','analysis','in_progress','resolved','closed') NOT NULL DEFAULT 'reported';--> statement-breakpoint
ALTER TABLE `defects` ADD `resolutionNotes` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `implementationMethod` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `beforePhotos` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `afterPhotos` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `closureNotes` text;