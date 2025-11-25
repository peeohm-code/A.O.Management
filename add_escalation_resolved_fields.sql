ALTER TABLE escalationLogs 
ADD COLUMN resolvedAt TIMESTAMP NULL,
ADD COLUMN resolvedBy INT NULL,
ADD INDEX resolvedAtIdx (resolvedAt),
ADD INDEX resolvedByIdx (resolvedBy);
