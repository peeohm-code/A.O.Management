import { logger } from "../logger";

/**
 * Query Performance Monitoring
 * 
 * ติดตาม และวิเคราะห์ performance ของ database queries
 * เพื่อระบุ slow queries และวัดผลการปรับปรุงจาก indexes
 */

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
  stackTrace?: string;
}

export interface QueryStats {
  totalQueries: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  slowQueries: QueryMetrics[];
}

// Store query metrics in memory (in production, use Redis or database)
const queryMetrics: QueryMetrics[] = [];
const SLOW_QUERY_THRESHOLD_MS = 100; // queries > 100ms are considered slow
const MAX_METRICS_STORED = 1000; // keep last 1000 queries

/**
 * Log query execution time
 */
export function logQueryMetrics(
  query: string,
  duration: number,
  params?: any[]
): void {
  const metrics: QueryMetrics = {
    query: normalizeQuery(query),
    duration,
    timestamp: new Date(),
    params,
  };

  // Add to metrics array
  queryMetrics.push(metrics);

  // Keep only last N metrics
  if (queryMetrics.length > MAX_METRICS_STORED) {
    queryMetrics.shift();
  }

  // Log slow queries
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn(`[SLOW QUERY] ${duration}ms: ${metrics.query}`, 'QueryPerformance', {
      duration,
      params,
      threshold: SLOW_QUERY_THRESHOLD_MS,
    });
  }
}

/**
 * Normalize query string for grouping
 * Replace parameter values with placeholders
 */
function normalizeQuery(query: string): string {
  return query
    .replace(/\s+/g, " ") // normalize whitespace
    .replace(/=\s*\?/g, "= ?") // normalize parameter placeholders
    .replace(/=\s*\d+/g, "= ?") // replace numbers with placeholders
    .replace(/=\s*'[^']*'/g, "= ?") // replace strings with placeholders
    .trim();
}

/**
 * Get query statistics
 */
export function getQueryStats(): QueryStats {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      slowQueries: [],
    };
  }

  const durations = queryMetrics.map((m) => m.duration);
  const totalDuration = durations.reduce((sum, d) => sum + d, 0);

  return {
    totalQueries: queryMetrics.length,
    avgDuration: totalDuration / queryMetrics.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    slowQueries: queryMetrics
      .filter((m) => m.duration > SLOW_QUERY_THRESHOLD_MS)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20), // top 20 slowest queries
  };
}

/**
 * Get slow queries grouped by query pattern
 */
export function getSlowQueriesByPattern(): Record<
  string,
  {
    count: number;
    avgDuration: number;
    maxDuration: number;
    examples: QueryMetrics[];
  }
> {
  const slowQueries = queryMetrics.filter(
    (m) => m.duration > SLOW_QUERY_THRESHOLD_MS
  );

  const grouped: Record<string, QueryMetrics[]> = {};

  for (const metric of slowQueries) {
    const pattern = metric.query;
    if (!grouped[pattern]) {
      grouped[pattern] = [];
    }
    grouped[pattern].push(metric);
  }

  const result: Record<
    string,
    {
      count: number;
      avgDuration: number;
      maxDuration: number;
      examples: QueryMetrics[];
    }
  > = {};

  for (const [pattern, metrics] of Object.entries(grouped)) {
    const durations = metrics.map((m) => m.duration);
    result[pattern] = {
      count: metrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      maxDuration: Math.max(...durations),
      examples: metrics.slice(0, 3), // first 3 examples
    };
  }

  return result;
}

/**
 * Clear query metrics
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

/**
 * Wrapper function to measure query execution time
 * 
 * @example
 * const result = await measureQuery(
 *   'SELECT * FROM users WHERE id = ?',
 *   async () => db.select().from(users).where(eq(users.id, userId)),
 *   [userId]
 * );
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  params?: any[]
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    logQueryMetrics(queryName, duration, params);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logQueryMetrics(queryName, duration, params);

    throw error;
  }
}

/**
 * Get query performance report
 */
export function getPerformanceReport(): {
  summary: QueryStats;
  slowQueriesByPattern: ReturnType<typeof getSlowQueriesByPattern>;
  recommendations: string[];
} {
  const summary = getQueryStats();
  const slowQueriesByPattern = getSlowQueriesByPattern();

  const recommendations: string[] = [];

  // Generate recommendations based on patterns
  for (const [pattern, stats] of Object.entries(slowQueriesByPattern)) {
    if (stats.count > 10 && stats.avgDuration > 200) {
      recommendations.push(
        `Query pattern appears ${stats.count} times with avg ${stats.avgDuration.toFixed(2)}ms - consider adding index: ${pattern.substring(0, 100)}...`
      );
    }
  }

  if (summary.slowQueries.length > summary.totalQueries * 0.1) {
    recommendations.push(
      `${((summary.slowQueries.length / summary.totalQueries) * 100).toFixed(1)}% of queries are slow (>${SLOW_QUERY_THRESHOLD_MS}ms) - review database indexes`
    );
  }

  return {
    summary,
    slowQueriesByPattern,
    recommendations,
  };
}
