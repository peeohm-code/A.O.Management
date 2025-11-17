import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface QuickActionMenuProps {
  actions: QuickAction[];
  mainIcon?: React.ReactNode;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  className?: string;
}

export function QuickActionMenu({
  actions,
  mainIcon = <Plus className="h-6 w-6" />,
  position = "bottom-right",
  className,
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-20 right-4 md:bottom-6 md:right-6",
    "bottom-left": "bottom-20 left-4 md:bottom-6 md:left-6",
    "bottom-center": "bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      {/* Action Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Actions */}
          <div className="absolute bottom-20 right-0 flex flex-col gap-3 items-end mb-2">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {/* Label */}
                <span className="bg-background text-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border">
                  {action.label}
                </span>

                {/* Action Button */}
                <Button
                  size="lg"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg",
                    action.color || "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                    if (navigator.vibrate) {
                      navigator.vibrate(10);
                    }
                  }}
                >
                  {action.icon}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl transition-transform",
          "[bottom:calc(5rem+env(safe-area-inset-bottom))]",
          "[right:calc(1rem+env(safe-area-inset-right))]",
          isOpen && "rotate-45"
        )}
        onClick={toggleMenu}
      >
        {isOpen ? <X className="h-6 w-6" /> : mainIcon}
      </Button>
    </div>
  );
}
