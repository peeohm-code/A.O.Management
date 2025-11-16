import { z } from "zod";
import { protectedProcedure, router, roleBasedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Database Router - Database Management and Optimization
 */
export const databaseRouter = router({
  /**
   * Get list of all indexes in the database
   */
  listIndexes: roleBasedProcedure('system', 'view').query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      });
    }

    try {
      // Query to get all indexes from information_schema
      const result = await db.execute(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          SEQ_IN_INDEX,
          INDEX_TYPE
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
      `);

      return result;
    } catch (error) {
      console.error('[Database] Failed to list indexes:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve database indexes',
      });
    }
  }),

  /**
   * Apply recommended indexes to database tables
   * This will create missing indexes based on the schema definition
   */
  applyIndexes: roleBasedProcedure('system', 'edit').mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      });
    }

    const results: { table: string; index: string; status: 'created' | 'exists' | 'error'; error?: string }[] = [];

    try {
      // Define indexes to be created (based on schema.ts)
      const indexDefinitions = [
        // Projects table
        { table: 'projects', name: 'createdByIdx', columns: ['createdBy'] },
        { table: 'projects', name: 'archivedAtIdx', columns: ['archivedAt'] },
        
        // Project members table
        { table: 'projectMembers', name: 'projectUserIdx', columns: ['projectId', 'userId'] },
        
        // Tasks table
        { table: 'tasks', name: 'projectIdx', columns: ['projectId'] },
        { table: 'tasks', name: 'assigneeIdx', columns: ['assigneeId'] },
        { table: 'tasks', name: 'parentIdx', columns: ['parentTaskId'] },
        { table: 'tasks', name: 'statusIdx', columns: ['status'] },
        { table: 'tasks', name: 'categoryIdx', columns: ['category'] },
        { table: 'tasks', name: 'startDateIdx', columns: ['startDate'] },
        { table: 'tasks', name: 'endDateIdx', columns: ['endDate'] },
        
        // Task dependencies table
        { table: 'taskDependencies', name: 'taskIdx', columns: ['taskId'] },
        { table: 'taskDependencies', name: 'dependsOnIdx', columns: ['dependsOnTaskId'] },
        
        // Checklist templates table
        { table: 'checklistTemplates', name: 'categoryIdx', columns: ['category'] },
        { table: 'checklistTemplates', name: 'stageIdx', columns: ['stage'] },
        
        // Checklist template items table
        { table: 'checklistTemplateItems', name: 'templateIdx', columns: ['templateId'] },
        
        // Task checklists table
        { table: 'taskChecklists', name: 'taskIdx', columns: ['taskId'] },
        { table: 'taskChecklists', name: 'templateIdx', columns: ['templateId'] },
        
        // Checklist item results table
        { table: 'checklistItemResults', name: 'checklistIdx', columns: ['taskChecklistId'] },
        
        // Defects table
        { table: 'defects', name: 'taskIdx', columns: ['taskId'] },
        { table: 'defects', name: 'assignedToIdx', columns: ['assignedTo'] },
        { table: 'defects', name: 'statusIdx', columns: ['status'] },
        
        // Task comments table
        { table: 'taskComments', name: 'taskIdx', columns: ['taskId'] },
        { table: 'taskComments', name: 'userIdx', columns: ['userId'] },
        
        // Task attachments table
        { table: 'taskAttachments', name: 'taskIdx', columns: ['taskId'] },
        { table: 'taskAttachments', name: 'uploadedByIdx', columns: ['uploadedBy'] },
        
        // Notifications table
        { table: 'notifications', name: 'userIdx', columns: ['userId'] },
        { table: 'notifications', name: 'readIdx', columns: ['isRead'] },
        { table: 'notifications', name: 'createdAtIdx', columns: ['createdAt'] },
        
        // Activity logs table
        { table: 'activityLogs', name: 'userIdx', columns: ['userId'] },
        { table: 'activityLogs', name: 'projectIdx', columns: ['projectId'] },
        { table: 'activityLogs', name: 'taskIdx', columns: ['taskId'] },
        { table: 'activityLogs', name: 'createdAtIdx', columns: ['createdAt'] },
        
        // Task followers table
        { table: 'taskFollowers', name: 'taskUserIdx', columns: ['taskId', 'userId'] },
      ];

      // Check and create each index
      for (const indexDef of indexDefinitions) {
        try {
          // Check if index exists
          const checkResult: any = await db.execute(`
            SELECT COUNT(*) as count
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = '${indexDef.table}'
              AND INDEX_NAME = '${indexDef.name}'
          `);

          const indexExists = checkResult[0]?.count > 0;

          if (indexExists) {
            results.push({
              table: indexDef.table,
              index: indexDef.name,
              status: 'exists',
            });
          } else {
            // Create index
            const columnList = indexDef.columns.join(', ');
            await db.execute(`
              CREATE INDEX ${indexDef.name} ON ${indexDef.table} (${columnList})
            `);

            results.push({
              table: indexDef.table,
              index: indexDef.name,
              status: 'created',
            });
          }
        } catch (error: any) {
          results.push({
            table: indexDef.table,
            index: indexDef.name,
            status: 'error',
            error: error.message,
          });
        }
      }

      return {
        success: true,
        results,
        summary: {
          total: results.length,
          created: results.filter(r => r.status === 'created').length,
          exists: results.filter(r => r.status === 'exists').length,
          errors: results.filter(r => r.status === 'error').length,
        },
      };
    } catch (error) {
      console.error('[Database] Failed to apply indexes:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to apply database indexes',
      });
    }
  }),

  /**
   * Get database statistics
   */
  getStats: roleBasedProcedure('system', 'view').query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database connection not available',
      });
    }

    try {
      // Get table sizes
      const tableSizes: any = await db.execute(`
        SELECT 
          TABLE_NAME,
          ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb,
          TABLE_ROWS
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      `);

      // Get total database size
      const dbSize: any = await db.execute(`
        SELECT 
          ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_size_mb
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
      `);

      return {
        tables: tableSizes,
        totalSize: dbSize[0]?.total_size_mb || 0,
      };
    } catch (error) {
      console.error('[Database] Failed to get database stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve database statistics',
      });
    }
  }),
});
