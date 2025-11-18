import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["owner", "admin", "project_manager", "qc_inspector", "worker"]).default("worker").notNull(),
  // Notification settings
  notificationDaysAdvance: int("notificationDaysAdvance").default(3).notNull(), // จำนวนวันล่วงหน้าสำหรับการแจ้งเตือน
  enableInAppNotifications: boolean("enableInAppNotifications").default(true).notNull(),
  enableEmailNotifications: boolean("enableEmailNotifications").default(true).notNull(),
  enableDailySummaryEmail: boolean("enableDailySummaryEmail").default(false).notNull(),
  dailySummaryTime: varchar("dailySummaryTime", { length: 5 }).default("08:00"), // เวลาส่งอีเมลสรุปรายวัน (HH:mm)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - represents construction projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }),
  location: text("location"),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  ownerName: varchar("ownerName", { length: 255 }),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  status: mysqlEnum("status", ["draft", "planning", "active", "on_hold", "completed", "cancelled"]).default("draft").notNull(),
  completionPercentage: int("completionPercentage").default(0),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Project color in hex format (e.g., #3B82F6)
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Archive fields
  archivedAt: timestamp("archivedAt"),
  archivedBy: int("archivedBy"),
  archivedReason: text("archivedReason"),
}, (table) => ({
  createdByIdx: index("createdByIdx").on(table.createdBy),
  archivedAtIdx: index("archivedAtIdx").on(table.archivedAt),
}));

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project members - associates users with projects and their roles
 */
export const projectMembers = mysqlTable("projectMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["project_manager", "qc_inspector", "worker"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectUserIdx: index("projectUserIdx").on(table.projectId, table.userId),
}));

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Tasks table - represents work items in a project (supports hierarchy)
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  parentTaskId: int("parentTaskId"), // For sub-tasks
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  progress: int("progress").default(0).notNull(), // 0-100
  status: mysqlEnum("status", [
    "todo",
    "pending_pre_inspection",
    "ready_to_start",
    "in_progress",
    "pending_final_inspection",
    "rectification_needed",
    "completed",
    "not_started",
    "delayed"
  ]).default("todo").notNull(),
  assigneeId: int("assigneeId"),
  category: varchar("category", { length: 50 }), // e.g., "structure", "architecture", "mep", "finishing"
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  order: int("order").default(0).notNull(), // For sorting
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("projectIdx").on(table.projectId),
  assigneeIdx: index("assigneeIdx").on(table.assigneeId),
  parentIdx: index("parentIdx").on(table.parentTaskId),
  statusIdx: index("statusIdx").on(table.status),
  categoryIdx: index("categoryIdx").on(table.category),
  startDateIdx: index("startDateIdx").on(table.startDate),
  endDateIdx: index("endDateIdx").on(table.endDate),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Task dependencies - defines relationships between tasks
 */
export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(), // The dependent task
  dependsOnTaskId: int("dependsOnTaskId").notNull(), // The task it depends on
  type: mysqlEnum("type", ["finish_to_start", "start_to_start", "finish_to_finish"]).default("finish_to_start").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  dependsOnIdx: index("dependsOnIdx").on(table.dependsOnTaskId),
}));

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Task Assignments - many-to-many relationship for multiple assignees per task
 */
export const taskAssignments = mysqlTable("taskAssignments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskUserIdx: index("taskUserIdx").on(table.taskId, table.userId),
}));

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * Checklist templates - reusable QC checklists
 */
export const checklistTemplates = mysqlTable("checklistTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // e.g., "structure", "architecture", "mep"
  stage: mysqlEnum("stage", ["pre_execution", "in_progress", "post_execution"]).notNull(),
  description: text("description"),
  allowGeneralComments: boolean("allowGeneralComments").default(true).notNull(),
  allowPhotos: boolean("allowPhotos").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("categoryIdx").on(table.category),
  stageIdx: index("stageIdx").on(table.stage),
}));

export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type InsertChecklistTemplate = typeof checklistTemplates.$inferInsert;

/**
 * Checklist template items - individual items in a checklist template
 */
export const checklistTemplateItems = mysqlTable("checklistTemplateItems", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  itemText: text("itemText").notNull(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templateIdx: index("templateIdx").on(table.templateId),
}));

export type ChecklistTemplateItem = typeof checklistTemplateItems.$inferSelect;
export type InsertChecklistTemplateItem = typeof checklistTemplateItems.$inferInsert;

/**
 * Task checklists - links checklist templates to tasks
 */
export const taskChecklists = mysqlTable("taskChecklists", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  templateId: int("templateId").notNull(),
  stage: mysqlEnum("stage", ["pre_execution", "in_progress", "post_execution"]).notNull(),
  status: mysqlEnum("status", ["not_started", "pending_inspection", "in_progress", "completed", "failed"]).default("not_started").notNull(),
  inspectedBy: int("inspectedBy"),
  inspectedAt: timestamp("inspectedAt"),
  generalComments: text("generalComments"),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  signature: text("signature"), // Base64 encoded signature image
  originalInspectionId: int("originalInspectionId"), // Reference to original inspection if this is a re-inspection
  reinspectionCount: int("reinspectionCount").default(0).notNull(), // Number of times this has been re-inspected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  templateIdx: index("templateIdx").on(table.templateId),
  originalInspectionIdx: index("originalInspectionIdx").on(table.originalInspectionId),
}));

export type TaskChecklist = typeof taskChecklists.$inferSelect;
export type InsertTaskChecklist = typeof taskChecklists.$inferInsert;

/**
 * Checklist item results - records the result of each checklist item inspection
 */
export const checklistItemResults = mysqlTable("checklistItemResults", {
  id: int("id").autoincrement().primaryKey(),
  taskChecklistId: int("taskChecklistId").notNull(),
  templateItemId: int("templateItemId").notNull(),
  result: mysqlEnum("result", ["pass", "fail", "na"]).notNull(),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  checklistIdx: index("checklistIdx").on(table.taskChecklistId),
}));

export type ChecklistItemResult = typeof checklistItemResults.$inferSelect;
export type InsertChecklistItemResult = typeof checklistItemResults.$inferInsert;

/**
 * Defects - tracks issues found during inspections
 */
export const defects = mysqlTable("defects", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  checklistItemResultId: int("checklistItemResultId"), // Link to specific checklist item if applicable
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  status: mysqlEnum("status", [
    "reported",    // รายงานปัญหา (พร้อม Before photos)
    "analysis",    // วิเคราะห์สาเหตุ (RCA)
    "in_progress",  // กำลังแก้ไข
    "resolved",     // แก้ไขเสร็จ (พร้อม After photos)
    "pending_reinspection", // รอตรวจสอบซ้ำ
    "closed"        // ปิดงาน
  ]).default("reported").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assignedTo: int("assignedTo"),
  reportedBy: int("reportedBy").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionPhotoUrls: text("resolutionPhotoUrls"), // JSON array of resolution photo URLs
  resolutionComment: text("resolutionComment"),
  // CAR/PAR/NCR specific fields
  type: mysqlEnum("type", ["CAR", "PAR", "NCR"]).default("CAR").notNull(),
  checklistId: int("checklistId"), // Link to task checklist
  rootCause: text("rootCause"), // Root Cause Analysis
  correctiveAction: text("correctiveAction"), // Corrective action plan
  preventiveAction: text("preventiveAction"), // Preventive action plan
  dueDate: timestamp("dueDate"), // Due date for resolution
  // Action Plan fields (in_progress status)
  actionMethod: text("actionMethod"), // วิธีการแก้ไข
  actionResponsible: varchar("actionResponsible", { length: 255 }), // ผู้รับผิดชอบ
  actionDeadline: timestamp("actionDeadline"), // กำหนดเสร็จ
  actionNotes: text("actionNotes"), // หมายเหตุ
  ncrLevel: mysqlEnum("ncrLevel", ["major", "minor"]), // NCR severity level
  verifiedBy: int("verifiedBy"), // User who verified the fix
  verifiedAt: timestamp("verifiedAt"), // Verification timestamp
  verificationComment: text("verificationComment"), // Verification notes
  // Resolution and Closure fields
  resolutionNotes: text("resolutionNotes"), // Notes when changing status to resolved
  implementationMethod: text("implementationMethod"), // How the fix was implemented
  beforePhotos: text("beforePhotos"), // JSON array of photo URLs before fix
  afterPhotos: text("afterPhotos"), // JSON array of photo URLs after fix
  closureNotes: text("closureNotes"), // Notes when changing status to closed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  statusIdx: index("statusIdx").on(table.status),
  assignedToIdx: index("assignedToIdx").on(table.assignedTo),
  typeIdx: index("typeIdx").on(table.type),
  checklistIdx: index("checklistIdx").on(table.checklistId),
}));

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;

/**
 * Defect Attachments - stores file attachments for CAR/NCR/PAR
 */
export const defectAttachments = mysqlTable("defectAttachments", {
  id: int("id").autoincrement().primaryKey(),
  defectId: int("defectId").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key for management
  fileName: varchar("fileName", { length: 255 }).notNull(), // Original filename
  fileType: varchar("fileType", { length: 100 }).notNull(), // MIME type
  fileSize: int("fileSize").notNull(), // Size in bytes
  attachmentType: mysqlEnum("attachmentType", ["before", "after", "supporting"]).notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
}, (table) => ({
  defectIdx: index("defectIdx").on(table.defectId),
  typeIdx: index("typeIdx").on(table.attachmentType),
}));

export type DefectAttachment = typeof defectAttachments.$inferSelect;
export type InsertDefectAttachment = typeof defectAttachments.$inferInsert;

/**
 * Defect Inspections - stores inspection history for defects (initial and re-inspections)
 */
export const defectInspections = mysqlTable("defect_inspections", {
  id: int("id").autoincrement().primaryKey(),
  defectId: int("defectId").notNull(),
  inspectorId: int("inspectorId").notNull(),
  inspectionType: varchar("inspectionType", { length: 20 }).notNull(),
  result: varchar("result", { length: 20 }).default("pending").notNull(),
  comments: text("comments"),
  photoUrls: text("photoUrls"), // JSON array of inspection photo URLs
  inspectedAt: timestamp("inspectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  defectIdx: index("defectIdx").on(table.defectId),
  inspectorIdx: index("inspectorIdx").on(table.inspectorId),
  typeIdx: index("typeIdx").on(table.inspectionType),
}));

export type DefectInspection = typeof defectInspections.$inferSelect;
export type InsertDefectInspection = typeof defectInspections.$inferInsert;

/**
 * Checklist Results - stores individual item inspection results
 */
export const checklistResults = mysqlTable("checklistResults", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(), // task checklist
  itemId: int("itemId").notNull(), // checklist template item
  result: mysqlEnum("result", ["pass", "fail", "na"]).notNull(),
  comment: text("comment"),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  inspectedBy: int("inspectedBy").notNull(),
  inspectedAt: timestamp("inspectedAt").defaultNow().notNull(),
}, (table) => ({
  checklistIdx: index("checklistIdx").on(table.checklistId),
  itemIdx: index("itemIdx").on(table.itemId),
}));

export type ChecklistResult = typeof checklistResults.$inferSelect;
export type InsertChecklistResult = typeof checklistResults.$inferInsert;

/**
 * Task comments - comments on tasks
 */
export const taskComments = mysqlTable("taskComments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  mentions: text("mentions"), // JSON array of user IDs mentioned
  attachmentUrls: text("attachmentUrls"), // JSON array of attachment URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  userIdx: index("userIdx").on(table.userId),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

/**
 * Task attachments - files attached to tasks
 */
export const taskAttachments = mysqlTable("taskAttachments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileSize: int("fileSize"), // In bytes
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
}));

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = typeof taskAttachments.$inferInsert;

/**
 * Task followers - users who want to receive notifications about a task
 */
export const taskFollowers = mysqlTable("taskFollowers", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskUserIdx: index("taskUserIdx").on(table.taskId, table.userId),
}));

export type TaskFollower = typeof taskFollowers.$inferSelect;
export type InsertTaskFollower = typeof taskFollowers.$inferInsert;

/**
 * Notifications - system notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "task_assigned",
    "task_status_changed",
    "task_deadline_approaching",
    "task_overdue",
    "task_progress_updated",
    "task_comment_mention",
    "inspection_requested",
    "inspection_completed",
    "inspection_passed",
    "inspection_failed",
    "checklist_assigned",
    "checklist_reminder",
    "reinspection_required",
    "defect_assigned",
    "defect_created",
    "defect_status_changed",
    "defect_resolved",
    "defect_reinspected",
    "defect_deadline_approaching",
    "project_member_added",
    "project_milestone_reached",
    "project_status_changed",
    "file_uploaded",
    "comment_added",
    "dependency_blocked",
    "comment_mention",
    "task_updated",
    "deadline_reminder",
    "system_health_warning",
    "system_health_critical",
    "system_health_info"
  ]).notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  relatedTaskId: int("relatedTaskId"),
  relatedProjectId: int("relatedProjectId"),
  relatedDefectId: int("relatedDefectId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  isReadIdx: index("isReadIdx").on(table.isRead),
  typeIdx: index("typeIdx").on(table.type),
  relatedTaskIdx: index("relatedTaskIdx").on(table.relatedTaskId),
  relatedProjectIdx: index("relatedProjectIdx").on(table.relatedProjectId),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Push Subscriptions - stores browser push notification subscriptions
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  // Index on text column requires prefix length in MySQL
  // Removed index on endpoint as it's not needed for this use case
}));

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Alert Thresholds - user-defined thresholds for system metrics (CPU/Memory)
 */
export const alertThresholds = mysqlTable("alertThresholds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metricType: mysqlEnum("metricType", ["cpu", "memory"]).notNull(),
  threshold: int("threshold").notNull(), // Percentage (0-100)
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userMetricIdx: index("userMetricIdx").on(table.userId, table.metricType),
}));

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = typeof alertThresholds.$inferInsert;

/**
 * Database Query Logs - tracks slow queries and database performance
 */
export const queryLogs = mysqlTable("queryLogs", {
  id: int("id").autoincrement().primaryKey(),
  queryText: text("queryText").notNull(),
  executionTime: int("executionTime").notNull(), // milliseconds
  tableName: varchar("tableName", { length: 100 }),
  operationType: mysqlEnum("operationType", ["SELECT", "INSERT", "UPDATE", "DELETE", "OTHER"]).notNull(),
  userId: int("userId"),
  endpoint: varchar("endpoint", { length: 255 }), // tRPC procedure name
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  executionTimeIdx: index("executionTimeIdx").on(table.executionTime),
  tableNameIdx: index("tableNameIdx").on(table.tableName),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type QueryLog = typeof queryLogs.$inferSelect;
export type InsertQueryLog = typeof queryLogs.$inferInsert;

/**
 * Database Statistics Snapshots - periodic snapshots of database metrics
 */
export const dbStatistics = mysqlTable("dbStatistics", {
  id: int("id").autoincrement().primaryKey(),
  tableName: varchar("tableName", { length: 100 }).notNull(),
  rowCount: int("rowCount").notNull(),
  dataSize: int("dataSize").notNull(), // bytes
  indexSize: int("indexSize").notNull(), // bytes
  avgQueryTime: int("avgQueryTime"), // milliseconds
  queryCount: int("queryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tableNameIdx: index("tableNameIdx").on(table.tableName),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type DbStatistic = typeof dbStatistics.$inferSelect;
export type InsertDbStatistic = typeof dbStatistics.$inferInsert;

/**
 * Activity log - tracks all important actions in the system
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  taskId: int("taskId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "task_created", "status_changed", "inspection_completed", "defect_created", "defect_status_changed"
  details: text("details"), // JSON object with additional details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  projectIdx: index("projectIdx").on(table.projectId),
  taskIdx: index("taskIdx").on(table.taskId),
  actionIdx: index("actionIdx").on(table.action),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

/**
 * Category colors - stores custom colors for task categories per project
 */
export const categoryColors = mysqlTable("categoryColors", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: mysqlEnum("category", ["preparation", "structure", "architecture", "mep", "other"]).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // Hex color code (e.g., "#3B82F6")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectCategoryIdx: index("projectCategoryIdx").on(table.projectId, table.category),
}));

export type CategoryColor = typeof categoryColors.$inferSelect;
export type InsertCategoryColor = typeof categoryColors.$inferInsert;

/**
 * Archive Rules - automatic archiving rules for projects
 */
export const archiveRules = mysqlTable("archiveRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true).notNull(),
  // Rule conditions
  projectStatus: mysqlEnum("projectStatus", ["planning", "active", "on_hold", "completed", "cancelled"]),
  daysAfterCompletion: int("daysAfterCompletion"), // Auto-archive X days after project completion
  daysAfterEndDate: int("daysAfterEndDate"), // Auto-archive X days after end date
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastRunAt: timestamp("lastRunAt"),
});

export type ArchiveRule = typeof archiveRules.$inferSelect;
export type InsertArchiveRule = typeof archiveRules.$inferInsert;

/**
 * Archive History - tracks archive/unarchive actions
 */
export const archiveHistory = mysqlTable("archiveHistory", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  action: mysqlEnum("action", ["archived", "unarchived"]).notNull(),
  performedBy: int("performedBy").notNull(),
  reason: text("reason"),
  ruleId: int("ruleId"), // If archived by auto-rule
  performedAt: timestamp("performedAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectIdIdx").on(table.projectId),
  performedAtIdx: index("performedAtIdx").on(table.performedAt),
}));

export type ArchiveHistory = typeof archiveHistory.$inferSelect;
export type InsertArchiveHistory = typeof archiveHistory.$inferInsert;

/**
 * Signatures - digital signatures for QC inspections and approvals
 */
export const signatures = mysqlTable("signatures", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  signatureData: text("signatureData").notNull(), // Base64 encoded signature image
  signedBy: int("signedBy").notNull(),
  signedAt: timestamp("signedAt").defaultNow().notNull(),
}, (table) => ({
  checklistIdx: index("checklistIdx").on(table.checklistId),
  signedByIdx: index("signedByIdx").on(table.signedBy),
}));

export type Signature = typeof signatures.$inferSelect;
export type InsertSignature = typeof signatures.$inferInsert;

/**
 * Approvals - approval workflows for defects and checklists
 */
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["defect", "checklist"]).notNull(),
  entityId: int("entityId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  entityIdx: index("entityIdx").on(table.entityType, table.entityId),
}));

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Approval Steps - individual approval steps in a workflow
 */
export const approvalSteps = mysqlTable("approvalSteps", {
  id: int("id").autoincrement().primaryKey(),
  approvalId: int("approvalId").notNull(),
  approverId: int("approverId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  comments: text("comments"),
  signatureData: text("signatureData"), // Base64 encoded signature image
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  approvalIdx: index("approvalIdx").on(table.approvalId),
  approverIdx: index("approverIdx").on(table.approverId),
}));

export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = typeof approvalSteps.$inferInsert;

/**
 * Memory Logs - บันทึก memory usage ของระบบ
 */
export const memoryLogs = mysqlTable("memoryLogs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  totalMemoryMB: int("totalMemoryMB").notNull(), // Total system memory in MB
  usedMemoryMB: int("usedMemoryMB").notNull(), // Used memory in MB
  freeMemoryMB: int("freeMemoryMB").notNull(), // Free memory in MB
  usagePercentage: int("usagePercentage").notNull(), // Memory usage percentage (0-100)
  buffersCacheMB: int("buffersCacheMB"), // Buffers/Cache memory in MB
  availableMemoryMB: int("availableMemoryMB"), // Available memory in MB
  swapTotalMB: int("swapTotalMB"), // Total swap memory in MB
  swapUsedMB: int("swapUsedMB"), // Used swap memory in MB
  swapFreePercentage: int("swapFreePercentage"), // Swap free percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  timestampIdx: index("timestampIdx").on(table.timestamp),
  usagePercentageIdx: index("usagePercentageIdx").on(table.usagePercentage),
}));

export type MemoryLog = typeof memoryLogs.$inferSelect;
export type InsertMemoryLog = typeof memoryLogs.$inferInsert;

/**
 * OOM Events - บันทึก Out of Memory events
 */
export const oomEvents = mysqlTable("oomEvents", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  processName: varchar("processName", { length: 255 }), // Process that triggered OOM
  processId: int("processId"), // PID of the process
  killedProcessName: varchar("killedProcessName", { length: 255 }), // Process that was killed
  killedProcessId: int("killedProcessId"), // PID of killed process
  memoryUsedMB: int("memoryUsedMB"), // Memory used at the time of OOM
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  logMessage: text("logMessage"), // Full log message from system
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  timestampIdx: index("timestampIdx").on(table.timestamp),
  severityIdx: index("severityIdx").on(table.severity),
  resolvedIdx: index("resolvedIdx").on(table.resolved),
}));

export type OomEvent = typeof oomEvents.$inferSelect;
export type InsertOomEvent = typeof oomEvents.$inferInsert;

/**
 * Scheduled Notifications - ระบบแจ้งเตือนอัตโนมัติตามเวลาที่กำหนด
 */
export const scheduledNotifications = mysqlTable("scheduledNotifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "task_deadline_reminder",      // แจ้งเตือนก่อนถึง deadline ของงาน
    "defect_overdue_reminder",     // แจ้งเตือน defect ที่ค้างนาน
    "inspection_reminder",         // แจ้งเตือนตรวจสอบที่ค้างอยู่
    "daily_summary"                // สรุปรายวัน
  ]).notNull(),
  userId: int("userId").notNull(),
  relatedTaskId: int("relatedTaskId"),
  relatedDefectId: int("relatedDefectId"),
  relatedProjectId: int("relatedProjectId"),
  scheduledFor: timestamp("scheduledFor").notNull(), // เวลาที่จะส่งการแจ้งเตือน
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  scheduledForIdx: index("scheduledForIdx").on(table.scheduledFor),
  statusIdx: index("statusIdx").on(table.status),
  typeIdx: index("typeIdx").on(table.type),
  relatedTaskIdx: index("relatedTaskIdx").on(table.relatedTaskId),
  relatedDefectIdx: index("relatedDefectIdx").on(table.relatedDefectId),
}));

export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = typeof scheduledNotifications.$inferInsert;

/**
 * System Logs - tracks system events, errors, and performance issues for admin monitoring
 */
export const systemLogs = mysqlTable("systemLogs", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["error", "warning", "info", "performance", "security"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  message: text("message").notNull(),
  details: text("details"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low").notNull(),
  userId: int("userId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("typeIdx").on(table.type),
  categoryIdx: index("categoryIdx").on(table.category),
  severityIdx: index("severityIdx").on(table.severity),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
  resolvedIdx: index("resolvedIdx").on(table.resolved),
}));

export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;

/**
 * Notification Settings - การตั้งค่าการแจ้งเตือนของแต่ละ user
 */
export const notificationSettings = mysqlTable("notificationSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Task deadline reminders
  enableTaskDeadlineReminders: boolean("enableTaskDeadlineReminders").default(true).notNull(),
  taskDeadlineDaysAdvance: int("taskDeadlineDaysAdvance").default(3).notNull(), // แจ้งเตือนกี่วันล่วงหน้า
  // Defect reminders
  enableDefectOverdueReminders: boolean("enableDefectOverdueReminders").default(true).notNull(),
  defectOverdueDaysThreshold: int("defectOverdueDaysThreshold").default(7).notNull(), // ถือว่า defect ค้างนานเมื่อเกินกี่วัน
  // Daily summary
  enableDailySummary: boolean("enableDailySummary").default(false).notNull(),
  dailySummaryTime: varchar("dailySummaryTime", { length: 5 }).default("08:00"), // เวลาส่งสรุปรายวัน (HH:mm)
  // Notification channels
  enableInAppNotifications: boolean("enableInAppNotifications").default(true).notNull(),
  enableEmailNotifications: boolean("enableEmailNotifications").default(true).notNull(),
  enablePushNotifications: boolean("enablePushNotifications").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
}));

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

/**
 * Permissions - defines granular permissions for each module
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  module: mysqlEnum("module", [
    "projects",
    "tasks", 
    "inspections",
    "defects",
    "reports",
    "users",
    "settings",
    "dashboard"
  ]).notNull(),
  action: mysqlEnum("action", ["view", "create", "edit", "delete"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "View Projects", "Create Tasks"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  moduleActionIdx: index("moduleActionIdx").on(table.module, table.action),
}));

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * User Permissions - assigns specific permissions to users
 */
export const userPermissions = mysqlTable("userPermissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissionId: int("permissionId").notNull(),
  granted: boolean("granted").default(true).notNull(), // true = granted, false = explicitly denied
  grantedBy: int("grantedBy").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userPermissionIdx: index("userPermissionIdx").on(table.userId, table.permissionId),
  userIdx: index("userIdx").on(table.userId),
}));

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

/**
 * User Activity Logs - tracks detailed user activities for audit trail
 */
export const userActivityLogs = mysqlTable("userActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "login", "logout", "create_project", "update_task"
  module: varchar("module", { length: 50 }), // e.g., "projects", "tasks", "users"
  entityType: varchar("entityType", { length: 50 }), // e.g., "project", "task", "user"
  entityId: int("entityId"), // ID of the affected entity
  details: text("details"), // JSON object with additional details
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  actionIdx: index("actionIdx").on(table.action),
  moduleIdx: index("moduleIdx").on(table.module),
  entityIdx: index("entityIdx").on(table.entityType, table.entityId),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLogs.$inferInsert;

/**
 * Error Logs - tracks system errors for debugging and monitoring
 */
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  errorCode: varchar("errorCode", { length: 100 }),
  severity: mysqlEnum("severity", ["critical", "error", "warning", "info"]).default("error").notNull(),
  category: mysqlEnum("category", ["frontend", "backend", "database", "external_api", "auth", "file_upload", "other"]).default("other").notNull(),
  url: varchar("url", { length: 500 }), // URL where error occurred
  method: varchar("method", { length: 10 }), // HTTP method (GET, POST, etc.)
  userAgent: text("userAgent"), // Browser/client info
  userId: int("userId"), // User who encountered the error (if logged in)
  sessionId: varchar("sessionId", { length: 100 }), // Session identifier
  metadata: text("metadata"), // JSON string with additional context
  status: mysqlEnum("status", ["new", "investigating", "resolved", "ignored"]).default("new").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionNotes: text("resolutionNotes"),
  occurrenceCount: int("occurrenceCount").default(1).notNull(), // Number of times this error occurred
  firstOccurredAt: timestamp("firstOccurredAt").defaultNow().notNull(),
  lastOccurredAt: timestamp("lastOccurredAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  severityIdx: index("severityIdx").on(table.severity),
  categoryIdx: index("categoryIdx").on(table.category),
  statusIdx: index("statusIdx").on(table.status),
  userIdx: index("userIdx").on(table.userId),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

/**
 * Bulk Import Logs - tracks bulk user import operations
 */
export const bulkImportLogs = mysqlTable("bulkImportLogs", {
  id: int("id").autoincrement().primaryKey(),
  importedBy: int("importedBy").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl"), // S3 URL of the uploaded file
  totalRows: int("totalRows").notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorDetails: text("errorDetails"), // JSON array of errors
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  importedByIdx: index("importedByIdx").on(table.importedBy),
  statusIdx: index("statusIdx").on(table.status),
  createdAtIdx: index("createdAtIdx").on(table.createdAt),
}));

export type BulkImportLog = typeof bulkImportLogs.$inferSelect;
export type InsertBulkImportLog = typeof bulkImportLogs.$inferInsert;

/**
 * Role Templates - predefined permission templates for common roles
 */
export const roleTemplates = mysqlTable("roleTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Project Manager", "QC Inspector", "Worker"
  roleType: mysqlEnum("roleType", ["project_manager", "qc_inspector", "worker"]).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(), // true = system default template
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  roleTypeIdx: index("roleTypeIdx").on(table.roleType),
  isDefaultIdx: index("isDefaultIdx").on(table.isDefault),
}));

export type RoleTemplate = typeof roleTemplates.$inferSelect;
export type InsertRoleTemplate = typeof roleTemplates.$inferInsert;

/**
 * Role Template Permissions - maps permissions to role templates
 */
export const roleTemplatePermissions = mysqlTable("roleTemplatePermissions", {
  id: int("id").autoincrement().primaryKey(),
  roleTemplateId: int("roleTemplateId").notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templatePermissionIdx: index("templatePermissionIdx").on(table.roleTemplateId, table.permissionId),
}));

export type RoleTemplatePermission = typeof roleTemplatePermissions.$inferSelect;
export type InsertRoleTemplatePermission = typeof roleTemplatePermissions.$inferInsert;
