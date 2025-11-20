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


    let totalArchived = 0;

    for (const rule of rules) {
      
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
              lte(projects.endDate, cutoffDate.toISOString().split('T')[0])
            )
          );
      }


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

  } catch (error) {
    console.error("[Auto-Archive] Job failed:", error);
    throw error;
  }
}

// Run the job
runAutoArchive()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Auto-Archive] Fatal error:", error);
    process.exit(1);
  });
