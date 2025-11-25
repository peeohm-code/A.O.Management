import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableCard({ children, className, onClick }: MobileTableCardProps) {
  return (
    <Card 
      className={cn(
        "mb-3 hover:shadow-md transition-shadow",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileTableRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileTableRow({ label, value, className }: MobileTableRowProps) {
  return (
    <div className={cn("flex justify-between items-start py-2 border-b last:border-0", className)}>
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-right ml-4">{value}</span>
    </div>
  );
}

interface MobileTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableHeader({ children, className }: MobileTableHeaderProps) {
  return (
    <div className={cn("font-semibold text-base mb-3 pb-2 border-b", className)}>
      {children}
    </div>
  );
}

interface MobileTableActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableActions({ children, className }: MobileTableActionsProps) {
  return (
    <div className={cn("flex gap-2 mt-3 pt-3 border-t", className)}>
      {children}
    </div>
  );
}
