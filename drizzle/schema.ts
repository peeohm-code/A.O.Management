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
  location: varchar("location", { length: 500 }),
  status: mysqlEnum("status", ["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // เก็บเป็นหน่วยเล็กสุด เช่น สตางค์
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
  status: mysqlEnum("status", ["todo", "in_progress", "review", "completed"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedTo: int("assignedTo"), // user id ที่รับผิดชอบ
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * QC Checklists table - รายการตรวจสอบคุณภาพ
 */
export const qcChecklists = mysqlTable("qc_checklists", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskId: int("taskId"), // optional - อาจเชื่อมกับ task หรือไม่ก็ได้
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // เช่น "โครงสร้าง", "ระบบไฟฟ้า", "ระบบประปา"
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcChecklist = typeof qcChecklists.$inferSelect;
export type InsertQcChecklist = typeof qcChecklists.$inferInsert;

/**
 * QC Inspections table - การตรวจสอบคุณภาพแต่ละครั้ง
 */
export const qcInspections = mysqlTable("qc_inspections", {
  id: int("id").autoincrement().primaryKey(),
  checklistId: int("checklistId").notNull(),
  inspectedBy: int("inspectedBy").notNull(), // user id ผู้ตรวจสอบ
  status: mysqlEnum("status", ["pass", "fail", "pending"]).default("pending").notNull(),
  notes: text("notes"),
  inspectionDate: timestamp("inspectionDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QcInspection = typeof qcInspections.$inferSelect;
export type InsertQcInspection = typeof qcInspections.$inferInsert;

/**
 * QC Photos table - รูปภาพประกอบการตรวจสอบ
 */
export const qcPhotos = mysqlTable("qc_photos", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  url: varchar("url", { length: 1000 }).notNull(), // S3 URL
  caption: text("caption"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QcPhoto = typeof qcPhotos.$inferSelect;
export type InsertQcPhoto = typeof qcPhotos.$inferInsert;

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
