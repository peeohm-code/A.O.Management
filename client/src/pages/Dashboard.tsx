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
  Briefcase,
  ListTodo,
  XCircle,
  ArrowRight,
  Bell,
  Flag,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { th } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QualityMetrics } from "@/components/dashboard/QualityMetrics";
import { TeamWorkload } from "@/components/dashboard/TeamWorkload";
import { DocumentStatus } from "@/components/dashboard/DocumentStatus";
import { SafetyCompliance } from "@/components/dashboard/SafetyCompliance";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";

/**
 * Enhanced Dashboard - Construction Management & QC Platform
 * 
 * Phase 1: Must Have Features
 * - Overview Cards (Projects, Tasks, Inspections, Defects)
 * - Tasks Overview
 * - Inspections Overview
 * - Defects Overview
 * - Recent Activity Feed
 * - Upcoming Milestones
 * 
 * Phase 2: Should Have Features
 * - Quality Metrics & Trends
 * - Team Workload
 * - Timeline/Gantt Chart Integration
 * - Document Status
 * 
 * Phase 3: Nice to Have Features
 * - Financial Overview
 * - Safety & Compliance
 * - Advanced Analytics
 * 
 * UX Features:
 * - Progressive Disclosure (expandable sections)
 * - Visual Hierarchy (clear information structure)
 * - Loading States (Skeleton loaders)
 * - Empty States (helpful messages)
 * - Tooltips (contextual help)
 * - Responsive Design (mobile-first)
 * - Color Coding (status-based colors)
 * - Hover Effects (interactive feedback)
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = trpc.project.list.useQuery();
  const { data: allTasks = [], isLoading: tasksLoading } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: allInspections = [], isLoading: inspectionsLoading } = trpc.inspection.listByProject.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: allDefects = [], isLoading: defectsLoading } = trpc.defect.list.useQuery(
    { taskId: 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: activities = [], isLoading: activitiesLoading } = trpc.activity.list.useQuery(
    { projectId: selectedProjectId || 0, limit: 10 },
    { enabled: !!selectedProjectId }
  );
  const { data: allUsers = [] } = trpc.user.list.useQuery();

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

  // === OVERVIEW CARDS STATS ===
  const overviewStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjectsCount = activeProjects.length;
    const completedProjects = projects.filter(p => p.status === "completed").length;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === "completed").length;
    const inProgressTasks = allTasks.filter(t => t.status === "in_progress").length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === "completed") return false;
      if (!t.endDate) return false;
      return isBefore(new Date(t.endDate), new Date());
    }).length;

    const totalInspections = allInspections.length;
    const passedInspections = allInspections.filter(i => i.status === "completed").length;
    const failedInspections = allInspections.filter(i => i.status === "failed").length;
    const pendingInspections = allInspections.filter(i => i.status === "pending_inspection" || i.status === "in_progress").length;

    const totalDefects = allDefects.length;
    const openDefects = allDefects.filter(d => d.status === "open" || d.status === "in_progress").length;
    const resolvedDefects = allDefects.filter(d => d.status === "resolved").length;
    const criticalDefects = allDefects.filter(d => d.severity === "critical" && d.status !== "resolved").length;

    return {
      projects: { total: totalProjects, active: activeProjectsCount, completed: completedProjects },
      tasks: { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, overdue: overdueTasks },
      inspections: { total: totalInspections, passed: passedInspections, failed: failedInspections, pending: pendingInspections },
      defects: { total: totalDefects, open: openDefects, resolved: resolvedDefects, critical: criticalDefects },
    };
  }, [projects, activeProjects, allTasks, allInspections, allDefects]);

  // === TASKS OVERVIEW ===
  const tasksOverview = useMemo(() => {
    const myTasks = allTasks.filter(t => t.assigneeId === user?.id && t.status !== "completed").slice(0, 5);
    const urgentTasks = allTasks.filter(t => t.priority === "urgent" && t.status !== "completed").slice(0, 5);
    const upcomingTasks = allTasks
      .filter(t => {
        if (t.status === "completed" || !t.startDate) return false;
        const startDate = new Date(t.startDate);
        return isAfter(startDate, new Date()) && isBefore(startDate, addDays(new Date(), 7));
      })
      .slice(0, 5);

    return { myTasks, urgentTasks, upcomingTasks };
  }, [allTasks, user]);

  // === INSPECTIONS OVERVIEW ===
  const inspectionsOverview = useMemo(() => {
    const pending = allInspections.filter(i => i.status === "pending_inspection" || i.status === "in_progress").slice(0, 5);
    const recentlyCompleted = allInspections
      .filter(i => i.status === "completed" || i.status === "failed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return { pending, recentlyCompleted };
  }, [allInspections]);

  // === DEFECTS OVERVIEW ===
  const defectsOverview = useMemo(() => {
    const critical = allDefects.filter(d => d.severity === "critical" && d.status !== "resolved").slice(0, 5);
    const recentlyReported = allDefects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return { critical, recentlyReported };
  }, [allDefects]);

  // === UPCOMING MILESTONES ===
  const upcomingMilestones = useMemo(() => {
    return allTasks
      .filter(t => {
        if (!t.endDate || t.status === "completed") return false;
        const endDate = new Date(t.endDate);
        return isAfter(endDate, new Date()) && isBefore(endDate, addDays(new Date(), 30));
      })
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);
  }, [allTasks]);

  // Loading State
  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty State
  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">ยังไม่มีโปรเจกต์</h2>
          <p className="text-muted-foreground mb-6">เริ่มต้นสร้างโปรเจกต์แรกของคุณเพื่อเริ่มใช้งานระบบ</p>
          <Link href="/projects">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              สร้างโปรเจกต์ใหม่
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">ภาพรวมการบริหารจัดการงานก่อสร้างและ QC</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={value => setSelectedProjectId(Number(value))}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="เลือกโปรเจกต์" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || "#3B82F6" }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Projects Card */}
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">โปรเจกต์</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="metric-value text-[#00366D]">{overviewStats.projects.total}</div>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Active: {overviewStats.projects.active}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Done: {overviewStats.projects.completed}</span>
                </div>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tasks Card */}
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">งาน</CardTitle>
              <ListTodo className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="metric-value text-[#00CE81]">{overviewStats.tasks.total}</div>
              <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span>{overviewStats.tasks.completed}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>งานที่เสร็จสมบูรณ์</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>{overviewStats.tasks.inProgress}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>กำลังดำเนินการ</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>{overviewStats.tasks.overdue}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>เกินกำหนด</TooltipContent>
                </Tooltip>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Inspections Card */}
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">การตรวจสอบ</CardTitle>
              <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="metric-value text-[#00366D]">{overviewStats.inspections.total}</div>
              <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span>{overviewStats.inspections.passed}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>ผ่านการตรวจสอบ</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-500" />
                      <span>{overviewStats.inspections.failed}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>ไม่ผ่านการตรวจสอบ</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <span>{overviewStats.inspections.pending}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>รอการตรวจสอบ</TooltipContent>
                </Tooltip>
              </div>
              <Link href="/inspections">
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Defects Card */}
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ข้อบกพร่อง</CardTitle>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="metric-value text-red-600">{overviewStats.defects.total}</div>
              <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>{overviewStats.defects.critical}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>วิกฤติ</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" />
                      <span>{overviewStats.defects.open}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>เปิดอยู่</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span>{overviewStats.defects.resolved}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>แก้ไขแล้ว</TooltipContent>
                </Tooltip>
              </div>
              <Link href="/defects">
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="w-5 h-5" />
                งานของฉัน
              </CardTitle>
              <CardDescription>งานที่ได้รับมอบหมายและต้องดำเนินการ</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : tasksOverview.myTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ไม่มีงานที่ต้องดำเนินการ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasksOverview.myTasks.map(task => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{task.name}</p>
                            {task.priority === "urgent" && (
                              <Badge variant="destructive" className="text-xs">ด่วน</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.endDate ? format(new Date(task.endDate), "dd MMM yyyy", { locale: th }) : "ไม่ระบุ"}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {task.status === "in_progress" ? "กำลังดำเนินการ" : "รอดำเนินการ"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/tasks">
                    <Button variant="outline" className="w-full">
                      ดูงานทั้งหมด
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspections Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                การตรวจสอบที่รอดำเนินการ
              </CardTitle>
              <CardDescription>รายการตรวจสอบที่ต้องดำเนินการ</CardDescription>
            </CardHeader>
            <CardContent>
              {inspectionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : inspectionsOverview.pending.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ไม่มีการตรวจสอบที่รอดำเนินการ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectionsOverview.pending.map(inspection => (
                    <Link key={inspection.id} href={`/inspections/${inspection.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate mb-1">
                            {inspection.templateName || `Inspection #${inspection.id}`}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {inspection.stage === "pre_execution" ? "ก่อนเริ่มงาน" : 
                               inspection.stage === "in_progress" ? "ระหว่างดำเนินการ" : "หลังเสร็จงาน"}
                            </Badge>
                            <span>
                              {formatDistanceToNow(new Date(inspection.createdAt), { addSuffix: true, locale: th })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/inspections">
                    <Button variant="outline" className="w-full">
                      ดูทั้งหมด
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Defects Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                ข้อบกพร่องที่ต้องแก้ไข
              </CardTitle>
              <CardDescription>รายการข้อบกพร่องที่มีความสำคัญสูง</CardDescription>
            </CardHeader>
            <CardContent>
              {defectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : defectsOverview.critical.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                  <p>ไม่มีข้อบกพร่องที่ต้องแก้ไขเร่งด่วน</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {defectsOverview.critical.map(defect => (
                    <Link key={defect.id} href={`/defects/${defect.id}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate mb-1">{defect.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Badge variant="destructive" className="text-xs">
                              {defect.severity === "critical" ? "วิกฤติ" : defect.severity}
                            </Badge>
                            <span>
                              {formatDistanceToNow(new Date(defect.createdAt), { addSuffix: true, locale: th })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/defects">
                    <Button variant="outline" className="w-full">
                      ดูทั้งหมด
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                กิจกรรมล่าสุด
              </CardTitle>
              <CardDescription>อัปเดตล่าสุดในโปรเจกต์</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === "task_created" && <Plus className="w-4 h-4 text-blue-500" />}
                        {activity.type === "task_updated" && <FileText className="w-4 h-4 text-orange-500" />}
                        {activity.type === "task_completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {activity.type === "inspection_completed" && <ClipboardCheck className="w-4 h-4 text-green-500" />}
                        {activity.type === "defect_reported" && <AlertCircle className="w-4 h-4 text-red-500" />}
                        {!["task_created", "task_updated", "task_completed", "inspection_completed", "defect_reported"].includes(activity.type) && (
                          <Bell className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: th })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phase 2: Should Have Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Metrics */}
          <QualityMetrics
            inspections={allInspections}
            defects={allDefects}
            isLoading={inspectionsLoading || defectsLoading}
          />

          {/* Team Workload */}
          <TeamWorkload
            tasks={allTasks}
            users={allUsers}
            isLoading={tasksLoading}
          />
        </div>

        {/* Document Status */}
        <DocumentStatus
          tasks={allTasks}
          inspections={allInspections}
          isLoading={tasksLoading || inspectionsLoading}
        />

        {/* Phase 3: Nice to Have Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Safety & Compliance */}
          <SafetyCompliance
            inspections={allInspections}
            defects={allDefects}
            tasks={allTasks}
            isLoading={inspectionsLoading || defectsLoading}
          />
        </div>

        {/* Advanced Analytics */}
        <AdvancedAnalytics
          project={currentProject}
          tasks={allTasks}
          inspections={allInspections}
          defects={allDefects}
          isLoading={projectsLoading || tasksLoading || inspectionsLoading || defectsLoading}
        />

        {/* Upcoming Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Milestones ที่กำลังจะถึง
            </CardTitle>
            <CardDescription>งานสำคัญที่จะครบกำหนดใน 30 วันข้างหน้า</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : upcomingMilestones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มี Milestones ที่กำลังจะถึง</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMilestones.map(task => {
                  const daysUntilDue = Math.ceil(
                    (new Date(task.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysUntilDue <= 7;

                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className={`p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${
                        isUrgent ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <Flag className={`w-5 h-5 ${isUrgent ? "text-red-500" : "text-blue-500"}`} />
                          <Badge variant={isUrgent ? "destructive" : "default"} className="text-xs">
                            {daysUntilDue} วัน
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-1 truncate">{task.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          ครบกำหนด: {format(new Date(task.endDate!), "dd MMM yyyy", { locale: th })}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{task.progress || 0}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
