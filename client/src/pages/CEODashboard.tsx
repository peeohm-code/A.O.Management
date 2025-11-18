import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DonutChart } from "@tremor/react";

/**
 * CEO Dashboard - Core Features Only
 * แสดงภาพรวมสำคัญของโครงการทั้งหมด
 */
export default function CEODashboard() {
  const { data, isLoading, error } = trpc.dashboard.ceoDashboard.useQuery();

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <CEODashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ไม่พบข้อมูล</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { projectOverview, projectStatus, tasksOverview, inspectionStats, defectStats, alerts } =
    data;

  // Prepare data for Donut Chart
  const projectStatusData = [
    {
      name: "ปกติ",
      value: projectStatus?.onTrack || 0,
      color: "#10B981", // Green
    },
    {
      name: "เสี่ยง",
      value: projectStatus?.atRisk || 0,
      color: "#F59E0B", // Amber
    },
    {
      name: "วิกฤต",
      value: projectStatus?.critical || 0,
      color: "#EF4444", // Red
    },
  ];

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A]">CEO Dashboard</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมโครงการทั้งหมด</p>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="โครงการทั้งหมด"
          value={projectOverview?.total || 0}
          icon="🏗️"
          color="bg-[#1E3A8A]"
        />
        <StatCard
          title="กำลังดำเนินการ"
          value={projectOverview?.active || 0}
          icon="▶️"
          color="bg-[#10B981]"
        />
        <StatCard
          title="ล่าช้า"
          value={projectOverview?.delayed || 0}
          icon="⚠️"
          color="bg-[#F59E0B]"
        />
        <StatCard
          title="เลยกำหนด"
          value={projectOverview?.overdue || 0}
          icon="🔴"
          color="bg-[#EF4444]"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถานะโครงการ</CardTitle>
          </CardHeader>
          <CardContent>
            {projectStatus && projectStatus.total > 0 ? (
              <div className="space-y-4">
                <DonutChart
                  data={projectStatusData}
                  category="value"
                  index="name"
                  colors={["green", "amber", "red"]}
                  className="h-48"
                  showLabel={true}
                />
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-[#10B981]">
                      {projectStatus.onTrack}
                    </div>
                    <div className="text-muted-foreground">ปกติ</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#F59E0B]">
                      {projectStatus.atRisk}
                    </div>
                    <div className="text-muted-foreground">เสี่ยง</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#EF4444]">
                      {projectStatus.critical}
                    </div>
                    <div className="text-muted-foreground">วิกฤต</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ภาพรวมงาน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1E3A8A]">
                    {tasksOverview?.total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">งานทั้งหมด</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#10B981]">
                    {tasksOverview?.completionRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">เสร็จสมบูรณ์</div>
                </div>
              </div>
              <div className="space-y-2">
                <ProgressBar
                  label="เสร็จแล้ว"
                  value={tasksOverview?.completed || 0}
                  total={tasksOverview?.total || 1}
                  color="bg-[#10B981]"
                />
                <ProgressBar
                  label="กำลังทำ"
                  value={tasksOverview?.inProgress || 0}
                  total={tasksOverview?.total || 1}
                  color="bg-[#3B82F6]"
                />
                <ProgressBar
                  label="เลยกำหนด"
                  value={tasksOverview?.overdue || 0}
                  total={tasksOverview?.total || 1}
                  color="bg-[#EF4444]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">การตรวจสอบ QC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#10B981]">
                  {inspectionStats?.passRate || 0}%
                </div>
                <div className="text-sm text-muted-foreground">อัตราผ่าน</div>
              </div>
              <div className="space-y-2">
                <StatRow label="ผ่าน" value={inspectionStats?.passed || 0} color="text-[#10B981]" />
                <StatRow label="ไม่ผ่าน" value={inspectionStats?.failed || 0} color="text-[#EF4444]" />
                <StatRow
                  label="รออนุมัติ"
                  value={inspectionStats?.pending || 0}
                  color="text-[#F59E0B]"
                />
                <StatRow
                  label="ทั้งหมด"
                  value={inspectionStats?.total || 0}
                  color="text-[#64748B]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defect Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อบกพร่อง</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#EF4444]">
                  {defectStats?.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">ข้อบกพร่องที่เปิดอยู่</div>
              </div>
              <div className="space-y-2">
                <StatRow
                  label="🔴 ร้ายแรง"
                  value={defectStats?.critical || 0}
                  color="text-[#EF4444]"
                />
                <StatRow
                  label="🟡 ปานกลาง"
                  value={defectStats?.major || 0}
                  color="text-[#F59E0B]"
                />
                <StatRow
                  label="🟢 เล็กน้อย"
                  value={defectStats?.minor || 0}
                  color="text-[#10B981]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <Card className="border-[#EF4444]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#EF4444]">
              <AlertCircle className="h-5 w-5" />
              แจ้งเตือนและสิ่งที่ต้องดำเนินการ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.severity === "high" ? "destructive" : "default"}
                  className={
                    alert.severity === "high"
                      ? ""
                      : alert.severity === "medium"
                        ? "border-[#F59E0B] bg-[#FEF3C7]"
                        : ""
                  }
                >
                  <AlertDescription className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    {alert.severity === "high" && <span className="text-xs font-semibold">ด่วน</span>}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== Helper Components ====================

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  trend?: number;
}

function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend !== undefined && trend !== 0 && (
                <span
                  className={`text-sm flex items-center ${trend > 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
                >
                  {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {Math.abs(trend)}
                </span>
              )}
            </div>
          </div>
          <div className={`${color} text-white text-3xl p-3 rounded-lg`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: number;
  color: string;
}

function StatRow({ label, value, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ==================== Skeleton Loader ====================

function CEODashboardSkeleton() {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
