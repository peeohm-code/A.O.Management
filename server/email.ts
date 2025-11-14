import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Email templates
export const emailTemplates = {
  taskAssignment: (data: {
    recipientName: string;
    taskName: string;
    projectName: string;
    dueDate: string;
    taskUrl: string;
  }) => ({
    subject: `🔔 มีงานใหม่มอบหมายให้คุณ - ${data.taskName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00366D 0%, #00CE81 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .info-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #00CE81; margin: 20px 0; }
    .button { display: inline-block; background: #00366D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 มีงานใหม่มอบหมายให้คุณ</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${data.recipientName}</strong></p>
      
      <p>คุณได้รับมอบหมายงานใหม่ในระบบ Construction Management</p>
      
      <div class="info-box">
        <p><strong>ชื่องาน:</strong> ${data.taskName}</p>
        <p><strong>โครงการ:</strong> ${data.projectName}</p>
        <p><strong>กำหนดเสร็จ:</strong> ${data.dueDate}</p>
      </div>
      
      <p>กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดและเริ่มดำเนินการ</p>
      
      <a href="${data.taskUrl}" class="button">ดูรายละเอียดงาน</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  qcInspectionFailed: (data: {
    recipientName: string;
    taskName: string;
    checklistName: string;
    inspectorName: string;
    failedItems: string[];
    taskUrl: string;
  }) => ({
    subject: `⚠️ ผลการตรวจสอบ QC: ไม่ผ่าน - ${data.taskName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .alert-box { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
    .failed-items { background: #f8f9fa; padding: 15px; margin: 20px 0; }
    .failed-items ul { margin: 10px 0; padding-left: 20px; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ผลการตรวจสอบ QC: ไม่ผ่าน</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${data.recipientName}</strong></p>
      
      <div class="alert-box">
        <p><strong>งาน:</strong> ${data.taskName}</p>
        <p><strong>Checklist:</strong> ${data.checklistName}</p>
        <p><strong>ผู้ตรวจสอบ:</strong> ${data.inspectorName}</p>
      </div>
      
      <div class="failed-items">
        <p><strong>รายการที่ไม่ผ่าน:</strong></p>
        <ul>
          ${data.failedItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      
      <p>กรุณาดำเนินการแก้ไขและขอตรวจสอบใหม่</p>
      
      <a href="${data.taskUrl}" class="button">ดูรายละเอียดและแก้ไข</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  defectReport: (data: {
    recipientName: string;
    defectType: 'CAR' | 'NCR' | 'PAR';
    defectTitle: string;
    severity: string;
    location: string;
    reportedBy: string;
    defectUrl: string;
  }) => ({
    subject: `🚨 รายงานข้อบกพร่อง (${data.defectType}) - ${data.defectTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .defect-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
    .car { background: #fef3c7; color: #92400e; }
    .ncr { background: #fee2e2; color: #991b1b; }
    .par { background: #dbeafe; color: #1e40af; }
    .info-box { background: #f8f9fa; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 รายงานข้อบกพร่อง (Defect Report)</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${data.recipientName}</strong></p>
      
      <p>มีรายงานข้อบกพร่องใหม่ในระบบ</p>
      
      <span class="defect-badge ${data.defectType.toLowerCase()}">${data.defectType}</span>
      
      <div class="info-box">
        <p><strong>หัวข้อ:</strong> ${data.defectTitle}</p>
        <p><strong>ระดับความรุนแรง:</strong> ${data.severity}</p>
        <p><strong>สถานที่:</strong> ${data.location}</p>
        <p><strong>ผู้รายงาน:</strong> ${data.reportedBy}</p>
      </div>
      
      <p>กรุณาตรวจสอบและดำเนินการแก้ไข</p>
      
      <a href="${data.defectUrl}" class="button">ดูรายละเอียด ${data.defectType}</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
    `,
  }),

  deadlineReminder: (data: {
    recipientName: string;
    taskName: string;
    projectName: string;
    dueDate: string;
    daysRemaining: number;
    taskUrl: string;
  }) => ({
    subject: `⏰ แจ้งเตือนกำหนดส่งงาน - ${data.taskName} (เหลือ ${data.daysRemaining} วัน)`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .warning-box { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ แจ้งเตือนกำหนดส่งงาน</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ<strong>${data.recipientName}</strong></p>
      
      <div class="warning-box">
        <p><strong>งาน:</strong> ${data.taskName}</p>
        <p><strong>โครงการ:</strong> ${data.projectName}</p>
        <p><strong>กำหนดเสร็จ:</strong> ${data.dueDate}</p>
        <p><strong>เหลือเวลา:</strong> ${data.daysRemaining} วัน</p>
      </div>
      
      <p>งานของคุณใกล้ถึงกำหนดส่งแล้ว กรุณาตรวจสอบความคืบหน้าและดำเนินการให้เสร็จตามกำหนด</p>
      
      <a href="${data.taskUrl}" class="button">ดูรายละเอียดงาน</a>
    </div>
    <div class="footer">
      <p>A.O. Construction Management & QC Platform</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>
    `,
  }),
};

// Send email function
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const from = options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    if (!from) {
      console.error('[Email] No sender email configured');
      return false;
    }

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('[Email] Sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

// Helper functions for specific email types
export async function sendTaskAssignmentEmail(data: {
  recipientEmail: string;
  recipientName: string;
  taskName: string;
  projectName: string;
  dueDate: string;
  taskUrl: string;
}) {
  const template = emailTemplates.taskAssignment(data);
  return sendEmail({
    to: data.recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendQCInspectionFailedEmail(data: {
  recipientEmail: string;
  recipientName: string;
  taskName: string;
  checklistName: string;
  inspectorName: string;
  failedItems: string[];
  taskUrl: string;
}) {
  const template = emailTemplates.qcInspectionFailed(data);
  return sendEmail({
    to: data.recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDefectReportEmail(data: {
  recipientEmail: string;
  recipientName: string;
  defectType: 'CAR' | 'NCR' | 'PAR';
  defectTitle: string;
  severity: string;
  location: string;
  reportedBy: string;
  defectUrl: string;
}) {
  const template = emailTemplates.defectReport(data);
  return sendEmail({
    to: data.recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendDeadlineReminderEmail(data: {
  recipientEmail: string;
  recipientName: string;
  taskName: string;
  projectName: string;
  dueDate: string;
  daysRemaining: number;
  taskUrl: string;
}) {
  const template = emailTemplates.deadlineReminder(data);
  return sendEmail({
    to: data.recipientEmail,
    subject: template.subject,
    html: template.html,
  });
}
