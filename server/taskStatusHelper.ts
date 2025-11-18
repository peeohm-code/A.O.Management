import { Task } from "../drizzle/schema";

/**
 * Task Display Status Types
 * These are computed statuses based on dates and progress
 */
export type TaskDisplayStatus = "not_started" | "in_progress" | "delayed" | "completed";

/**
 * Compute display status for a task based on dates and progress
 * 
 * Logic:
 * - "completed" (เสร็จสมบูรณ์): progress = 100%
 * - "not_started" (ยังไม่เริ่ม): before start date OR no start date
 * - "delayed" (ล่าช้า): past end date AND progress < 100%
 * - "in_progress" (กำลังทำ): after start date AND progress < 100% AND not delayed
 */
export function getTaskDisplayStatus(task: Task): TaskDisplayStatus {
  const now = new Date();
  
  // If progress is 100%, task is completed regardless of dates
  if (task.progress >= 100) {
    return "completed";
  }
  
  // If no start date, consider not started
  if (!task.startDate) {
    return "not_started";
  }
  
  const startDate = new Date(task.startDate);
  const endDate = task.endDate ? new Date(task.endDate) : null;
  
  // If before start date, not started
  if (now < startDate) {
    return "not_started";
  }
  
  // If past end date and not completed, delayed
  if (endDate && now > endDate) {
    return "delayed";
  }
  
  // Otherwise, in progress
  return "in_progress";
}

/**
 * Get Thai label for display status
 */
export function getTaskDisplayStatusLabel(status: TaskDisplayStatus): string {
  const labels: Record<TaskDisplayStatus, string> = {
    not_started: "ยังไม่เริ่ม",
    in_progress: "กำลังทำ",
    delayed: "ล่าช้า",
    completed: "เสร็จสมบูรณ์",
  };
  return labels[status];
}

/**
 * Get color class for display status badge
 */
export function getTaskDisplayStatusColor(status: TaskDisplayStatus): string {
  const colors: Record<TaskDisplayStatus, string> = {
    not_started: "bg-gray-100 text-gray-700 border-gray-300",
    in_progress: "bg-blue-100 text-blue-700 border-blue-300",
    delayed: "bg-red-100 text-red-700 border-red-300",
    completed: "bg-green-100 text-green-700 border-green-300",
  };
  return colors[status];
}
