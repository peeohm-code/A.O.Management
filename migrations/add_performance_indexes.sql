-- Performance Optimization: Add Missing Indexes
-- Created: 2025-01-23
-- Purpose: Improve query performance for inspection statistics and real-time notifications

-- Add indexes to taskChecklists table
CREATE INDEX IF NOT EXISTS taskIdIdx ON taskChecklists(taskId);
CREATE INDEX IF NOT EXISTS templateIdIdx ON taskChecklists(templateId);
CREATE INDEX IF NOT EXISTS statusIdx ON taskChecklists(status);
CREATE INDEX IF NOT EXISTS inspectedByIdx ON taskChecklists(inspectedBy);
CREATE INDEX IF NOT EXISTS inspectedAtIdx ON taskChecklists(inspectedAt);
CREATE INDEX IF NOT EXISTS taskStatusIdx ON taskChecklists(taskId, status);

-- Add indexes to checklistItemResults table
CREATE INDEX IF NOT EXISTS templateItemIdx ON checklistItemResults(templateItemId);
CREATE INDEX IF NOT EXISTS resultIdx ON checklistItemResults(result);
CREATE INDEX IF NOT EXISTS checklistResultIdx ON checklistItemResults(taskChecklistId, result);

-- Add indexes to projectMembers table
CREATE INDEX IF NOT EXISTS projectIdIdx ON projectMembers(projectId);
CREATE INDEX IF NOT EXISTS userIdIdx ON projectMembers(userId);
CREATE INDEX IF NOT EXISTS roleIdx ON projectMembers(role);
CREATE INDEX IF NOT EXISTS projectRoleIdx ON projectMembers(projectId, role);
