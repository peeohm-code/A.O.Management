/**
 * CSV/Excel Parser Utility for Bulk User Import
 */

export interface ParsedUser {
  name: string;
  email: string;
  role: "owner" | "admin" | "project_manager" | "qc_inspector" | "worker";
}

export interface ParseResult {
  success: boolean;
  data: ParsedUser[];
  errors: Array<{ row: number; field: string; message: string }>;
}

/**
 * Parse CSV content and validate user data
 */
export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n');
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const data: ParsedUser[] = [];
  
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, field: 'file', message: 'ไฟล์ CSV ว่างเปล่า' }],
    };
  }
  
  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIndex = header.findIndex(h => h === 'name' || h === 'ชื่อ');
  const emailIndex = header.findIndex(h => h === 'email' || h === 'อีเมล');
  const roleIndex = header.findIndex(h => h === 'role' || h === 'บทบาท');
  
  if (nameIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'ไม่พบคอลัมน์ "name" หรือ "ชื่อ"' });
  }
  if (emailIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'ไม่พบคอลัมน์ "email" หรือ "อีเมล"' });
  }
  if (roleIndex === -1) {
    errors.push({ row: 0, field: 'header', message: 'ไม่พบคอลัมน์ "role" หรือ "บทบาท"' });
  }
  
  if (errors.length > 0) {
    return { success: false, data: [], errors };
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    const rowNumber = i + 1;
    
    const name = values[nameIndex]?.trim() || '';
    const email = values[emailIndex]?.trim() || '';
    const roleRaw = values[roleIndex]?.trim().toLowerCase() || '';
    
    // Validate name
    if (!name) {
      errors.push({ row: rowNumber, field: 'name', message: 'ชื่อต้องไม่ว่างเปล่า' });
      continue;
    }
    
    // Validate email
    if (!email) {
      errors.push({ row: rowNumber, field: 'email', message: 'อีเมลต้องไม่ว่างเปล่า' });
      continue;
    }
    if (!isValidEmail(email)) {
      errors.push({ row: rowNumber, field: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' });
      continue;
    }
    
    // Validate and map role
    const role = mapRole(roleRaw);
    if (!role) {
      errors.push({
        row: rowNumber,
        field: 'role',
        message: `บทบาท "${roleRaw}" ไม่ถูกต้อง (ต้องเป็น: admin, project_manager, qc_inspector, worker)`,
      });
      continue;
    }
    
    data.push({ name, email, role });
  }
  
  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Map role string to valid role enum
 */
function mapRole(roleStr: string): ParsedUser['role'] | null {
  const roleMap: Record<string, ParsedUser['role']> = {
    'admin': 'admin',
    'ผู้ดูแลระบบ': 'admin',
    'project_manager': 'project_manager',
    'pm': 'project_manager',
    'ผู้จัดการโครงการ': 'project_manager',
    'qc_inspector': 'qc_inspector',
    'qc': 'qc_inspector',
    'ผู้ตรวจสอบคุณภาพ': 'qc_inspector',
    'worker': 'worker',
    'พนักงาน': 'worker',
    'ช่าง': 'worker',
  };
  
  return roleMap[roleStr] || null;
}

/**
 * Generate sample CSV template
 */
export function generateSampleCSV(): string {
  return `name,email,role
สมชาย ใจดี,somchai@example.com,project_manager
สมหญิง รักงาน,somying@example.com,qc_inspector
สมศักดิ์ ขยัน,somsak@example.com,worker`;
}
