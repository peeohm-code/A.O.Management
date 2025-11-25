import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - โครงการก่อสร้าง
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location"),
  status: mysqlEnum("status", ["planning", "active", "on-hold", "completed", "cancelled"]).default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // in cents/satang
  ownerId: int("ownerId").notNull(), // user who created the project
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * QC Checklists table - รายการตรวจสอบคุณภาพ
 */
export const qcChecklists = mysqlTable("qc_checklists", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // e.g., "Structural", "Electrical", "Plumbing"
  inspectorId: int("inspectorId"), // user assigned to inspect
  status: mysqlEnum("status", ["pending", "in-progress", "completed"]).default("pending").notNull(),
  inspectionDate: timestamp("inspectionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcChecklist = typeof qcChecklists.$inferSelect;
export type InsertQcChecklist = typeof qcChecklists.$inferInsert;

/**
 * QC Checklist Items table - รายการย่อยในการตรวจสอบ
 */
export const qcChecklistItems = mysqlTable("qc_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  description: text("description"),
  result: mysqlEnum("result", ["pass", "fail", "pending", "na"]).default("pending").notNull(),
  notes: text("notes"),
  photoUrl: text("photoUrl"), // S3 URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcChecklistItem = typeof qcChecklistItems.$inferSelect;
export type InsertQcChecklistItem = typeof qcChecklistItems.$inferInsert;

/**
 * Defects table - ข้อบกพร่องที่พบ
 */
export const defects = mysqlTable("defects", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: text("location"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in-progress", "resolved", "closed"]).default("open").notNull(),
  reportedById: int("reportedById").notNull(), // user who reported
  assignedToId: int("assignedToId"), // user assigned to fix
  photoUrl: text("photoUrl"), // S3 URL
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;

/**
 * Documents table - เอกสารและรูปภาพ
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileType: varchar("fileType", { length: 100 }), // MIME type
  fileSize: int("fileSize"), // in bytes
  category: varchar("category", { length: 100 }), // e.g., "Drawing", "Photo", "Report"
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Tasks table - งานในโครงการ
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in-progress", "review", "completed"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  assignedToId: int("assignedToId"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
