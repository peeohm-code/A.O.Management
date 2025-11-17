import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Enhanced Status Badge Component
 * - Color-coded status indicators
 * - Mobile-friendly sizing (larger on mobile)
 * - High contrast colors for outdoor visibility
 * - Consistent styling across the app
 * 
 * Color Scheme:
 * - Green (#10b981): Pass, Completed, On Track
 * - Red (#ef4444): Fail, Overdue, HIGH severity
 * - Yellow/Orange (#f59e0b): Pending, Delayed, MEDIUM severity
 * - Gray (#6b7280): Not Started, LOW severity
 * - Blue (#3b82f6): Pending Inspection
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    // Task/Project Status - with color coding
    not_started: {
      label: "ยังไม่เริ่ม",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    },
    in_progress: {
      label: "กำลังทำ",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    delayed: {
      label: "ล่าช้า",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    completed: {
      label: "เสร็จสมบูรณ์",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    pending: {
      label: "รอดำเนินการ",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    pending_inspection: {
      label: "รอตรวจสอบ",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
    },
    failed: {
      label: "ไม่ผ่าน",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    
    // Project statuses
    draft: {
      label: "แบบร่าง",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    },
    planning: {
      label: "วางแผน",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
    },
    active: {
      label: "ดำเนินการ",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    on_hold: {
      label: "พักงาน",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    cancelled: {
      label: "ยกเลิก",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    
    // Inspection statuses
    pass: {
      label: "ผ่าน",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    fail: {
      label: "ไม่ผ่าน",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    "N/A": {
      label: "ไม่ระบุ",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    },
    
    // Defect statuses
    open: {
      label: "เปิด",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    in_review: {
      label: "กำลังตรวจสอบ",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
    },
    in_rectification: {
      label: "กำลังแก้ไข",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    implemented: {
      label: "ดำเนินการแล้ว",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
    },
    verified: {
      label: "ตรวจสอบแล้ว",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    resolved: {
      label: "แก้ไขแล้ว",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    closed: {
      label: "ปิด",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    },
    
    // Severity levels
    high: {
      label: "สูง",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-semibold",
    },
    medium: {
      label: "ปานกลาง",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
    },
    low: {
      label: "ต่ำ",
      className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
    },
    
    // Progress status
    on_track: {
      label: "ตามแผน",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
    },
    ahead: {
      label: "เร็วกว่าแผน",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20",
    },
    behind: {
      label: "ล่าช้า",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
    },
    
    // Defect types
    CAR: {
      label: "CAR",
      className: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 font-bold",
    },
    NCR: {
      label: "NCR",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20 font-bold",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20",
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
