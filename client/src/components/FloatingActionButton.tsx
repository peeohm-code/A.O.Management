import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export default function FloatingActionButton({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40",
        "h-14 w-14 rounded-full shadow-lg",
        "bg-primary text-primary-foreground",
        "hover:shadow-xl hover:scale-105",
        "active:scale-95",
        "transition-all duration-200",
        "flex items-center justify-center",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        label && "w-auto px-4 gap-2",
        className
      )}
      aria-label={label || "Add"}
    >
      {icon}
      {label && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}
