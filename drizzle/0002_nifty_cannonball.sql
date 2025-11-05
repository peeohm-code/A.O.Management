ALTER TABLE `checklistItemResults` MODIFY COLUMN `result` enum('pass','fail','na') NOT NULL;--> statement-breakpoint
ALTER TABLE `checklistTemplates` ADD `allowGeneralComments` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `checklistTemplates` ADD `allowPhotos` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `generalComments` text;--> statement-breakpoint
ALTER TABLE `taskChecklists` ADD `photoUrls` text;--> statement-breakpoint
ALTER TABLE `checklistItemResults` DROP COLUMN `comment`;--> statement-breakpoint
ALTER TABLE `checklistItemResults` DROP COLUMN `photoUrls`;--> statement-breakpoint
ALTER TABLE `checklistTemplateItems` DROP COLUMN `requirePhoto`;--> statement-breakpoint
ALTER TABLE `checklistTemplateItems` DROP COLUMN `acceptanceCriteria`;