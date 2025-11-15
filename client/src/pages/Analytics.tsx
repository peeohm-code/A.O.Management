import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon } from "lucide-react";
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
} from "recharts";

export default function Analytics() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Queries
  const { data: projects } = trpc.project.list.useQuery();
  const { data: tasks } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || undefined },
    { enabled: !!selectedProjectId }
  );
  const { data: defects } = trpc.defect.list.useQuery(
    { taskId: tasks?.[0]?.id || 0 },
    { enabled: !!tasks && tasks.length > 0 }
  );

  // Progress vs Plan Comparison Data
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

  // Velocity Trend Data (tasks completed over time)
  const velocityTrendData = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const data: { date: string; completed: number; total: number }[] = [];
    const startDate = dateRange.from;
    const endDate = dateRange.to;
    const days = differenceInDays(endDate, startDate);
    const interval = Math.max(Math.floor(days / 12), 1); // Show max 12 data points

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
  }, [tasks, dateRange]);

  // Defect Trend Data
  const defectTrendData = useMemo(() => {
    if (!defects || defects.length === 0) return [];

    const data: { date: string; created: number; resolved: number }[] = [];
    const startDate = dateRange.from;
    const endDate = dateRange.to;
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
  }, [defects, dateRange]);

  // Summary Statistics
  const summaryStats = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.progress === 100).length;
    const avgProgress = tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / totalTasks;
    const onTrackTasks = progressVsPlanData.filter((d) => d.status === "ahead").length;
    const behindTasks = progressVsPlanData.filter((d) => d.status === "behind").length;

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

  const handleQuickDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case "7days":
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case "30days":
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case "3months":
        setDateRange({ from: subMonths(now, 3), to: now });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">
          วิเคราะห์ความคืบหน้าและประสิทธิภาพของโครงการ
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
                  {projects?.map((project: any) => (
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
                      {format(dateRange.from, "dd MMM yyyy", { locale: th })} -{" "}
                      {format(dateRange.to, "dd MMM yyyy", { locale: th })}
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
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range: any) => {
                          if (range?.from && range?.to) {
                            setDateRange({ from: range.from, to: range.to });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          <Card className="mb-6">
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
          <Card className="mb-6">
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
    </div>
  );
}
