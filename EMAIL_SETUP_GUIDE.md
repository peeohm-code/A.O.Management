# Email Notification Setup Guide

คู่มือการตั้งค่าระบบส่งอีเมลแจ้งเตือนสำหรับ Construction Management App

## 📧 Email Service Options

มี 3 ตัวเลือกหลักสำหรับส่งอีเมล:

1. **Gmail SMTP** - เหมาะสำหรับทดสอบและโปรเจกต์เล็ก
2. **SendGrid** - แนะนำสำหรับ production (ฟรี 100 emails/day)
3. **AWS SES** - สำหรับโปรเจกต์ขนาดใหญ่

---

## 1️⃣ Gmail SMTP Setup (สำหรับทดสอบ)

### ขั้นตอนการตั้งค่า

#### 1. เปิด 2-Step Verification
1. ไปที่ [Google Account Security](https://myaccount.google.com/security)
2. เลือก "2-Step Verification"
3. ทำตามขั้นตอนเพื่อเปิดใช้งาน

#### 2. สร้าง App Password
1. ไปที่ [App Passwords](https://myaccount.google.com/apppasswords)
2. เลือก "Mail" และ "Other (Custom name)"
3. ตั้งชื่อ เช่น "Construction App"
4. คัดลอก password 16 ตัวที่ได้

#### 3. ตั้งค่า Environment Variables
เพิ่มใน `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Construction Management
```

### ข้อจำกัด
- ส่งได้สูงสุด 500 emails/day
- อาจถูกจำกัดถ้าส่งเยอะเกินไป
- ไม่แนะนำสำหรับ production

---

## 2️⃣ SendGrid Setup (แนะนำสำหรับ Production)

### ทำไมต้อง SendGrid?
- ✅ ฟรี 100 emails/day
- ✅ Deliverability สูง (ไม่ติด spam)
- ✅ Email analytics และ tracking
- ✅ Template management
- ✅ API ใช้งานง่าย

### ขั้นตอนการตั้งค่า

#### 1. สมัคร SendGrid
1. ไปที่ [SendGrid Signup](https://signup.sendgrid.com/)
2. กรอกข้อมูล:
   - Email
   - Password
   - Company name
   - Website (ใส่ URL ของแอป)
3. ยืนยันอีเมล

#### 2. Verify Sender Identity
**Single Sender Verification (ง่ายที่สุด)**
1. ไปที่ Settings → Sender Authentication
2. เลือก "Single Sender Verification"
3. กรอกข้อมูล:
   - From Name: Construction Management
   - From Email: noreply@yourdomain.com (หรือ Gmail ก็ได้)
   - Reply To: support@yourdomain.com
   - Company Address
4. ยืนยันอีเมลที่ SendGrid ส่งมา

**Domain Authentication (แนะนำสำหรับ production)**
1. ไปที่ Settings → Sender Authentication
2. เลือก "Authenticate Your Domain"
3. เลือก DNS provider (เช่น Cloudflare, GoDaddy)
4. เพิ่ม DNS records ที่ SendGrid แนะนำ:
   ```
   Type: CNAME
   Name: em1234.yourdomain.com
   Value: u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Name: s1._domainkey.yourdomain.com
   Value: s1.domainkey.u1234567.wl123.sendgrid.net
   
   Type: CNAME
   Name: s2._domainkey.yourdomain.com
   Value: s2.domainkey.u1234567.wl123.sendgrid.net
   ```
5. รอ DNS propagate (15-60 นาที)
6. กด "Verify" ใน SendGrid

#### 3. สร้าง API Key
1. ไปที่ Settings → API Keys
2. กด "Create API Key"
3. ตั้งชื่อ เช่น "Construction App Production"
4. เลือก "Full Access" (หรือ "Restricted Access" แล้วเลือก Mail Send)
5. คัดลอก API Key (จะแสดงครั้งเดียว!)

#### 4. ตั้งค่า Environment Variables
เพิ่มใน `.env`:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Construction Management
```

### SendGrid Email Templates (Optional)

#### สร้าง Dynamic Template
1. ไปที่ Email API → Dynamic Templates
2. กด "Create a Dynamic Template"
3. ตั้งชื่อ เช่น "Task Assignment"
4. กด "Add Version"
5. เลือก "Code Editor"
6. ใส่ HTML template:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #00CE81; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .button { background: #00366D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{subject}}</h1>
    </div>
    <div class="content">
      <p>สวัสดีค่ะ คุณ{{recipientName}}</p>
      <p>{{message}}</p>
      <p><a href="{{actionUrl}}" class="button">{{actionText}}</a></p>
    </div>
  </div>
</body>
</html>
```

7. บันทึกและคัดลอก Template ID

#### ใช้งาน Template ใน Code
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: 'user@example.com',
  from: process.env.EMAIL_FROM!,
  templateId: 'd-xxxxxxxxxxxxxxxxxxxxx',
  dynamicTemplateData: {
    subject: 'มีงานใหม่มอบหมายให้คุณ',
    recipientName: 'สมชาย',
    message: 'คุณได้รับมอบหมายงาน "ตรวจสอบโครงสร้าง"',
    actionUrl: 'https://app.example.com/tasks/123',
    actionText: 'ดูรายละเอียดงาน',
  },
});
```

---

## 3️⃣ AWS SES Setup (สำหรับโปรเจกต์ขนาดใหญ่)

### ข้อดี
- ราคาถูกมาก ($0.10 per 1,000 emails)
- Scalable
- Integration กับ AWS services อื่นๆ

### ขั้นตอนการตั้งค่า

#### 1. สมัคร AWS Account
1. ไปที่ [AWS Console](https://aws.amazon.com/)
2. สมัครบัญชี (ต้องใส่บัตรเครดิต)

#### 2. Verify Email Address
1. ไปที่ SES Console
2. เลือก "Verified identities"
3. กด "Create identity"
4. เลือก "Email address"
5. ใส่อีเมลและยืนยัน

#### 3. Request Production Access
(SES เริ่มต้นอยู่ใน Sandbox mode - ส่งได้แค่ verified emails)
1. ไปที่ SES Console → Account dashboard
2. กด "Request production access"
3. กรอกแบบฟอร์ม:
   - Use case: Transactional emails
   - Website URL
   - Description
4. รอ AWS อนุมัติ (1-2 วัน)

#### 4. สร้าง SMTP Credentials
1. ไปที่ SES Console → SMTP settings
2. กด "Create SMTP credentials"
3. ตั้งชื่อ IAM user
4. คัดลอก SMTP username และ password

#### 5. ตั้งค่า Environment Variables
```env
EMAIL_SERVICE=ses
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=AKIAXXXXXXXXXXXXXXXX
EMAIL_PASSWORD=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Construction Management
AWS_REGION=us-east-1
```

---

## 📝 Email Templates

### 1. Task Assignment Email
```typescript
export const taskAssignmentTemplate = (data: {
  recipientName: string;
  taskName: string;
  projectName: string;
  dueDate: string;
  taskUrl: string;
}) => `
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
`;
```

### 2. QC Inspection Failed Email
```typescript
export const qcInspectionFailedTemplate = (data: {
  recipientName: string;
  taskName: string;
  checklistName: string;
  inspectorName: string;
  failedItems: string[];
  taskUrl: string;
}) => `
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
`;
```

### 3. Defect Report Email
```typescript
export const defectReportTemplate = (data: {
  recipientName: string;
  defectType: 'CAR' | 'NCR' | 'PAR';
  defectTitle: string;
  severity: string;
  location: string;
  reportedBy: string;
  defectUrl: string;
}) => `
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
`;
```

---

## 🧪 Testing Email Delivery

### 1. ทดสอบด้วย Mailtrap (Development)
[Mailtrap](https://mailtrap.io/) - Email testing service ที่ไม่ส่งอีเมลจริง

```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=test@example.com
```

### 2. ทดสอบการส่งจริง
สร้างไฟล์ `test-email.ts`:
```typescript
import { sendEmail } from './server/email';

async function testEmail() {
  try {
    await sendEmail({
      to: 'your-email@example.com',
      subject: 'Test Email from Construction App',
      html: '<h1>Hello!</h1><p>This is a test email.</p>',
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

testEmail();
```

รัน: `tsx test-email.ts`

---

## 📊 Monitoring & Analytics

### SendGrid Analytics
1. ไปที่ Stats → Overview
2. ดูข้อมูล:
   - Delivered
   - Opens
   - Clicks
   - Bounces
   - Spam Reports

### Email Logs
เพิ่ม logging ใน `server/email.ts`:
```typescript
import { logActivity } from './db';

export async function sendEmail(options: EmailOptions) {
  try {
    await transporter.sendMail(options);
    
    // Log success
    await logActivity({
      action: 'email_sent',
      details: `Email sent to ${options.to}: ${options.subject}`,
    });
  } catch (error) {
    // Log error
    await logActivity({
      action: 'email_failed',
      details: `Failed to send email to ${options.to}: ${error.message}`,
    });
    throw error;
  }
}
```

---

## 🔒 Security Best Practices

1. **ใช้ Environment Variables**
   - ไม่เก็บ API keys ใน code
   - ใช้ `.env` และเพิ่มใน `.gitignore`

2. **Validate Email Addresses**
   ```typescript
   function isValidEmail(email: string): boolean {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   }
   ```

3. **Rate Limiting**
   - จำกัดจำนวนอีเมลต่อผู้ใช้/ชั่วโมง
   - ป้องกัน spam

4. **Unsubscribe Link**
   - เพิ่ม unsubscribe link ในทุกอีเมล
   - ให้ผู้ใช้ปิดการแจ้งเตือนได้

---

## ✅ Checklist

- [ ] เลือก email service (Gmail/SendGrid/SES)
- [ ] สมัครและ verify sender identity
- [ ] สร้าง API key/credentials
- [ ] ตั้งค่า environment variables
- [ ] สร้าง email templates
- [ ] ทดสอบส่งอีเมล
- [ ] เพิ่ม error handling และ logging
- [ ] ตั้งค่า monitoring/analytics
- [ ] เพิ่ม unsubscribe functionality
- [ ] ทดสอบบน production

---

## 📚 Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Email Best Practices](https://sendgrid.com/blog/email-best-practices/)
