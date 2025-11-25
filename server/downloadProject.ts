import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { projects, tasks, defects, taskChecklists, checklistItemResults } from "../drizzle/schema";

/**
 * Generate project data export
 * Returns comprehensive project data for download/backup
 */
export async function generateProjectExport(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get project details
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  
  if (!project) {
    throw new Error("Project not found");
  }

  // Get all tasks
  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));

  // Get all defects
  const projectDefects = await db.select().from(defects).where(eq(tasks.projectId, projectId));

  // Get all checklists (simplified - just get checklist count for now)
  const taskIds = projectTasks.map(t => t.id);
  let checklistCount = 0;
  if (taskIds.length > 0) {
    // Count checklists instead of fetching all data to avoid complex joins
    const checklistCountResult = await db.select().from(taskChecklists).where(
      eq(taskChecklists.taskId, taskIds[0])
    );
    checklistCount = checklistCountResult.length;
  }

  // Compile export data
  const exportData = {
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      archivedAt: project.archivedAt,
      archivedReason: project.archivedReason,
    },
    statistics: {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status === "completed").length,
      totalDefects: projectDefects.length,
      openDefects: projectDefects.filter(d => d.status !== "resolved").length,
    },
    tasks: projectTasks.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      startDate: t.startDate,
      endDate: t.endDate,
      progress: t.progress,
      status: t.status,
      category: t.category,
    })),
    defects: projectDefects.map(d => ({
      id: d.id,
      title: d.title,
      description: d.description,
      severity: d.severity,
      status: d.status,
      reportedAt: d.createdAt,
      resolvedAt: d.resolvedAt,
    })),
    checklistCount: checklistCount,
    exportedAt: new Date().toISOString(),
    exportVersion: "1.0",
  };

  return exportData;
}

/**
 * Generate project summary report in markdown format
 */
export function generateProjectReport(exportData: any): string {
  const { project, statistics, tasks, defects } = exportData;

  let report = `# Project Export Report\n\n`;
  report += `## Project Information\n\n`;
  report += `- **Name:** ${project.name}\n`;
  report += `- **Code:** ${project.code || "N/A"}\n`;
  report += `- **Location:** ${project.location || "N/A"}\n`;
  report += `- **Start Date:** ${project.startDate ? new Date(project.startDate).toLocaleDateString('th-TH') : "N/A"}\n`;
  report += `- **End Date:** ${project.endDate ? new Date(project.endDate).toLocaleDateString('th-TH') : "N/A"}\n`;
  report += `- **Status:** ${project.status}\n\n`;

  if (project.archivedAt) {
    report += `### Archive Information\n\n`;
    report += `- **Archived At:** ${new Date(project.archivedAt).toLocaleDateString('th-TH')}\n`;
    report += `- **Reason:** ${project.archivedReason || "N/A"}\n\n`;
  }

  report += `## Statistics\n\n`;
  report += `- **Total Tasks:** ${statistics.totalTasks}\n`;
  report += `- **Completed Tasks:** ${statistics.completedTasks} (${Math.round((statistics.completedTasks / statistics.totalTasks) * 100)}%)\n`;
  report += `- **Total Defects:** ${statistics.totalDefects}\n`;
  report += `- **Open Defects:** ${statistics.openDefects}\n\n`;

  report += `## Tasks Summary\n\n`;
  if (tasks.length > 0) {
    report += `| Task Name | Status | Progress | Start Date | End Date |\n`;
    report += `|-----------|--------|----------|------------|----------|\n`;
    tasks.forEach((task: any) => {
      report += `| ${task.name} | ${task.status} | ${task.progress}% | ${task.startDate ? new Date(task.startDate).toLocaleDateString('th-TH') : "N/A"} | ${task.endDate ? new Date(task.endDate).toLocaleDateString('th-TH') : "N/A"} |\n`;
    });
  } else {
    report += `No tasks found.\n`;
  }

  report += `\n## Defects Summary\n\n`;
  if (defects.length > 0) {
    report += `| Title | Severity | Status | Reported At | Resolved At |\n`;
    report += `|-------|----------|--------|-------------|-------------|\n`;
    defects.forEach((defect: any) => {
      report += `| ${defect.title} | ${defect.severity} | ${defect.status} | ${new Date(defect.reportedAt).toLocaleDateString('th-TH')} | ${defect.resolvedAt ? new Date(defect.resolvedAt).toLocaleDateString('th-TH') : "N/A"} |\n`;
    });
  } else {
    report += `No defects found.\n`;
  }

  report += `\n---\n\n`;
  report += `*Report generated at: ${new Date(exportData.exportedAt).toLocaleString('th-TH')}*\n`;

  return report;
}
