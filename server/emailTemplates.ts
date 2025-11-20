/**
 * Email Templates for Daily Summary and Notifications
 */

interface DailySummaryData {
  userName: string;
  date: string;
  projects: Array<{
    id: number;
    name: string;
    tasksOverdue: number;
    tasksCompleted: number;
    checklistsPending: number;
    defectsOpen: number;
  }>;
  upcomingDeadlines: Array<{
    taskName: string;
    projectName: string;
    dueDate: string;
    daysRemaining: number;
  }>;
  recentActivities: Array<{
    action: string;
    details: string;
    time: string;
  }>;
}

export function generateDailySummaryEmail(data: DailySummaryData): string {
  const projectsHtml = data.projects
    .map(
      (p) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #dc2626;">${p.tasksOverdue}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #16a34a;">${p.tasksCompleted}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #ea580c;">${p.checklistsPending}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #dc2626;">${p.defectsOpen}</td>
    </tr>
  `
    )
    .join("");

  const deadlinesHtml = data.upcomingDeadlines
    .map(
      (d) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${d.taskName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${d.projectName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${d.dueDate}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${
        d.daysRemaining <= 3 ? "#dc2626" : "#ea580c"
      };">${d.daysRemaining} วัน</td>
    </tr>
  `
    )
    .join("");

  const activitiesHtml = data.recentActivities
    .map(
      (a) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${a.action}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${a.details}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">${a.time}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สรุปรายวัน - Construction Management</title>
</head>
<body style="font-family: 'Sarabun', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">📊 สรุปรายวัน</h1>
      <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">Construction Management Platform</p>
    </div>

    <!-- Greeting -->
    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #111827; margin: 0 0 8px 0;">สวัสดี คุณ${data.userName},</p>
      <p style="font-size: 14px; color: #6b7280; margin: 0;">นี่คือสรุปกิจกรรมของคุณประจำวันที่ ${data.date}</p>
    </div>

    <!-- Projects Summary -->
    <div style="padding: 0 30px 30px 30px;">
      <h2 style="font-size: 20px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
        📁 สรุปโครงการ
      </h2>
      ${
        data.projects.length > 0
          ? `
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">โครงการ</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">ล่าช้า</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">เสร็จสิ้น</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">รอตรวจ</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">ข้อบกพร่อง</th>
          </tr>
        </thead>
        <tbody>
          ${projectsHtml}
        </tbody>
      </table>
      `
          : `
      <p style="color: #6b7280; font-style: italic;">ไม่มีข้อมูลโครงการ</p>
      `
      }
    </div>

    <!-- Upcoming Deadlines -->
    <div style="padding: 0 30px 30px 30px;">
      <h2 style="font-size: 20px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #ea580c; padding-bottom: 8px;">
        ⏰ งานที่ใกล้ครบกำหนด
      </h2>
      ${
        data.upcomingDeadlines.length > 0
          ? `
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">งาน</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">โครงการ</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">วันครบกำหนด</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">เหลือเวลา</th>
          </tr>
        </thead>
        <tbody>
          ${deadlinesHtml}
        </tbody>
      </table>
      `
          : `
      <p style="color: #6b7280; font-style: italic;">ไม่มีงานที่ใกล้ครบกำหนด</p>
      `
      }
    </div>

    <!-- Recent Activities -->
    <div style="padding: 0 30px 30px 30px;">
      <h2 style="font-size: 20px; color: #111827; margin: 0 0 16px 0; border-bottom: 2px solid #16a34a; padding-bottom: 8px;">
        📝 กิจกรรมล่าสุด
      </h2>
      ${
        data.recentActivities.length > 0
          ? `
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">กิจกรรม</th>
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">รายละเอียด</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">เวลา</th>
          </tr>
        </thead>
        <tbody>
          ${activitiesHtml}
        </tbody>
      </table>
      `
          : `
      <p style="color: #6b7280; font-style: italic;">ไม่มีกิจกรรมล่าสุด</p>
      `
      }
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
        📧 คุณได้รับอีเมลนี้เนื่องจากคุณเปิดใช้งานการแจ้งเตือนสรุปรายวัน
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        สามารถเปลี่ยนแปลงการตั้งค่าได้ที่ <strong>Settings → Notifications</strong>
      </p>
    </div>

  </div>
</body>
</html>
  `;
}
