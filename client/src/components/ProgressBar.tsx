import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warning" | "danger";
  className?: string;
}

/**
 * Enhanced Visual Progress Bar Component
 * - Color-coded based on percentage: 0-30% (red), 31-70% (yellow), 71-100% (green)
 * - Larger height (8-12px) for better visibility
 * - Animated gradient fill
 * - Mobile-friendly sizing
 * - Optional percentage label
 */
export function ProgressBar({
  value,
  showLabel = true,
  size = "md",
  variant = "default",
  className,
}: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Auto-determine variant based on value if not specified
  const autoVariant =
    variant === "default"
      ? clampedValue >= 71
        ? "default"
        : clampedValue >= 31
        ? "warning"
        : "danger"
      : variant;

  // Enhanced size classes with larger heights (8-12px)
  const sizeClasses = {
    sm: "h-2", // 8px
    md: "h-2.5 md:h-3", // 10-12px
    lg: "h-3 md:h-3.5", // 12-14px
  };

  // Color classes based on percentage
  const getColorClasses = () => {
    if (autoVariant === "danger" || clampedValue <= 30) {
      return {
        bg: "bg-red-500/10",
        fill: "bg-gradient-to-r from-red-500 to-red-600",
      };
    } else if (autoVariant === "warning" || (clampedValue > 30 && clampedValue <= 70)) {
      return {
        bg: "bg-amber-500/10",
        fill: "bg-gradient-to-r from-amber-500 to-amber-600",
      };
    } else {
      return {
        bg: "bg-emerald-500/10",
        fill: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ความคืบหน้า
          </span>
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">
            {clampedValue.toFixed(0)}%
          </span>
        </div>
      )}
      <div 
        className={cn(
          "w-full rounded-full overflow-hidden",
          colors.bg,
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colors.fill
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
