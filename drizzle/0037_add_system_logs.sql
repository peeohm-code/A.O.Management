CREATE TABLE IF NOT EXISTS `systemLogs` (
`id` int AUTO_INCREMENT NOT NULL,
`type` enum('error','warning','info','performance','security') NOT NULL,
`category` varchar(100) NOT NULL,
`message` text NOT NULL,
`details` text,
`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
`userId` int,
`ipAddress` varchar(45),
`userAgent` text,
`resolved` boolean NOT NULL DEFAULT false,
`resolvedBy` int,
`resolvedAt` timestamp,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `systemLogs_id` PRIMARY KEY(`id`)
);

CREATE INDEX `typeIdx` ON `systemLogs` (`type`);
CREATE INDEX `categoryIdx` ON `systemLogs` (`category`);
CREATE INDEX `severityIdx` ON `systemLogs` (`severity`);
CREATE INDEX `createdAtIdx` ON `systemLogs` (`createdAt`);
CREATE INDEX `resolvedIdx` ON `systemLogs` (`resolved`);
