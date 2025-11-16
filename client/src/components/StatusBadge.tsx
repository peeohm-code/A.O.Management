import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Enhanced Status Badge Component
 * - Mobile-friendly sizing (larger on mobile)
 * - High contrast colors for outdoor visibility
 * - Consistent styling across the app
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    not_started: {
      label: "ยังไม่เริ่ม",
      className: "status-not-started",
    },
    in_progress: {
      label: "กำลังทำ",
      className: "status-in-progress",
    },
    delayed: {
      label: "ล่าช้า",
      className: "status-delayed",
    },
    completed: {
      label: "เสร็จสมบูรณ์",
      className: "status-completed",
    },
    pending: {
      label: "รอดำเนินการ",
      className: "status-pending",
    },
    pending_inspection: {
      label: "รอตรวจสอบ",
      className: "status-pending",
    },
    failed: {
      label: "ไม่ผ่าน",
      className: "status-delayed",
    },
    // Project statuses
    draft: {
      label: "แบบร่าง",
      className: "status-not-started",
    },
    planning: {
      label: "วางแผน",
      className: "status-pending",
    },
    active: {
      label: "ดำเนินการ",
      className: "status-in-progress",
    },
    on_hold: {
      label: "พักงาน",
      className: "status-delayed",
    },
    cancelled: {
      label: "ยกเลิก",
      className: "status-delayed",
    },
    // Defect statuses
    open: {
      label: "เปิด",
      className: "status-delayed",
    },
    in_review: {
      label: "กำลังตรวจสอบ",
      className: "status-pending",
    },
    implemented: {
      label: "ดำเนินการแล้ว",
      className: "status-in-progress",
    },
    verified: {
      label: "ตรวจสอบแล้ว",
      className: "status-completed",
    },
    closed: {
      label: "ปิด",
      className: "status-completed",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "status-not-started",
  };

  return (
    <span className={cn("status-badge", config.className, className)}>
      {label || config.label}
    </span>
  );
}
