import { z } from "zod";

/**
 * Validation schemas for Construction Management & QC Platform
 * Used for both frontend form validation and backend API input validation
 */

// Project validation
export const projectSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อโครงการ").max(255, "ชื่อโครงการยาวเกินไป"),
  code: z.string().max(100, "รหัสโครงการยาวเกินไป").optional(),
  location: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  ownerName: z.string().max(255, "ชื่อเจ้าของโครงการยาวเกินไป").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().int().positive("งบประมาณต้องเป็นจำนวนเต็มบวก").optional(),
  status: z.enum(["draft", "planning", "active", "on_hold", "completed", "cancelled"]).optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "รูปแบบสีไม่ถูกต้อง").optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

// Task validation
export const taskSchema = z.object({
  projectId: z.number().int().positive("Project ID ไม่ถูกต้อง"),
  parentTaskId: z.number().int().positive().optional(),
  name: z.string().min(1, "กรุณากรอกชื่องาน").max(255, "ชื่องานยาวเกินไป"),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["todo", "pending_pre_inspection", "ready_to_start", "in_progress", "pending_final_inspection", "rectification_needed", "completed", "not_started", "delayed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  assigneeId: z.number().int().positive().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;

// QC Inspection validation
export const inspectionItemSchema = z.object({
  templateItemId: z.number().int().positive("Template Item ID ไม่ถูกต้อง"),
  result: z.enum(["pass", "fail", "na"], { message: "ผลการตรวจสอบต้องเป็น pass, fail หรือ na" }),
  itemText: z.string().min(1, "กรุณากรอกรายละเอียดรายการ"),
});

export const inspectionSchema = z.object({
  taskId: z.number().int().positive("Task ID ไม่ถูกต้อง"),
  checklistId: z.number().int().positive("Checklist ID ไม่ถูกต้อง"),
  inspectedBy: z.number().int().positive("Inspector ID ไม่ถูกต้อง"),
  itemResults: z.array(inspectionItemSchema).min(1, "ต้องมีรายการตรวจสอบอย่างน้อย 1 รายการ"),
  generalComments: z.string().optional(),
  photoUrls: z.array(z.string().url("URL รูปภาพไม่ถูกต้อง")).optional(),
});

export type InspectionInput = z.infer<typeof inspectionSchema>;

// Defect validation
export const defectSchema = z.object({
  taskId: z.number().int().positive("Task ID ไม่ถูกต้อง"),
  checklistItemResultId: z.number().int().positive().optional(),
  title: z.string().min(1, "กรุณากรอกหัวข้อข้อบกพร่อง").max(255, "หัวข้อยาวเกินไป"),
  description: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"], { message: "ระดับความรุนแรงไม่ถูกต้อง" }),
  status: z.enum(["reported", "in_progress", "analysis", "resolved", "closed"]).optional(),
  reportedBy: z.number().int().positive("Reporter ID ไม่ถูกต้อง"),
  assignedTo: z.number().int().positive().optional(),
  dueDate: z.string().optional(),
  photoUrls: z.string().optional(), // JSON string
});

export type DefectInput = z.infer<typeof defectSchema>;

// Checklist Template validation
export const checklistTemplateItemSchema = z.object({
  itemText: z.string().min(1, "กรุณากรอกรายละเอียดรายการ"),
  category: z.string().optional(),
  requiresPhoto: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const checklistTemplateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อเทมเพลต").max(255, "ชื่อเทมเพลตยาวเกินไป"),
  description: z.string().optional(),
  category: z.string().optional(),
  items: z.array(checklistTemplateItemSchema).min(1, "ต้องมีรายการตรวจสอบอย่างน้อย 1 รายการ"),
});

export type ChecklistTemplateInput = z.infer<typeof checklistTemplateSchema>;

// User validation
export const userUpdateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ").optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional(),
  role: z.enum(["owner", "admin", "project_manager", "qc_inspector", "field_engineer"]).optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// Archive Rule validation
export const archiveRuleSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อกฎ").max(255, "ชื่อกฎยาวเกินไป"),
  description: z.string().optional(),
  conditions: z.object({
    status: z.array(z.string()).optional(),
    daysInactive: z.number().int().positive().optional(),
    completedBefore: z.string().optional(),
  }),
  action: z.enum(["archive", "delete", "notify"]),
  enabled: z.boolean().optional(),
});

export type ArchiveRuleInput = z.infer<typeof archiveRuleSchema>;
