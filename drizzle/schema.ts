import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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
  status: mysqlEnum("status", ["planning", "in_progress", "completed", "on_hold"]).default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // เก็บเป็นจำนวนเต็ม (satang/cents)
  ownerId: int("ownerId").notNull(), // ผู้สร้างโครงการ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Tasks table - งานในโครงการ
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "blocked"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedTo: int("assignedTo"), // user id
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * QC Checklists table - รายการตรวจสอบ QC แม่แบบ
 */
export const qcChecklists = mysqlTable("qc_checklists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // เช่น "โครงสร้าง", "สถาปัตย์", "ระบบไฟฟ้า"
  isTemplate: boolean("isTemplate").default(true).notNull(), // เป็น template หรือเฉพาะโครงการ
  projectId: int("projectId"), // null = template ทั่วไป, มีค่า = เฉพาะโครงการ
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcChecklist = typeof qcChecklists.$inferSelect;
export type InsertQcChecklist = typeof qcChecklists.$inferInsert;

/**
 * QC Checklist Items table - รายการตรวจสอบย่อยใน checklist
 */
export const qcChecklistItems = mysqlTable("qc_checklist_items", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  itemText: text("itemText").notNull(),
  orderIndex: int("orderIndex").default(0).notNull(), // ลำดับการแสดงผล
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QcChecklistItem = typeof qcChecklistItems.$inferSelect;
export type InsertQcChecklistItem = typeof qcChecklistItems.$inferInsert;

/**
 * QC Inspections table - การตรวจสอบ QC จริง
 */
export const qcInspections = mysqlTable("qc_inspections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  checklistId: int("checklistId").notNull(),
  taskId: int("taskId"), // อาจเชื่อมกับ task หรือไม่ก็ได้
  inspectionDate: timestamp("inspectionDate").notNull(),
  inspectorId: int("inspectorId").notNull(), // ผู้ตรวจสอบ
  location: text("location"), // ตำแหน่งที่ตรวจ
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  overallResult: mysqlEnum("overallResult", ["pass", "fail", "conditional"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcInspection = typeof qcInspections.$inferSelect;
export type InsertQcInspection = typeof qcInspections.$inferInsert;

/**
 * QC Inspection Results table - ผลการตรวจสอบแต่ละรายการ
 */
export const qcInspectionResults = mysqlTable("qc_inspection_results", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  checklistItemId: int("checklistItemId").notNull(),
  result: mysqlEnum("result", ["pass", "fail", "na"]).notNull(), // pass/fail/not applicable
  remarks: text("remarks"),
  photoUrl: text("photoUrl"), // URL รูปภาพประกอบ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QcInspectionResult = typeof qcInspectionResults.$inferSelect;
export type InsertQcInspectionResult = typeof qcInspectionResults.$inferInsert;

/**
 * Project Members table - สมาชิกในโครงการ
 */
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "manager", "member", "viewer"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;
