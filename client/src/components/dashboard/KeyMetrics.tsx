import { Briefcase, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KeyMetricsProps {
  stats: {
    projectStats: {
      active: number;
      onTrack: number;
      at_risk: number;
      delayed: number;
      total: number;
    };
  };
}

export function KeyMetrics({ stats }: KeyMetricsProps) {
  const { active, onTrack, at_risk, delayed, total } = stats.projectStats;

  const metrics = [
    {
      title: "Active Projects",
      value: active,
      subtitle: `จาก ${total} โครงการทั้งหมด`,
      icon: Briefcase,
      color: "blue",
      bgGradient: "from-blue-50 to-blue-100/50",
      textColor: "text-blue-700",
      iconBg: "bg-blue-500",
    },
    {
      title: "On Track Projects",
      value: onTrack,
      subtitle: active > 0 ? `${Math.round((onTrack / active) * 100)}% ของโครงการที่ทำงาน` : "ไม่มีโครงการ",
      icon: CheckCircle2,
      color: "green",
      bgGradient: "from-green-50 to-green-100/50",
      textColor: "text-green-700",
      iconBg: "bg-green-500",
      badge: "✅ ปกติ",
    },
    {
      title: "At Risk Projects",
      value: at_risk,
      subtitle: at_risk > 0 ? "ต้องติดตามใกล้ชิด" : "ไม่มีโครงการเสี่ยง",
      icon: AlertTriangle,
      color: "orange",
      bgGradient: "from-orange-50 to-orange-100/50",
      textColor: "text-orange-700",
      iconBg: "bg-orange-500",
      badge: at_risk > 0 ? "⚠️ ต้องดู" : undefined,
    },
    {
      title: "Delayed Projects",
      value: delayed,
      subtitle: delayed > 0 ? "ต้องเร่งแก้ไข" : "ไม่มีโครงการล่าช้า",
      icon: Clock,
      color: "red",
      bgGradient: "from-red-50 to-red-100/50",
      textColor: "text-red-700",
      iconBg: "bg-red-500",
      badge: delayed > 0 ? "🔴 ล่าช้า" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className={`relative overflow-hidden bg-gradient-to-br ${metric.bgGradient} border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
        >
          <div className="p-6">
            {/* Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${metric.iconBg} shadow-lg`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              {metric.badge && (
                <span className="text-sm font-medium">{metric.badge}</span>
              )}
            </div>

            {/* Value */}
            <div className={`text-4xl font-bold ${metric.textColor} mb-2`}>
              {metric.value}
            </div>

            {/* Title */}
            <div className="text-sm font-medium text-gray-600 mb-1">
              {metric.title}
            </div>

            {/* Subtitle */}
            <div className="text-xs text-gray-500">
              {metric.subtitle}
            </div>
          </div>

          {/* Decorative element */}
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${metric.iconBg} opacity-10 rounded-full`} />
        </Card>
      ))}
    </div>
  );
}
