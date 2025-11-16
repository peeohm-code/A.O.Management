import { getDb } from "./db";
import { taskChecklists, tasks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * คำนวณและอัพเดทความคืบหน้าของ task อัตโนมัติ
 * โดยนับจำนวน checklist ที่ผ่าน (completed) เทียบกับจำนวนทั้งหมด
 * 
 * @param taskId - ID ของ task ที่ต้องการอัพเดท
 * @returns progress percentage (0-100)
 */
export async function calculateAndUpdateTaskProgress(taskId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ดึงข้อมูล checklist ทั้งหมดของ task
  const checklists = await db
    .select({
      id: taskChecklists.id,
      status: taskChecklists.status,
    })
    .from(taskChecklists)
    .where(eq(taskChecklists.taskId, taskId));

  // ถ้าไม่มี checklist ให้ progress = 0
  if (checklists.length === 0) {
    await db.update(tasks).set({ progress: 0 }).where(eq(tasks.id, taskId));
    return 0;
  }

  // นับจำนวน checklist ที่ผ่าน (completed)
  const completedCount = checklists.filter((c) => c.status === "completed").length;
  const totalCount = checklists.length;

  // คำนวณ progress percentage
  const progress = Math.round((completedCount / totalCount) * 100);

  // อัพเดท progress ใน task
  await db.update(tasks).set({ progress }).where(eq(tasks.id, taskId));

  // ถ้า progress = 100% ให้เปลี่ยนสถานะเป็น completed
  if (progress === 100) {
    await db.update(tasks).set({ 
      status: "completed",
      progress: 100 
    }).where(eq(tasks.id, taskId));
  }

  return progress;
}

/**
 * ตรวจสอบว่า checklist ทั้งหมดผ่านหรือยัง
 */
export async function areAllChecklistsCompleted(taskId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const checklists = await db
    .select({
      status: taskChecklists.status,
    })
    .from(taskChecklists)
    .where(eq(taskChecklists.taskId, taskId));

  if (checklists.length === 0) return false;

  return checklists.every((c) => c.status === "completed");
}
