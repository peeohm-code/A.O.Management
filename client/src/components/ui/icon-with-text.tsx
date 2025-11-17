import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface IconWithTextProps {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  iconClassName?: string;
}

export function IconWithText({
  icon: Icon,
  children,
  className = "",
  iconClassName = "",
}: IconWithTextProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${iconClassName}`} />
      <span className="truncate">{children}</span>
    </div>
  );
}
