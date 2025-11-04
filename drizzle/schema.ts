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
  role: mysqlEnum("role", ["user", "admin", "pm", "engineer", "qc"]).default("user").notNull(),
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
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // Store as cents/smallest unit
  status: mysqlEnum("status", ["planning", "active", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("createdByIdx").on(table.createdBy),
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
  role: mysqlEnum("role", ["owner", "pm", "engineer", "qc", "viewer"]).notNull(),
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
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  progress: int("progress").default(0).notNull(), // 0-100
  status: mysqlEnum("status", [
    "todo",
    "pending_pre_inspection",
    "ready_to_start",
    "in_progress",
    "pending_final_inspection",
    "rectification_needed",
    "completed"
  ]).default("todo").notNull(),
  assigneeId: int("assigneeId"),
  order: int("order").default(0).notNull(), // For sorting
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("projectIdx").on(table.projectId),
  assigneeIdx: index("assigneeIdx").on(table.assigneeId),
  parentIdx: index("parentIdx").on(table.parentTaskId),
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
 * Checklist templates - reusable QC checklists
 */
export const checklistTemplates = mysqlTable("checklistTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // e.g., "structure", "architecture", "mep"
  stage: mysqlEnum("stage", ["pre_execution", "in_progress", "post_execution"]).notNull(),
  description: text("description"),
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
  requirePhoto: boolean("requirePhoto").default(false).notNull(),
  acceptanceCriteria: text("acceptanceCriteria"),
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
  status: mysqlEnum("status", ["pending", "in_progress", "passed", "failed"]).default("pending").notNull(),
  inspectedBy: int("inspectedBy"),
  inspectedAt: timestamp("inspectedAt"),
  signature: text("signature"), // Base64 encoded signature image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  templateIdx: index("templateIdx").on(table.templateId),
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
  result: mysqlEnum("result", ["pass", "fail", "na"]),
  comment: text("comment"),
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
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "verified"]).default("open").notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assignedTo: int("assignedTo"),
  reportedBy: int("reportedBy").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolutionPhotoUrls: text("resolutionPhotoUrls"), // JSON array of resolution photo URLs
  resolutionComment: text("resolutionComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskIdx: index("taskIdx").on(table.taskId),
  statusIdx: index("statusIdx").on(table.status),
  assignedToIdx: index("assignedToIdx").on(table.assignedTo),
}));

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;

/**
 * Task comments - discussion threads on tasks
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
    "inspection_requested",
    "inspection_completed",
    "defect_assigned",
    "defect_resolved",
    "comment_mention",
    "task_updated",
    "deadline_reminder"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  relatedTaskId: int("relatedTaskId"),
  relatedProjectId: int("relatedProjectId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  isReadIdx: index("isReadIdx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Activity log - tracks all important actions in the system
 */
export const activityLog = mysqlTable("activityLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  taskId: int("taskId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "task_created", "status_changed", "inspection_completed"
  details: text("details"), // JSON object with additional details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("userIdx").on(table.userId),
  projectIdx: index("projectIdx").on(table.projectId),
  taskIdx: index("taskIdx").on(table.taskId),
}));

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
