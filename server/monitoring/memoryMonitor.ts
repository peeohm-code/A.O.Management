import os from "os";
import fs from "fs";
import { notifyOwner } from "../_core/notification";

export interface MemoryStats {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  usedPercentage: number;
  swapTotal: number;
  swapFree: number;
  swapUsed: number;
  swapPercentage: number;
  timestamp: Date;
}

export interface MemoryThresholds {
  warning: number; // percentage
  critical: number; // percentage
  swapWarning: number; // percentage
}

const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 70,
  critical: 85,
  swapWarning: 50,
};

let lastAlertTime: { [key: string]: number } = {};
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown between alerts

/**
 * Get current memory statistics
 */
export function getMemoryStats(): MemoryStats {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedPercentage = (usedMemory / totalMemory) * 100;

  // Note: Node.js doesn't provide direct swap info, we'll need to read from /proc/meminfo on Linux
  let swapTotal = 0;
  let swapFree = 0;

  try {
    const meminfo = fs.readFileSync("/proc/meminfo", "utf8");
    const swapTotalMatch = meminfo.match(/SwapTotal:\s+(\d+)/);
    const swapFreeMatch = meminfo.match(/SwapFree:\s+(\d+)/);

    if (swapTotalMatch) swapTotal = parseInt(swapTotalMatch[1]) * 1024; // Convert KB to bytes
    if (swapFreeMatch) swapFree = parseInt(swapFreeMatch[1]) * 1024;
  } catch (error) {
    // If we can't read swap info (e.g., not on Linux), just use 0
    console.warn("[MemoryMonitor] Could not read swap info:", error);
  }

  const swapUsed = swapTotal - swapFree;
  const swapPercentage = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;

  return {
    totalMemory,
    freeMemory,
    usedMemory,
    usedPercentage,
    swapTotal,
    swapFree,
    swapUsed,
    swapPercentage,
    timestamp: new Date(),
  };
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if we should send an alert (respecting cooldown)
 */
function shouldSendAlert(alertKey: string): boolean {
  const now = Date.now();
  const lastAlert = lastAlertTime[alertKey] || 0;

  if (now - lastAlert > ALERT_COOLDOWN) {
    lastAlertTime[alertKey] = now;
    return true;
  }

  return false;
}

/**
 * Check memory status and send alerts if thresholds are exceeded
 */
export async function checkMemoryAndAlert(
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): Promise<{
  status: "ok" | "warning" | "critical";
  stats: MemoryStats;
  message?: string;
}> {
  const stats = getMemoryStats();

  // Check memory usage
  if (stats.usedPercentage >= thresholds.critical) {
    if (shouldSendAlert("memory_critical")) {
      const message = `🚨 **Critical Memory Alert**\n\n` +
        `Memory usage: **${stats.usedPercentage.toFixed(1)}%**\n` +
        `Used: ${formatBytes(stats.usedMemory)} / ${formatBytes(stats.totalMemory)}\n` +
        `Free: ${formatBytes(stats.freeMemory)}\n\n` +
        `**Action Required:** System may become unresponsive. Consider restarting services or upgrading resources.`;

      await notifyOwner({
        title: "🚨 Critical Memory Alert",
        content: message,
      });

      return { status: "critical", stats, message };
    }
    return { status: "critical", stats };
  }

  if (stats.usedPercentage >= thresholds.warning) {
    if (shouldSendAlert("memory_warning")) {
      const message = `⚠️ **Memory Warning**\n\n` +
        `Memory usage: **${stats.usedPercentage.toFixed(1)}%**\n` +
        `Used: ${formatBytes(stats.usedMemory)} / ${formatBytes(stats.totalMemory)}\n` +
        `Free: ${formatBytes(stats.freeMemory)}\n\n` +
        `Monitor the situation. Consider optimizing queries or clearing caches.`;

      await notifyOwner({
        title: "⚠️ Memory Warning",
        content: message,
      });

      return { status: "warning", stats, message };
    }
    return { status: "warning", stats };
  }

  // Check swap usage
  if (stats.swapTotal > 0 && stats.swapPercentage >= thresholds.swapWarning) {
    if (shouldSendAlert("swap_warning")) {
      const message = `⚠️ **Swap Usage Alert**\n\n` +
        `Swap usage: **${stats.swapPercentage.toFixed(1)}%**\n` +
        `Used: ${formatBytes(stats.swapUsed)} / ${formatBytes(stats.swapTotal)}\n\n` +
        `High swap usage may indicate memory pressure. Consider investigating memory-intensive processes.`;

      await notifyOwner({
        title: "⚠️ Swap Usage Alert",
        content: message,
      });

      return { status: "warning", stats, message };
    }
    return { status: "warning", stats };
  }

  return { status: "ok", stats };
}

/**
 * Start continuous memory monitoring
 */
export function startMemoryMonitoring(
  intervalMs: number = 60000, // Check every minute by default
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): NodeJS.Timeout {
  console.log("[MemoryMonitor] Starting memory monitoring...");
  console.log(`[MemoryMonitor] Check interval: ${intervalMs}ms`);
  console.log(`[MemoryMonitor] Thresholds:`, thresholds);

  const interval = setInterval(async () => {
    try {
      const result = await checkMemoryAndAlert(thresholds);
      if (result.status !== "ok") {
        console.warn(`[MemoryMonitor] ${result.status.toUpperCase()}:`, {
          usedPercentage: result.stats.usedPercentage.toFixed(1),
          swapPercentage: result.stats.swapPercentage.toFixed(1),
        });
      }
    } catch (error) {
      console.error("[MemoryMonitor] Error during memory check:", error);
    }
  }, intervalMs);

  // Initial check
  checkMemoryAndAlert(thresholds).catch((error) => {
    console.error("[MemoryMonitor] Error during initial memory check:", error);
  });

  return interval;
}

/**
 * Stop memory monitoring
 */
export function stopMemoryMonitoring(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log("[MemoryMonitor] Memory monitoring stopped");
}
