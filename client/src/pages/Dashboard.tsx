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
  TrendingDown,
  ArrowRight,
  Activity,
  Target,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Dashboard - Construction Management & QC Platform
 * 3-Column Grid Layout with KPI Summary Bar
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Fetch data
  const projectsQuery = trpc.project.list.useQuery();
  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  const projectsLoading = projectsQuery.isLoading;
  
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
    () => projects.filter(p => p.status === "active" && !p.archivedAt),
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!selectedProjectId) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        totalInspections: 0,
        passedInspections: 0,
        failedInspections: 0,
        pendingInspections: 0,
        totalDefects: 0,
        criticalDefects: 0,
        highDefects: 0,
        mediumDefects: 0,
        lowDefects: 0,
        openDefects: 0,
        completionRate: 0,
      };
    }

    // Task statistics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === "completed").length;
    const inProgressTasks = allTasks.filter(t => t.status === "in_progress").length;
    const pendingTasks = allTasks.filter(t => 
      t.status === "todo" || t.status === "not_started"
    ).length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === "completed") return false;
      if (!t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;

    // Inspection statistics (mock data - replace with actual inspection queries)
    const totalInspections = Math.floor(totalTasks * 0.7);
    const passedInspections = Math.floor(totalInspections * 0.8);
    const failedInspections = Math.floor(totalInspections * 0.1);
    const pendingInspections = totalInspections - passedInspections - failedInspections;

    // Defect statistics
    const totalDefects = allDefects.length;
    const criticalDefects = allDefects.filter(d => d.severity === "critical").length;
    const highDefects = allDefects.filter(d => d.severity === "high").length;
    const mediumDefects = allDefects.filter(d => d.severity === "medium").length;
    const lowDefects = allDefects.filter(d => d.severity === "low").length;
    const openDefects = allDefects.filter(d => 
      d.status !== "resolved" && d.status !== "closed"
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      totalInspections,
      passedInspections,
      failedInspections,
      pendingInspections,
      totalDefects,
      criticalDefects,
      highDefects,
      mediumDefects,
      lowDefects,
      openDefects,
      completionRate,
    };
  }, [selectedProjectId, allTasks, allDefects]);

  // Chart data
  const taskChartData = [
    { name: "เสร็จสิ้น", value: stats.completedTasks, color: "#16a34a" },
    { name: "กำลังดำเนินการ", value: stats.inProgressTasks, color: "#eab308" },
    { name: "รอดำเนินการ", value: stats.pendingTasks, color: "#6b7280" },
    { name: "เกินกำหนด", value: stats.overdueTasks, color: "#dc2626" },
  ].filter(item => item.value > 0);

  const inspectionChartData = [
    { name: "ผ่าน", passed: stats.passedInspections, failed: 0, pending: 0 },
    { name: "ไม่ผ่าน", passed: 0, failed: stats.failedInspections, pending: 0 },
    { name: "รอตรวจ", passed: 0, failed: 0, pending: stats.pendingInspections },
  ];

  const defectChartData = [
    { name: "Critical", value: stats.criticalDefects, color: "#dc2626" },
    { name: "High", value: stats.highDefects, color: "#f97316" },
    { name: "Medium", value: stats.mediumDefects, color: "#eab308" },
    { name: "Low", value: stats.lowDefects, color: "#16a34a" },
  ].filter(item => item.value > 0);

  // Recent activities
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
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(task => {
        activities.push({
          type: "task",
          title: "งานเสร็จสิ้น",
          description: task.name,
          time: new Date(task.updatedAt),
          link: `/tasks/${task.id}`,
        });
      });

    // Recent defects
    allDefects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach(defect => {
        activities.push({
          type: "defect",
          title: "รายงานข้อบกพร่อง",
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
          <p className="text-muted-foreground">กำลังโหลด Dashboard...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">ยังไม่มีโครงการ</h2>
          <p className="text-muted-foreground mb-6">
            สร้างโครงการแรกของคุณเพื่อเริ่มต้นใช้งาน
          </p>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              สร้างโครงการ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header with Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#2563eb]">
            📊 Dashboard
          </h1>
          <p className="text-muted-foreground">
            ภาพรวมโครงการ - {currentProject?.name || "เลือกโครงการ"}
          </p>
        </div>
        <Select
          value={selectedProjectId?.toString() || ""}
          onValueChange={value => setSelectedProjectId(Number(value))}
        >
          <SelectTrigger className="w-full lg:w-[320px] h-11 border-2 hover:border-[#2563eb]/50 transition-all shadow-sm hover:shadow-md font-medium">
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

      {!selectedProjectId ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">เลือกโครงการ</h2>
            <p className="text-muted-foreground">
              กรุณาเลือกโครงการเพื่อดูข้อมูลสถิติ
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Tasks KPI */}
            <Card className="border-l-4 border-l-[#2563eb] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  งานทั้งหมด
                </CardTitle>
                <FileText className="h-5 w-5 text-[#2563eb]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#2563eb] mb-2">
                  {stats.totalTasks}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.overdueTasks > 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">
                        {stats.overdueTasks} เกินกำหนด
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        ตามแผน
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563eb] transition-all"
                    style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inspections KPI */}
            <Card className="border-l-4 border-l-[#0891b2] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  การตรวจสอบ
                </CardTitle>
                <ClipboardCheck className="h-5 w-5 text-[#0891b2]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#0891b2] mb-2">
                  {stats.totalInspections}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.passedInspections > stats.failedInspections ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        {stats.passedInspections} ผ่าน
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">
                        {stats.failedInspections} ไม่ผ่าน
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#16a34a] transition-all"
                    style={{ width: `${(stats.passedInspections / stats.totalInspections) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Defects KPI */}
            <Card className="border-l-4 border-l-[#dc2626] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  ข้อบกพร่อง
                </CardTitle>
                <AlertTriangle className="h-5 w-5 text-[#dc2626]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#dc2626] mb-2">
                  {stats.totalDefects}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.criticalDefects > 0 ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">
                        {stats.criticalDefects} Critical
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        ไม่มี Critical
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#dc2626] transition-all"
                    style={{ width: `${(stats.openDefects / stats.totalDefects) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Progress KPI */}
            <Card className="border-l-4 border-l-[#16a34a] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  ความคืบหน้า
                </CardTitle>
                <Target className="h-5 w-5 text-[#16a34a]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#16a34a] mb-2">
                  {stats.completionRate.toFixed(0)}%
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">
                    {stats.completedTasks} / {stats.totalTasks} งาน
                  </span>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      stats.completionRate <= 30
                        ? "bg-red-500"
                        : stats.completionRate <= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href={`/projects/${selectedProjectId}/tasks/new`}>
              <Button className="w-full h-auto flex-col py-4 gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md hover:shadow-lg transition-all">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-semibold">สร้างงาน</span>
              </Button>
            </Link>
            <Link href="/inspections">
              <Button className="w-full h-auto flex-col py-4 gap-2 bg-[#0891b2] hover:bg-[#0e7490] shadow-md hover:shadow-lg transition-all">
                <ClipboardCheck className="h-6 w-6" />
                <span className="text-sm font-semibold">ตรวจสอบ QC</span>
              </Button>
            </Link>
            <Link href="/defects">
              <Button className="w-full h-auto flex-col py-4 gap-2 bg-[#dc2626] hover:bg-[#b91c1c] shadow-md hover:shadow-lg transition-all">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm font-semibold">รายงานข้อบกพร่อง</span>
              </Button>
            </Link>
            <Link href={`/projects/${selectedProjectId}`}>
              <Button className="w-full h-auto flex-col py-4 gap-2 bg-[#16a34a] hover:bg-[#15803d] shadow-md hover:shadow-lg transition-all">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-semibold">ดูโครงการ</span>
              </Button>
            </Link>
          </div>

          {/* 3-Column Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Overview */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#2563eb]" />
                      งานทั้งหมด
                    </CardTitle>
                    <CardDescription className="mt-1">
                      สถานะงานในโครงการ
                    </CardDescription>
                  </div>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm">
                      ดูทั้งหมด
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Donut Chart */}
                {taskChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={taskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {taskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    ไม่มีข้อมูล
                  </div>
                )}

                {/* Quick Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#16a34a]" />
                      <span className="text-sm font-medium">เสร็จสิ้น</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {stats.completedTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#eab308]" />
                      <span className="text-sm font-medium">กำลังดำเนินการ</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {stats.inProgressTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
                      <span className="text-sm font-medium">รอดำเนินการ</span>
                    </div>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {stats.pendingTasks}
                    </Badge>
                  </div>
                  {stats.overdueTasks > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
                        <span className="text-sm font-medium">เกินกำหนด</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {stats.overdueTasks}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inspections Overview */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-[#0891b2]" />
                      การตรวจสอบ
                    </CardTitle>
                    <CardDescription className="mt-1">
                      ผลการตรวจสอบคุณภาพ
                    </CardDescription>
                  </div>
                  <Link href="/inspections">
                    <Button variant="ghost" size="sm">
                      ดูทั้งหมด
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bar Chart */}
                {stats.totalInspections > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={inspectionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="passed" stackId="a" fill="#16a34a" />
                      <Bar dataKey="failed" stackId="a" fill="#dc2626" />
                      <Bar dataKey="pending" stackId="a" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    ไม่มีข้อมูล
                  </div>
                )}

                {/* Quick Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">ผ่าน</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {stats.passedInspections}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">ไม่ผ่าน</span>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {stats.failedInspections}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">รอตรวจสอบ</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {stats.pendingInspections}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Defects Overview */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-[#dc2626]" />
                      ข้อบกพร่อง
                    </CardTitle>
                    <CardDescription className="mt-1">
                      ระดับความรุนแรง
                    </CardDescription>
                  </div>
                  <Link href="/defects">
                    <Button variant="ghost" size="sm">
                      ดูทั้งหมด
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pie Chart */}
                {defectChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={defectChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {defectChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    ไม่มีข้อมูล
                  </div>
                )}

                {/* Quick Stats */}
                <div className="space-y-2">
                  {stats.criticalDefects > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
                        <span className="text-sm font-medium">Critical</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {stats.criticalDefects}
                      </Badge>
                    </div>
                  )}
                  {stats.highDefects > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#f97316]" />
                        <span className="text-sm font-medium">High</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {stats.highDefects}
                      </Badge>
                    </div>
                  )}
                  {stats.mediumDefects > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#eab308]" />
                        <span className="text-sm font-medium">Medium</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {stats.mediumDefects}
                      </Badge>
                    </div>
                  )}
                  {stats.lowDefects > 0 && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#16a34a]" />
                        <span className="text-sm font-medium">Low</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {stats.lowDefects}
                      </Badge>
                    </div>
                  )}
                  {stats.totalDefects === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      ไม่มีข้อบกพร่อง
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          {recentActivities.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#2563eb]" />
                  กิจกรรมล่าสุด
                </CardTitle>
                <CardDescription>
                  อัปเดตล่าสุดในโครงการ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "task"
                            ? "bg-blue-100"
                            : activity.type === "inspection"
                              ? "bg-cyan-100"
                              : "bg-red-100"
                        }`}
                      >
                        {activity.type === "task" ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : activity.type === "inspection" ? (
                          <ClipboardCheck className="h-4 w-4 text-cyan-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(activity.time, {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      </div>
                      {activity.link && (
                        <Link href={activity.link}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
