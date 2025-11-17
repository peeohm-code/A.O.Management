import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface QualityMetricsProps {
  inspections: any[];
  defects: any[];
  isLoading?: boolean;
}

/**
 * Quality Metrics & Trends Component
 * แสดงตัวชี้วัดคุณภาพและแนวโน้ม
 */
export function QualityMetrics({ inspections, defects, isLoading }: QualityMetricsProps) {
  const metrics = useMemo(() => {
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => i.status === "completed").length;
    const failedInspections = inspections.filter(i => i.status === "failed").length;
    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;

    const totalDefects = defects.length;
    const criticalDefects = defects.filter(d => d.severity === "critical").length;
    const resolvedDefects = defects.filter(d => d.status === "resolved").length;
    const resolutionRate = totalDefects > 0 ? (resolvedDefects / totalDefects) * 100 : 0;

    // Calculate trends (mock data - in real app, compare with previous period)
    const passRateTrend = 5.2; // +5.2% from last period
    const resolutionRateTrend = -2.1; // -2.1% from last period
    const defectRateTrend = -8.5; // -8.5% (negative is good - fewer defects)

    return {
      passRate,
      passRateTrend,
      resolutionRate,
      resolutionRateTrend,
      defectRateTrend,
      totalInspections,
      passedInspections,
      failedInspections,
      totalDefects,
      criticalDefects,
      resolvedDefects,
    };
  }, [inspections, defects]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number, inverse = false) => {
    if (inverse) {
      // For metrics where decrease is good (e.g., defect rate)
      if (trend < 0) return "text-green-600";
      if (trend > 0) return "text-red-600";
    } else {
      if (trend > 0) return "text-green-600";
      if (trend < 0) return "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Quality Metrics & Trends
        </CardTitle>
        <CardDescription>ตัวชี้วัดคุณภาพและแนวโน้มการปรับปรุง</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pass Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">Inspection Pass Rate</span>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">?</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>เปอร์เซ็นต์การตรวจสอบที่ผ่านเกณฑ์</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(metrics.passRateTrend)}
              <span className={`text-sm font-medium ${getTrendColor(metrics.passRateTrend)}`}>
                {metrics.passRateTrend > 0 ? "+" : ""}{metrics.passRateTrend.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.passRate}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-green-600">{metrics.passRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>ผ่าน: {metrics.passedInspections}</span>
            <span>ไม่ผ่าน: {metrics.failedInspections}</span>
            <span>ทั้งหมด: {metrics.totalInspections}</span>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Defect Resolution Rate</span>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">?</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>เปอร์เซ็นต์ข้อบกพร่องที่แก้ไขแล้ว</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(metrics.resolutionRateTrend)}
              <span className={`text-sm font-medium ${getTrendColor(metrics.resolutionRateTrend)}`}>
                {metrics.resolutionRateTrend > 0 ? "+" : ""}{metrics.resolutionRateTrend.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.resolutionRate}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-blue-600">{metrics.resolutionRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>แก้ไขแล้ว: {metrics.resolvedDefects}</span>
            <span>วิกฤติ: {metrics.criticalDefects}</span>
            <span>ทั้งหมด: {metrics.totalDefects}</span>
          </div>
        </div>

        {/* Defect Rate Trend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-medium">Defect Rate Trend</span>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">?</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>แนวโน้มอัตราข้อบกพร่องเทียบกับช่วงก่อนหน้า</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(metrics.defectRateTrend)}
              <span className={`text-sm font-medium ${getTrendColor(metrics.defectRateTrend, true)}`}>
                {metrics.defectRateTrend > 0 ? "+" : ""}{metrics.defectRateTrend.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">แนวโน้มการปรับปรุง</p>
                <p className="text-lg font-semibold text-green-700">
                  {metrics.defectRateTrend < 0 ? "ดีขึ้น" : "ต้องปรับปรุง"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">เทียบกับช่วงก่อนหน้า</p>
                <p className={`text-2xl font-bold ${getTrendColor(metrics.defectRateTrend, true)}`}>
                  {Math.abs(metrics.defectRateTrend).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Quality Score</p>
              <p className="text-2xl font-bold text-[#00366D]">
                {((metrics.passRate + metrics.resolutionRate) / 2).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Checks</p>
              <p className="text-2xl font-bold text-[#00CE81]">{metrics.totalInspections}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Open Issues</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.totalDefects - metrics.resolvedDefects}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
