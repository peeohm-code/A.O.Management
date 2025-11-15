import PDFDocument from 'pdfkit';
import * as db from './db';
import { Readable } from 'stream';

// Thai font support would require additional font files
// For now, we'll use basic Latin characters and romanized Thai

/**
 * Export project data to PDF format (Executive Summary)
 */
export async function exportProjectToPDF(projectId: number): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch project data
      const project = await db.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const tasks = await db.getTasksByProject(projectId);
      const allDefects = await db.getAllDefects();
      const taskIds = tasks.map((t: any) => t.id);
      const defects = allDefects.filter((d: any) => taskIds.includes(d.taskId));
      const stats = await db.getProjectStats(projectId);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ========== Header ==========
      doc.fontSize(24).font('Helvetica-Bold').text('Project Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('th-TH')}`, { align: 'center' });
      doc.moveDown(2);

      // ========== Project Information ==========
      doc.fontSize(16).font('Helvetica-Bold').text('Project Information');
      doc.moveDown(0.5);
      
      const projectInfo = [
        ['Project Name:', project.name],
        ['Project Code:', project.code || '-'],
        ['Location:', project.location || '-'],
        ['Owner:', project.ownerName || '-'],
        ['Start Date:', project.startDate || '-'],
        ['End Date:', project.endDate || '-'],
        ['Status:', project.status],
        ['Completion:', `${project.completionPercentage || 0}%`],
      ];

      doc.fontSize(10).font('Helvetica');
      projectInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, { continued: true, width: 150 });
        doc.font('Helvetica').text(` ${value}`);
      });

      doc.moveDown(2);

      // ========== Project Statistics ==========
      doc.fontSize(16).font('Helvetica-Bold').text('Project Statistics');
      doc.moveDown(0.5);

      const statistics = [
        ['Total Tasks:', tasks.length.toString()],
        ['Completed Tasks:', stats?.completedTasks?.toString() || '0'],
        ['In Progress:', stats?.inProgressTasks?.toString() || '0'],
        ['Total Defects:', defects.length.toString()],
        ['Open Defects:', defects.filter((d: any) => d.status !== 'resolved').length.toString()],
        ['Resolved Defects:', defects.filter((d: any) => d.status === 'resolved').length.toString()],
      ];

      doc.fontSize(10).font('Helvetica');
      statistics.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, { continued: true, width: 150 });
        doc.font('Helvetica').text(` ${value}`);
      });

      doc.moveDown(2);

      // ========== Task Summary ==========
      doc.fontSize(16).font('Helvetica-Bold').text('Task Summary');
      doc.moveDown(0.5);

      if (tasks.length > 0) {
        // Group tasks by status
        const tasksByStatus: Record<string, number> = {};
        tasks.forEach(task => {
          tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
        });

        doc.fontSize(10).font('Helvetica');
        Object.entries(tasksByStatus).forEach(([status, count]) => {
          doc.text(`${status}: ${count} tasks`);
        });
      } else {
        doc.fontSize(10).font('Helvetica-Oblique').text('No tasks found');
      }

      doc.moveDown(2);

      // ========== Defects Summary ==========
      doc.fontSize(16).font('Helvetica-Bold').text('Defects Summary');
      doc.moveDown(0.5);

      if (defects.length > 0) {
        // Group defects by severity
        const defectsBySeverity: Record<string, number> = {};
        defects.forEach((defect: any) => {
          defectsBySeverity[defect.severity] = (defectsBySeverity[defect.severity] || 0) + 1;
        });

        doc.fontSize(10).font('Helvetica');
        Object.entries(defectsBySeverity).forEach(([severity, count]) => {
          doc.text(`${severity}: ${count} defects`);
        });

        doc.moveDown(1);

        // List critical defects
        const criticalDefects = defects.filter((d: any) => d.severity === 'critical' && d.status !== 'resolved');
        if (criticalDefects.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Critical Open Defects:');
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica');
          
          criticalDefects.slice(0, 10).forEach((defect: any, index: number) => {
            doc.text(`${index + 1}. ${defect.title} (Status: ${defect.status})`);
          });

          if (criticalDefects.length > 10) {
            doc.text(`... and ${criticalDefects.length - 10} more`);
          }
        }
      } else {
        doc.fontSize(10).font('Helvetica-Oblique').text('No defects found');
      }

      // ========== Footer ==========
      doc.moveDown(3);
      doc.fontSize(8).font('Helvetica-Oblique').text(
        'This report was generated by ConQC - Construction Management & QC Platform',
        { align: 'center' }
      );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
