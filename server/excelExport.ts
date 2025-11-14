import * as XLSX from 'xlsx';

export interface ArchiveExportData {
  id: number;
  name: string;
  code: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  projectStatus: string;
  archivedAt: Date | null;
  archivedReason: string | null;
  archivedYears: number;
}

export function generateArchiveExcel(projects: ArchiveExportData[]): Buffer {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data for main sheet
  const mainData = projects.map((p) => ({
    'รหัสโครงการ': p.code || '-',
    'ชื่อโครงการ': p.name,
    'สถานที่': p.location || '-',
    'วันเริ่มต้น': p.startDate ? new Date(p.startDate).toLocaleDateString('th-TH') : '-',
    'วันสิ้นสุด': p.endDate ? new Date(p.endDate).toLocaleDateString('th-TH') : '-',
    'สถานะ': p.projectStatus,
    'วันที่ Archive': p.archivedAt ? new Date(p.archivedAt).toLocaleDateString('th-TH') : '-',
    'เหตุผล': p.archivedReason || '-',
    'อายุ (ปี)': p.archivedYears.toFixed(1),
  }));

  // Create main sheet
  const mainSheet = XLSX.utils.json_to_sheet(mainData);
  
  // Set column widths
  mainSheet['!cols'] = [
    { wch: 15 }, // รหัสโครงการ
    { wch: 30 }, // ชื่อโครงการ
    { wch: 20 }, // สถานที่
    { wch: 15 }, // วันเริ่มต้น
    { wch: 15 }, // วันสิ้นสุด
    { wch: 15 }, // สถานะ
    { wch: 15 }, // วันที่ Archive
    { wch: 30 }, // เหตุผล
    { wch: 10 }, // อายุ
  ];

  XLSX.utils.book_append_sheet(workbook, mainSheet, 'โครงการที่เก็บถาวร');

  // Create summary sheet
  const total = projects.length;
  const approaching5Years = projects.filter(p => p.archivedYears >= 4.5 && p.archivedYears < 5).length;
  const readyToDelete = projects.filter(p => p.archivedYears >= 5).length;
  const estimatedStorage = total * 10; // 10MB per project

  const summaryData = [
    { 'รายการ': 'โครงการทั้งหมด', 'จำนวน': total },
    { 'รายการ': 'ใกล้ครบ 5 ปี (4.5-5 ปี)', 'จำนวน': approaching5Years },
    { 'รายการ': 'พร้อมลบ (>5 ปี)', 'จำนวน': readyToDelete },
    { 'รายการ': 'Storage ประมาณการ (MB)', 'จำนวน': estimatedStorage },
    { 'รายการ': 'Storage ประหยัดได้ (MB)', 'จำนวน': readyToDelete * 10 },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุป');

  // Write to buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(excelBuffer);
}
