import ExcelJS from 'exceljs';
import * as db from './db';

export interface ProjectExportData {
  project: any;
  tasks: any[];
  defects: any[];
  inspections: any[];
  members: any[];
}

/**
 * Export project data to Excel format
 */
export async function exportProjectToExcel(projectId: number): Promise<Buffer> {
  // Fetch all project data
  const project = await db.getProjectById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const tasks = await db.getTasksByProject(projectId);
  const defects = await db.getAllDefects(); // Filter by project later
  const members: any[] = []; // Project members not available in current schema

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ConQC - Construction Management & QC Platform';
  workbook.created = new Date();

  // ========== Project Overview Sheet ==========
  const projectSheet = workbook.addWorksheet('ข้อมูลโปรเจค');
  
  // Header styling
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF0EA5E9' } },
    alignment: { vertical: 'middle' as const, horizontal: 'left' as const },
  };

  projectSheet.columns = [
    { header: 'ฟิลด์', key: 'field', width: 25 },
    { header: 'ข้อมูล', key: 'value', width: 50 },
  ];

  projectSheet.getRow(1).font = headerStyle.font;
  projectSheet.getRow(1).fill = headerStyle.fill;
  projectSheet.getRow(1).alignment = headerStyle.alignment;

  projectSheet.addRows([
    { field: 'ชื่อโปรเจค', value: project.name },
    { field: 'รหัสโปรเจค', value: project.code || '-' },
    { field: 'สถานที่', value: project.location || '-' },
    { field: 'เจ้าของโปรเจค', value: project.ownerName || '-' },
    { field: 'วันเริ่มต้น', value: project.startDate || '-' },
    { field: 'วันสิ้นสุด', value: project.endDate || '-' },
    { field: 'สถานะ', value: project.status },
    { field: 'ความคืบหน้า', value: `${project.completionPercentage || 0}%` },
    { field: 'จำนวนงาน', value: tasks.length },
    { field: 'จำนวนปัญหา/ข้อบกพร่อง', value: defects.length },
  ]);

  // ========== Tasks Sheet ==========
  const tasksSheet = workbook.addWorksheet('รายการงาน');
  
  tasksSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'ชื่องาน', key: 'name', width: 35 },
    { header: 'หมวดหมู่', key: 'category', width: 15 },
    { header: 'สถานะ', key: 'status', width: 20 },
    { header: 'ความคืบหน้า', key: 'progress', width: 12 },
    { header: 'ผู้รับผิดชอบ', key: 'assignee', width: 20 },
    { header: 'วันเริ่ม', key: 'startDate', width: 12 },
    { header: 'วันสิ้นสุด', key: 'endDate', width: 12 },
    { header: 'คำอธิบาย', key: 'description', width: 40 },
  ];

  tasksSheet.getRow(1).font = headerStyle.font;
  tasksSheet.getRow(1).fill = headerStyle.fill;
  tasksSheet.getRow(1).alignment = headerStyle.alignment;

  for (const task of tasks) {
    const assignee = task.assigneeId 
      ? await db.getUserById(task.assigneeId)
      : null;

    tasksSheet.addRow({
      id: task.id,
      name: task.name,
      category: task.category || '-',
      status: task.status,
      progress: `${task.progress}%`,
      assignee: assignee?.name || '-',
      startDate: task.startDate || '-',
      endDate: task.endDate || '-',
      description: task.description || '-',
    });
  }

  // ========== Defects Sheet ==========
  const defectsSheet = workbook.addWorksheet('ปัญหา/ข้อบกพร่อง');
  
  defectsSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'ชื่อปัญหา', key: 'title', width: 35 },
    { header: 'ความรุนแรง', key: 'severity', width: 12 },
    { header: 'สถานะ', key: 'status', width: 20 },
    { header: 'งานที่เกี่ยวข้อง', key: 'taskName', width: 30 },
    { header: 'ผู้รับผิดชอบ', key: 'assignee', width: 20 },
    { header: 'กำหนดแก้ไข', key: 'dueDate', width: 12 },
    { header: 'คำอธิบาย', key: 'description', width: 40 },
  ];

  defectsSheet.getRow(1).font = headerStyle.font;
  defectsSheet.getRow(1).fill = headerStyle.fill;
  defectsSheet.getRow(1).alignment = headerStyle.alignment;

  for (const defect of defects) {
    const task = defect.taskId 
      ? await db.getTaskById(defect.taskId)
      : null;
    const assignee = defect.assignedTo 
      ? await db.getUserById(defect.assignedTo)
      : null;

    defectsSheet.addRow({
      id: defect.id,
      title: defect.title,
      severity: defect.severity,
      status: defect.status,
      taskName: task?.name || '-',
      assignee: assignee?.name || '-',
      dueDate: defect.dueDate || '-',
      description: defect.description || '-',
    });
  }

  // ========== Team Members Sheet ==========
  const membersSheet = workbook.addWorksheet('สมาชิกทีม');
  
  membersSheet.columns = [
    { header: 'ชื่อ', key: 'name', width: 25 },
    { header: 'อีเมล', key: 'email', width: 30 },
    { header: 'บทบาท', key: 'role', width: 20 },
  ];

  membersSheet.getRow(1).font = headerStyle.font;
  membersSheet.getRow(1).fill = headerStyle.fill;
  membersSheet.getRow(1).alignment = headerStyle.alignment;

  for (const member of members) {
    const user = await db.getUserById(member.userId);
    if (user) {
      membersSheet.addRow({
        name: user.name || '-',
        email: user.email || '-',
        role: member.role,
      });
    }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Get safe filename for export
 */
export function getExportFilename(projectName: string, format: 'xlsx' | 'pdf'): string {
  const safeName = projectName.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  return `${safeName}_${timestamp}.${format}`;
}
