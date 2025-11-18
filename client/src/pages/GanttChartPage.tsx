import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import EnhancedGanttChart from "@/components/EnhancedGanttChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function GanttChartPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Queries
  const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery({});
  const { data: tasks, isLoading: tasksLoading } = trpc.task.list.useQuery();
  const { data: criticalPath } = trpc.task.getCriticalPath.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  // Mutation for updating task dates
  const updateTaskMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตวันที่งานสำเร็จ");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  // Filter tasks by selected project
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (!selectedProjectId) return tasks;
    return tasks.filter((task: any) => task.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Transform tasks for Gantt Chart
  const ganttTasks = useMemo(() => {
    return filteredTasks.map((task: any) => ({
      id: task.id,
      name: task.name,
      startDate: new Date(task.startDate),
      endDate: new Date(task.endDate),
      progress: task.progress || 0,
      displayStatus: task.displayStatus || "not_started",
      displayStatusLabel: task.displayStatusLabel || "ยังไม่เริ่ม",
      displayStatusColor: task.displayStatusColor || "#9CA3AF",
      category: task.category,
      isMilestone: false,
    }));
  }, [filteredTasks]);

  // Handle task date update
  const handleTaskUpdate = (taskId: number, startDate: Date, endDate: Date) => {
    updateTaskMutation.mutate({
      id: taskId,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredTasks.length) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        onTrackTasks: 0,
        criticalPathTasks: 0,
      };
    }

    return {
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter((t: any) => t.displayStatus === "completed").length,
      onTrackTasks: filteredTasks.filter((t: any) => t.displayStatus === "on_track").length,
      criticalPathTasks: criticalPath?.criticalPath?.length || 0,
    };
  }, [filteredTasks, criticalPath]);

  const selectedProject = projects?.find((p: any) => p.id === selectedProjectId);

  if (projectsLoading || tasksLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gantt Chart</h1>
          <p className="text-muted-foreground mt-1">
            แผนภูมิแกนต์แสดงความสัมพันธ์และความคืบหน้าของงาน
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>เลือกโครงการ</CardTitle>
            <CardDescription>
              เลือกโครงการเพื่อแสดง Gantt Chart และ dependencies ของงาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId?.toString() || "all"}
              onValueChange={(value) => setSelectedProjectId(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="เลือกโครงการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกโครงการ</SelectItem>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProjectId && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">ในโครงการ {selectedProject?.name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">งานเสร็จสมบูรณ์</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : "0%"} ของงานทั้งหมด
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">งานตามแผน</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.onTrackTasks}</div>
                <p className="text-xs text-muted-foreground">งานที่ดำเนินการตามแผน</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Path</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.criticalPathTasks}</div>
                <p className="text-xs text-muted-foreground">งานสำคัญที่ต้องติดตาม</p>
              </CardContent>
            </Card>
          </div>
        )}

        {ganttTasks.length > 0 ? (
          <EnhancedGanttChart
            tasks={ganttTasks}
            projectId={selectedProjectId || undefined}
            onTaskUpdate={handleTaskUpdate}
          />
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">ไม่มีข้อมูลงาน</p>
              <p className="text-sm">
                {selectedProjectId ? "โครงการนี้ยังไม่มีงาน กรุณาเพิ่มงานในหน้าโครงการ" : "กรุณาเลือกโครงการเพื่อแสดง Gantt Chart"}
              </p>
            </div>
          </Card>
        )}

        {ganttTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>คำอธิบาย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Critical Path - งานสำคัญที่ต้องติดตาม</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">งานทั่วไป</span>
                </div>
                <div className="text-sm text-muted-foreground mt-4">
                  <strong>คำแนะนำ:</strong> คลิกและลากแถบงานเพื่อปรับวันที่เริ่มต้นและสิ้นสุด
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
