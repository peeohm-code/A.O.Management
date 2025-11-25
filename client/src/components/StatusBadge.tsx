import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Priority 1: Enhanced Status Badge Component
 * - Solid background colors for better visibility
 * - Color Scheme (Priority 1 requirements):
 *   🟢 Green (#10b981): Pass, Completed, On Track
 *   🔴 Red (#ef4444): Fail, Overdue, HIGH severity
 *   🟡 Yellow/Orange (#f59e0b): Pending, Delayed, MEDIUM severity
 *   ⚪ Gray (#6b7280): Not Started, LOW severity
 * - Mobile-friendly sizing
 * - High contrast for outdoor visibility
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    // Task/Project Status - Priority 1: Solid colors
    not_started: {
      label: "ยังไม่เริ่ม",
      className: "status-badge status-default",
    },
    in_progress: {
      label: "กำลังทำ",
      className: "status-badge status-warning",
    },
    delayed: {
      label: "ล่าช้า",
      className: "status-badge status-danger",
    },
    completed: {
      label: "เสร็จสมบูรณ์",
      className: "status-badge status-success",
    },
    pending: {
      label: "รอดำเนินการ",
      className: "status-badge status-warning",
    },
    pending_inspection: {
      label: "รอตรวจสอบ",
      className: "status-badge bg-blue-500 text-white",
    },
    failed: {
      label: "ไม่ผ่าน",
      className: "status-badge status-danger",
    },
    
    // Project statuses - Priority 1: Solid colors
    draft: {
      label: "แบบร่าง",
      className: "status-badge status-default",
    },
    planning: {
      label: "วางแผน",
      className: "status-badge bg-blue-500 text-white",
    },
    active: {
      label: "ดำเนินการ",
      className: "status-badge status-success",
    },
    on_hold: {
      label: "พักงาน",
      className: "status-badge status-warning",
    },
    cancelled: {
      label: "ยกเลิก",
      className: "status-badge status-danger",
    },
    
    // Inspection statuses - Priority 1: Solid colors
    pass: {
      label: "ผ่าน",
      className: "status-badge status-success",
    },
    fail: {
      label: "ไม่ผ่าน",
      className: "status-badge status-danger",
    },
    "N/A": {
      label: "ไม่ระบุ",
      className: "status-badge status-default",
    },
    
    // Defect statuses - Priority 1: Solid colors
    open: {
      label: "เปิด",
      className: "status-badge status-danger",
    },
    in_review: {
      label: "กำลังตรวจสอบ",
      className: "status-badge bg-blue-500 text-white",
    },
    in_rectification: {
      label: "กำลังแก้ไข",
      className: "status-badge status-warning",
    },
    implemented: {
      label: "ดำเนินการแล้ว",
      className: "status-badge bg-blue-500 text-white",
    },
    verified: {
      label: "ตรวจสอบแล้ว",
      className: "status-badge status-success",
    },
    resolved: {
      label: "แก้ไขแล้ว",
      className: "status-badge status-success",
    },
    closed: {
      label: "ปิด",
      className: "status-badge status-default",
    },
    
    // Severity levels - Priority 1: Solid colors
    high: {
      label: "สูง",
      className: "status-badge status-high font-bold",
    },
    medium: {
      label: "ปานกลาง",
      className: "status-badge status-medium",
    },
    low: {
      label: "ต่ำ",
      className: "status-badge status-low",
    },
    
    // Progress status - Priority 1: Solid colors
    on_track: {
      label: "ตามแผน",
      className: "status-badge status-success",
    },
    ahead: {
      label: "เร็วกว่าแผน",
      className: "status-badge bg-blue-500 text-white",
    },
    behind: {
      label: "ล่าช้า",
      className: "status-badge status-danger",
    },
    
    // Defect types - Priority 1: Different colors for CAR/NCR
    CAR: {
      label: "CAR",
      className: "status-badge bg-red-600 text-white font-bold",
    },
    NCR: {
      label: "NCR",
      className: "status-badge bg-orange-600 text-white font-bold",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "status-badge status-default",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200",
        "hover:scale-105 hover:shadow-sm",
        config.className, 
        className
      )}
    >
      {label || config.label}
    </span>
  );
}
