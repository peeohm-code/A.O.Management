import { Briefcase, CheckCircle2, AlertTriangle, Clock, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useLocation } from "wouter";

interface Project {
  id: number;
  name: string;
  progress: number;
  status: string;
  tasksCompleted: number;
  tasksTotal: number;
}

interface KeyMetricsProps {
  stats: {
    projectStats: {
      active: number;
      onTrack: number;
      at_risk: number;
      delayed: number;
      total: number;
    };
    trends?: {
      active: number;
      onTrack: number;
      at_risk: number;
      delayed: number;
    };
  };
  projects?: Project[];
}

export function KeyMetrics({ stats, projects = [] }: KeyMetricsProps) {
  // Safely destructure with fallback values
  const { active = 0, onTrack = 0, at_risk = 0, delayed = 0, total = 0 } = stats?.projectStats || {};
  const trends = stats?.trends || { active: 0, onTrack: 0, at_risk: 0, delayed: 0 };
  const [, navigate] = useLocation();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Filter projects based on selected metric
  const getFilteredProjects = (metricType: string): Project[] => {
    if (!projects || projects.length === 0) return [];
    
    switch (metricType) {
      case "active":
        return projects.filter(p => p.status === "active");
      case "onTrack":
        return projects.filter(p => p.status === "active" && !p.status.includes("at_risk") && !p.status.includes("delayed"));
      case "atRisk":
        return projects.filter(p => p.status.includes("at_risk"));
      case "delayed":
        return projects.filter(p => p.status.includes("delayed"));
      default:
        return projects;
    }
  };

  // Get trend indicator component
  const getTrendIndicator = (trend: number, metricType: string) => {
    if (trend === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Minus className="w-3 h-3" />
          <span>ไม่เปลี่ยนแปลง</span>
        </div>
      );
    }

    // For "at_risk" and "delayed", negative trend is good (fewer problems)
    const isGoodTrend = (metricType === "atRisk" || metricType === "delayed") 
      ? trend < 0 
      : trend > 0;

    const trendColor = isGoodTrend ? "text-[#00CE81]" : "text-red-600";
    const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        <span>{Math.abs(trend)}% จากสัปดาห์ที่แล้ว</span>
      </div>
    );
  };

  const metrics = [
    {
      title: "Active Projects",
      value: active,
      subtitle: `จาก ${total} โครงการทั้งหมด`,
      icon: Briefcase,
      color: "blue",
      bgGradient: "from-blue-50 to-blue-100/50",
      textColor: "text-[#00366D]",
      iconBg: "bg-[#00366D]",
      metricType: "active",
      trend: trends.active,
    },
    {
      title: "On Track Projects",
      value: onTrack,
      subtitle: active > 0 ? `${Math.round((onTrack / active) * 100)}% ของโครงการที่ทำงาน` : "ไม่มีโครงการ",
      icon: CheckCircle2,
      color: "green",
      bgGradient: "from-green-50 to-green-100/50",
      textColor: "text-[#00CE81]",
      iconBg: "bg-[#00CE81]",
      badge: "✅ ปกติ",
      metricType: "onTrack",
      trend: trends.onTrack,
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
      metricType: "atRisk",
      trend: trends.at_risk,
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
      metricType: "delayed",
      trend: trends.delayed,
    },
  ];

  const handleCardClick = (metricType: string) => {
    setSelectedMetric(metricType);
  };

  const handleProjectClick = (projectId: number) => {
    setSelectedMetric(null);
    navigate(`/projects/${projectId}`);
  };

  const getModalTitle = (metricType: string | null): string => {
    switch (metricType) {
      case "active":
        return "โครงการที่ทำงานอยู่ทั้งหมด";
      case "onTrack":
        return "โครงการที่ดำเนินการตามแผน";
      case "atRisk":
        return "โครงการที่มีความเสี่ยง";
      case "delayed":
        return "โครงการที่ล่าช้า";
      default:
        return "รายชื่อโครงการ";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status.includes("delayed")) {
      return <Badge variant="destructive">ล่าช้า</Badge>;
    } else if (status.includes("at_risk")) {
      return <Badge className="bg-orange-500">เสี่ยง</Badge>;
    } else if (status === "completed") {
      return <Badge className="bg-[#00CE81] text-white">เสร็จสมบูรณ์</Badge>;
    } else {
      return <Badge variant="secondary">ปกติ</Badge>;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            onClick={() => handleCardClick(metric.metricType)}
            className={`relative overflow-hidden bg-gradient-to-br ${metric.bgGradient} border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
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
              <div className="text-xs text-gray-500 mb-2">
                {metric.subtitle}
              </div>

              {/* Trend Indicator */}
              {getTrendIndicator(metric.trend, metric.metricType)}
            </div>

            {/* Decorative element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${metric.iconBg} opacity-10 rounded-full`} />
          </Card>
        ))}
      </div>

      {/* Project Detail Modal */}
      <Dialog open={selectedMetric !== null} onOpenChange={() => setSelectedMetric(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {getModalTitle(selectedMetric)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedMetric && getFilteredProjects(selectedMetric).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่มีโครงการในหมวดนี้
              </div>
            ) : (
              getFilteredProjects(selectedMetric || "").map((project) => (
                <Card
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    {getStatusBadge(project.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>ความคืบหน้า: {project.progress}%</span>
                    <span>งาน: {project.tasksCompleted}/{project.tasksTotal}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        project.progress === 100
                          ? "bg-green-500"
                          : project.status.includes("delayed")
                          ? "bg-red-500"
                          : project.status.includes("at_risk")
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
