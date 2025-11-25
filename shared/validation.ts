/**
 * Shared Zod Validation Schemas
 * Purpose: Centralized input validation to prevent SQL injection and invalid data
 */

import { z } from 'zod';

// ============================================
// COMMON VALIDATORS
// ============================================

export const idSchema = z.number().int().positive();
export const optionalIdSchema = z.number().int().positive().optional();
export const stringSchema = z.string().min(1).max(255);
export const optionalStringSchema = z.string().min(1).max(255).optional();
export const textSchema = z.string().max(10000);
export const optionalTextSchema = z.string().max(10000).optional();
export const emailSchema = z.string().email().max(320);
export const urlSchema = z.string().url().max(500);
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const optionalDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
export const timestampSchema = z.date();
export const optionalTimestampSchema = z.date().optional();
export const percentageSchema = z.number().int().min(0).max(100);
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// ============================================
// PROJECT SCHEMAS
// ============================================

export const projectStatusSchema = z.enum(['draft', 'planning', 'active', 'on_hold', 'completed', 'cancelled']);

export const createProjectSchema = z.object({
  name: stringSchema,
  code: optionalStringSchema,
  location: optionalTextSchema,
  latitude: z.string().max(50).optional(),
  longitude: z.string().max(50).optional(),
  ownerName: optionalStringSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  budget: z.number().int().positive().optional(),
  status: projectStatusSchema.default('draft'),
  color: colorSchema.default('#3B82F6'),
});

export const updateProjectSchema = z.object({
  id: idSchema,
  name: optionalStringSchema,
  code: optionalStringSchema,
  location: optionalTextSchema,
  latitude: z.string().max(50).optional(),
  longitude: z.string().max(50).optional(),
  ownerName: optionalStringSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  budget: z.number().int().positive().optional(),
  status: projectStatusSchema.optional(),
  completionPercentage: percentageSchema.optional(),
  color: colorSchema.optional(),
});

export const deleteProjectSchema = z.object({
  id: idSchema,
});

export const getProjectSchema = z.object({
  id: idSchema,
});

export const addProjectMemberSchema = z.object({
  projectId: idSchema,
  userId: idSchema,
  role: z.enum(['project_manager', 'qc_inspector', 'worker']),
});

export const removeProjectMemberSchema = z.object({
  projectId: idSchema,
  userId: idSchema,
});

// ============================================
// TASK SCHEMAS
// ============================================

export const taskStatusSchema = z.enum([
  'todo',
  'pending_pre_inspection',
  'ready_to_start',
  'in_progress',
  'pending_final_inspection',
  'rectification_needed',
  'completed',
  'not_started',
  'delayed'
]);

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const createTaskSchema = z.object({
  projectId: idSchema,
  parentTaskId: optionalIdSchema,
  name: stringSchema,
  description: optionalTextSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  progress: percentageSchema.default(0),
  status: taskStatusSchema.default('todo'),
  assigneeId: optionalIdSchema,
  category: z.string().max(50).optional(),
  priority: taskPrioritySchema.default('medium'),
  order: z.number().int().min(0).default(0),
});

export const updateTaskSchema = z.object({
  id: idSchema,
  name: optionalStringSchema,
  description: optionalTextSchema,
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
  progress: percentageSchema.optional(),
  status: taskStatusSchema.optional(),
  assigneeId: optionalIdSchema,
  category: z.string().max(50).optional(),
  priority: taskPrioritySchema.optional(),
  order: z.number().int().min(0).optional(),
});

export const deleteTaskSchema = z.object({
  id: idSchema,
});

export const getTaskSchema = z.object({
  id: idSchema,
});

export const getTasksByProjectSchema = z.object({
  projectId: idSchema,
});

// ============================================
// DEFECT SCHEMAS
// ============================================

export const defectStatusSchema = z.enum([
  'reported',
  'analysis',
  'in_progress',
  'resolved',
  'pending_reinspection',
  'closed'
]);

export const defectSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const defectTypeSchema = z.enum(['CAR', 'PAR', 'NCR']);
export const ncrLevelSchema = z.enum(['major', 'minor']);

export const createDefectSchema = z.object({
  projectId: idSchema,
  taskId: idSchema,
  checklistItemResultId: optionalIdSchema,
  title: stringSchema,
  description: optionalTextSchema,
  photoUrls: optionalTextSchema,
  status: defectStatusSchema.default('reported'),
  severity: defectSeveritySchema.default('medium'),
  assignedTo: optionalIdSchema,
  type: defectTypeSchema.default('CAR'),
  checklistId: optionalIdSchema,
  rootCause: optionalTextSchema,
  correctiveAction: optionalTextSchema,
  preventiveAction: optionalTextSchema,
  dueDate: optionalTimestampSchema,
  actionMethod: optionalTextSchema,
  actionResponsible: optionalStringSchema,
  actionDeadline: optionalTimestampSchema,
  actionNotes: optionalTextSchema,
  ncrLevel: ncrLevelSchema.optional(),
});

export const updateDefectSchema = z.object({
  id: idSchema,
  title: optionalStringSchema,
  description: optionalTextSchema,
  photoUrls: optionalTextSchema,
  status: defectStatusSchema.optional(),
  severity: defectSeveritySchema.optional(),
  assignedTo: optionalIdSchema,
  resolvedBy: optionalIdSchema,
  resolvedAt: optionalTimestampSchema,
  resolutionPhotoUrls: optionalTextSchema,
  resolutionComment: optionalTextSchema,
  type: defectTypeSchema.optional(),
  rootCause: optionalTextSchema,
  correctiveAction: optionalTextSchema,
  preventiveAction: optionalTextSchema,
  dueDate: optionalTimestampSchema,
  actionMethod: optionalTextSchema,
  actionResponsible: optionalStringSchema,
  actionDeadline: optionalTimestampSchema,
  actionNotes: optionalTextSchema,
  ncrLevel: ncrLevelSchema.optional(),
  verifiedBy: optionalIdSchema,
  verifiedAt: optionalTimestampSchema,
  verificationComment: optionalTextSchema,
  resolutionNotes: optionalTextSchema,
  implementationMethod: optionalTextSchema,
  beforePhotos: optionalTextSchema,
  afterPhotos: optionalTextSchema,
  closureNotes: optionalTextSchema,
});

export const deleteDefectSchema = z.object({
  id: idSchema,
});

export const getDefectSchema = z.object({
  id: idSchema,
});

export const getDefectsByProjectSchema = z.object({
  projectId: idSchema,
});

export const getDefectsByTaskSchema = z.object({
  taskId: idSchema,
});

// ============================================
// CHECKLIST SCHEMAS
// ============================================

export const checklistStageSchema = z.enum(['pre_execution', 'in_progress', 'post_execution']);
export const checklistStatusSchema = z.enum(['not_started', 'pending_inspection', 'in_progress', 'completed', 'failed']);
export const checklistResultSchema = z.enum(['pass', 'fail', 'na']);

export const createChecklistTemplateSchema = z.object({
  name: stringSchema,
  category: z.string().max(100).optional(),
  stage: checklistStageSchema,
  description: optionalTextSchema,
  allowGeneralComments: z.boolean().default(true),
  allowPhotos: z.boolean().default(true),
});

export const updateChecklistTemplateSchema = z.object({
  id: idSchema,
  name: optionalStringSchema,
  category: z.string().max(100).optional(),
  stage: checklistStageSchema.optional(),
  description: optionalTextSchema,
  allowGeneralComments: z.boolean().optional(),
  allowPhotos: z.boolean().optional(),
});

export const deleteChecklistTemplateSchema = z.object({
  id: idSchema,
});

export const createChecklistTemplateItemSchema = z.object({
  templateId: idSchema,
  itemText: textSchema,
  order: z.number().int().min(0).default(0),
});

export const updateChecklistTemplateItemSchema = z.object({
  id: idSchema,
  itemText: textSchema.optional(),
  order: z.number().int().min(0).optional(),
});

export const deleteChecklistTemplateItemSchema = z.object({
  id: idSchema,
});

export const createTaskChecklistSchema = z.object({
  taskId: idSchema,
  templateId: idSchema,
  stage: checklistStageSchema,
});

export const updateTaskChecklistSchema = z.object({
  id: idSchema,
  status: checklistStatusSchema.optional(),
  inspectedBy: optionalIdSchema,
  inspectedAt: optionalTimestampSchema,
  generalComments: optionalTextSchema,
  photoUrls: optionalTextSchema,
  signature: optionalTextSchema,
});

export const submitChecklistResultSchema = z.object({
  taskChecklistId: idSchema,
  templateItemId: idSchema,
  result: checklistResultSchema,
  photoUrls: optionalTextSchema,
  comments: optionalTextSchema,
});

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const notificationTypeSchema = z.enum([
  'task_assigned',
  'task_status_changed',
  'task_deadline_approaching',
  'task_overdue',
  'task_progress_updated',
  'task_comment_mention',
  'inspection_requested',
  'inspection_completed',
  'inspection_passed',
  'inspection_failed',
  'checklist_assigned',
  'checklist_reminder',
  'reinspection_required',
  'defect_assigned',
  'defect_created',
  'defect_status_changed',
  'defect_resolved',
  'defect_reinspected',
  'defect_deadline_approaching',
  'project_member_added',
  'project_milestone_reached',
  'project_status_changed',
  'file_uploaded',
  'comment_added',
  'dependency_blocked',
  'comment_mention',
  'task_updated',
  'deadline_reminder',
  'escalation',
  'system_health_warning',
  'system_health_critical',
  'system_health_info'
]);

export const notificationPrioritySchema = z.enum(['urgent', 'high', 'normal', 'low']);

export const createNotificationSchema = z.object({
  userId: idSchema,
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('normal'),
  title: stringSchema,
  content: optionalTextSchema,
  relatedTaskId: optionalIdSchema,
  relatedProjectId: optionalIdSchema,
  relatedDefectId: optionalIdSchema,
});

export const markNotificationReadSchema = z.object({
  id: idSchema,
});

export const markAllNotificationsReadSchema = z.object({
  userId: idSchema,
});

export const deleteNotificationSchema = z.object({
  id: idSchema,
});

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createTaskCommentSchema = z.object({
  taskId: idSchema,
  content: textSchema,
  mentions: optionalTextSchema,
  attachmentUrls: optionalTextSchema,
});

export const updateTaskCommentSchema = z.object({
  id: idSchema,
  content: textSchema,
});

export const deleteTaskCommentSchema = z.object({
  id: idSchema,
});

// ============================================
// ATTACHMENT SCHEMAS
// ============================================

export const attachmentTypeSchema = z.enum(['before', 'after', 'supporting']);

export const createDefectAttachmentSchema = z.object({
  defectId: idSchema,
  fileUrl: urlSchema,
  fileKey: stringSchema,
  fileName: stringSchema,
  fileType: z.string().max(100),
  fileSize: z.number().int().positive(),
  attachmentType: attachmentTypeSchema,
});

export const createTaskAttachmentSchema = z.object({
  taskId: idSchema,
  fileName: stringSchema,
  fileUrl: urlSchema,
  fileKey: stringSchema,
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
});

export const deleteAttachmentSchema = z.object({
  id: idSchema,
});

// ============================================
// PAGINATION & FILTERING
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: optionalDateStringSchema,
  endDate: optionalDateStringSchema,
});

export const searchSchema = z.object({
  query: z.string().max(255).optional(),
});

// ============================================
// FILE UPLOAD VALIDATION
// ============================================

export const fileUploadSchema = z.object({
  fileName: stringSchema,
  fileSize: z.number().int().positive().max(50 * 1024 * 1024), // 50MB max
  mimeType: z.string().max(100),
});

export const imageUploadSchema = fileUploadSchema.extend({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max for images
});

// ============================================
// EXPORT TYPES
// ============================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateDefectInput = z.infer<typeof createDefectSchema>;
export type UpdateDefectInput = z.infer<typeof updateDefectSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
