-- Script: Check for Orphaned Data Before Adding Foreign Keys
-- Purpose: Identify records that would violate foreign key constraints
-- Run this BEFORE executing add-foreign-keys.sql

-- ============================================
-- CHECK PROJECTS
-- ============================================

-- Projects with invalid createdBy
SELECT 'projects.createdBy' as issue, COUNT(*) as count
FROM projects p
LEFT JOIN users u ON p.createdBy = u.id
WHERE u.id IS NULL;

-- Projects with invalid archivedBy
SELECT 'projects.archivedBy' as issue, COUNT(*) as count
FROM projects p
LEFT JOIN users u ON p.archivedBy = u.id
WHERE p.archivedBy IS NOT NULL AND u.id IS NULL;

-- ============================================
-- CHECK TASKS
-- ============================================

-- Tasks with invalid projectId
SELECT 'tasks.projectId' as issue, COUNT(*) as count
FROM tasks t
LEFT JOIN projects p ON t.projectId = p.id
WHERE p.id IS NULL;

-- Tasks with invalid parentTaskId
SELECT 'tasks.parentTaskId' as issue, COUNT(*) as count
FROM tasks t
LEFT JOIN tasks pt ON t.parentTaskId = pt.id
WHERE t.parentTaskId IS NOT NULL AND pt.id IS NULL;

-- Tasks with invalid assigneeId
SELECT 'tasks.assigneeId' as issue, COUNT(*) as count
FROM tasks t
LEFT JOIN users u ON t.assigneeId = u.id
WHERE t.assigneeId IS NOT NULL AND u.id IS NULL;

-- ============================================
-- CHECK DEFECTS
-- ============================================

-- Defects with invalid projectId
SELECT 'defects.projectId' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN projects p ON d.projectId = p.id
WHERE p.id IS NULL;

-- Defects with invalid taskId
SELECT 'defects.taskId' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN tasks t ON d.taskId = t.id
WHERE t.id IS NULL;

-- Defects with invalid checklistId
SELECT 'defects.checklistId' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN taskChecklists tc ON d.checklistId = tc.id
WHERE d.checklistId IS NOT NULL AND tc.id IS NULL;

-- Defects with invalid assignedTo
SELECT 'defects.assignedTo' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN users u ON d.assignedTo = u.id
WHERE d.assignedTo IS NOT NULL AND u.id IS NULL;

-- Defects with invalid reportedBy
SELECT 'defects.reportedBy' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN users u ON d.reportedBy = u.id
WHERE u.id IS NULL;

-- Defects with invalid resolvedBy
SELECT 'defects.resolvedBy' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN users u ON d.resolvedBy = u.id
WHERE d.resolvedBy IS NOT NULL AND u.id IS NULL;

-- Defects with invalid verifiedBy
SELECT 'defects.verifiedBy' as issue, COUNT(*) as count
FROM defects d
LEFT JOIN users u ON d.verifiedBy = u.id
WHERE d.verifiedBy IS NOT NULL AND u.id IS NULL;

-- ============================================
-- CHECK DEFECT ATTACHMENTS
-- ============================================

-- Defect attachments with invalid defectId
SELECT 'defectAttachments.defectId' as issue, COUNT(*) as count
FROM defectAttachments da
LEFT JOIN defects d ON da.defectId = d.id
WHERE d.id IS NULL;

-- Defect attachments with invalid uploadedBy
SELECT 'defectAttachments.uploadedBy' as issue, COUNT(*) as count
FROM defectAttachments da
LEFT JOIN users u ON da.uploadedBy = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK DEFECT INSPECTIONS
-- ============================================

-- Defect inspections with invalid defectId
SELECT 'defect_inspections.defectId' as issue, COUNT(*) as count
FROM defect_inspections di
LEFT JOIN defects d ON di.defectId = d.id
WHERE d.id IS NULL;

-- Defect inspections with invalid inspectorId
SELECT 'defect_inspections.inspectorId' as issue, COUNT(*) as count
FROM defect_inspections di
LEFT JOIN users u ON di.inspectorId = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK PROJECT MEMBERS
-- ============================================

-- Project members with invalid projectId
SELECT 'projectMembers.projectId' as issue, COUNT(*) as count
FROM projectMembers pm
LEFT JOIN projects p ON pm.projectId = p.id
WHERE p.id IS NULL;

-- Project members with invalid userId
SELECT 'projectMembers.userId' as issue, COUNT(*) as count
FROM projectMembers pm
LEFT JOIN users u ON pm.userId = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK TASK COMMENTS
-- ============================================

-- Task comments with invalid taskId
SELECT 'taskComments.taskId' as issue, COUNT(*) as count
FROM taskComments tc
LEFT JOIN tasks t ON tc.taskId = t.id
WHERE t.id IS NULL;

-- Task comments with invalid userId
SELECT 'taskComments.userId' as issue, COUNT(*) as count
FROM taskComments tc
LEFT JOIN users u ON tc.userId = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK TASK ATTACHMENTS
-- ============================================

-- Task attachments with invalid taskId
SELECT 'taskAttachments.taskId' as issue, COUNT(*) as count
FROM taskAttachments ta
LEFT JOIN tasks t ON ta.taskId = t.id
WHERE t.id IS NULL;

-- Task attachments with invalid uploadedBy
SELECT 'taskAttachments.uploadedBy' as issue, COUNT(*) as count
FROM taskAttachments ta
LEFT JOIN users u ON ta.uploadedBy = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK TASK DEPENDENCIES
-- ============================================

-- Task dependencies with invalid taskId
SELECT 'taskDependencies.taskId' as issue, COUNT(*) as count
FROM taskDependencies td
LEFT JOIN tasks t ON td.taskId = t.id
WHERE t.id IS NULL;

-- Task dependencies with invalid dependsOnTaskId
SELECT 'taskDependencies.dependsOnTaskId' as issue, COUNT(*) as count
FROM taskDependencies td
LEFT JOIN tasks t ON td.dependsOnTaskId = t.id
WHERE t.id IS NULL;

-- ============================================
-- CHECK CHECKLIST TEMPLATES
-- ============================================

-- Checklist templates with invalid createdBy
SELECT 'checklistTemplates.createdBy' as issue, COUNT(*) as count
FROM checklistTemplates ct
LEFT JOIN users u ON ct.createdBy = u.id
WHERE u.id IS NULL;

-- ============================================
-- CHECK CHECKLIST TEMPLATE ITEMS
-- ============================================

-- Checklist template items with invalid templateId
SELECT 'checklistTemplateItems.templateId' as issue, COUNT(*) as count
FROM checklistTemplateItems cti
LEFT JOIN checklistTemplates ct ON cti.templateId = ct.id
WHERE ct.id IS NULL;

-- ============================================
-- CHECK TASK CHECKLISTS
-- ============================================

-- Task checklists with invalid taskId
SELECT 'taskChecklists.taskId' as issue, COUNT(*) as count
FROM taskChecklists tc
LEFT JOIN tasks t ON tc.taskId = t.id
WHERE t.id IS NULL;

-- Task checklists with invalid templateId
SELECT 'taskChecklists.templateId' as issue, COUNT(*) as count
FROM taskChecklists tc
LEFT JOIN checklistTemplates ct ON tc.templateId = ct.id
WHERE ct.id IS NULL;

-- Task checklists with invalid inspectedBy
SELECT 'taskChecklists.inspectedBy' as issue, COUNT(*) as count
FROM taskChecklists tc
LEFT JOIN users u ON tc.inspectedBy = u.id
WHERE tc.inspectedBy IS NOT NULL AND u.id IS NULL;

-- ============================================
-- CHECK NOTIFICATIONS
-- ============================================

-- Notifications with invalid userId
SELECT 'notifications.userId' as issue, COUNT(*) as count
FROM notifications n
LEFT JOIN users u ON n.userId = u.id
WHERE u.id IS NULL;

-- Notifications with invalid relatedTaskId
SELECT 'notifications.relatedTaskId' as issue, COUNT(*) as count
FROM notifications n
LEFT JOIN tasks t ON n.relatedTaskId = t.id
WHERE n.relatedTaskId IS NOT NULL AND t.id IS NULL;

-- Notifications with invalid relatedProjectId
SELECT 'notifications.relatedProjectId' as issue, COUNT(*) as count
FROM notifications n
LEFT JOIN projects p ON n.relatedProjectId = p.id
WHERE n.relatedProjectId IS NOT NULL AND p.id IS NULL;

-- Notifications with invalid relatedDefectId
SELECT 'notifications.relatedDefectId' as issue, COUNT(*) as count
FROM notifications n
LEFT JOIN defects d ON n.relatedDefectId = d.id
WHERE n.relatedDefectId IS NOT NULL AND d.id IS NULL;

-- ============================================
-- CHECK ACTIVITY LOG
-- ============================================

-- Activity log with invalid userId
SELECT 'activityLog.userId' as issue, COUNT(*) as count
FROM activityLog al
LEFT JOIN users u ON al.userId = u.id
WHERE u.id IS NULL;

-- Activity log with invalid projectId
SELECT 'activityLog.projectId' as issue, COUNT(*) as count
FROM activityLog al
LEFT JOIN projects p ON al.projectId = p.id
WHERE al.projectId IS NOT NULL AND p.id IS NULL;

-- Activity log with invalid taskId
SELECT 'activityLog.taskId' as issue, COUNT(*) as count
FROM activityLog al
LEFT JOIN tasks t ON al.taskId = t.id
WHERE al.taskId IS NOT NULL AND t.id IS NULL;

-- Activity log with invalid defectId
SELECT 'activityLog.defectId' as issue, COUNT(*) as count
FROM activityLog al
LEFT JOIN defects d ON al.defectId = d.id
WHERE al.defectId IS NOT NULL AND d.id IS NULL;

-- ============================================
-- SUMMARY
-- ============================================

SELECT '========================================' as separator;
SELECT 'SUMMARY: Run this script and check if any count > 0' as message;
SELECT 'If count > 0, you need to fix orphaned data before adding foreign keys' as message;
SELECT '========================================' as separator;
