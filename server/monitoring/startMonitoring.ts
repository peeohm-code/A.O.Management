import { startMemoryMonitoring, MemoryThresholds } from "./memoryMonitor";

/**
 * Configuration for memory monitoring
 * Adjust these values based on your system requirements
 */
const MONITORING_CONFIG = {
  // Check interval in milliseconds (default: 1 minute)
  intervalMs: 60000,

  // Memory thresholds (percentage)
  thresholds: {
    warning: 70, // Send warning when memory usage exceeds 70%
    critical: 85, // Send critical alert when memory usage exceeds 85%
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
    console.log("[Monitoring] Already running, skipping initialization");
    return;
  }

  console.log("[Monitoring] Initializing system monitoring...");

  // Start memory monitoring
  monitoringInterval = startMemoryMonitoring(
    MONITORING_CONFIG.intervalMs,
    MONITORING_CONFIG.thresholds
  );

  console.log("[Monitoring] System monitoring initialized successfully");
}

/**
 * Stop monitoring (useful for graceful shutdown)
 */
export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log("[Monitoring] System monitoring stopped");
  }
}

/**
 * Graceful shutdown handler
 */
process.on("SIGTERM", () => {
  console.log("[Monitoring] SIGTERM received, stopping monitoring...");
  stopMonitoring();
});

process.on("SIGINT", () => {
  console.log("[Monitoring] SIGINT received, stopping monitoring...");
  stopMonitoring();
});
