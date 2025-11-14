/**
 * Cron Job Scheduler
 * 
 * Sets up scheduled tasks for the application:
 * - Deadline reminders (daily at 8:00 AM)
 * - Archive checks (daily at 2:00 AM)
 */

import cron from "node-cron";
import { runDeadlineReminders } from "./deadlineReminders";

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {
  console.log("[CronScheduler] Initializing cron jobs...");

  // Run deadline reminders daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CronScheduler] Running deadline reminders...");
    try {
      await runDeadlineReminders();
    } catch (error) {
      console.error("[CronScheduler] Deadline reminders failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  console.log("[CronScheduler] Cron jobs initialized:");
  console.log("  - Deadline reminders: Daily at 8:00 AM (Asia/Bangkok)");
  
  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === "development") {
    console.log("[CronScheduler] Development mode: Running deadline reminders immediately...");
    runDeadlineReminders().catch((error) => {
      console.error("[CronScheduler] Initial deadline reminders failed:", error);
    });
  }
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs() {
  console.log("[CronScheduler] Stopping all cron jobs...");
  cron.getTasks().forEach((task) => task.stop());
  console.log("[CronScheduler] All cron jobs stopped");
}
