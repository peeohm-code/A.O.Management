import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, FileWarning, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function DefectDashboard() {
  const [, setLocation] = useLocation();
  
  const metricsQuery = trpc.defect.getMetrics.useQuery();
  const statsByStatusQuery = trpc.defect.getStatsByStatus.useQuery();
  const statsByTypeQuery = trpc.defect.getStatsByType.useQuery();
  const statsByPriorityQuery = trpc.defect.getStatsByPriority.useQuery();
  const recentDefectsQuery = trpc.defect.getRecent.useQuery({ limit: 10 });

  const metrics = metricsQuery.data || { total: 0, open: 0, closed: 0, pendingVerification: 0, overdue: 0 };

  // Status labels in Thai
  const statusLabels: Record<string, string> = {
    reported: "รายงานแล้ว",
    action_plan: "กำลังวางแผน",
    assigned: "มอบหมายแล้ว",
    in_progress: "กำลังดำเนินการ",
    implemented: "แก้ไขเสร็จแล้ว",
    verification: "รอตรวจสอบ",
    effectiveness_check: "ตรวจสอบประสิทธิผล",
    closed: "ปิดแล้ว",
  };

  const priorityLabels: Record<string, string> = {
    low: "ต่ำ",
    medium: "ปานกลาง",
    high: "สูง",
    critical: "วิกฤต",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Defect Tracking Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมการจัดการ CAR/NCR/PAR</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ทั้งหมด</CardTitle>
              <FileWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
              <p className="text-xs text-muted-foreground">Total Defects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เปิดอยู่</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.open}</div>
              <p className="text-xs text-muted-foreground">Open Defects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ปิดแล้ว</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.closed}</div>
              <p className="text-xs text-muted-foreground">Closed Defects</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอตรวจสอบ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.pendingVerification}</div>
              <p className="text-xs text-yellow-700">Pending Verification</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เกินกำหนด</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
              <p className="text-xs text-red-700">Overdue</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>สถานะ (Status)</CardTitle>
              <CardDescription>จำนวน Defect แยกตามสถานะ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsByStatusQuery.data?.map((stat: any) => (
                  <div key={stat.status} className="flex items-center justify-between">
                    <span className="text-sm">{statusLabels[stat.status] || stat.status}</span>
                    <Badge variant="secondary">{stat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>ประเภท (Type)</CardTitle>
              <CardDescription>จำนวน CAR/NCR/PAR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsByTypeQuery.data?.map((stat: any) => (
                  <div key={stat.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.type}</span>
                    <Badge variant="secondary">{stat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>ความสำคัญ (Priority)</CardTitle>
              <CardDescription>จำนวนแยกตามความสำคัญ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statsByPriorityQuery.data?.map((stat: any) => (
                  <div key={stat.priority} className="flex items-center justify-between">
                    <span className="text-sm">{priorityLabels[stat.priority] || stat.priority}</span>
                    <Badge className={priorityColors[stat.priority]}>{stat.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Defects */}
        <Card>
          <CardHeader>
            <CardTitle>Defect ล่าสุด</CardTitle>
            <CardDescription>10 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDefectsQuery.data?.map((defect: any) => (
                <div
                  key={defect.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setLocation("/defects")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{defect.type}</Badge>
                      <span className="font-medium">{defect.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{defect.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={priorityColors[defect.priority]}>
                      {priorityLabels[defect.priority]}
                    </Badge>
                    <Badge variant="secondary">
                      {statusLabels[defect.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
