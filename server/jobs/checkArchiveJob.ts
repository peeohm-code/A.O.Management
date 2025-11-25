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
  
  try {
    const result = await checkArchiveWarnings();
    
    
    if (result.notified > 0) {
    } else {
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
