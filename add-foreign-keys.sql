-- Migration: Add Foreign Key Constraints
-- Purpose: Improve data integrity and prevent orphaned records
-- Date: 2025-01-XX

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- USERS TABLE FOREIGN KEYS
-- ============================================

-- Projects
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE projects 
ADD CONSTRAINT fk_projects_archivedBy 
FOREIGN KEY (archivedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Tasks
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_parentTaskId 
FOREIGN KEY (parentTaskId) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_assigneeId 
FOREIGN KEY (assigneeId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Defects
ALTER TABLE defects 
ADD CONSTRAINT fk_defects_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_checklistId 
FOREIGN KEY (checklistId) REFERENCES taskChecklists(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_assignedTo 
FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_reportedBy 
FOREIGN KEY (reportedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_resolvedBy 
FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE defects 
ADD CONSTRAINT fk_defects_verifiedBy 
FOREIGN KEY (verifiedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Defect Attachments
ALTER TABLE defectAttachments 
ADD CONSTRAINT fk_defectAttachments_defectId 
FOREIGN KEY (defectId) REFERENCES defects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE defectAttachments 
ADD CONSTRAINT fk_defectAttachments_uploadedBy 
FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Defect Inspections
ALTER TABLE defect_inspections 
ADD CONSTRAINT fk_defectInspections_defectId 
FOREIGN KEY (defectId) REFERENCES defects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE defect_inspections 
ADD CONSTRAINT fk_defectInspections_inspectorId 
FOREIGN KEY (inspectorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Project Members
ALTER TABLE projectMembers 
ADD CONSTRAINT fk_projectMembers_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE projectMembers 
ADD CONSTRAINT fk_projectMembers_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Task Comments
ALTER TABLE taskComments 
ADD CONSTRAINT fk_taskComments_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskComments 
ADD CONSTRAINT fk_taskComments_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Task Attachments
ALTER TABLE taskAttachments 
ADD CONSTRAINT fk_taskAttachments_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskAttachments 
ADD CONSTRAINT fk_taskAttachments_uploadedBy 
FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Task Dependencies
ALTER TABLE taskDependencies 
ADD CONSTRAINT fk_taskDependencies_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskDependencies 
ADD CONSTRAINT fk_taskDependencies_dependsOnTaskId 
FOREIGN KEY (dependsOnTaskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Task Assignments
ALTER TABLE taskAssignments 
ADD CONSTRAINT fk_taskAssignments_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskAssignments 
ADD CONSTRAINT fk_taskAssignments_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Task Followers
ALTER TABLE taskFollowers 
ADD CONSTRAINT fk_taskFollowers_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskFollowers 
ADD CONSTRAINT fk_taskFollowers_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Checklist Templates
ALTER TABLE checklistTemplates 
ADD CONSTRAINT fk_checklistTemplates_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Checklist Template Items
ALTER TABLE checklistTemplateItems 
ADD CONSTRAINT fk_checklistTemplateItems_templateId 
FOREIGN KEY (templateId) REFERENCES checklistTemplates(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Task Checklists
ALTER TABLE taskChecklists 
ADD CONSTRAINT fk_taskChecklists_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE taskChecklists 
ADD CONSTRAINT fk_taskChecklists_templateId 
FOREIGN KEY (templateId) REFERENCES checklistTemplates(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE taskChecklists 
ADD CONSTRAINT fk_taskChecklists_inspectedBy 
FOREIGN KEY (inspectedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE taskChecklists 
ADD CONSTRAINT fk_taskChecklists_originalInspectionId 
FOREIGN KEY (originalInspectionId) REFERENCES taskChecklists(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Checklist Item Results
ALTER TABLE checklistItemResults 
ADD CONSTRAINT fk_checklistItemResults_taskChecklistId 
FOREIGN KEY (taskChecklistId) REFERENCES taskChecklists(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE checklistItemResults 
ADD CONSTRAINT fk_checklistItemResults_templateItemId 
FOREIGN KEY (templateItemId) REFERENCES checklistTemplateItems(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Checklist Results
ALTER TABLE checklistResults 
ADD CONSTRAINT fk_checklistResults_checklistId 
FOREIGN KEY (checklistId) REFERENCES taskChecklists(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE checklistResults 
ADD CONSTRAINT fk_checklistResults_itemId 
FOREIGN KEY (itemId) REFERENCES checklistTemplateItems(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE checklistResults 
ADD CONSTRAINT fk_checklistResults_inspectedBy 
FOREIGN KEY (inspectedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notifications
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_relatedTaskId 
FOREIGN KEY (relatedTaskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_relatedProjectId 
FOREIGN KEY (relatedProjectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_relatedDefectId 
FOREIGN KEY (relatedDefectId) REFERENCES defects(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Scheduled Notifications
ALTER TABLE scheduledNotifications 
ADD CONSTRAINT fk_scheduledNotifications_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE scheduledNotifications 
ADD CONSTRAINT fk_scheduledNotifications_relatedTaskId 
FOREIGN KEY (relatedTaskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE scheduledNotifications 
ADD CONSTRAINT fk_scheduledNotifications_relatedProjectId 
FOREIGN KEY (relatedProjectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE scheduledNotifications 
ADD CONSTRAINT fk_scheduledNotifications_relatedDefectId 
FOREIGN KEY (relatedDefectId) REFERENCES defects(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Notification Settings
ALTER TABLE notificationSettings 
ADD CONSTRAINT fk_notificationSettings_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Activity Log
ALTER TABLE activityLog 
ADD CONSTRAINT fk_activityLog_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE activityLog 
ADD CONSTRAINT fk_activityLog_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE activityLog 
ADD CONSTRAINT fk_activityLog_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE activityLog 
ADD CONSTRAINT fk_activityLog_defectId 
FOREIGN KEY (defectId) REFERENCES defects(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- QC Checklists
ALTER TABLE qc_checklists 
ADD CONSTRAINT fk_qcChecklists_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE qc_checklists 
ADD CONSTRAINT fk_qcChecklists_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- QC Checklist Items
ALTER TABLE qc_checklist_items 
ADD CONSTRAINT fk_qcChecklistItems_checklistId 
FOREIGN KEY (checklistId) REFERENCES qc_checklists(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- QC Inspections
ALTER TABLE qc_inspections 
ADD CONSTRAINT fk_qcInspections_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE qc_inspections 
ADD CONSTRAINT fk_qcInspections_checklistId 
FOREIGN KEY (checklistId) REFERENCES qc_checklists(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE qc_inspections 
ADD CONSTRAINT fk_qcInspections_taskId 
FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE qc_inspections 
ADD CONSTRAINT fk_qcInspections_inspectorId 
FOREIGN KEY (inspectorId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- QC Inspection Results
ALTER TABLE qc_inspection_results 
ADD CONSTRAINT fk_qcInspectionResults_inspectionId 
FOREIGN KEY (inspectionId) REFERENCES qc_inspections(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE qc_inspection_results 
ADD CONSTRAINT fk_qcInspectionResults_checklistItemId 
FOREIGN KEY (checklistItemId) REFERENCES qc_checklist_items(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Signatures
ALTER TABLE signatures 
ADD CONSTRAINT fk_signatures_checklistId 
FOREIGN KEY (checklistId) REFERENCES taskChecklists(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE signatures 
ADD CONSTRAINT fk_signatures_signedBy 
FOREIGN KEY (signedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Approvals
ALTER TABLE approvals 
ADD CONSTRAINT fk_approvals_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Approval Steps
ALTER TABLE approvalSteps 
ADD CONSTRAINT fk_approvalSteps_approvalId 
FOREIGN KEY (approvalId) REFERENCES approvals(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE approvalSteps 
ADD CONSTRAINT fk_approvalSteps_approverId 
FOREIGN KEY (approverId) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Category Colors
ALTER TABLE categoryColors 
ADD CONSTRAINT fk_categoryColors_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Archive Rules
ALTER TABLE archiveRules 
ADD CONSTRAINT fk_archiveRules_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Archive History
ALTER TABLE archiveHistory 
ADD CONSTRAINT fk_archiveHistory_projectId 
FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE archiveHistory 
ADD CONSTRAINT fk_archiveHistory_performedBy 
FOREIGN KEY (performedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE archiveHistory 
ADD CONSTRAINT fk_archiveHistory_ruleId 
FOREIGN KEY (ruleId) REFERENCES archiveRules(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Escalation Rules
ALTER TABLE escalationRules 
ADD CONSTRAINT fk_escalationRules_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Escalation Logs
ALTER TABLE escalationLogs 
ADD CONSTRAINT fk_escalationLogs_ruleId 
FOREIGN KEY (ruleId) REFERENCES escalationRules(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE escalationLogs 
ADD CONSTRAINT fk_escalationLogs_resolvedBy 
FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Push Subscriptions
ALTER TABLE pushSubscriptions 
ADD CONSTRAINT fk_pushSubscriptions_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Alert Thresholds
ALTER TABLE alertThresholds 
ADD CONSTRAINT fk_alertThresholds_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Error Logs
ALTER TABLE errorLogs 
ADD CONSTRAINT fk_errorLogs_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE errorLogs 
ADD CONSTRAINT fk_errorLogs_resolvedBy 
FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- OOM Events
ALTER TABLE oomEvents 
ADD CONSTRAINT fk_oomEvents_resolvedBy 
FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- System Logs
ALTER TABLE systemLogs 
ADD CONSTRAINT fk_systemLogs_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE systemLogs 
ADD CONSTRAINT fk_systemLogs_resolvedBy 
FOREIGN KEY (resolvedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Query Logs
ALTER TABLE queryLogs 
ADD CONSTRAINT fk_queryLogs_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Permissions
ALTER TABLE userPermissions 
ADD CONSTRAINT fk_userPermissions_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE userPermissions 
ADD CONSTRAINT fk_userPermissions_permissionId 
FOREIGN KEY (permissionId) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE userPermissions 
ADD CONSTRAINT fk_userPermissions_grantedBy 
FOREIGN KEY (grantedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- User Activity Logs
ALTER TABLE userActivityLogs 
ADD CONSTRAINT fk_userActivityLogs_userId 
FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Bulk Import Logs
ALTER TABLE bulkImportLogs 
ADD CONSTRAINT fk_bulkImportLogs_importedBy 
FOREIGN KEY (importedBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Role Templates
ALTER TABLE roleTemplates 
ADD CONSTRAINT fk_roleTemplates_createdBy 
FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify foreign keys were created
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    REFERENCED_TABLE_SCHEMA = DATABASE()
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 
    TABLE_NAME, CONSTRAINT_NAME;
