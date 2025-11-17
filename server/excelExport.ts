import ExcelJS from 'exceljs';

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

export async function generateArchiveExcel(projects: ArchiveExportData[]): Promise<Buffer> {
  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // Create main sheet
  const mainSheet = workbook.addWorksheet('โครงการที่เก็บถาวร');
  
  // Define columns
  mainSheet.columns = [
    { header: 'รหัสโครงการ', key: 'code', width: 15 },
    { header: 'ชื่อโครงการ', key: 'name', width: 30 },
    { header: 'สถานที่', key: 'location', width: 20 },
    { header: 'วันเริ่มต้น', key: 'startDate', width: 15 },
    { header: 'วันสิ้นสุด', key: 'endDate', width: 15 },
    { header: 'สถานะ', key: 'status', width: 15 },
    { header: 'วันที่ Archive', key: 'archivedAt', width: 15 },
    { header: 'เหตุผล', key: 'reason', width: 30 },
    { header: 'อายุ (ปี)', key: 'years', width: 10 },
  ];

  // Add rows
  projects.forEach((p) => {
    mainSheet.addRow({
      code: p.code || '-',
      name: p.name,
      location: p.location || '-',
      startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('th-TH') : '-',
      endDate: p.endDate ? new Date(p.endDate).toLocaleDateString('th-TH') : '-',
      status: p.projectStatus,
      archivedAt: p.archivedAt ? new Date(p.archivedAt).toLocaleDateString('th-TH') : '-',
      reason: p.archivedReason || '-',
      years: p.archivedYears.toFixed(1),
    });
  });

  // Style header row
  mainSheet.getRow(1).font = { bold: true };
  mainSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Create summary sheet
  const total = projects.length;
  const approaching5Years = projects.filter(p => p.archivedYears >= 4.5 && p.archivedYears < 5).length;
  const readyToDelete = projects.filter(p => p.archivedYears >= 5).length;
  const estimatedStorage = total * 10; // 10MB per project

  const summarySheet = workbook.addWorksheet('สรุป');
  summarySheet.columns = [
    { header: 'รายการ', key: 'item', width: 30 },
    { header: 'จำนวน', key: 'count', width: 15 },
  ];

  summarySheet.addRow({ item: 'โครงการทั้งหมด', count: total });
  summarySheet.addRow({ item: 'ใกล้ครบ 5 ปี (4.5-5 ปี)', count: approaching5Years });
  summarySheet.addRow({ item: 'พร้อมลบ (>5 ปี)', count: readyToDelete });
  summarySheet.addRow({ item: 'Storage ประมาณการ (MB)', count: estimatedStorage });
  summarySheet.addRow({ item: 'Storage ประหยัดได้ (MB)', count: readyToDelete * 10 });

  // Style header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
