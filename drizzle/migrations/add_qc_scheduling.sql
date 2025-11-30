-- Migration: Add QC Scheduling System
-- Created: 2025-11-30
-- Description: Add scheduling capabilities for QC inspections

-- Step 1: Add scheduling fields to taskChecklists table
ALTER TABLE taskChecklists
ADD COLUMN scheduledDate TIMESTAMP NULL AFTER status,
ADD COLUMN scheduledBy INT AFTER scheduledDate,
ADD COLUMN scheduledAt TIMESTAMP NULL AFTER scheduledBy,
ADD COLUMN assignedQCInspector INT AFTER scheduledAt,
ADD COLUMN scheduledLocation TEXT AFTER assignedQCInspector,
ADD COLUMN scheduledNotes TEXT AFTER scheduledLocation,
ADD COLUMN notificationSent BOOLEAN DEFAULT FALSE AFTER scheduledNotes,
ADD COLUMN reminderSent BOOLEAN DEFAULT FALSE AFTER notificationSent;

-- Step 2: Add indexes for scheduling queries
CREATE INDEX scheduledDateIdx ON taskChecklists(scheduledDate);
CREATE INDEX scheduledByIdx ON taskChecklists(scheduledBy);
CREATE INDEX assignedQCInspectorIdx ON taskChecklists(assignedQCInspector);

-- Step 3: Add foreign keys for referential integrity
ALTER TABLE taskChecklists
ADD CONSTRAINT fk_scheduled_by FOREIGN KEY (scheduledBy) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_assigned_qc FOREIGN KEY (assignedQCInspector) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Update table comment
ALTER TABLE taskChecklists
COMMENT = 'QC checklists with scheduling support for PM/OE to assign and schedule inspections';

-- Rollback script (if needed):
-- ALTER TABLE taskChecklists
--   DROP FOREIGN KEY fk_scheduled_by,
--   DROP FOREIGN KEY fk_assigned_qc,
--   DROP INDEX scheduledDateIdx,
--   DROP INDEX scheduledByIdx,
--   DROP INDEX assignedQCInspectorIdx,
--   DROP COLUMN scheduledDate,
--   DROP COLUMN scheduledBy,
--   DROP COLUMN scheduledAt,
--   DROP COLUMN assignedQCInspector,
--   DROP COLUMN scheduledLocation,
--   DROP COLUMN scheduledNotes,
--   DROP COLUMN notificationSent,
--   DROP COLUMN reminderSent;
