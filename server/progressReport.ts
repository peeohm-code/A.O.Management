import PDFDocument from 'pdfkit';
import * as db from './db';

interface ProgressReportOptions {
  projectId?: number;
  startDate: string;
  endDate: string;
  reportType: 'daily' | 'weekly';
}

interface ProjectProgressData {
  project: any;
  tasks: any[];
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  plannedProgress: number;
  status: 'ahead' | 'on_track' | 'behind';
  inspections: any[];
  defects: any[];
}

/**
 * Calculate planned progress based on project timeline
 */
function calculatePlannedProgress(startDate: string | null, endDate: string | null, reportDate: Date): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  // If project hasn't started yet
  if (reportDate < start) return 0;

  // If project is past end date
  if (reportDate > end) return 100;

  // Calculate expected progress based on time elapsed
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = reportDate.getTime() - start.getTime();
  const plannedProgress = (elapsed / totalDuration) * 100;

  return Math.min(Math.round(plannedProgress), 100);
}

/**
 * Generate Progress Report PDF
 */
export async function generateProgressReport(options: ProgressReportOptions): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 50
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const reportDate = new Date(options.endDate);
      const reportTitle = options.reportType === 'daily' 
        ? `Daily Progress Report - ${new Date(options.startDate).toLocaleDateString('th-TH')}`
        : `Weekly Progress Report - ${new Date(options.startDate).toLocaleDateString('th-TH')} to ${new Date(options.endDate).toLocaleDateString('th-TH')}`;

      // Get data
      let projects: any[] = [];
      if (options.projectId) {
        const project = await db.getProjectById(options.projectId);
        if (project) projects = [project];
      } else {
        projects = await db.getAllProjects();
      }

      // Filter active projects only
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');

      // Collect progress data for each project
      const progressData: ProjectProgressData[] = [];
      
      for (const project of activeProjects) {
        const tasks = await db.getTasksByProject(project.id);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const plannedProgress = calculatePlannedProgress(project.startDate, project.endDate, reportDate);
        
        let status: 'ahead' | 'on_track' | 'behind' = 'on_track';
        const difference = progressPercentage - plannedProgress;
        if (difference > 5) status = 'ahead';
        else if (difference < -5) status = 'behind';

        // Get inspections in date range
        const allChecklists = await db.getAllTaskChecklists();
        const projectChecklists = allChecklists.filter((c: any) => {
          if (!c.inspectedAt) return false;
          const inspectedDate = new Date(c.inspectedAt);
          return inspectedDate >= new Date(options.startDate) && 
                 inspectedDate <= new Date(options.endDate);
        });

        // Get defects in date range
        const allDefects = await db.getAllDefects();
        const projectDefects = allDefects.filter((d: any) => {
          if (!d.createdAt) return false;
          const createdDate = new Date(d.createdAt);
          return createdDate >= new Date(options.startDate) && 
                 createdDate <= new Date(options.endDate);
        });

        progressData.push({
          project,
          tasks,
          completedTasks,
          totalTasks,
          progressPercentage,
          plannedProgress,
          status,
          inspections: projectChecklists,
          defects: projectDefects,
        });
      }

      // === PDF Content ===

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(reportTitle, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('th-TH')}`, { align: 'center' });
      doc.moveDown(1.5);

      // Summary Section
      doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true });
      doc.moveDown(0.5);
      
      const totalProjects = progressData.length;
      const projectsAhead = progressData.filter(p => p.status === 'ahead').length;
      const projectsOnTrack = progressData.filter(p => p.status === 'on_track').length;
      const projectsBehind = progressData.filter(p => p.status === 'behind').length;
      const totalInspections = progressData.reduce((sum, p) => sum + p.inspections.length, 0);
      const totalDefects = progressData.reduce((sum, p) => sum + p.defects.length, 0);

      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Active Projects: ${totalProjects}`);
      doc.text(`Projects Ahead of Schedule: ${projectsAhead}`);
      doc.text(`Projects On Track: ${projectsOnTrack}`);
      doc.text(`Projects Behind Schedule: ${projectsBehind}`);
      doc.text(`Total Inspections Completed: ${totalInspections}`);
      doc.text(`Total Defects Reported: ${totalDefects}`);
      doc.moveDown(1.5);

      // Project Details
      doc.fontSize(16).font('Helvetica-Bold').text('Project Details', { underline: true });
      doc.moveDown(0.5);

      for (const data of progressData) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }

        doc.fontSize(14).font('Helvetica-Bold').text(data.project.name);
        doc.moveDown(0.3);

        doc.fontSize(10).font('Helvetica');
        doc.text(`Project Code: ${data.project.code || 'N/A'}`);
        doc.text(`Location: ${data.project.location || 'N/A'}`);
        doc.text(`Status: ${data.project.status}`);
        doc.text(`Start Date: ${data.project.startDate || 'N/A'}`);
        doc.text(`End Date: ${data.project.endDate || 'N/A'}`);
        doc.moveDown(0.3);

        // Progress Bar (visual representation)
        const barWidth = 400;
        const barHeight = 20;
        const barX = doc.page.margins.left;
        const barY = doc.y;

        // Background
        doc.rect(barX, barY, barWidth, barHeight).fillAndStroke('#E0E0E0', '#CCCCCC');

        // Planned progress (blue)
        const plannedWidth = (data.plannedProgress / 100) * barWidth;
        doc.rect(barX, barY, plannedWidth, barHeight).fillAndStroke('#3B82F6', '#2563EB');

        // Actual progress (green or red)
        const actualWidth = (data.progressPercentage / 100) * barWidth;
        const progressColor = data.status === 'behind' ? '#EF4444' : '#10B981';
        const progressStroke = data.status === 'behind' ? '#DC2626' : '#059669';
        doc.rect(barX, barY + barHeight / 4, actualWidth, barHeight / 2).fillAndStroke(progressColor, progressStroke);

        doc.y = barY + barHeight + 5;
        doc.fontSize(9).font('Helvetica');
        doc.text(`Planned: ${data.plannedProgress}% | Actual: ${data.progressPercentage}% | Status: ${data.status.toUpperCase()}`);
        doc.moveDown(0.3);

        // Task Summary
        doc.fontSize(10).font('Helvetica-Bold').text('Tasks:');
        doc.fontSize(9).font('Helvetica');
        doc.text(`  Total: ${data.totalTasks} | Completed: ${data.completedTasks} | In Progress: ${data.tasks.filter(t => t.status === 'in_progress').length}`);
        doc.moveDown(0.3);

        // Inspection Summary
        doc.fontSize(10).font('Helvetica-Bold').text('Inspections:');
        doc.fontSize(9).font('Helvetica');
        const passedInspections = data.inspections.filter((i: any) => i.status === 'completed').length;
        const failedInspections = data.inspections.filter((i: any) => i.status === 'failed').length;
        doc.text(`  Total: ${data.inspections.length} | Passed: ${passedInspections} | Failed: ${failedInspections}`);
        doc.moveDown(0.3);

        // Defect Summary
        doc.fontSize(10).font('Helvetica-Bold').text('Defects:');
        doc.fontSize(9).font('Helvetica');
        const openDefects = data.defects.filter((d: any) => d.status === 'reported' || d.status === 'analysis').length;
        const closedDefects = data.defects.filter((d: any) => d.status === 'closed').length;
        doc.text(`  Total: ${data.defects.length} | Open: ${openDefects} | Closed: ${closedDefects}`);
        doc.moveDown(1);

        // Separator line
        doc.moveTo(doc.page.margins.left, doc.y)
           .lineTo(doc.page.width - doc.page.margins.right, doc.y)
           .stroke('#CCCCCC');
        doc.moveDown(1);
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).font('Helvetica').text(
          `Page ${i + 1} of ${pageCount}`,
          doc.page.margins.left,
          doc.page.height - 30,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
