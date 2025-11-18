import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Zap, Award, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdvancedAnalyticsProps {
  project: any;
  tasks: any[];
  inspections: any[];
  defects: any[];
  isLoading?: boolean;
}

/**
 * Advanced Analytics Component
 * แสดงการวิเคราะห์ขั้นสูงและ Insights
 */
export function AdvancedAnalytics({ project, tasks, inspections, defects, isLoading }: AdvancedAnalyticsProps) {
  const analytics = useMemo(() => {
    // Performance Index (0-100)
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const passedInspections = inspections.filter(i => i.status === "completed").length;
    const totalInspections = inspections.length;
    const inspectionPassRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    const resolvedDefects = defects.filter(d => d.status === "resolved").length;
    const totalDefects = defects.length;
    const defectResolutionRate = totalDefects > 0 ? (resolvedDefects / totalDefects) * 100 : 0;

    const performanceIndex = (
      taskCompletionRate * 0.4 +
      inspectionPassRate * 0.3 +
      defectResolutionRate * 0.3
    );

    // Productivity Score
    const avgTasksPerDay = totalTasks > 0 ? totalTasks / 30 : 0; // Mock: assume 30 days
    const productivityScore = Math.min(100, avgTasksPerDay * 10);

    // Quality Index
    const qualityIndex = (inspectionPassRate * 0.6) + (defectResolutionRate * 0.4);

    // Risk Assessment
    const overdueTasks = tasks.filter(t => {
      if (t.status === "completed" || !t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;
    const criticalDefects = defects.filter(d => d.severity === "critical" && d.status !== "resolved").length;
    const failedInspections = inspections.filter(i => i.status === "failed").length;
    
    const riskScore = Math.min(100,
      (overdueTasks * 10) +
      (criticalDefects * 15) +
      (failedInspections * 5)
    );

    let riskLevel = "low";
    if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 25) riskLevel = "medium";

    // Efficiency Metrics
    const efficiency = {
      onTimeCompletion: totalTasks > 0 ? ((totalTasks - overdueTasks) / totalTasks) * 100 : 100,
      firstTimePassRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
      reworkRate: totalDefects > 0 ? ((totalDefects - resolvedDefects) / totalDefects) * 100 : 0,
    };

    // Insights & Recommendations
    const insights = [];
    
    if (performanceIndex >= 80) {
      insights.push({
        type: "success",
        title: "ประสิทธิภาพดีเยี่ยม",
        description: "โปรเจกต์มีประสิทธิภาพสูง ควรรักษาระดับการทำงานนี้ต่อไป",
      });
    } else if (performanceIndex < 60) {
      insights.push({
        type: "warning",
        title: "ประสิทธิภาพต่ำ",
        description: "ควรทบทวนกระบวนการทำงานและแก้ไขปัญหาที่เกิดขึ้น",
      });
    }

    if (riskLevel === "high") {
      insights.push({
        type: "danger",
        title: "ความเสี่ยงสูง",
        description: `มีงานเกินกำหนด ${overdueTasks} งาน และข้อบกพร่องวิกฤติ ${criticalDefects} รายการ`,
      });
    }

    if (qualityIndex >= 85) {
      insights.push({
        type: "success",
        title: "คุณภาพสูง",
        description: "งานมีคุณภาพดี ผ่านการตรวจสอบส่วนใหญ่",
      });
    }

    if (efficiency.reworkRate > 30) {
      insights.push({
        type: "warning",
        title: "อัตราการแก้ไขงานสูง",
        description: "ควรปรับปรุงกระบวนการเพื่อลดการแก้ไขงานซ้ำ",
      });
    }

    return {
      performanceIndex,
      productivityScore,
      qualityIndex,
      riskScore,
      riskLevel,
      efficiency,
      insights,
    };
  }, [project, tasks, inspections, defects]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      default:
        return "text-green-600";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "high":
        return "สูง";
      case "medium":
        return "ปานกลาง";
      default:
        return "ต่ำ";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Award className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "danger":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-orange-50 border-orange-200";
      case "danger":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Advanced Analytics
        </CardTitle>
        <CardDescription>การวิเคราะห์ขั้นสูงและข้อเสนอแนะ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">Performance</p>
            <p className={`text-2xl font-bold ${getScoreColor(analytics.performanceIndex)}`}>
              {analytics.performanceIndex.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
            <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-muted-foreground mb-1">Productivity</p>
            <p className={`text-2xl font-bold ${getScoreColor(analytics.productivityScore)}`}>
              {analytics.productivityScore.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <Award className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-muted-foreground mb-1">Quality</p>
            <p className={`text-2xl font-bold ${getScoreColor(analytics.qualityIndex)}`}>
              {analytics.qualityIndex.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
            <p className={`text-lg font-bold ${getRiskColor(analytics.riskLevel)}`}>
              {getRiskLabel(analytics.riskLevel)}
            </p>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Efficiency Metrics</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">On-Time Completion</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">?</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>เปอร์เซ็นต์งานที่เสร็จตรงเวลา</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium">{analytics.efficiency.onTimeCompletion.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.efficiency.onTimeCompletion}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">First-Time Pass Rate</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">?</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>เปอร์เซ็นต์งานที่ผ่านการตรวจสอบครั้งแรก</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium">{analytics.efficiency.firstTimePassRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${analytics.efficiency.firstTimePassRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rework Rate</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">?</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>เปอร์เซ็นต์งานที่ต้องแก้ไขซ้ำ (ยิ่งต่ำยิ่งดี)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-medium">{analytics.efficiency.reworkRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  analytics.efficiency.reworkRate > 30 ? "bg-red-500" :
                  analytics.efficiency.reworkRate > 15 ? "bg-orange-500" :
                  "bg-green-500"
                }`}
                style={{ width: `${Math.min(100, analytics.efficiency.reworkRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Insights & Recommendations</h4>
          {analytics.insights.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ไม่มีข้อเสนอแนะในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${getInsightBg(insight.type)}`}
                >
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Trends (Mock Chart) */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Performance Trends</h4>
          <div className="h-32 flex items-end justify-between gap-2 p-4 rounded-lg bg-gradient-to-t from-blue-50 to-transparent border">
            {[65, 72, 68, 75, 80, 78, 85, 82, 88, 90, 87, analytics.performanceIndex].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        value >= 80 ? "bg-green-500" :
                        value >= 60 ? "bg-blue-500" :
                        "bg-orange-500"
                      }`}
                      style={{ height: `${value}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Performance: {value.toFixed(0)}%</p>
                  </TooltipContent>
                </Tooltip>
                {index === 11 && (
                  <span className="text-xs text-muted-foreground">Now</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            แนวโน้มประสิทธิภาพย้อนหลัง 12 ช่วงเวลา
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
