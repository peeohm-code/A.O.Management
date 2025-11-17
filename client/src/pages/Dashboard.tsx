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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Dashboard - Project-specific Dashboard
 * จัดเรียงข้อมูลตามลำดับความสำคัญ: ข้อมูลโปรเจกต์ → สถิติ → Quick Actions
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } =
    trpc.project.list.useQuery();
  const { data: allTasks = [] } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: allDefects = [] } = trpc.defect.list.useQuery(
    { taskId: 0 },
    { enabled: false }
  );

  // Get active projects
  const activeProjects = useMemo(
    () => projects.filter(p => p.status === "active"),
    [projects]
  );

  // Auto-select first active project if none selected
  const currentProject = useMemo(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
      return activeProjects[0];
    }
    return projects.find(p => p.id === selectedProjectId);
  }, [selectedProjectId, projects, activeProjects]);

  // My Tasks (assigned to current user)
  const myTasks = useMemo(() => {
    if (!user) return [];
    return allTasks
      .filter(
        task => task.assigneeId === user.id && task.status !== "completed"
      )
      .slice(0, 5);
  }, [allTasks, user]);

  // Project Statistics
  const projectStats = useMemo(() => {
    if (!selectedProjectId) return null;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      t => t.status === "completed"
    ).length;
    const inProgressTasks = allTasks.filter(
      t => t.status === "in_progress"
    ).length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === "completed") return false;
      if (!t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;

    const openDefects = allDefects.filter(d => d.status !== "resolved").length;
    const criticalDefects = allDefects.filter(
      d => d.severity === "critical" && d.status !== "resolved"
    ).length;

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      openDefects,
      criticalDefects,
      completionRate,
    };
  }, [selectedProjectId, allTasks, allDefects]);

  // Recent Activities
  const recentActivities = useMemo(() => {
    const activities: Array<{
      type: "task" | "defect" | "inspection";
      title: string;
      description: string;
      time: Date;
      link?: string;
    }> = [];

    // Recent completed tasks
    allTasks
      .filter(t => t.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 3)
      .forEach(task => {
        activities.push({
          type: "task",
          title: "Task Completed",
          description: task.name,
          time: new Date(task.updatedAt),
          link: `/tasks/${task.id}`,
        });
      });

    // Recent defects
    allDefects
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 2)
      .forEach(defect => {
        activities.push({
          type: "defect",
          title: "Defect Reported",
          description: defect.title,
          time: new Date(defect.createdAt),
          link: `/defects/${defect.id}`,
        });
      });

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [allTasks, allDefects]);

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first project to get started
          </p>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header with Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] via-[#006b7a] to-[#00CE81] bg-clip-text text-transparent">
            Project Dashboard
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">{user?.name}</span>
          </p>
        </div>
        <Select
          value={selectedProjectId?.toString() || ""}
          onValueChange={value => setSelectedProjectId(Number(value))}
        >
          <SelectTrigger className="w-full lg:w-[320px] h-11 border-2 hover:border-[#00366D]/50 transition-all shadow-sm hover:shadow-md font-medium">
            <SelectValue placeholder="เลือกโครงการ" />
          </SelectTrigger>
          <SelectContent>
            {activeProjects.map(project => (
              <SelectItem key={project.id} value={project.id.toString()}>
                <span className="font-medium">{project.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Info Card - ข้อมูลสำคัญด้านบนสุด */}
      {currentProject && (
        <Card className="border-l-4 border-l-[#00366D] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-[#00366D] mb-2">
                  {currentProject.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {currentProject.description || "ไม่มีคำอธิบาย"}
                </CardDescription>
              </div>
              <Link href={`/projects/${currentProject.id}`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  ดูรายละเอียด
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              <div>
                <p className="text-gray-600 mb-1 text-xs font-medium">วันเริ่มต้น</p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00366D]" />
                  {format(new Date(currentProject.startDate), "dd MMM yyyy", {
                    locale: th,
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1 text-xs font-medium">วันสิ้นสุด</p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00366D]" />
                  {format(new Date(currentProject.endDate), "dd MMM yyyy", {
                    locale: th,
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1 text-xs font-medium">สถานะ</p>
                <Badge
                  variant={
                    currentProject.status === "active"
                      ? "default"
                      : currentProject.status === "completed"
                        ? "outline"
                        : "secondary"
                  }
                  className="font-semibold"
                >
                  {currentProject.status === "active"
                    ? "กำลังดำเนินการ"
                    : currentProject.status === "completed"
                      ? "เสร็จสิ้น"
                      : "ร่าง"}
                </Badge>
              </div>
              <div>
                <p className="text-gray-600 mb-1 text-xs font-medium">ความคืบหน้า</p>
                <p className="font-semibold text-[#00CE81] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {projectStats?.completionRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - ย้ายขึ้นมาด้านบน */}
      {selectedProjectId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href={`/projects/${selectedProjectId}/tasks/new`}>
            <Button
              className="w-full h-auto flex-col py-4 gap-2 bg-gradient-to-br from-[#00366D] to-[#1e3a8a] hover:shadow-lg transition-all group"
            >
              <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">สร้างงาน</span>
            </Button>
          </Link>
          <Link href={`/inspections`}>
            <Button
              className="w-full h-auto flex-col py-4 gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-lg transition-all group"
            >
              <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">ตรวจสอบ QC</span>
            </Button>
          </Link>
          <Link href={`/defects`}>
            <Button
              className="w-full h-auto flex-col py-4 gap-2 bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg transition-all group"
            >
              <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">รายงานข้อบกพร่อง</span>
            </Button>
          </Link>
          <Link href={`/projects/${selectedProjectId}`}>
            <Button
              className="w-full h-auto flex-col py-4 gap-2 bg-gradient-to-br from-[#00CE81] to-[#00b894] hover:shadow-lg transition-all group"
            >
              <div className="p-2 rounded-full bg-white/20 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">ดูโครงการ</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Project Statistics - สถิติสำคัญ */}
      {projectStats && (
        <div className="grid card-spacing grid-cols-2 lg:grid-cols-4">
          <Card className="card-border card-shadow hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                งานทั้งหมด
              </CardTitle>
              <div className="p-2.5 rounded-lg bg-[#00366D]/10">
                <FileText className="h-5 w-5 text-[#00366D]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="metric-value text-[#00366D]">
                {projectStats.totalTasks}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {projectStats.inProgressTasks} กำลังดำเนินการ · {projectStats.completedTasks} เสร็จสิ้น
              </p>
            </CardContent>
          </Card>

          <Card className="card-border card-shadow hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                ความสำเร็จ
              </CardTitle>
              <div className="p-2.5 rounded-lg bg-[#00CE81]/10">
                <Target className="h-5 w-5 text-[#00CE81]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="metric-value text-[#00CE81]">
                {projectStats.completionRate.toFixed(0)}%
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {projectStats.completedTasks} จาก {projectStats.totalTasks} งาน
                </p>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${projectStats.completionRate}%` }}
                    {...{ [projectStats.completionRate <= 30 ? 'data-progress-low' : projectStats.completionRate <= 70 ? 'data-progress-medium' : 'data-progress-high']: '' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-border card-shadow hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                งานล่าช้า
              </CardTitle>
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="metric-value text-amber-600">
                {projectStats.overdueTasks}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {projectStats.overdueTasks > 0 ? 'ต้องดำเนินการทันที' : 'ไม่มีงานล่าช้า'}
              </p>
            </CardContent>
          </Card>

          <Card className="card-border card-shadow hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                ข้อบกพร่อง
              </CardTitle>
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="metric-value text-red-600">
                {projectStats.openDefects}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {projectStats.criticalDefects} วิกฤต · {projectStats.openDefects - projectStats.criticalDefects} ทั่วไป
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two Column Layout - My Tasks & Recent Activities */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 flex-1">
        {/* My Tasks Section */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-[#00366D]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <div className="p-1.5 rounded-lg bg-[#00366D]/10">
                  <User className="h-4 w-4 text-[#00366D]" />
                </div>
                งานของฉัน
              </CardTitle>
              <Link href="/tasks">
                <Button variant="outline" size="sm">
                  ดูทั้งหมด
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00CE81]/10 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-[#00CE81]" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">ไม่มีงานค้างอยู่</p>
                <p className="text-xs text-gray-600">งานทั้งหมดเสร็จสิ้นแล้ว</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer active:scale-[0.98]">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {task.status === "completed"
                              ? "เสร็จสิ้น"
                              : task.status === "in_progress"
                                ? "กำลังทำ"
                                : task.status === "pending_pre_inspection"
                                  ? "รอตรวจ"
                                  : "ยังไม่เริ่ม"}
                          </Badge>
                          {task.endDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.endDate), "dd MMM", {
                                locale: th,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-[#00CE81]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-1">
              <div className="p-1.5 rounded-lg bg-[#00CE81]/10">
                <Activity className="h-4 w-4 text-[#00CE81]" />
              </div>
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีกิจกรรม</p>
                <p className="text-xs text-gray-600">กิจกรรล่าสุดจะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === "task"
                          ? "bg-[#00366D]/10"
                          : activity.type === "defect"
                            ? "bg-red-500/10"
                            : "bg-blue-500/10"
                      }`}
                    >
                      {activity.type === "task" ? (
                        <CheckCircle2 className="h-4 w-4 text-[#00366D]" />
                      ) : activity.type === "defect" ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(activity.time, {
                          addSuffix: true,
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
      </div>


    </div>
  );
}
