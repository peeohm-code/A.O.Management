import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";

interface MetricCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  description,
  className = "",
}: MetricCardProps) {
  return (
    <Card className={`hover-lift ${className}`}>
      <CardContent className="card-padding">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="metric-label">{label}</p>
            <p className="metric-value mt-2">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
