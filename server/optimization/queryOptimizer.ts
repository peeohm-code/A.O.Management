import { getDb } from "../db";

/**
 * Query Optimization Utilities
 * 
 * This module provides utilities for optimizing database queries:
 * - Pagination helpers
 * - Index recommendations
 * - Query performance tracking
 */

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Calculate pagination offset and limit
 */
export function getPaginationParams(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || 15)); // Max 50 items per page, default 15
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
    limit: pageSize,
  };
}

/**
 * Build paginated result
 */
export function buildPaginatedResult<T>(
  data: T[],
  totalItems: number,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { page, pageSize } = getPaginationParams(options);
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Recommended indexes for the database
 * Run these if not already created
 */
export const RECOMMENDED_INDEXES = [
  // Projects
  "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)",
  "CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(createdBy)",
  "CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(startDate)",
  "CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(endDate)",

  // Tasks
  "CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assigneeId)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(startDate)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(endDate)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(projectId, status)",
  "CREATE INDEX IF NOT EXISTS idx_tasks_project_assignee ON tasks(projectId, assigneeId)",

  // Task Dependencies
  "CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON taskDependencies(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON taskDependencies(dependsOnTaskId)",

  // Task Checklists
  "CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON taskChecklists(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_task_checklists_template_id ON taskChecklists(templateId)",
  "CREATE INDEX IF NOT EXISTS idx_task_checklists_status ON taskChecklists(status)",
  "CREATE INDEX IF NOT EXISTS idx_task_checklists_task_status ON taskChecklists(taskId, status)",

  // Checklist Template Items
  "CREATE INDEX IF NOT EXISTS idx_checklist_items_template_id ON checklistTemplateItems(templateId)",

  // Checklist Item Results
  "CREATE INDEX IF NOT EXISTS idx_checklist_results_checklist_id ON checklistItemResults(checklistId)",
  "CREATE INDEX IF NOT EXISTS idx_checklist_results_item_id ON checklistItemResults(itemId)",

  // Defects
  "CREATE INDEX IF NOT EXISTS idx_defects_task_id ON defects(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_defects_checklist_id ON defects(checklistId)",
  "CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status)",
  "CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity)",
  "CREATE INDEX IF NOT EXISTS idx_defects_reported_by ON defects(reportedBy)",
  "CREATE INDEX IF NOT EXISTS idx_defects_assigned_to ON defects(assignedTo)",

  // Task Comments
  "CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON taskComments(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON taskComments(userId)",
  "CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON taskComments(createdAt)",

  // Task Attachments
  "CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON taskAttachments(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON taskAttachments(uploadedBy)",

  // Notifications
  "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(isRead)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdAt)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(userId, isRead)",

  // Activity Log
  "CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activityLog(userId)",
  "CREATE INDEX IF NOT EXISTS idx_activity_log_task_id ON activityLog(taskId)",
  "CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activityLog(projectId)",
  "CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activityLog(createdAt)",

  // Project Members
  "CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON projectMembers(projectId)",
  "CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON projectMembers(userId)",
];

/**
 * Apply recommended indexes to the database
 */
export async function applyRecommendedIndexes(): Promise<{
  success: boolean;
  applied: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, applied: 0, errors: ["Database not available"] };
  }

  const errors: string[] = [];
  let applied = 0;


  for (const indexSql of RECOMMENDED_INDEXES) {
    try {
      await db.execute(indexSql as any);
      applied++;
    } catch (error: any) {
      // Ignore "already exists" errors
      if (!error.message?.includes("already exists") && !error.message?.includes("Duplicate key")) {
        console.error(`[QueryOptimizer] ✗ Failed: ${indexSql}`, error);
        errors.push(`${indexSql}: ${error.message}`);
      } else {
        applied++;
      }
    }
  }


  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

/**
 * Analyze table sizes and row counts
 */
export async function analyzeTableSizes(): Promise<
  Array<{
    table: string;
    rows: number;
    dataSize: string;
    indexSize: string;
    totalSize: string;
  }>
> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const result = await db.execute(`
      SELECT 
        table_name as tableName,
        table_rows as rows,
        ROUND(data_length / 1024 / 1024, 2) as dataSizeMB,
        ROUND(index_length / 1024 / 1024, 2) as indexSizeMB,
        ROUND((data_length + index_length) / 1024 / 1024, 2) as totalSizeMB
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    ` as any);

    return (result as any).map((row: any) => ({
      table: row.tableName,
      rows: row.rows,
      dataSize: `${row.dataSizeMB} MB`,
      indexSize: `${row.indexSizeMB} MB`,
      totalSize: `${row.totalSizeMB} MB`,
    }));
  } catch (error) {
    console.error("[QueryOptimizer] Error analyzing table sizes:", error);
    return [];
  }
}

/**
 * Get slow queries from query logs
 */
export async function getSlowQueries(limit: number = 20): Promise<
  Array<{
    query: string;
    executionTime: number;
    timestamp: Date;
  }>
> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const result = await db.execute(`
      SELECT query, executionTime, timestamp
      FROM queryLogs
      WHERE executionTime > 1000
      ORDER BY executionTime DESC
      LIMIT ${limit}
    ` as any);

    return result as any;
  } catch (error) {
    console.error("[QueryOptimizer] Error getting slow queries:", error);
    return [];
  }
}
