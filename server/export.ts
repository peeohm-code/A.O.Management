import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// ===== Excel Export Utilities =====

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export async function createExcelWorkbook(
  sheetName: string,
  columns: ExcelColumn[],
  data: any[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns
  worksheet.columns = columns;

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  worksheet.addRows(data);

  // Auto-fit columns (approximate)
  worksheet.columns.forEach(column => {
    if (!column.width) {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? String(cell.value).length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// ===== PDF Export Utilities =====

export interface PDFTableColumn {
  header: string;
  key: string;
  width: number;
}

export interface PDFOptions {
  title: string;
  subtitle?: string;
  columns: PDFTableColumn[];
  data: any[];
  pageSize?: 'A4' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
}

export async function createPDFDocument(options: PDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: options.pageSize || 'A4',
      layout: options.orientation || 'landscape',
      margin: 50
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(options.title, { align: 'center' });
    doc.moveDown(0.5);

    // Subtitle
    if (options.subtitle) {
      doc.fontSize(12).font('Helvetica').text(options.subtitle, { align: 'center' });
      doc.moveDown(1);
    }

    // Calculate column positions
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const totalWidth = options.columns.reduce((sum, col) => sum + col.width, 0);
    const scale = pageWidth / totalWidth;

    let xPos = doc.page.margins.left;
    const yStart = doc.y;

    // Draw table header
    doc.fontSize(10).font('Helvetica-Bold');
    options.columns.forEach(col => {
      const colWidth = col.width * scale;
      doc.rect(xPos, yStart, colWidth, 25).fillAndStroke('#E0E0E0', '#000000');
      doc.fillColor('#000000').text(col.header, xPos + 5, yStart + 8, {
        width: colWidth - 10,
        align: 'left'
      });
      xPos += colWidth;
    });

    doc.moveDown(1.5);

    // Draw table rows
    doc.font('Helvetica').fontSize(9);
    options.data.forEach((row, index) => {
      xPos = doc.page.margins.left;
      const yPos = doc.y;

      // Check if we need a new page
      if (yPos > doc.page.height - doc.page.margins.bottom - 30) {
        doc.addPage();
      }

      const rowHeight = 20;

      options.columns.forEach(col => {
        const colWidth = col.width * scale;
        const value = row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '';
        
        // Draw cell border
        doc.rect(xPos, doc.y, colWidth, rowHeight).stroke('#CCCCCC');
        
        // Draw cell text
        doc.text(value, xPos + 5, doc.y + 5, {
          width: colWidth - 10,
          height: rowHeight - 10,
          align: 'left',
          ellipsis: true
        });
        
        xPos += colWidth;
      });

      doc.y += rowHeight;
    });

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text(
      `Generated on ${new Date().toLocaleString('th-TH')}`,
      doc.page.margins.left,
      doc.page.height - doc.page.margins.bottom + 10,
      { align: 'center' }
    );

    doc.end();
  });
}

// ===== Format Helpers =====

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'not_started': 'ยังไม่เริ่ม',
    'in_progress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
    'on_hold': 'พักงาน',
    'cancelled': 'ยกเลิก',
    'pending': 'รอดำเนินการ',
    'open': 'เปิด',
    'resolved': 'แก้ไขแล้ว',
    'closed': 'ปิด',
    'pass': 'ผ่าน',
    'fail': 'ไม่ผ่าน',
    'n/a': 'ไม่ระบุ'
  };
  return statusMap[status] || status;
}

export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    'low': 'ต่ำ',
    'medium': 'ปานกลาง',
    'high': 'สูง',
    'critical': 'วิกฤติ'
  };
  return priorityMap[priority] || priority;
}
