-- Performance Optimization: Add Indexes for Frequently Queried Columns
-- Date: 2025-11-21
-- Purpose: Improve query performance for dashboard, tasks, defects, and activity logs

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_projectId ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigneeId ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_startDate ON tasks(startDate);
CREATE INDEX IF NOT EXISTS idx_tasks_endDate ON tasks(endDate);

-- Defects table indexes
CREATE INDEX IF NOT EXISTS idx_defects_taskId ON defects(taskId);
CREATE INDEX IF NOT EXISTS idx_defects_projectId ON defects(projectId);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_assignedTo ON defects(assignedTo);
CREATE INDEX IF NOT EXISTS idx_defects_reportedBy ON defects(reportedBy);

-- Project Members table indexes
CREATE INDEX IF NOT EXISTS idx_projectMembers_userId ON projectMembers(userId);
CREATE INDEX IF NOT EXISTS idx_projectMembers_projectId ON projectMembers(projectId);
CREATE INDEX IF NOT EXISTS idx_projectMembers_role ON projectMembers(role);

-- Activity Log table indexes
CREATE INDEX IF NOT EXISTS idx_activityLog_userId ON activityLog(userId);
CREATE INDEX IF NOT EXISTS idx_activityLog_taskId ON activityLog(taskId);
CREATE INDEX IF NOT EXISTS idx_activityLog_projectId ON activityLog(projectId);
CREATE INDEX IF NOT EXISTS idx_activityLog_createdAt ON activityLog(createdAt);

-- Task Checklists table indexes
CREATE INDEX IF NOT EXISTS idx_taskChecklists_taskId ON taskChecklists(taskId);
CREATE INDEX IF NOT EXISTS idx_taskChecklists_status ON taskChecklists(status);
CREATE INDEX IF NOT EXISTS idx_taskChecklists_inspectedBy ON taskChecklists(inspectedBy);

-- Checklist Item Results table indexes
CREATE INDEX IF NOT EXISTS idx_checklistItemResults_taskChecklistId ON checklistItemResults(taskChecklistId);
CREATE INDEX IF NOT EXISTS idx_checklistItemResults_result ON checklistItemResults(result);

-- Task Assignments table indexes
CREATE INDEX IF NOT EXISTS idx_taskAssignments_taskId ON taskAssignments(taskId);
CREATE INDEX IF NOT EXISTS idx_taskAssignments_userId ON taskAssignments(userId);

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_createdBy ON projects(createdBy);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_startDate ON projects(startDate);
CREATE INDEX IF NOT EXISTS idx_projects_endDate ON projects(endDate);
