import { getDb } from "./db";
import os from "os";
import process from "process";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  database: {
    connected: boolean;
    responseTime?: number;
  };
  fileDescriptors: {
    used: number;
    limit: number;
    percentage: number;
  };
  warnings: string[];
}

/**
 * Get current file descriptor usage (Linux only)
 */
function getFileDescriptorUsage(): { used: number; limit: number } {
  try {
    const fs = require("fs");
    const fdDir = `/proc/${process.pid}/fd`;
    const used = fs.readdirSync(fdDir).length;
    
    // Get soft limit for open files
    const { exec } = require("child_process");
    let limit = 1024; // default
    
    try {
      const result = require("child_process").execSync("ulimit -n").toString().trim();
      limit = parseInt(result, 10) || 1024;
    } catch (e) {
      // Fallback to default
    }
    
    return { used, limit };
  } catch (error) {
    return { used: 0, limit: 1024 };
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ connected: boolean; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return { connected: false };
    }
    
    // Simple query to test connection
    await db.execute("SELECT 1");
    const responseTime = Date.now() - startTime;
    
    return { connected: true, responseTime };
  } catch (error) {
    console.error("[Health] Database check failed:", error);
    return { connected: false };
  }
}

/**
 * Get system health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercentage = (usedMem / totalMem) * 100;
  
  const cpuUsage = process.cpuUsage();
  const loadAvg = os.loadavg();
  
  const fdUsage = getFileDescriptorUsage();
  const fdPercentage = (fdUsage.used / fdUsage.limit) * 100;
  
  const dbStatus = await checkDatabase();
  
  const warnings: string[] = [];
  
  // Check for warning conditions
  if (memPercentage > 80) {
    warnings.push(`High memory usage: ${memPercentage.toFixed(1)}%`);
  }
  
  if (fdPercentage > 70) {
    warnings.push(`High file descriptor usage: ${fdPercentage.toFixed(1)}%`);
  }
  
  if (!dbStatus.connected) {
    warnings.push("Database connection failed");
  } else if (dbStatus.responseTime && dbStatus.responseTime > 1000) {
    warnings.push(`Slow database response: ${dbStatus.responseTime}ms`);
  }
  
  if (loadAvg[0] > os.cpus().length * 0.8) {
    warnings.push(`High CPU load: ${loadAvg[0].toFixed(2)}`);
  }
  
  // Determine overall status
  let status: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (warnings.length > 0) {
    status = "degraded";
  }
  if (!dbStatus.connected || memPercentage > 90 || fdPercentage > 90) {
    status = "unhealthy";
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: memPercentage,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    },
    cpu: {
      usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      loadAverage: loadAvg,
    },
    database: dbStatus,
    fileDescriptors: {
      used: fdUsage.used,
      limit: fdUsage.limit,
      percentage: fdPercentage,
    },
    warnings,
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
