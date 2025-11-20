import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle2, HardHat, FileCheck, Clock } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface SafetyComplianceProps {
  inspections: any[];
  defects: any[];
  tasks: any[];
  isLoading?: boolean;
}

/**
 * Safety & Compliance Component
 * แสดงข้อมูลความปลอดภัยและการปฏิบัติตามมาตรฐาน
 */
export function SafetyCompliance({ inspections, defects, tasks, isLoading }: SafetyComplianceProps) {
  const safetyData = useMemo(() => {
    // Safety inspections (mock - in real app, filter by inspection type)
    const safetyInspections = inspections.filter(i => 
      i.templateName?.toLowerCase().includes("safety") || 
      i.templateName?.toLowerCase().includes("ความปลอดภัย")
    );
    
    const totalSafetyInspections = safetyInspections.length;
    const passedSafetyInspections = safetyInspections.filter(i => i.status === "completed").length;
    const failedSafetyInspections = safetyInspections.filter(i => i.status === "failed").length;
    const safetyComplianceRate = totalSafetyInspections > 0 
      ? (passedSafetyInspections / totalSafetyInspections) * 100 
      : 0;

    // Safety-related defects
    const safetyDefects = defects.filter(d => 
      d.severity === "critical" || 
      d.description?.toLowerCase().includes("safety") ||
      d.description?.toLowerCase().includes("ความปลอดภัย")
    );
    const openSafetyDefects = safetyDefects.filter(d => d.status !== "resolved").length;

    // Days since last incident (mock data)
    const daysSinceLastIncident = 45;

    // Safety score (0-100)
    const safetyScore = Math.min(100, 
      (safetyComplianceRate * 0.6) + 
      ((100 - (openSafetyDefects * 10)) * 0.4)
    );

    // Safety status
    let safetyStatus = "excellent";
    if (safetyScore < 60) safetyStatus = "poor";
    else if (safetyScore < 80) safetyStatus = "good";

    // Recent safety activities
    const recentActivities = [
      ...safetyInspections.map(i => ({
        id: i.id,
        type: "inspection",
        description: `Safety Inspection: ${i.templateName || `#${i.id}`}`,
        status: i.status,
        timestamp: i.updatedAt,
      })),
      ...safetyDefects.map(d => ({
        id: d.id,
        type: "defect",
        description: `Safety Issue: ${d.description}`,
        status: d.status,
        timestamp: d.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      totalSafetyInspections,
      passedSafetyInspections,
      failedSafetyInspections,
      safetyComplianceRate,
      openSafetyDefects,
      daysSinceLastIncident,
      safetyScore,
      safetyStatus,
      recentActivities,
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

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getSafetyStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "ดีเยี่ยม";
      case "good":
        return "ดี";
      default:
        return "ต้องปรับปรุง";
    }
  };

  const getSafetyStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-orange-500";
      default:
        return "bg-red-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Safety & Compliance
        </CardTitle>
        <CardDescription>ความปลอดภัยและการปฏิบัติตามมาตรฐาน</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Safety Score */}
        <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200">
          <Shield className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <p className="text-sm text-muted-foreground mb-2">Safety Score</p>
          <p className={`text-5xl font-bold mb-2 ${getSafetyScoreColor(safetyData.safetyScore)}`}>
            {safetyData.safetyScore.toFixed(0)}
          </p>
          <Badge className={`${getSafetyStatusColor(safetyData.safetyStatus)} text-white`}>
            {getSafetyStatusLabel(safetyData.safetyStatus)}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <HardHat className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-muted-foreground mb-1">Days Safe</p>
            <p className="text-2xl font-bold text-green-600">{safetyData.daysSinceLastIncident}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <FileCheck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">Compliance Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {safetyData.safetyComplianceRate.toFixed(0)}%
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="text-xs text-muted-foreground mb-1">Open Issues</p>
            <p className="text-2xl font-bold text-red-600">{safetyData.openSafetyDefects}</p>
          </div>
        </div>

        {/* Safety Compliance Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Safety Compliance</span>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs">?</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>เปอร์เซ็นต์การตรวจสอบความปลอดภัยที่ผ่านเกณฑ์</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm font-medium">{safetyData.safetyComplianceRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                safetyData.safetyComplianceRate >= 80 ? "bg-green-500" :
                safetyData.safetyComplianceRate >= 60 ? "bg-orange-500" :
                "bg-red-500"
              }`}
              style={{ width: `${safetyData.safetyComplianceRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Passed: {safetyData.passedSafetyInspections}</span>
            <span>Failed: {safetyData.failedSafetyInspections}</span>
            <span>Total: {safetyData.totalSafetyInspections}</span>
          </div>
        </div>

        {/* Safety Checklist */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Safety Requirements</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">PPE Compliance</p>
                <p className="text-xs text-muted-foreground">อุปกรณ์ป้องกันส่วนบุคคลครบถ้วน</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">100%</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Site Safety Signage</p>
                <p className="text-xs text-muted-foreground">ป้ายเตือนความปลอดภัยครบถ้วน</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">100%</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Safety Training</p>
                <p className="text-xs text-muted-foreground">การอบรมความปลอดภัย</p>
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">85%</Badge>
            </div>
            {safetyData.openSafetyDefects > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Open Safety Issues</p>
                  <p className="text-xs text-muted-foreground">ประเด็นความปลอดภัยที่ต้องแก้ไข</p>
                </div>
                <Badge variant="destructive">{safetyData.openSafetyDefects}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Recent Safety Activities */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Recent Safety Activities</h4>
          {safetyData.recentActivities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ยังไม่มีกิจกรรมความปลอดภัย</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {safetyData.recentActivities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  {activity.type === "inspection" ? (
                    <FileCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: th })}
                    </p>
                  </div>
                  <Badge variant={
                    activity.status === "completed" ? "secondary" :
                    activity.status === "failed" || activity.status === "open" ? "destructive" :
                    "outline"
                  } className="text-xs">
                    {activity.status === "completed" ? "ผ่าน" :
                     activity.status === "failed" ? "ไม่ผ่าน" :
                     activity.status === "resolved" ? "แก้ไขแล้ว" :
                     "เปิดอยู่"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
