import { type Notification } from "../drizzle/schema";
import { ENV } from "./_core/env";

/**
 * Email Service for Notification Delivery
 * 
 * Uses Manus built-in email API (if available) or external email service
 * Provides HTML email templates for notifications
 */

export interface SendNotificationEmailParams {
  to: string;
  userName: string;
  notification: Notification;
}

/**
 * Get notification icon emoji based on type
 */
function getNotificationIcon(type: Notification["type"]): string {
  const iconMap: Record<string, string> = {
    task_assigned: "📋",
    task_status_changed: "🔄",
    task_deadline_approaching: "⏰",
    task_overdue: "🚨",
    task_progress_updated: "📊",
    inspection_requested: "🔍",
    inspection_completed: "✅",
    inspection_passed: "✅",
    inspection_failed: "❌",
    checklist_assigned: "📝",
    reinspection_required: "🔁",
    defect_assigned: "🐛",
    defect_created: "🆕",
    defect_status_changed: "🔄",
    defect_resolved: "✅",
    defect_reinspected: "🔍",
    defect_deadline_approaching: "⏰",
    project_member_added: "👥",
    project_milestone_reached: "🎯",
    project_status_changed: "🔄",
    file_uploaded: "📎",
    comment_added: "💬",
    dependency_blocked: "🚫",
    comment_mention: "@",
    task_updated: "📝",
    deadline_reminder: "⏰",
  };
  return iconMap[type] || "🔔";
}

/**
 * Get notification action button text and color
 */
function getNotificationAction(type: Notification["type"]): {
  text: string;
  color: string;
} {
  if (type.includes("task")) {
    return { text: "ดูงาน", color: "#3b82f6" };
  }
  if (type.includes("defect")) {
    return { text: "ดู Defect", color: "#ef4444" };
  }
  if (type.includes("inspection")) {
    return { text: "ดูการตรวจสอบ", color: "#10b981" };
  }
  return { text: "ดูรายละเอียด", color: "#6366f1" };
}

/**
 * Generate HTML email template for notification
 */
function generateEmailHTML(params: SendNotificationEmailParams): string {
  const { userName, notification } = params;
  const icon = getNotificationIcon(notification.type);
  const action = getNotificationAction(notification.type);

  // Build action link
  let actionLink = `${ENV.viteAppUrl || "https://app.manus.space"}/notifications`;
  if (notification.relatedTaskId) {
    actionLink = `${ENV.viteAppUrl || "https://app.manus.space"}/tasks/${notification.relatedTaskId}`;
  } else if (notification.relatedDefectId) {
    actionLink = `${ENV.viteAppUrl || "https://app.manus.space"}/defects/${notification.relatedDefectId}`;
  } else if (notification.relatedProjectId) {
    actionLink = `${ENV.viteAppUrl || "https://app.manus.space"}/projects/${notification.relatedProjectId}`;
  }

  // Priority badge color
  const priorityColors: Record<string, string> = {
    urgent: "#dc2626",
    high: "#f59e0b",
    normal: "#3b82f6",
    low: "#6b7280",
  };
  const priorityColor = priorityColors[notification.priority] || "#3b82f6";

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${icon} การแจ้งเตือนใหม่
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                สวัสดี <strong>${userName}</strong>,
              </p>
              
              <!-- Priority Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; padding: 4px 12px; background-color: ${priorityColor}; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                  ${notification.priority === "urgent" ? "เร่งด่วน" : notification.priority === "high" ? "สำคัญ" : notification.priority === "normal" ? "ปกติ" : "ต่ำ"}
                </span>
              </div>
              
              <!-- Notification Title -->
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${notification.title}
              </h2>
              
              <!-- Notification Content -->
              ${
                notification.content
                  ? `
              <div style="margin: 0 0 30px 0; padding: 20px; background-color: #f9fafb; border-left: 4px solid ${priorityColor}; border-radius: 4px;">
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
                  ${notification.content}
                </p>
              </div>
              `
                  : ""
              }
              
              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${actionLink}" style="display: inline-block; padding: 14px 32px; background-color: ${action.color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      ${action.text}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <!-- Footer Note -->
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                หากคุณไม่ต้องการรับการแจ้งเตือนทางอีเมล สามารถปรับการตั้งค่าได้ที่ <a href="${ENV.viteAppUrl || "https://app.manus.space"}/settings/notifications" style="color: #3b82f6; text-decoration: none;">การตั้งค่าการแจ้งเตือน</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                © ${new Date().getFullYear()} Construction Management & QC Platform
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ระบบบริหารจัดการโครงการก่อสร้างและควบคุมคุณภาพ
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of email (fallback for email clients that don't support HTML)
 */
function generateEmailText(params: SendNotificationEmailParams): string {
  const { userName, notification } = params;
  const icon = getNotificationIcon(notification.type);

  let text = `${icon} การแจ้งเตือนใหม่\n\n`;
  text += `สวัสดี ${userName},\n\n`;
  text += `${notification.title}\n\n`;

  if (notification.content) {
    text += `${notification.content}\n\n`;
  }

  text += `ดูรายละเอียดเพิ่มเติมได้ที่: ${ENV.viteAppUrl || "https://app.manus.space"}/notifications\n\n`;
  text += `---\n`;
  text += `© ${new Date().getFullYear()} Construction Management & QC Platform\n`;

  return text;
}

/**
 * Send notification email
 * 
 * Currently uses console.log for development
 * TODO: Integrate with actual email service (SendGrid, AWS SES, or Manus built-in)
 */
export async function sendNotificationEmail(
  params: SendNotificationEmailParams
): Promise<boolean> {
  try {
    const htmlContent = generateEmailHTML(params);
    const textContent = generateEmailText(params);

    // TODO: Integrate with actual email service
    // For now, log to console for development/testing
    console.log("[EmailService] Would send email to:", params.to);
    console.log("[EmailService] Subject:", params.notification.title);
    console.log("[EmailService] Priority:", params.notification.priority);

    // Example integration with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: params.to,
    //   from: 'notifications@yourapp.com',
    //   subject: params.notification.title,
    //   text: textContent,
    //   html: htmlContent,
    // });

    // Example integration with Manus built-in email API:
    // const response = await fetch(`${ENV.builtInForgeApiUrl}/email/send`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${ENV.builtInForgeApiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: params.to,
    //     subject: params.notification.title,
    //     html: htmlContent,
    //     text: textContent,
    //   }),
    // });

    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
}

/**
 * Send batch emails
 * More efficient than sending one by one
 */
export async function sendNotificationEmails(
  emailsList: SendNotificationEmailParams[]
): Promise<boolean[]> {
  const results = await Promise.allSettled(
    emailsList.map((params) => sendNotificationEmail(params))
  );

  return results.map((result) =>
    result.status === "fulfilled" ? result.value : false
  );
}
