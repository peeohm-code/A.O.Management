-- Add new fields to activityLog table for enhanced audit trail
ALTER TABLE activityLog 
ADD COLUMN resourceType VARCHAR(50) AFTER action,
ADD COLUMN resourceId INT AFTER resourceType,
ADD COLUMN oldValue TEXT AFTER resourceId,
ADD COLUMN newValue TEXT AFTER oldValue,
ADD COLUMN ipAddress VARCHAR(45) AFTER newValue,
ADD COLUMN userAgent TEXT AFTER ipAddress;

-- Add indexes for better query performance
CREATE INDEX resourceTypeIdx ON activityLog(resourceType);
CREATE INDEX resourceIdIdx ON activityLog(resourceId);
CREATE INDEX ipAddressIdx ON activityLog(ipAddress);
