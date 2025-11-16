import { startMemoryMonitoring, MemoryThresholds, getMemoryStats, formatBytes } from "./memoryMonitor";
import os from 'os';
import { getDb } from '../db';

/**
 * Configuration for memory monitoring
 * Adjust these values based on your system requirements
 */
const MONITORING_CONFIG = {
  // Check interval in milliseconds (default: 1 minute)
  intervalMs: 60000,

  // Memory thresholds (percentage)
  // Adjusted for production use - more conservative thresholds
  thresholds: {
    warning: 70, // Send warning when memory usage exceeds 70%
    critical: 90, // Send critical alert when memory usage exceeds 90%
    swapWarning: 50, // Send warning when swap usage exceeds 50%
  } as MemoryThresholds,
};

let monitoringInterval: NodeJS.Timeout | null = null;

/**
 * Initialize and start memory monitoring
 * Call this function when the server starts
 */
export function initializeMonitoring(): void {
  if (monitoringInterval) {
    return;
  }


  // Start memory monitoring
  monitoringInterval = startMemoryMonitoring(
    MONITORING_CONFIG.intervalMs,
    MONITORING_CONFIG.thresholds
  );

}

/**
 * Stop monitoring (useful for graceful shutdown)
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

/**
 * Graceful shutdown handler
 */
process.on("SIGTERM", () => {
  stopMonitoring();
});

process.on("SIGINT", () => {
  stopMonitoring();
});

/**
 * Get comprehensive system metrics including CPU, memory, and disk
 */
export async function getSystemMetrics() {
  const memStats = getMemoryStats();
  const cpus = os.cpus();
  
  // Calculate CPU usage (average across all cores)
  let totalIdle = 0;
  let totalTick = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  const cpuUsage = 100 - (100 * totalIdle / totalTick);

  return {
    cpu: {
      usage: Math.round(cpuUsage * 100) / 100,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
    },
    memory: {
      total: memStats.totalMemory,
      used: memStats.usedMemory,
      free: memStats.freeMemory,
      usagePercent: memStats.usedPercentage,
      swap: {
        total: memStats.swapTotal,
        used: memStats.swapUsed,
        free: memStats.swapFree,
        usagePercent: memStats.swapPercentage,
      },
    },
    uptime: os.uptime(),
    timestamp: new Date(),
  };
}

/**
 * Get database statistics including table sizes and index information
 */
export async function getDatabaseStats() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Get table sizes
    const tableSizes = await db.execute(`
      SELECT 
        table_name,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
        table_rows
      FROM information_schema.TABLES
      WHERE table_schema = DATABASE()
      ORDER BY (data_length + index_length) DESC
    `);

    // Get index information
    const indexes = await db.execute(`
      SELECT 
        table_name,
        index_name,
        column_name,
        non_unique,
        seq_in_index
      FROM information_schema.STATISTICS
      WHERE table_schema = DATABASE()
      ORDER BY table_name, index_name, seq_in_index
    `);

    // Get connection count
    const connections = await db.execute(`
      SELECT COUNT(*) as count
      FROM information_schema.PROCESSLIST
      WHERE db = DATABASE()
    `);

    return {
      tables: (tableSizes as any).rows || [],
      indexes: (indexes as any).rows || [],
      connections: (connections as any).rows?.[0]?.count || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[Monitoring] Error getting database stats:', error);
    throw error;
  }
}

/**
 * Apply recommended indexes to improve query performance
 */
export async function applyRecommendedIndexes() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const indexQueries = [
    // Projects table indexes
    'CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(createdBy)',
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(startDate)',
    'CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(endDate)',
    
    // Tasks table indexes
    'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(projectId)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assigneeId)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(startDate)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(endDate)',
    'CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)',
    
    // Task dependencies indexes
    'CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON taskDependencies(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON taskDependencies(dependsOnTaskId)',
    
    // Task checklists indexes
    'CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON taskChecklists(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_task_checklists_template_id ON taskChecklists(templateId)',
    'CREATE INDEX IF NOT EXISTS idx_task_checklists_status ON taskChecklists(status)',
    
    // Checklist results indexes
    'CREATE INDEX IF NOT EXISTS idx_checklist_results_checklist_id ON checklistResults(checklistId)',
    'CREATE INDEX IF NOT EXISTS idx_checklist_results_inspector_id ON checklistResults(inspectorId)',
    'CREATE INDEX IF NOT EXISTS idx_checklist_results_date ON checklistResults(inspectionDate)',
    
    // Defects indexes
    'CREATE INDEX IF NOT EXISTS idx_defects_task_id ON defects(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status)',
    'CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity)',
    
    // Comments indexes
    'CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON taskComments(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON taskComments(userId)',
    
    // Attachments indexes
    'CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON taskAttachments(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON taskAttachments(uploadedBy)',
    
    // Notifications indexes
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(isRead)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(createdAt)',
    
    // Activity log indexes
    'CREATE INDEX IF NOT EXISTS idx_activity_log_task_id ON activityLog(taskId)',
    'CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activityLog(userId)',
    'CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activityLog(timestamp)',
  ];

  const results = [];
  for (const query of indexQueries) {
    try {
      await db.execute(query);
      results.push({ query, success: true });
    } catch (error) {
      console.error(`[Monitoring] Error applying index: ${query}`, error);
      results.push({ query, success: false, error: String(error) });
    }
  }

  return {
    total: indexQueries.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    details: results,
  };
}

/**
 * Export thresholds for configuration
 */
export { MONITORING_CONFIG };
