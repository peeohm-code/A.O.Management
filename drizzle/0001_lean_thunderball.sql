ALTER TABLE `defects` MODIFY COLUMN `status` enum('reported','rca_pending','action_plan','assigned','in_progress','implemented','verification','effectiveness_check','closed','rejected') NOT NULL DEFAULT 'reported';--> statement-breakpoint
ALTER TABLE `defects` ADD `type` enum('CAR','PAR','NCR') DEFAULT 'CAR' NOT NULL;--> statement-breakpoint
ALTER TABLE `defects` ADD `checklistId` int;--> statement-breakpoint
ALTER TABLE `defects` ADD `rootCause` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `correctiveAction` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `preventiveAction` text;--> statement-breakpoint
ALTER TABLE `defects` ADD `dueDate` timestamp;--> statement-breakpoint
ALTER TABLE `defects` ADD `ncrLevel` enum('major','minor');--> statement-breakpoint
ALTER TABLE `defects` ADD `verifiedBy` int;--> statement-breakpoint
ALTER TABLE `defects` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `defects` ADD `verificationComment` text;--> statement-breakpoint
CREATE INDEX `typeIdx` ON `defects` (`type`);--> statement-breakpoint
CREATE INDEX `checklistIdx` ON `defects` (`checklistId`);