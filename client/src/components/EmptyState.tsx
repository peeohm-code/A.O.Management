import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Inbox,
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 md:p-16 text-center", className)}>
      <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted/50 mb-6">
        <Icon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">{title}</h3>
      {description && (
        <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="lg" className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
