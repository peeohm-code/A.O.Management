/**
 * Cron Job Scheduler
 * 
 * Sets up scheduled tasks for the application:
 * - Deadline reminders (daily at 8:00 AM)
 * - Archive checks (daily at 2:00 AM)
 */

import cron from "node-cron";
import { runDeadlineReminders } from "./deadlineReminders";
import { checkChecklistReminders } from "../jobs/checklistReminderJob";
import { checkOverdueTasks } from "../jobs/taskOverdueJob";

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

  // Run checklist reminders daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CronScheduler] Running checklist reminders...");
    try {
      const result = await checkChecklistReminders();
      console.log("[CronScheduler] Checklist reminders result:", result);
    } catch (error) {
      console.error("[CronScheduler] Checklist reminders failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  // Run overdue task checks daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("[CronScheduler] Running overdue task checks...");
    try {
      const result = await checkOverdueTasks();
      console.log("[CronScheduler] Overdue task checks result:", result);
    } catch (error) {
      console.error("[CronScheduler] Overdue task checks failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  console.log("[CronScheduler] Cron jobs initialized:");
  console.log("  - Deadline reminders: Daily at 8:00 AM (Asia/Bangkok)");
  console.log("  - Checklist reminders: Daily at 8:00 AM (Asia/Bangkok)");
  console.log("  - Overdue task checks: Daily at 8:00 AM (Asia/Bangkok)");
  
  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === "development") {
    console.log("[CronScheduler] Development mode: Running all jobs immediately...");
    runDeadlineReminders().catch((error) => {
      console.error("[CronScheduler] Initial deadline reminders failed:", error);
    });
    checkChecklistReminders().catch((error) => {
      console.error("[CronScheduler] Initial checklist reminders failed:", error);
    });
    checkOverdueTasks().catch((error) => {
      console.error("[CronScheduler] Initial overdue task checks failed:", error);
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
