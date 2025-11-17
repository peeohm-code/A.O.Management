import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Users,
  BarChart3,
  Activity,
  Target,
  Briefcase,
  ListTodo,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DashboardFullSkeleton } from "@/components/skeletons";

/**
 * Dashboard หลัก - แสดงภาพรวมของระบบบริหารโครงการก่อสร้างและ QC
 */
export default function NewDashboard() {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  // Note: recentActivities endpoint not available, using empty array
  const recentActivities: any[] = [];
  const activitiesLoading = false;
  
  // Prepare data for charts from stats
  const taskDistribution = stats?.taskStats ? [
    { status: 'not_started', count: stats.taskStats.not_started },
    { status: 'in_progress', count: stats.taskStats.in_progress },
    { status: 'delayed', count: stats.taskStats.delayed },
    { status: 'completed', count: stats.taskStats.completed },
  ] : [];
  
  const defectDistribution = stats?.defectStats ? [
    { severity: 'high', count: stats.defectStats.overdue || 0 },
    { severity: 'medium', count: stats.defectStats.pendingVerification || 0 },
    { severity: 'low', count: stats.defectStats.closed || 0 },
  ] : [];
  
  const projectProgress: any[] = []; // Not used in current implementation

  // Format activity action to Thai
  const formatActivityAction = (action: string) => {
    const actionMap: Record<string, string> = {
      project_created: "สร้างโครงการ",
      project_updated: "อัปเดตโครงการ",
      task_created: "สร้างงาน",
      task_updated: "อัปเดตงาน",
      task_assigned: "มอบหมายงาน",
      task_completed: "ทำงานเสร็จ",
      defect_created: "รายงานข้อบกพร่อง",
      defect_resolved: "แก้ไขข้อบกพร่อง",
      inspection_completed: "ตรวจสอบเสร็จสิ้น",
    };
    return actionMap[action] || action;
  };

  // Format task status to Thai
  const formatTaskStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      todo: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      completed: "เสร็จสิ้น",
      pending_pre_inspection: "รอตรวจก่อนเริ่ม",
      ready_to_start: "พร้อมเริ่มงาน",
      pending_final_inspection: "รอตรวจสุดท้าย",
      rectification_needed: "ต้องแก้ไข",
      not_started: "ยังไม่เริ่ม",
      delayed: "ล่าช้า",
    };
    return statusMap[status] || status;
  };

  // Format defect severity to Thai
  const formatDefectSeverity = (severity: string) => {
    const severityMap: Record<string, string> = {
      critical: "วิกฤต",
      major: "สำคัญ",
      minor: "เล็กน้อย",
      low: "ต่ำ",
    };
    return severityMap[severity] || severity;
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardFullSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] via-[#006b7a] to-[#00CE81] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            ยินดีต้อนรับ,{" "}
            <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Projects */}
          <Card className="border-l-4 border-l-[#00366D] shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                โครงการที่ดำเนินการ
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00366D] to-[#004d8a] shadow-md">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#00366D] mb-1">
                {stats?.projectStats?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                โครงการที่กำลังทำงาน
              </p>
            </CardContent>
          </Card>

          {/* Total Tasks */}
          <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                งานทั้งหมด
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {stats?.taskStats?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.taskStats?.in_progress || 0} กำลังดำเนินการ ·{" "}
                {stats?.taskStats?.completed || 0} เสร็จสิ้น
              </p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="border-l-4 border-l-[#00CE81] shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                อัตราความสำเร็จ
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00CE81] to-[#00b371] shadow-md">
                <Target className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-[#00CE81] mb-1">
                {stats?.averageProgress?.toFixed(1) || 0}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-[#00CE81] to-[#00b371] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.averageProgress || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                งานล่าช้า
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-600 mb-1">
                {stats?.taskStats?.delayed || 0}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                ต้องดำเนินการทันที
              </p>
            </CardContent>
          </Card>
        </div>

        {/* QC & Defects Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Pending Inspections */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                รอตรวจสอบ QC
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-100">
                <ClipboardCheck className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.checklistStats?.pending_inspection || 0}
              </div>
            </CardContent>
          </Card>

          {/* Open Defects */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                ข้อบกพร่องที่เปิดอยู่
              </CardTitle>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats?.defectStats?.open || 0}
              </div>
            </CardContent>
          </Card>

          {/* Critical Defects */}
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                ข้อบกพร่องวิกฤต
              </CardTitle>
              <div className="p-2 rounded-lg bg-rose-100">
                <AlertCircle className="h-4 w-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600">
                {stats?.defectStats?.overdue || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <Card className="shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#00366D]/10">
                    <Activity className="h-5 w-5 text-[#00366D]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      กิจกรรมล่าสุด
                    </CardTitle>
                    <CardDescription className="text-xs">
                      อัปเดตล่าสุดในระบบ
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00366D] mx-auto"></div>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ยังไม่มีกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-2 rounded-full bg-[#00366D]/10 mt-0.5">
                        <Activity className="h-4 w-4 text-[#00366D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.userName || "ผู้ใช้"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatActivityAction(activity.action)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(activity.createdAt), "dd MMM yyyy, HH:mm", {
                            locale: th,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Progress */}
          <Card className="shadow-lg bg-white/80 backdrop-blur">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-teal-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#00CE81]/10">
                    <BarChart3 className="h-5 w-5 text-[#00CE81]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">
                      ความคืบหน้าโครงการ
                    </CardTitle>
                    <CardDescription className="text-xs">
                      โครงการที่กำลังดำเนินการ
                    </CardDescription>
                  </div>
                </div>
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    ดูทั้งหมด
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {projectProgress.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">ยังไม่มีโครงการที่กำลังดำเนินการ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectProgress.map((project: any) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Link href={`/projects/${project.id}`}>
                          <p className="text-sm font-medium hover:text-[#00366D] transition-colors cursor-pointer">
                            {project.name}
                          </p>
                        </Link>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold"
                        >
                          {project.completionPercentage || 0}%
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-[#00366D] to-[#00CE81] h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${project.completionPercentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-teal-50/20 backdrop-blur border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00CE81]" />
              การดำเนินการด่วน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/projects/new">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-[#00366D]/5 hover:border-[#00366D] transition-all"
                >
                  <Plus className="h-6 w-6 text-[#00366D]" />
                  <span className="text-sm font-medium">สร้างโครงการ</span>
                </Button>
              </Link>
              <Link href="/tasks">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-500/5 hover:border-blue-500 transition-all"
                >
                  <ListTodo className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">จัดการงาน</span>
                </Button>
              </Link>
              <Link href="/inspections">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-500/5 hover:border-purple-500 transition-all"
                >
                  <ClipboardCheck className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">ตรวจสอบ QC</span>
                </Button>
              </Link>
              <Link href="/defects">
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-500/5 hover:border-red-500 transition-all"
                >
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <span className="text-sm font-medium">รายงานข้อบกพร่อง</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
