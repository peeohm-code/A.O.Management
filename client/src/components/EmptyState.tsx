import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * EmptyState Component
 * แสดงสถานะเมื่อไม่มีข้อมูล พร้อม call-to-action ที่ชัดเจน
 */
export function EmptyState({ 
  icon: Icon = Inbox,
  title, 
  description, 
  action,
  secondaryAction,
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
