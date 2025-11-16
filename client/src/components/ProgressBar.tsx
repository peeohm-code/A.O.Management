import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warning" | "danger";
  className?: string;
}

/**
 * Visual Progress Bar Component
 * - Animated gradient fill
 * - Mobile-friendly sizing
 * - Color variants based on progress status
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
      ? clampedValue >= 70
        ? "default"
        : clampedValue >= 40
        ? "warning"
        : "danger"
      : variant;

  const sizeClasses = {
    sm: "h-2",
    md: "h-3 md:h-3",
    lg: "h-4 md:h-5",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm font-medium">
          <span>ความคืบหน้า</span>
          <span className="text-base font-bold">{clampedValue}%</span>
        </div>
      )}
      <div className={cn("progress-bar", sizeClasses[size])}>
        <div
          className={cn("progress-bar-fill", {
            warning: autoVariant === "warning",
            danger: autoVariant === "danger",
          })}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
