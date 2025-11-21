/**
 * Database Helper Functions
 * Optimized queries to avoid N+1 problems
 */

import { eq, inArray, asc } from "drizzle-orm";
import { getDb } from "./db";
import { tasks } from "../drizzle/schema";

/**
 * Get tasks by multiple project IDs (optimized to avoid N+1 queries)
 * 
 * @param projectIds Array of project IDs
 * @returns Array of tasks
 */
export async function getTasksByProjectIds(projectIds: number[]): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  if (projectIds.length === 0) return [];

  return await db
    .select()
    .from(tasks)
    .where(inArray(tasks.projectId, projectIds))
    .orderBy(asc(tasks.order));
}
