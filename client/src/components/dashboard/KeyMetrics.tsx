import { Briefcase, CheckCircle2, AlertTriangle, Clock, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useLocation } from "wouter";
import { ProgressBar } from "@/components/ProgressBar";

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
      total: number;
      on_track: number;
      delayed: number;
      overdue: number;
      active?: number; // Backward compatibility
      onTrack?: number; // Backward compatibility
      at_risk?: number; // Deprecated
    };
    trends?: {
      on_track: number;
      delayed: number;
      overdue: number;
    };
  };
  projects?: Project[];
}

export function KeyMetrics({ stats, projects = [] }: KeyMetricsProps) {
  // Safely destructure with fallback values - new 4-status logic
  const { total = 0, on_track = 0, delayed = 0, overdue = 0 } = stats?.projectStats || {};
  const trends = stats?.trends || { on_track: 0, delayed: 0, overdue: 0 };
  const [, navigate] = useLocation();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Filter projects based on selected metric - new 4-status logic
  const getFilteredProjects = (metricType: string): Project[] => {
    if (!projects || projects.length === 0) return [];
    
    switch (metricType) {
      case "total":
        return projects;
      case "onTrack":
        return projects.filter(p => p.status === "on_track");
      case "delayed":
        return projects.filter(p => p.status === "delayed");
      case "overdue":
        return projects.filter(p => p.status === "overdue");
      default:
        return projects;
    }
  };

  // Get trend indicator component - new logic
  const getTrendIndicator = (trend: number, metricType: string) => {
    if (trend === 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Minus className="w-3 h-3" />
          <span>ไม่เปลี่ยนแปลง</span>
        </div>
      );
    }

    // For "delayed" and "overdue", negative trend is good (fewer problems)
    const isGoodTrend = (metricType === "delayed" || metricType === "overdue") 
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
      title: "โครงการทั้งหมด",
      value: total,
      subtitle: "โครงการทั้งหมดในระบบ",
      icon: Briefcase,
      color: "blue",
      bgGradient: "from-blue-50 to-blue-100/50",
      textColor: "text-[#00366D]",
      iconBg: "bg-[#00366D]",
      metricType: "total",
      trend: 0,
    },
    {
      title: "กำลังดำเนินการ",
      value: on_track,
      subtitle: total > 0 ? `${Math.round((on_track / total) * 100)}% ของโครงการทั้งหมด` : "ไม่มีโครงการ",
      icon: CheckCircle2,
      color: "green",
      bgGradient: "from-green-50 to-green-100/50",
      textColor: "text-[#00CE81]",
      iconBg: "bg-[#00CE81]",
      badge: on_track > 0 ? "✅ ปกติ" : undefined,
      metricType: "onTrack",
      trend: trends.on_track,
    },
    {
      title: "ล่าช้า",
      value: delayed,
      subtitle: delayed > 0 ? "มี task ล่าช้า" : "ไม่มีโครงการล่าช้า",
      icon: AlertTriangle,
      color: "yellow",
      bgGradient: "from-yellow-50 to-yellow-100/50",
      textColor: "text-yellow-700",
      iconBg: "bg-yellow-500",
      badge: delayed > 0 ? "⚠️ ล่าช้า" : undefined,
      metricType: "delayed",
      trend: trends.delayed,
    },
    {
      title: "เลยกำหนด",
      value: overdue,
      subtitle: overdue > 0 ? "เลยวันสิ้นสุดโครงการ" : "ไม่มีโครงการเลยกำหนด",
      icon: Clock,
      color: "red",
      bgGradient: "from-red-50 to-red-100/50",
      textColor: "text-red-700",
      iconBg: "bg-red-500",
      badge: overdue > 0 ? "🔴 เลยกำหนด" : undefined,
      metricType: "overdue",
      trend: trends.overdue,
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
      case "total":
        return "โครงการทั้งหมด";
      case "onTrack":
        return "โครงการที่กำลังดำเนินการ";
      case "delayed":
        return "โครงการที่ล่าช้า";
      case "overdue":
        return "โครงการที่เลยกำหนด";
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
                  <div className="mt-3">
                    <ProgressBar
                      value={project.progress}
                      variant={
                        project.status.includes("delayed")
                          ? "danger"
                          : project.status.includes("at_risk")
                          ? "warning"
                          : "default"
                      }
                      size="sm"
                      showLabel={false}
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
