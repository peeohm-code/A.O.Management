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
import { sendDailySummaryEmails } from "../dailySummaryJob";

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs() {

  // Run deadline reminders daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
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
    try {
      const result = await checkChecklistReminders();
    } catch (error) {
      console.error("[CronScheduler] Checklist reminders failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  // Run overdue task checks daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    try {
      const result = await checkOverdueTasks();
    } catch (error) {
      console.error("[CronScheduler] Overdue task checks failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  // Run daily summary emails at 8:00 AM (user-specific times will be handled by the job)
  cron.schedule("0 8 * * *", async () => {
    try {
      await sendDailySummaryEmails();
    } catch (error) {
      console.error("[CronScheduler] Daily summary emails failed:", error);
    }
  }, {
    timezone: "Asia/Bangkok"
  });

  
  // Optional: Run immediately on startup for testing
  if (process.env.NODE_ENV === "development") {
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
  cron.getTasks().forEach((task) => task.stop());
}
