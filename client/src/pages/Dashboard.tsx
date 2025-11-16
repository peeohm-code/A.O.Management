import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { KeyMetrics } from "@/components/dashboard/KeyMetrics";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { WorkOverview } from "@/components/dashboard/WorkOverview";
import { FeaturedProjects } from "@/components/dashboard/FeaturedProjects";
import { ProgressVsPlan } from "@/components/dashboard/ProgressVsPlan";
import { ProgressReportExport } from "@/components/dashboard/ProgressReportExport";
import { AllProjectsTable } from "@/components/dashboard/AllProjectsTable";
import { AllProjectsCards } from "@/components/dashboard/AllProjectsCards";
import { RoleBasedDashboard } from "@/components/dashboard/RoleBasedDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Calendar, X, BarChart3, TrendingUp, TrendingDown, CalendarIcon, LineChart as LineChartIcon } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
} from "@/components/LazyChart";

type DateRange = "today" | "week" | "month" | "quarter" | "all";

export default function Dashboard() {
  // All useState hooks first
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: subMonths(new Date(), 3),
    to: new Date(),
  }));
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Then other hooks
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const statsQuery = trpc.dashboard.getStats.useQuery();
  const projectsQuery = trpc.project.list.useQuery();
  const notificationsQuery = trpc.notification.list.useQuery();
  
  // Analytics queries
  const { data: tasks } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || undefined },
    { enabled: !!selectedProjectId }
  );
  const { data: defects } = trpc.defect.list.useQuery(
    { taskId: tasks?.[0]?.id || 0 },
    { enabled: !!tasks && tasks.length > 0 }
  );
  
  // Analytics calculations - MUST be before early return to avoid hooks order violation
  const progressVsPlanData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const now = new Date();
    return tasks.map((task: any) => {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      const totalDays = differenceInDays(endDate, startDate) || 1;
      const elapsedDays = Math.min(differenceInDays(now, startDate), totalDays);
      const plannedProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
      const actualProgress = task.progress || 0;
      const variance = actualProgress - plannedProgress;

      return {
        name: task.name.length > 20 ? task.name.substring(0, 20) + "..." : task.name,
        planned: Math.round(plannedProgress),
        actual: actualProgress,
        variance: Math.round(variance),
        status: variance >= 0 ? "ahead" : "behind",
      };
    });
  }, [tasks]);

  const velocityTrendData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const data: { date: string; completed: number; total: number }[] = [];
    const startDate = analyticsDateRange.from;
    const endDate = analyticsDateRange.to;
    const days = differenceInDays(endDate, startDate);
    const interval = Math.max(Math.floor(days / 12), 1);

    for (let i = 0; i <= days; i += interval) {
      const currentDate = subDays(endDate, days - i);
      const completedTasks = tasks.filter((task: any) => {
        const updatedAt = new Date(task.updatedAt);
        return task.progress === 100 && updatedAt <= currentDate;
      }).length;

      data.push({
        date: format(currentDate, "dd MMM", { locale: th }),
        completed: completedTasks,
        total: tasks.length,
      });
    }

    return data;
  }, [tasks, analyticsDateRange]);

  const defectTrendData = useMemo(() => {
    if (!defects || defects.length === 0) return [];

    const data: { date: string; created: number; resolved: number }[] = [];
    const startDate = analyticsDateRange.from;
    const endDate = analyticsDateRange.to;
    const days = differenceInDays(endDate, startDate);
    const interval = Math.max(Math.floor(days / 12), 1);

    for (let i = 0; i <= days; i += interval) {
      const currentDate = subDays(endDate, days - i);
      const createdCount = defects.filter((defect: any) => {
        const createdAt = new Date(defect.createdAt);
        return createdAt <= currentDate;
      }).length;

      const resolvedCount = defects.filter((defect: any) => {
        const resolvedAt = defect.resolvedAt ? new Date(defect.resolvedAt) : null;
        return resolvedAt && resolvedAt <= currentDate;
      }).length;

      data.push({
        date: format(currentDate, "dd MMM", { locale: th }),
        created: createdCount,
        resolved: resolvedCount,
      });
    }

    return data;
  }, [defects, analyticsDateRange]);

  const summaryStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.progress === 100).length;
    const avgProgress = tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / totalTasks;
    const onTrackTasks = progressVsPlanData.filter((d: any) => d.status === "ahead").length;
    const behindTasks = progressVsPlanData.filter((d: any) => d.status === "behind").length;

    return {
      totalTasks,
      completedTasks,
      avgProgress: Math.round(avgProgress),
      completionRate: Math.round((completedTasks / totalTasks) * 100),
      onTrackTasks,
      behindTasks,
      onTrackPercentage: Math.round((onTrackTasks / totalTasks) * 100),
    };
  }, [tasks, progressVsPlanData]);

  const handleRefresh = async () => {
    await Promise.all([
      utils.dashboard.getStats.invalidate(),
      utils.project.list.invalidate(),
      utils.notification.list.invalidate(),
    ]);
  };

  // Loading state with Skeleton - MUST be after all hooks
  if (statsQuery.isLoading || projectsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = statsQuery.data;
  const allProjects = projectsQuery.data || [];
  const notifications = notificationsQuery.data || [];

  // Filter projects by date range
  const getDateRangeFilter = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      case "quarter":
        const quarterAgo = new Date();
        quarterAgo.setMonth(now.getMonth() - 3);
        return quarterAgo;
      case "all":
      default:
        return null;
    }
  };

  const filterProjectsByDateRange = (projects: any[]) => {
    const filterDate = getDateRangeFilter(dateRange);
    if (!filterDate) return projects;

    return projects.filter((project: any) => {
      const projectDate = project.createdAt ? new Date(project.createdAt) : null;
      return projectDate && projectDate >= filterDate;
    });
  };

  const filteredProjects = filterProjectsByDateRange(allProjects);

  // Filter active projects only
  const activeProjects = filteredProjects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled"
  );

  const getDateRangeLabel = (range: DateRange): string => {
    switch (range) {
      case "today":
        return "วันนี้";
      case "week":
        return "สัปดาห์นี้";
      case "month":
        return "เดือนนี้";
      case "quarter":
        return "ไตรมาสนี้";
      case "all":
      default:
        return "ทั้งหมด";
    }
  };

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case "7days":
        setAnalyticsDateRange({ from: subDays(now, 7), to: now });
        break;
      case "30days":
        setAnalyticsDateRange({ from: subDays(now, 30), to: now });
        break;
      case "3months":
        setAnalyticsDateRange({ from: subMonths(now, 3), to: now });
        break;
      case "thisMonth":
        setAnalyticsDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container py-8 space-y-8">
        {/* Role-based Dashboard Section */}
        <RoleBasedDashboard />
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Header with Date Range Filter */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2 text-sm md:text-base">
                      ยินดีต้อนรับ, <span className="font-semibold text-gray-800">{user?.name}</span>
                    </p>
                  </div>

                  {/* Date Range Selector */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                    <Calendar className="w-5 h-5 text-[#00366D]" />
                    <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                      <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0">
                        <SelectValue placeholder="เลือกช่วงเวลา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">📅 วันนี้</SelectItem>
                        <SelectItem value="week">📊 สัปดาห์นี้</SelectItem>
                        <SelectItem value="month">📈 เดือนนี้</SelectItem>
                        <SelectItem value="quarter">📉 ไตรมาสนี้</SelectItem>
                        <SelectItem value="all">🌐 ทั้งหมด</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range Info Banner */}
                {dateRange !== "all" && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00366D] rounded-full animate-pulse" />
                      <span className="text-sm text-[#00366D] font-medium">
                        กำลังแสดงข้อมูล: <strong>{getDateRangeLabel(dateRange)}</strong>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange("all")}
                      className="text-[#00366D] hover:text-blue-800 hover:bg-blue-100"
                    >
                      <X className="w-4 h-4 mr-1" />
                      แสดงทั้งหมด
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Key Metrics */}
            <KeyMetrics 
              stats={stats as any || { projectStats: { active: 0, onTrack: 0, at_risk: 0, delayed: 0, total: 0 }, trends: { active: 0, onTrack: 0, at_risk: 0, delayed: 0 } }} 
              projects={filteredProjects} 
            />

            {/* Featured Projects */}
            <FeaturedProjects projects={activeProjects} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <ProgressVsPlan projects={allProjects} />
                <WorkOverview stats={stats || {}} />
                <div className="hidden md:block">
                  <AllProjectsTable projects={activeProjects} />
                </div>
                <div className="md:hidden">
                  <AllProjectsCards projects={activeProjects} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="hidden lg:block space-y-6">
                <ProgressReportExport projects={allProjects} />
                <QuickActions />

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      <CardTitle>การแจ้งเตือน</CardTitle>
                    </div>
                    <CardDescription>อัปเดตล่าสุด</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500">ไม่มีการแจ้งเตือน</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((notif: any) => (
                          <div
                            key={notif.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("th-TH")}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <Badge variant="default" className="text-xs">ใหม่</Badge>
                            )}
                          </div>
                        ))}
                        {notifications.length > 5 && (
                          <Link href="/notifications">
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              ดูทั้งหมด ({notifications.length})
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Mobile Quick Actions */}
            <div className="lg:hidden">
              <QuickActions />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Analytics & Reports</h2>
              <p className="text-muted-foreground mt-1">
                วิเคราะห์ความคืบหน้าและประสิทธิภาพของโครงการ
              </p>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>ตัวกรอง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Project Filter */}
                  <div className="space-y-2">
                    <Label>เลือกโครงการ</Label>
                    <Select
                      value={selectedProjectId?.toString() || ""}
                      onValueChange={(value) => setSelectedProjectId(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกโครงการ" />
                      </SelectTrigger>
                      <SelectContent>
                        {allProjects?.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <Label>ช่วงเวลา</Label>
                    <div className="flex gap-2">
                      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(analyticsDateRange.from, "dd MMM yyyy", { locale: th })} -{" "}
                            {format(analyticsDateRange.to, "dd MMM yyyy", { locale: th })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="p-3 space-y-2">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleQuickDateRange("7days")}>
                                7 วัน
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleQuickDateRange("30days")}>
                                30 วัน
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleQuickDateRange("3months")}>
                                3 เดือน
                              </Button>
                            </div>
                            <CalendarComponent
                              mode="range"
                              selected={{ from: analyticsDateRange.from, to: analyticsDateRange.to }}
                              onSelect={(range: any) => {
                                if (range?.from && range?.to) {
                                  setAnalyticsDateRange({ from: range.from, to: range.to });
                                }
                              }}
                              numberOfMonths={2}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!selectedProjectId ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">กรุณาเลือกโครงการเพื่อดู Analytics</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Statistics */}
                {summaryStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>งานทั้งหมด</CardDescription>
                        <CardTitle className="text-3xl">{summaryStats.totalTasks}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          เสร็จแล้ว {summaryStats.completedTasks} งาน ({summaryStats.completionRate}%)
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>ความคืบหน้าเฉลี่ย</CardDescription>
                        <CardTitle className="text-3xl">{summaryStats.avgProgress}%</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00CE81]"
                            style={{ width: `${summaryStats.avgProgress}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>งานตามแผน</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                          {summaryStats.onTrackTasks}
                          <TrendingUp className="h-6 w-6 text-[#00CE81]" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {summaryStats.onTrackPercentage}% ของงานทั้งหมด
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>งานล่าช้า</CardDescription>
                        <CardTitle className="text-3xl flex items-center gap-2">
                          {summaryStats.behindTasks}
                          <TrendingDown className="h-6 w-6 text-destructive" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {100 - summaryStats.onTrackPercentage}% ของงานทั้งหมด
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Progress vs Plan Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>เปรียบเทียบความคืบหน้า: แผน vs จริง</CardTitle>
                    <CardDescription>
                      แสดงความแตกต่างระหว่างความคืบหน้าตามแผนและความคืบหน้าจริง
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progressVsPlanData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={progressVsPlanData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis label={{ value: "ความคืบหน้า (%)", angle: -90, position: "insideLeft" }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="planned" fill="#94a3b8" name="แผน (%)" />
                          <Bar dataKey="actual" fill="#00CE81" name="จริง (%)" />
                          <Line
                            type="monotone"
                            dataKey="variance"
                            stroke="#ff6b6b"
                            name="ส่วนต่าง (%)"
                            strokeWidth={2}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
                    )}
                  </CardContent>
                </Card>

                {/* Velocity Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>แนวโน้มความเร็วในการทำงาน (Velocity)</CardTitle>
                    <CardDescription>จำนวนงานที่เสร็จสมบูรณ์ตามช่วงเวลา</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {velocityTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={velocityTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            stroke="#00CE81"
                            fill="#00CE81"
                            fillOpacity={0.6}
                            name="งานเสร็จ"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
                    )}
                  </CardContent>
                </Card>

                {/* Defect Trend */}
                {defects && defects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>แนวโน้มข้อบกพร่อง (Defects)</CardTitle>
                      <CardDescription>จำนวนข้อบกพร่องที่พบและแก้ไขตามช่วงเวลา</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={defectTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="created"
                            stroke="#ff6b6b"
                            strokeWidth={2}
                            name="พบข้อบกพร่อง"
                          />
                          <Line
                            type="monotone"
                            dataKey="resolved"
                            stroke="#00CE81"
                            strokeWidth={2}
                            name="แก้ไขแล้ว"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}
