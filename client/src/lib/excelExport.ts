import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Export tasks to Excel
 */
export function exportTasksToExcel(tasks: any[], projectName?: string) {
  const data = tasks.map((task) => ({
    'รหัสงาน': task.id,
    'ชื่องาน': task.name,
    'รายละเอียด': task.description || '-',
    'สถานะ': getStatusLabel(task.status),
    'ความคืบหน้า (%)': task.progress || 0,
    'วันเริ่มต้น': task.startDate ? format(new Date(task.startDate), 'dd/MM/yyyy', { locale: th }) : '-',
    'วันสิ้นสุด': task.endDate ? format(new Date(task.endDate), 'dd/MM/yyyy', { locale: th }) : '-',
    'ผู้รับผิดชอบ': task.assigneeName || '-',
    'หมวดหมู่': task.category || '-',
    'ลำดับความสำคัญ': getPriorityLabel(task.priority),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const fileName = projectName
    ? `Tasks_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Tasks_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export defects to Excel
 */
export function exportDefectsToExcel(defects: any[], projectName?: string) {
  const data = defects.map((defect) => ({
    'รหัส': defect.id,
    'ประเภท': defect.type,
    'หัวข้อ': defect.title,
    'รายละเอียด': defect.description || '-',
    'ระดับความรุนแรง': getSeverityLabel(defect.severity),
    'สถานะ': getDefectStatusLabel(defect.status),
    'ผู้รายงาน': defect.reporterName || '-',
    'ผู้รับผิดชอบ': defect.assigneeName || '-',
    'วันที่รายงาน': defect.createdAt ? format(new Date(defect.createdAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-',
    'วันที่แก้ไข': defect.resolvedAt ? format(new Date(defect.resolvedAt), 'dd/MM/yyyy HH:mm', { locale: th }) : '-',
    'ระยะเวลาแก้ไข (วัน)': defect.resolvedAt
      ? Math.ceil((new Date(defect.resolvedAt).getTime() - new Date(defect.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Defects');

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const fileName = projectName
    ? `Defects_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Defects_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export inspection results to Excel
 */
export function exportInspectionsToExcel(inspections: any[], projectName?: string) {
  const data = inspections.map((inspection) => ({
    'รหัส Checklist': inspection.id,
    'ชื่อ Checklist': inspection.name,
    'งาน': inspection.taskName || '-',
    'สถานะ': getInspectionStatusLabel(inspection.status),
    'ผู้ตรวจสอบ': inspection.inspectorName || '-',
    'วันที่ตรวจสอบ': inspection.inspectedAt
      ? format(new Date(inspection.inspectedAt), 'dd/MM/yyyy HH:mm', { locale: th })
      : '-',
    'ความคิดเห็น': inspection.generalComments || '-',
    'จำนวนรายการทั้งหมด': inspection.totalItems || 0,
    'ผ่าน': inspection.passedItems || 0,
    'ไม่ผ่าน': inspection.failedItems || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspections');

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const fileName = projectName
    ? `Inspections_${projectName}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    : `Inspections_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}

/**
 * Export project summary to Excel (multiple sheets)
 */
export function exportProjectSummaryToExcel(data: {
  project: any;
  tasks: any[];
  defects: any[];
  inspections: any[];
}) {
  const workbook = XLSX.utils.book_new();

  // Project Info Sheet
  const projectInfo = [
    ['ชื่อโครงการ', data.project.name],
    ['รายละเอียด', data.project.description || '-'],
    ['สถานะ', getStatusLabel(data.project.status)],
    ['วันเริ่มต้น', data.project.startDate ? format(new Date(data.project.startDate), 'dd/MM/yyyy', { locale: th }) : '-'],
    ['วันสิ้นสุด', data.project.endDate ? format(new Date(data.project.endDate), 'dd/MM/yyyy', { locale: th }) : '-'],
    ['งบประมาณ', data.project.budget ? `${data.project.budget.toLocaleString()} บาท` : '-'],
    ['ความคืบหน้า', `${data.project.progress || 0}%`],
    [],
    ['สรุปสถิติ'],
    ['จำนวนงานทั้งหมด', data.tasks.length],
    ['งานเสร็จสมบูรณ์', data.tasks.filter((t: any) => t.progress === 100).length],
    ['จำนวนข้อบกพร่อง', data.defects.length],
    ['ข้อบกพร่องที่แก้ไขแล้ว', data.defects.filter((d: any) => d.status === 'resolved' || d.status === 'closed').length],
    ['จำนวนการตรวจสอบ', data.inspections.length],
  ];
  const projectSheet = XLSX.utils.aoa_to_sheet(projectInfo);
  XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project Info');

  // Tasks Sheet
  const tasksData = data.tasks.map((task) => ({
    'รหัสงาน': task.id,
    'ชื่องาน': task.name,
    'สถานะ': getStatusLabel(task.status),
    'ความคืบหน้า (%)': task.progress || 0,
    'วันเริ่มต้น': task.startDate ? format(new Date(task.startDate), 'dd/MM/yyyy', { locale: th }) : '-',
    'วันสิ้นสุด': task.endDate ? format(new Date(task.endDate), 'dd/MM/yyyy', { locale: th }) : '-',
    'ผู้รับผิดชอบ': task.assigneeName || '-',
  }));
  const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

  // Defects Sheet
  const defectsData = data.defects.map((defect) => ({
    'รหัส': defect.id,
    'ประเภท': defect.type,
    'หัวข้อ': defect.title,
    'ระดับความรุนแรง': getSeverityLabel(defect.severity),
    'สถานะ': getDefectStatusLabel(defect.status),
    'วันที่รายงาน': defect.createdAt ? format(new Date(defect.createdAt), 'dd/MM/yyyy', { locale: th }) : '-',
    'วันที่แก้ไข': defect.resolvedAt ? format(new Date(defect.resolvedAt), 'dd/MM/yyyy', { locale: th }) : '-',
  }));
  const defectsSheet = XLSX.utils.json_to_sheet(defectsData);
  XLSX.utils.book_append_sheet(workbook, defectsSheet, 'Defects');

  // Inspections Sheet
  const inspectionsData = data.inspections.map((inspection) => ({
    'รหัส': inspection.id,
    'ชื่อ Checklist': inspection.name,
    'สถานะ': getInspectionStatusLabel(inspection.status),
    'ผู้ตรวจสอบ': inspection.inspectorName || '-',
    'วันที่ตรวจสอบ': inspection.inspectedAt
      ? format(new Date(inspection.inspectedAt), 'dd/MM/yyyy', { locale: th })
      : '-',
  }));
  const inspectionsSheet = XLSX.utils.json_to_sheet(inspectionsData);
  XLSX.utils.book_append_sheet(workbook, inspectionsSheet, 'Inspections');

  const fileName = `Project_${data.project.name}_Summary_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
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
