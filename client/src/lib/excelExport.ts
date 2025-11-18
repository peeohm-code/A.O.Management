import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Export tasks to Excel using ExcelJS
 */
export async function exportTasksToExcel(tasks: any[], projectName?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Define columns
  worksheet.columns = [
    { header: 'รหัสงาน', key: 'id', width: 10 },
    { header: 'ชื่องาน', key: 'name', width: 30 },
    { header: 'รายละเอียด', key: 'description', width: 40 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'ความคืบหน้า (%)', key: 'progress', width: 15 },
    { header: 'วันเริ่มต้น', key: 'startDate', width: 15 },
    { header: 'วันสิ้นสุด', key: 'endDate', width: 15 },
    { header: 'ผู้รับผิดชอบ', key: 'assigneeName', width: 20 },
    { header: 'หมวดหมู่', key: 'category', width: 15 },
    { header: 'ลำดับความสำคัญ', key: 'priority', width: 15 },
  ];

  // Add rows
  tasks.forEach((task) => {
    worksheet.addRow({
      id: task.id,
      name: task.name,
      description: task.description || '-',
      status: getStatusLabel(task.status),
      progress: task.progress || 0,
      startDate: task.startDate ? format(new Date(task.startDate), 'dd/MM/yyyy', { locale: th }) : '-',
      endDate: task.endDate ? format(new Date(task.endDate), 'dd/MM/yyyy', { locale: th }) : '-',
      assigneeName: task.assigneeName || '-',
      category: task.category || '-',
      priority: getPriorityLabel(task.priority),
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const fileName = projectName
    ? `Tasks_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export defects to Excel using ExcelJS
 */
export async function exportDefectsToExcel(defects: any[], projectName?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Defects');

  // Define columns
  worksheet.columns = [
    { header: 'รหัส', key: 'id', width: 10 },
    { header: 'ประเภท', key: 'type', width: 10 },
    { header: 'หัวข้อ', key: 'title', width: 30 },
    { header: 'รายละเอียด', key: 'description', width: 40 },
    { header: 'ระดับความรุนแรง', key: 'severity', width: 15 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'ผู้รายงาน', key: 'reporterName', width: 20 },
    { header: 'ผู้รับผิดชอบ', key: 'assigneeName', width: 20 },
    { header: 'วันที่รายงาน', key: 'createdAt', width: 20 },
    { header: 'วันที่แก้ไข', key: 'resolvedAt', width: 20 },
    { header: 'ระยะเวลาแก้ไข (วัน)', key: 'resolutionDays', width: 20 },
  ];

  // Add rows
  defects.forEach((defect) => {
    worksheet.addRow({
      id: defect.id,
      type: defect.type,
      title: defect.title,
      description: defect.description || '-',
      severity: getSeverityLabel(defect.severity),
      status: getDefectStatusLabel(defect.status),
      reporterName: defect.reporterName || '-',
      assigneeName: defect.assigneeName || '-',
      createdAt: defect.createdAt ? format(new Date(defect.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-',
      resolvedAt: defect.resolvedAt ? format(new Date(defect.resolvedAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-',
      resolutionDays: defect.resolvedAt
        ? Math.ceil((new Date(defect.resolvedAt).getTime() - new Date(defect.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : '-',
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const fileName = projectName
    ? `Defects_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Defects_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export inspection results to Excel using ExcelJS
 */
export async function exportInspectionsToExcel(inspections: any[], projectName?: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inspections');

  // Define columns
  worksheet.columns = [
    { header: 'รหัส Checklist', key: 'id', width: 15 },
    { header: 'ชื่อ Checklist', key: 'name', width: 30 },
    { header: 'งาน', key: 'taskName', width: 30 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'ผู้ตรวจสอบ', key: 'inspectorName', width: 20 },
    { header: 'วันที่ตรวจสอบ', key: 'inspectedAt', width: 20 },
    { header: 'ความคิดเห็น', key: 'generalComments', width: 40 },
    { header: 'จำนวนรายการทั้งหมด', key: 'totalItems', width: 20 },
    { header: 'ผ่าน', key: 'passedItems', width: 10 },
    { header: 'ไม่ผ่าน', key: 'failedItems', width: 10 },
  ];

  // Add rows
  inspections.forEach((inspection) => {
    worksheet.addRow({
      id: inspection.id,
      name: inspection.name,
      taskName: inspection.taskName || '-',
      status: getInspectionStatusLabel(inspection.status),
      inspectorName: inspection.inspectorName || '-',
      inspectedAt: inspection.inspectedAt
        ? format(new Date(inspection.inspectedAt), 'dd/MM/yyyy HH:mm', { locale: th })
        : '-',
      generalComments: inspection.generalComments || '-',
      totalItems: inspection.totalItems || 0,
      passedItems: inspection.passedItems || 0,
      failedItems: inspection.failedItems || 0,
    });
  });

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const fileName = projectName
    ? `Inspections_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Inspections_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export project summary to Excel (multiple sheets) using ExcelJS
 */
export async function exportProjectSummaryToExcel(data: {
  project: any;
  tasks: any[];
  defects: any[];
  inspections: any[];
}) {
  const workbook = new ExcelJS.Workbook();

  // Project Info Sheet
  const projectSheet = workbook.addWorksheet('Project Info');
  projectSheet.columns = [
    { header: 'Field', key: 'field', width: 30 },
    { header: 'Value', key: 'value', width: 50 },
  ];

  projectSheet.addRow({ field: 'ชื่อโครงการ', value: data.project.name });
  projectSheet.addRow({ field: 'รายละเอียด', value: data.project.description || '-' });
  projectSheet.addRow({ field: 'สถานะ', value: getStatusLabel(data.project.status) });
  projectSheet.addRow({
    field: 'วันเริ่มต้น',
    value: data.project.startDate ? format(new Date(data.project.startDate), 'dd/MM/yyyy', { locale: th }) : '-',
  });
  projectSheet.addRow({
    field: 'วันสิ้นสุด',
    value: data.project.endDate ? format(new Date(data.project.endDate), 'dd/MM/yyyy', { locale: th }) : '-',
  });
  projectSheet.addRow({ field: 'ความคืบหน้า', value: `${data.project.progress || 0}%` });
  projectSheet.addRow({ field: '', value: '' });
  projectSheet.addRow({ field: 'สรุปสถิติ', value: '' });
  projectSheet.addRow({ field: 'จำนวนงานทั้งหมด', value: data.tasks.length });
  projectSheet.addRow({
    field: 'งานเสร็จสมบูรณ์',
    value: data.tasks.filter((t: any) => t.progress === 100).length,
  });
  projectSheet.addRow({ field: 'จำนวนข้อบกพร่อง', value: data.defects.length });
  projectSheet.addRow({
    field: 'ข้อบกพร่องที่แก้ไขแล้ว',
    value: data.defects.filter((d: any) => d.status === 'resolved' || d.status === 'closed').length,
  });
  projectSheet.addRow({ field: 'จำนวนการตรวจสอบ', value: data.inspections.length });

  // Style header
  projectSheet.getRow(1).font = { bold: true };
  projectSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Tasks Sheet
  const tasksSheet = workbook.addWorksheet('Tasks');
  tasksSheet.columns = [
    { header: 'รหัสงาน', key: 'id', width: 10 },
    { header: 'ชื่องาน', key: 'name', width: 30 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'ความคืบหน้า (%)', key: 'progress', width: 15 },
    { header: 'วันเริ่มต้น', key: 'startDate', width: 15 },
    { header: 'วันสิ้นสุด', key: 'endDate', width: 15 },
    { header: 'ผู้รับผิดชอบ', key: 'assigneeName', width: 20 },
  ];

  data.tasks.forEach((task) => {
    tasksSheet.addRow({
      id: task.id,
      name: task.name,
      status: getStatusLabel(task.status),
      progress: task.progress || 0,
      startDate: task.startDate ? format(new Date(task.startDate), 'dd/MM/yyyy', { locale: th }) : '-',
      endDate: task.endDate ? format(new Date(task.endDate), 'dd/MM/yyyy', { locale: th }) : '-',
      assigneeName: task.assigneeName || '-',
    });
  });

  tasksSheet.getRow(1).font = { bold: true };
  tasksSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Defects Sheet
  const defectsSheet = workbook.addWorksheet('Defects');
  defectsSheet.columns = [
    { header: 'รหัส', key: 'id', width: 10 },
    { header: 'ประเภท', key: 'type', width: 10 },
    { header: 'หัวข้อ', key: 'title', width: 30 },
    { header: 'ระดับความรุนแรง', key: 'severity', width: 15 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'วันที่รายงาน', key: 'createdAt', width: 20 },
    { header: 'วันที่แก้ไข', key: 'resolvedAt', width: 20 },
  ];

  data.defects.forEach((defect) => {
    defectsSheet.addRow({
      id: defect.id,
      type: defect.type,
      title: defect.title,
      severity: getSeverityLabel(defect.severity),
      status: getDefectStatusLabel(defect.status),
      createdAt: defect.createdAt ? format(new Date(defect.createdAt), 'dd/MM/yyyy', { locale: th }) : '-',
      resolvedAt: defect.resolvedAt ? format(new Date(defect.resolvedAt), 'dd/MM/yyyy', { locale: th }) : '-',
    });
  });

  defectsSheet.getRow(1).font = { bold: true };
  defectsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Inspections Sheet
  const inspectionsSheet = workbook.addWorksheet('Inspections');
  inspectionsSheet.columns = [
    { header: 'รหัส', key: 'id', width: 15 },
    { header: 'ชื่อ Checklist', key: 'name', width: 30 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'ผู้ตรวจสอบ', key: 'inspectorName', width: 20 },
    { header: 'วันที่ตรวจสอบ', key: 'inspectedAt', width: 20 },
  ];

  data.inspections.forEach((inspection) => {
    inspectionsSheet.addRow({
      id: inspection.id,
      name: inspection.name,
      status: getInspectionStatusLabel(inspection.status),
      inspectorName: inspection.inspectorName || '-',
      inspectedAt: inspection.inspectedAt
        ? format(new Date(inspection.inspectedAt), 'dd/MM/yyyy', { locale: th })
        : '-',
    });
  });

  inspectionsSheet.getRow(1).font = { bold: true };
  inspectionsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const fileName = `Project_${data.project.name}_Summary_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

// Helper functions
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planning: 'วางแผน',
    in_progress: 'กำลังดำเนินการ',
    on_hold: 'พักชั่วคราว',
    completed: 'เสร็จสมบูรณ์',
    cancelled: 'ยกเลิก',
    not_started: 'ยังไม่เริ่ม',
    rectification_needed: 'ต้องแก้ไข',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    urgent: 'เร่งด่วน',
  };
  return labels[priority] || priority;
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'ต่ำ',
    medium: 'ปานกลาง',
    high: 'สูง',
    critical: 'วิกฤต',
  };
  return labels[severity] || severity;
}

function getDefectStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    reported: 'รายงานแล้ว',
    analysis: 'กำลังวิเคราะห์',
    in_progress: 'กำลังแก้ไข',
    resolved: 'แก้ไขเสร็จ',
    pending_reinspection: 'รอตรวจสอบซ้ำ',
    closed: 'ปิดงาน',
  };
  return labels[status] || status;
}

function getInspectionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: 'ยังไม่เริ่ม',
    pending_inspection: 'รอตรวจสอบ',
    in_progress: 'กำลังตรวจสอบ',
    completed: 'ผ่าน',
    failed: 'ไม่ผ่าน',
  };
  return labels[status] || status;
}
