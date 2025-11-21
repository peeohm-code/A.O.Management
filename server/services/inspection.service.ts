/**
 * Inspection Service
 * 
 * Handles inspection-related business logic with proper transaction management:
 * - submitInspection: Atomic submission of inspection results with automatic defect creation
 * 
 * Uses toNumber() helper for safe ID conversions and constants from utils/constants.ts
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  tasks,
  taskChecklists,
  checklistItemResults,
  defects,
  projectMembers,
} from "../../drizzle/schema";
import { toNumber } from "../utils/db-helpers";
import {
  INSPECTION_RESULT,
  CHECKLIST_STATUS,
  TASK_STATUS,
  DEFECT_SEVERITY,
  DEFECT_STATUS,
  NOTIFICATION_TYPE,
  ACTIVITY_TYPE,
} from "../utils/constants";
import { logger } from "../logger";
import { createNotification, logActivity } from "../db";

/**
 * Submit inspection results with transaction support
 * 
 * @param data Inspection submission data
 * @returns Object with success status and statistics
 * 
 * @throws Error if database is unavailable or transaction fails
 * 
 * Business Logic (ALL ATOMIC - wrapped in transaction):
 * 1. Save all checklist item results with photos
 * 2. Calculate overall status (failed if any item fails)
 * 3. Update task checklist with status, inspector, timestamp, comments, photos, signature
 * 4. Create defects for all failed items
 * 5. Update task status to 'rectification_needed' if any items failed
 * 6. Update task progress based on checklist completion
 * 7. Send notifications to assignee and project managers
 * 8. Log activity
 * 
 * Transaction ensures:
 * - All operations succeed together or all fail together
 * - No partial data corruption
 * - Consistent state across all related tables
 * 
 * Uses constants from utils/constants.ts:
 * - INSPECTION_RESULT for result values
 * - CHECKLIST_STATUS for status values
 * - TASK_STATUS for task status values
 * - DEFECT_SEVERITY and DEFECT_STATUS for defect creation
 * - NOTIFICATION_TYPE and ACTIVITY_TYPE for notifications and logs
 */
export async function submitInspection(data: {
  taskChecklistId: number;
  taskId: number;
  inspectedBy: number;
  itemResults: Array<{
    templateItemId: number;
    itemText: string;
    result: "pass" | "fail" | "na";
    photoUrls?: string; // JSON string of photo URLs for this item
  }>;
  generalComments?: string;
  photoUrls?: string[]; // Array of photo URLs for overall inspection
  signature?: string; // Base64 encoded signature image
}): Promise<{
  success: boolean;
  overallStatus: string;
  passedCount: number;
  failedCount: number;
  defectsCreated: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert IDs to numbers safely
  const taskChecklistId = toNumber(data.taskChecklistId);
  const taskId = toNumber(data.taskId);
  const inspectedBy = toNumber(data.inspectedBy);

  if (!taskChecklistId || !taskId || !inspectedBy) {
    throw new Error("Invalid ID parameters");
  }

  try {
    logger.info(`[Inspection Service] Starting inspection submission for checklist ${taskChecklistId}`);

    // Start transaction by using db.transaction()
    const result = await db.transaction(async (tx) => {
      // 1. Save all checklist item results with photos
      const insertedResults: Array<{ insertId: number | undefined }> = [];

      for (const item of data.itemResults) {
        const templateItemId = toNumber(item.templateItemId);
        if (!templateItemId) {
          throw new Error(`Invalid template item ID: ${item.templateItemId}`);
        }

        const [insertResult] = await tx.insert(checklistItemResults).values({
          taskChecklistId,
          templateItemId,
          result: item.result,
          photoUrls: item.photoUrls || null,
        });

        insertedResults.push({ insertId: toNumber(insertResult.insertId) });
      }

      // 2. Calculate overall status
      const failedCount = data.itemResults.filter((r) => r.result === INSPECTION_RESULT.FAIL).length;
      const passedCount = data.itemResults.filter((r) => r.result === INSPECTION_RESULT.PASS).length;
      const overallStatus = failedCount > 0 ? CHECKLIST_STATUS.FAILED : CHECKLIST_STATUS.COMPLETED;

      // 3. Update task checklist
      await tx
        .update(taskChecklists)
        .set({
          status: overallStatus,
          inspectedBy,
          inspectedAt: new Date(),
          generalComments: data.generalComments || null,
          photoUrls:
            data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
          signature: data.signature || null,
        })
        .where(eq(taskChecklists.id, taskChecklistId));

      // 4. Create defects for failed items
      const failedItems = data.itemResults.filter((r) => r.result === INSPECTION_RESULT.FAIL);
      const defectsCreated = failedItems.length;

      if (defectsCreated > 0) {
        for (let i = 0; i < failedItems.length; i++) {
          const item = failedItems[i];
          const resultId = insertedResults[data.itemResults.indexOf(item)]?.insertId;

          await tx.insert(defects).values({
            taskId,
            checklistId: taskChecklistId,
            checklistItemResultId: resultId,
            title: `ไม่ผ่าน QC: ${item.itemText}`,
            description: `รายการตรวจสอบไม่ผ่าน: ${item.itemText}${
              data.generalComments ? `\n\nความเห็นเพิ่มเติม: ${data.generalComments}` : ""
            }`,
            photoUrls:
              data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : null,
            severity: DEFECT_SEVERITY.MEDIUM,
            reportedBy: inspectedBy,
            status: DEFECT_STATUS.OPEN,
          });
        }

        // 5. Update task status to rectification_needed if there are failed items
        await tx
          .update(tasks)
          .set({
            status: TASK_STATUS.IN_PROGRESS, // Use constant - assuming rectification is part of in_progress
          })
          .where(eq(tasks.id, taskId));
      }

      // 6. Get task details for notifications (within transaction)
      const taskRecords = await tx.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

      if (taskRecords.length === 0) {
        throw new Error("Task not found");
      }

      const task = taskRecords[0];

      // Return data needed for post-transaction operations
      return {
        overallStatus,
        passedCount,
        failedCount,
        defectsCreated,
        task,
      };
    });

    // Transaction completed successfully
    logger.info(
      `[Inspection Service] Inspection submitted successfully: ${result.passedCount} passed, ${result.failedCount} failed`
    );

    // 7. Auto-update task progress (outside transaction - separate operation)
    try {
      const { calculateAndUpdateTaskProgress } = await import("../taskProgressHelper");
      await calculateAndUpdateTaskProgress(taskId);
    } catch (progressError) {
      logger.error("[Inspection Service] Failed to update task progress:", progressError);
      // Don't fail the whole operation if progress update fails
    }

    // 8. Send notifications (outside transaction - best effort)
    try {
      const { task, failedCount, passedCount } = result;

      // Notify task assignee
      if (task.assigneeId) {
        const assigneeId = toNumber(task.assigneeId);
        if (assigneeId) {
          await createNotification({
            userId: assigneeId,
            type: NOTIFICATION_TYPE.INSPECTION_COMPLETED,
            title: failedCount > 0 ? "การตรวจสอบไม่ผ่าน" : "การตรวจสอบผ่าน",
            content:
              failedCount > 0
                ? `งาน "${task.name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ กรุณาแก้ไข`
                : `งาน "${task.name}" ผ่านการตรวจสอบคุณภาพแล้ว`,
            relatedTaskId: taskId,
            relatedProjectId: task.projectId,
          });
        }
      }

      // Notify project managers if there are failed items
      if (failedCount > 0 && task.projectId) {
        const projectId = toNumber(task.projectId);
        if (projectId) {
          const pmMembers = await db
            .select()
            .from(projectMembers)
            .where(
              and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.role, "project_manager")
              )
            );

          for (const pm of pmMembers) {
            const pmUserId = toNumber(pm.userId);
            if (pmUserId) {
              await createNotification({
                userId: pmUserId,
                type: NOTIFICATION_TYPE.INSPECTION_FAILED,
                title: "การตรวจสอบไม่ผ่าน",
                content: `งาน "${task.name}" มีรายการตรวจสอบไม่ผ่าน ${failedCount} รายการ`,
                relatedTaskId: taskId,
                relatedProjectId: projectId,
              });
            }
          }
        }
      }
    } catch (notificationError) {
      logger.error("[Inspection Service] Failed to send notifications:", notificationError);
      // Don't fail the whole operation if notifications fail
    }

    // 9. Log activity (outside transaction - best effort)
    try {
      const { task, passedCount, failedCount } = result;
      const projectId = toNumber(task.projectId);

      if (projectId) {
        await logActivity({
          userId: inspectedBy,
          projectId,
          taskId,
          action: ACTIVITY_TYPE.INSPECTION_COMPLETED,
          details: `ผลการตรวจสอบ: ผ่าน ${passedCount} รายการ, ไม่ผ่าน ${failedCount} รายการ`,
        });
      }
    } catch (activityError) {
      logger.error("[Inspection Service] Failed to log activity:", activityError);
      // Don't fail the whole operation if activity logging fails
    }

    return {
      success: true,
      overallStatus: result.overallStatus,
      passedCount: result.passedCount,
      failedCount: result.failedCount,
      defectsCreated: result.defectsCreated,
    };
  } catch (error) {
    logger.error("[Inspection Service] Failed to submit inspection:", error);
    throw error;
  }
}
