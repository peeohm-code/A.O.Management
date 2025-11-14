#!/usr/bin/env tsx
/**
 * Auto-Archive Job
 * 
 * Automatically archives projects based on configured rules
 * 
 * Usage:
 *   pnpm tsx server/jobs/autoArchiveJob.ts
 * 
 * Schedule with cron (example - run daily at 2 AM):
 *   0 2 * * * cd /path/to/project && pnpm tsx server/jobs/autoArchiveJob.ts
 */

import { eq, and, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { projects, archiveRules, archiveHistory } from "../../drizzle/schema";

async function runAutoArchive() {
  console.log("[Auto-Archive] Starting auto-archive job...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Auto-Archive] Database not available");
    return;
  }

  try {
    // Get all enabled rules
    const rules = await db
      .select()
      .from(archiveRules)
      .where(eq(archiveRules.enabled, true));

    console.log(`[Auto-Archive] Found ${rules.length} enabled rules`);

    let totalArchived = 0;

    for (const rule of rules) {
      console.log(`[Auto-Archive] Processing rule: ${rule.name}`);
      
      // Build conditions based on rule
      const conditions: any[] = [
        isNull(projects.archivedAt), // Not already archived
      ];

      if (rule.projectStatus) {
        conditions.push(eq(projects.status, rule.projectStatus));
      }

      // Find projects matching this rule
      let matchingProjects: any[] = [];

      if (rule.daysAfterCompletion && rule.projectStatus === "completed") {
        // Archive X days after project was marked as completed
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - rule.daysAfterCompletion);
        
        matchingProjects = await db
          .select()
          .from(projects)
          .where(
            and(
              ...conditions,
              lte(projects.updatedAt, cutoffDate)
            )
          );
      } else if (rule.daysAfterEndDate) {
        // Archive X days after end date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - rule.daysAfterEndDate);
        
        matchingProjects = await db
          .select()
          .from(projects)
          .where(
            and(
              ...conditions,
              lte(projects.endDate, cutoffDate)
            )
          );
      }

      console.log(`[Auto-Archive] Found ${matchingProjects.length} projects matching rule`);

      // Archive each matching project
      for (const project of matchingProjects) {
        try {
          const now = new Date();
          
          // Update project
          await db
            .update(projects)
            .set({
              archivedAt: now,
              archivedBy: rule.createdBy, // Use rule creator as archiver
              archivedReason: `Auto-archived by rule: ${rule.name}`,
            })
            .where(eq(projects.id, project.id));

          // Log history
          await db.insert(archiveHistory).values({
            projectId: project.id,
            action: "archived",
            performedBy: rule.createdBy,
            reason: `Auto-archived by rule: ${rule.name}`,
            ruleId: rule.id,
            performedAt: now,
          });

          console.log(`[Auto-Archive] Archived project: ${project.name} (ID: ${project.id})`);
          totalArchived++;
        } catch (error) {
          console.error(`[Auto-Archive] Failed to archive project ${project.id}:`, error);
        }
      }

      // Update rule lastRunAt
      await db
        .update(archiveRules)
        .set({ lastRunAt: new Date() })
        .where(eq(archiveRules.id, rule.id));
    }

    console.log(`[Auto-Archive] Job completed. Total archived: ${totalArchived}`);
  } catch (error) {
    console.error("[Auto-Archive] Job failed:", error);
    throw error;
  }
}

// Run the job
runAutoArchive()
  .then(() => {
    console.log("[Auto-Archive] Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Auto-Archive] Fatal error:", error);
    process.exit(1);
  });
