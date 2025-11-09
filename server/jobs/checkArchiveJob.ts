import { checkArchiveWarnings } from "../archiveNotifications";

/**
 * Scheduled job to check for archive warnings
 * Run this weekly to notify owner about projects ready for deletion
 * 
 * Usage:
 * 1. Manual: node --loader ts-node/esm server/jobs/checkArchiveJob.ts
 * 2. Cron: Add to crontab: 0 9 * * 1 cd /path/to/project && node --loader ts-node/esm server/jobs/checkArchiveJob.ts
 */

async function runArchiveCheck() {
  console.log("[Archive Job] Starting archive warnings check...");
  console.log("[Archive Job] Time:", new Date().toISOString());
  
  try {
    const result = await checkArchiveWarnings();
    
    console.log("[Archive Job] Check completed successfully");
    console.log("[Archive Job] Warnings sent:", result.warningsSent);
    console.log("[Archive Job] Projects checked:", result.projectsChecked);
    console.log("[Archive Job] Projects with warnings:", result.projectsWithWarnings);
    
    if (result.projectsWithWarnings > 0) {
      console.log("[Archive Job] Notification sent to owner");
    } else {
      console.log("[Archive Job] No warnings to send");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("[Archive Job] Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runArchiveCheck();
}

export { runArchiveCheck };
