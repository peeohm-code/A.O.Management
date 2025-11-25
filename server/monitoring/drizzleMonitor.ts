import { getDb } from "../db";
import { logQueryMetrics } from "./queryPerformance";

/**
 * Drizzle Query Monitor
 * 
 * Wrapper สำหรับ Drizzle queries เพื่อติดตาม performance
 */

/**
 * Execute monitored query
 * 
 * @example
 * const users = await monitoredQuery(
 *   'getUserById',
 *   async (db) => db.select().from(users).where(eq(users.id, userId))
 * );
 */
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const startTime = performance.now();

  try {
    const result = await queryFn(db);
    const duration = performance.now() - startTime;

    logQueryMetrics(queryName, duration);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logQueryMetrics(queryName, duration);

    throw error;
  }
}

/**
 * Create a monitored version of a repository function
 * 
 * @example
 * export const getProjectById = monitoredRepo(
 *   'getProjectById',
 *   async (db, id: number) => {
 *     return db.select().from(projects).where(eq(projects.id, id)).limit(1);
 *   }
 * );
 */
export function monitoredRepo<TArgs extends any[], TResult>(
  queryName: string,
  repoFn: (
    db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
    ...args: TArgs
  ) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return monitoredQuery(queryName, (db) => repoFn(db, ...args));
  };
}
