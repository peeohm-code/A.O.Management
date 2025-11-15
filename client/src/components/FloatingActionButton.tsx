import { Plus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive';
}

export default function FloatingActionButton({
  onClick,
  icon: Icon = Plus,
  label,
  className,
  variant = 'default',
}: FloatingActionButtonProps) {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40",
        // Mobile positioning with safe area
        "bottom-20 right-4",
        "[bottom:calc(5rem+env(safe-area-inset-bottom))]",
        "[right:calc(1rem+env(safe-area-inset-right))]",
        // Desktop positioning
        "md:bottom-6 md:right-6",
        "md:[bottom:1.5rem] md:[right:1.5rem]",
        "h-14 w-14 rounded-full shadow-lg",
        variantStyles[variant],
        "hover:shadow-xl hover:scale-105",
        "active:scale-95",
        "transition-all duration-200",
        "flex items-center justify-center",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        label && "w-auto px-4 gap-2",
        className
      )}
      aria-label={label || "เพิ่ม"}
    >
      <Icon className="h-6 w-6" />
      {label && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}
