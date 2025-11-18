-- Performance Optimization: Add indexes for frequently queried columns
-- This migration adds indexes to improve query performance

-- Projects table indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(createdBy);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(startDate);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(endDate);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(startDate);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(endDate);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(projectId, status);

-- Task assignments indexes (table exists in schema)
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON taskAssignments(taskId);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON taskAssignments(userId);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_task ON taskAssignments(userId, taskId);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON projectMembers(projectId);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON projectMembers(userId);
CREATE INDEX IF NOT EXISTS idx_project_members_user_project ON projectMembers(userId, projectId);

-- Task dependencies indexes
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON taskDependencies(taskId);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON taskDependencies(dependsOnTaskId);

-- Checklist template items indexes
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template_id ON checklistTemplateItems(templateId);
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_order ON checklistTemplateItems(templateId, `order`);

-- Task checklists indexes
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON taskChecklists(taskId);
CREATE INDEX IF NOT EXISTS idx_task_checklists_template_id ON taskChecklists(templateId);
CREATE INDEX IF NOT EXISTS idx_task_checklists_stage ON taskChecklists(stage);

-- Checklist item results indexes
CREATE INDEX IF NOT EXISTS idx_checklist_item_results_checklist_id ON checklistItemResults(taskChecklistId);
CREATE INDEX IF NOT EXISTS idx_checklist_item_results_result ON checklistItemResults(result);

-- Defects indexes (some already exist in schema, adding missing ones)
CREATE INDEX IF NOT EXISTS idx_defects_reported_by ON defects(reportedBy);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_resolved_by ON defects(resolvedBy);
CREATE INDEX IF NOT EXISTS idx_defects_verified_by ON defects(verifiedBy);

-- Defect inspections indexes
CREATE INDEX IF NOT EXISTS idx_defect_inspections_defect_id ON defect_inspections(defectId);
CREATE INDEX IF NOT EXISTS idx_defect_inspections_inspector_id ON defect_inspections(inspectorId);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(isRead);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdAt);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Activity log indexes (some already exist in schema)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_project ON activityLog(userId, projectId);

-- Task comments indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON taskComments(taskId);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON taskComments(userId);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON taskComments(createdAt);

-- Task followers indexes
CREATE INDEX IF NOT EXISTS idx_task_followers_task_id ON taskFollowers(taskId);
CREATE INDEX IF NOT EXISTS idx_task_followers_user_id ON taskFollowers(userId);

-- Signatures indexes (already exist in schema, skipping)
