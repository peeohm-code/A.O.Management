import { eq, desc, and, inArray, sql } from "drizzle-orm";
import {
  taskChecklists,
  checklistItemResults,
  checklistTemplates,
  checklistTemplateItems,
  tasks,
  projects,
  users,
  signatures,
} from "../../drizzle/schema";
import { BaseRepository } from "./base.repository";
import { bigIntToNumber } from "../utils/bigint";

/**
 * Inspection Repository
 * 
 * Handles all inspection-related database operations including:
 * - Task checklists (inspections)
 * - Checklist item results
 * - Reinspections
 * - Signatures
 * - Inspection requests
 */
export class InspectionRepository extends BaseRepository {
  /**
   * Create task checklist (inspection)
   */
  async createTaskChecklist(data: {
    taskId: number;
    templateId: number;
    stage: "pre_execution" | "in_progress" | "post_execution";
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Create the task checklist
    const result = await this.db.insert(taskChecklists).values({
      taskId: data.taskId,
      templateId: data.templateId,
      stage: data.stage,
      status: "not_started",
    });

    const checklistId = result[0].insertId;

    // Get all template items
    const templateItems = await this.db
      .select()
      .from(checklistTemplateItems)
      .where(eq(checklistTemplateItems.templateId, data.templateId))
      .orderBy(checklistTemplateItems.order);

    // Create checklist item results for each template item
    if (templateItems.length > 0) {
      const itemResults = templateItems.map((item) => ({
        taskChecklistId: checklistId,
        templateItemId: item.id,
        result: "na" as const,
        photoUrls: null,
      }));

      await this.db.insert(checklistItemResults).values(itemResults);
    }

    return { insertId: checklistId };
  }

  /**
   * Get task checklists by task ID
   */
  async getTaskChecklistsByTask(taskId: number) {
    if (!this.db) return [];

    const checklists = await this.db
      .select({
        id: taskChecklists.id,
        taskId: taskChecklists.taskId,
        templateId: taskChecklists.templateId,
        stage: taskChecklists.stage,
        status: taskChecklists.status,
        templateName: checklistTemplates.name,
        allowGeneralComments: checklistTemplates.allowGeneralComments,
        allowPhotos: checklistTemplates.allowPhotos,
        taskName: tasks.name,
        projectName: projects.name,
      })
      .from(taskChecklists)
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(taskChecklists.taskId, taskId));

    // Get items for each checklist
    const result: any[] = [];
    for (const checklist of checklists) {
      const items = await this.db
        .select()
        .from(checklistTemplateItems)
        .where(eq(checklistTemplateItems.templateId, checklist.templateId));
      result.push({ ...checklist, items });
    }

    return result;
  }

  /**
   * Get task checklists by template ID
   */
  async getTaskChecklistsByTemplateId(templateId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.templateId, templateId));
  }

  /**
   * Get task checklists by project ID
   */
  async getTaskChecklistsByProject(projectId: number) {
    if (!this.db) return [];

    const checklists = await this.db
      .select({
        id: taskChecklists.id,
        taskId: taskChecklists.taskId,
        templateId: taskChecklists.templateId,
        stage: taskChecklists.stage,
        status: taskChecklists.status,
        inspectedBy: taskChecklists.inspectedBy,
        inspectedAt: taskChecklists.inspectedAt,
        generalComments: taskChecklists.generalComments,
        photoUrls: taskChecklists.photoUrls,
        signature: taskChecklists.signature,
        createdAt: taskChecklists.createdAt,
        updatedAt: taskChecklists.updatedAt,
        projectId: tasks.projectId,
        taskName: tasks.name,
        templateName: checklistTemplates.name,
        allowGeneralComments: checklistTemplates.allowGeneralComments,
        allowPhotos: checklistTemplates.allowPhotos,
      })
      .from(taskChecklists)
      .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .where(eq(tasks.projectId, projectId));

    // Get items for each checklist
    const result: any[] = [];
    for (const checklist of checklists) {
      const items = await this.db
        .select()
        .from(checklistTemplateItems)
        .where(eq(checklistTemplateItems.templateId, checklist.templateId));
      result.push({ ...checklist, items });
    }

    return result;
  }

  /**
   * Get task checklist by ID
   */
  async getTaskChecklistById(id: number) {
    if (!this.db) return undefined;

    const result = await this.db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  /**
   * Get all task checklists
   */
  async getAllTaskChecklists() {
    if (!this.db) return [];

    const result = await this.db
      .select({
        id: taskChecklists.id,
        taskId: taskChecklists.taskId,
        templateId: taskChecklists.templateId,
        stage: taskChecklists.stage,
        status: taskChecklists.status,
        inspectedBy: taskChecklists.inspectedBy,
        inspectedAt: taskChecklists.inspectedAt,
        generalComments: taskChecklists.generalComments,
        photoUrls: taskChecklists.photoUrls,
        signature: taskChecklists.signature,
        createdAt: taskChecklists.createdAt,
        updatedAt: taskChecklists.updatedAt,
        taskName: tasks.name,
        templateName: checklistTemplates.name,
        projectId: tasks.projectId,
        projectName: projects.name,
        inspectorName: users.name,
      })
      .from(taskChecklists)
      .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
      .orderBy(desc(taskChecklists.createdAt));

    return result;
  }

  /**
   * Update task checklist
   */
  async updateTaskChecklist(
    id: number,
    data: Partial<{
      status: "not_started" | "pending_inspection" | "in_progress" | "completed" | "failed";
      inspectedBy: number;
      inspectedAt: Date;
      generalComments: string;
      photoUrls: string;
      signature: string;
      notificationSent: boolean;
      notifiedAt: Date;
    }>
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.inspectedBy !== undefined) updateData.inspectedBy = data.inspectedBy;
    if (data.inspectedAt !== undefined) updateData.inspectedAt = data.inspectedAt;
    if (data.generalComments !== undefined) updateData.generalComments = data.generalComments;
    if (data.photoUrls !== undefined) updateData.photoUrls = data.photoUrls;
    if (data.signature !== undefined) updateData.signature = data.signature;
    if (data.notificationSent !== undefined) updateData.notificationSent = data.notificationSent;
    if (data.notifiedAt !== undefined) updateData.notifiedAt = data.notifiedAt;

    return await this.db.update(taskChecklists).set(updateData).where(eq(taskChecklists.id, id));
  }

  /**
   * Update task checklist status
   */
  async updateTaskChecklistStatus(
    id: number,
    status: "not_started" | "pending_inspection" | "in_progress" | "completed" | "failed"
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.update(taskChecklists).set({ status }).where(eq(taskChecklists.id, id));
  }

  /**
   * Delete task checklist
   */
  async deleteTaskChecklist(id: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // First delete related checklist item results
    await this.db.delete(checklistItemResults).where(eq(checklistItemResults.taskChecklistId, id));
    
    // Then delete the task checklist
    return await this.db.delete(taskChecklists).where(eq(taskChecklists.id, id));
  }

  /**
   * Add checklist item result
   */
  async addChecklistItemResult(data: {
    taskChecklistId: number;
    templateItemId: number;
    result: "pass" | "fail" | "na";
    photoUrls?: string;
  }) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db.insert(checklistItemResults).values({
      taskChecklistId: data.taskChecklistId,
      templateItemId: data.templateItemId,
      result: data.result,
      photoUrls: data.photoUrls,
    });
  }

  /**
   * Get checklist item results
   */
  async getChecklistItemResults(taskChecklistId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(checklistItemResults)
      .where(eq(checklistItemResults.taskChecklistId, taskChecklistId));
  }

  /**
   * Update checklist item result
   */
  async updateChecklistItemResult(
    id: number,
    data: {
      result?: "pass" | "fail" | "na";
      photoUrls?: string;
      comments?: string;
    }
  ) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    return await this.db
      .update(checklistItemResults)
      .set({
        result: data.result,
        photoUrls: data.photoUrls,
        comments: data.comments,
        updatedAt: new Date(),
      })
      .where(eq(checklistItemResults.id, id));
  }

  /**
   * Get checklist item result by ID
   */
  async getChecklistItemResultById(id: number) {
    if (!this.db) return null;

    const results = await this.db
      .select()
      .from(checklistItemResults)
      .where(eq(checklistItemResults.id, id))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get signatures by checklist ID
   * Note: Signature functionality is stored in taskChecklists.signature field
   */
  async getChecklistSignature(checklistId: number) {
    if (!this.db) return null;

    const result = await this.db
      .select({
        id: taskChecklists.id,
        signature: taskChecklists.signature,
        inspectedBy: taskChecklists.inspectedBy,
        inspectedAt: taskChecklists.inspectedAt,
      })
      .from(taskChecklists)
      .where(eq(taskChecklists.id, checklistId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create reinspection (duplicate checklist)
   * Note: Reinspection tracking is done by creating a new checklist for the same task
   */
  async createReinspection(originalChecklistId: number) {
    this.ensureDatabaseAvailable();
    if (!this.db) throw new Error("Database not available");

    // Get original checklist
    const original = await this.getTaskChecklistById(originalChecklistId);
    if (!original) throw new Error("Original checklist not found");

    // Create new checklist
    const [newChecklist] = await this.db.insert(taskChecklists).values({
      taskId: original.taskId,
      templateId: original.templateId,
      stage: original.stage,
      status: "not_started",
    });

    const newChecklistId = bigIntToNumber(newChecklist.insertId);

    // Copy checklist items
    const originalItems = await this.getChecklistItemResults(originalChecklistId);
    if (originalItems.length > 0) {
      const newItems = originalItems.map((item: any) => ({
        taskChecklistId: newChecklistId,
        templateItemId: item.templateItemId,
        result: "na" as const,
        photoUrls: null,
      }));

      await this.db.insert(checklistItemResults).values(newItems);
    }

    return { insertId: newChecklistId };
  }

  /**
   * Get inspection history by task
   */
  async getInspectionHistoryByTask(taskId: number) {
    if (!this.db) return [];

    return await this.db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.taskId, taskId))
      .orderBy(desc(taskChecklists.createdAt));
  }

  /**
   * Get inspection detail with all related data
   */
  async getInspectionDetail(inspectionId: number) {
    if (!this.db) return null;

    const inspection = await this.db
      .select({
        id: taskChecklists.id,
        taskId: taskChecklists.taskId,
        templateId: taskChecklists.templateId,
        stage: taskChecklists.stage,
        status: taskChecklists.status,
        inspectedBy: taskChecklists.inspectedBy,
        inspectedAt: taskChecklists.inspectedAt,
        generalComments: taskChecklists.generalComments,
        photoUrls: taskChecklists.photoUrls,
        signature: taskChecklists.signature,
        createdAt: taskChecklists.createdAt,
        updatedAt: taskChecklists.updatedAt,
        taskName: tasks.name,
        templateName: checklistTemplates.name,
        projectId: tasks.projectId,
        projectName: projects.name,
        inspectorName: users.name,
      })
      .from(taskChecklists)
      .leftJoin(tasks, eq(taskChecklists.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(checklistTemplates, eq(taskChecklists.templateId, checklistTemplates.id))
      .leftJoin(users, eq(taskChecklists.inspectedBy, users.id))
      .where(eq(taskChecklists.id, inspectionId))
      .limit(1);

    if (inspection.length === 0) return null;

    // Get checklist items with results
    const items = await this.db
      .select({
        id: checklistItemResults.id,
        templateItemId: checklistItemResults.templateItemId,
        result: checklistItemResults.result,
        photoUrls: checklistItemResults.photoUrls,
        comments: checklistItemResults.comments,
        itemDescription: checklistTemplateItems.itemText,
        itemOrder: checklistTemplateItems.order,
      })
      .from(checklistItemResults)
      .leftJoin(checklistTemplateItems, eq(checklistItemResults.templateItemId, checklistTemplateItems.id))
      .where(eq(checklistItemResults.taskChecklistId, inspectionId))
      .orderBy(checklistTemplateItems.order);

    // Get signature
    const sig = await this.getChecklistSignature(inspectionId);

    return {
      ...inspection[0],
      items,
      signature: sig,
    };
  }

  /**
   * Get inspection summary by task
   */
  async getInspectionSummaryByTask(taskId: number) {
    if (!this.db) return null;

    const checklists = await this.getTaskChecklistsByTask(taskId);

    const summary = {
      total: checklists.length,
      completed: 0,
      failed: 0,
      inProgress: 0,
      notStarted: 0,
    };

    checklists.forEach((checklist: any) => {
      switch (checklist.status) {
        case "completed":
          summary.completed++;
          break;
        case "failed":
          summary.failed++;
          break;
        case "in_progress":
        case "pending_inspection":
          summary.inProgress++;
          break;
        case "not_started":
          summary.notStarted++;
          break;
      }
    });

    return summary;
  }
}
