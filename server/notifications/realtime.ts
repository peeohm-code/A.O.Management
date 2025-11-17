import { sendNotificationToUser, sendNotificationToUsers } from "../sse";

export interface NotificationPayload {
  type: "defect_created" | "task_overdue" | "task_assigned" | "comment_mention" | "inspection_failed";
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

/**
 * Send real-time notification when a new defect is created
 */
export async function notifyDefectCreated(params: {
  userId: number;
  defectId: number;
  taskName: string;
  severity: string;
}) {
  const notification: NotificationPayload = {
    type: "defect_created",
    title: "พบข้อบกพร่องใหม่",
    message: `งาน "${params.taskName}" มีข้อบกพร่องใหม่ (ระดับ: ${params.severity})`,
    data: {
      defectId: params.defectId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUser(params.userId, notification);
}

/**
 * Send real-time notification when a task is overdue
 */
export async function notifyTaskOverdue(params: {
  userId: number;
  taskId: number;
  taskName: string;
  daysOverdue: number;
}) {
  const notification: NotificationPayload = {
    type: "task_overdue",
    title: "งานล่าช้า",
    message: `งาน "${params.taskName}" ล่าช้าแล้ว ${params.daysOverdue} วัน`,
    data: {
      taskId: params.taskId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUser(params.userId, notification);
}

/**
 * Send real-time notification when a task is assigned
 */
export async function notifyTaskAssigned(params: {
  userId: number;
  taskId: number;
  taskName: string;
  assignedBy: string;
}) {
  const notification: NotificationPayload = {
    type: "task_assigned",
    title: "มีงานใหม่มอบหมาย",
    message: `${params.assignedBy} มอบหมายงาน "${params.taskName}" ให้คุณ`,
    data: {
      taskId: params.taskId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUser(params.userId, notification);
}

/**
 * Send real-time notification when mentioned in a comment
 */
export async function notifyCommentMention(params: {
  userId: number;
  taskId: number;
  taskName: string;
  mentionedBy: string;
  commentPreview: string;
}) {
  const notification: NotificationPayload = {
    type: "comment_mention",
    title: "มีคนกล่าวถึงคุณ",
    message: `${params.mentionedBy} กล่าวถึงคุณในงาน "${params.taskName}": ${params.commentPreview}`,
    data: {
      taskId: params.taskId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUser(params.userId, notification);
}

/**
 * Send real-time notification when an inspection fails
 */
export async function notifyInspectionFailed(params: {
  userIds: number[];
  inspectionId: number;
  taskName: string;
  failedItemsCount: number;
}) {
  const notification: NotificationPayload = {
    type: "inspection_failed",
    title: "การตรวจสอบไม่ผ่าน",
    message: `งาน "${params.taskName}" มีรายการไม่ผ่านการตรวจสอบ ${params.failedItemsCount} รายการ`,
    data: {
      inspectionId: params.inspectionId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUsers(params.userIds, notification);
}

/**
 * Send notification to multiple users about task updates
 */
export async function notifyTaskUpdate(params: {
  userIds: number[];
  taskId: number;
  taskName: string;
  updateType: string;
  updatedBy: string;
}) {
  const notification = {
    type: "task_updated" as const,
    title: "งานมีการอัปเดต",
    message: `${params.updatedBy} ${params.updateType} งาน "${params.taskName}"`,
    data: {
      taskId: params.taskId,
    },
    timestamp: new Date().toISOString(),
  };

  sendNotificationToUsers(params.userIds, notification);
}
