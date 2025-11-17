import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyTasks() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "todo" | "in_progress" | "completed">("all");

  const { data: tasks, isLoading } = trpc.team.getMyTasks.useQuery({
    status: activeTab,
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "todo":
      case "not_started":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "รอดำเนินการ";
      case "not_started":
        return "ยังไม่เริ่ม";
      case "in_progress":
        return "กำลังดำเนินการ";
      case "completed":
        return "เสร็จสิ้น";
      case "pending_pre_inspection":
        return "รอตรวจก่อนเริ่ม";
      case "pending_final_inspection":
        return "รอตรวจสุดท้าย";
      case "rectification_needed":
        return "ต้องแก้ไข";
      case "delayed":
        return "ล่าช้า";
      default:
        return status;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "ด่วนมาก";
      case "high":
        return "สูง";
      case "medium":
        return "ปานกลาง";
      case "low":
        return "ต่ำ";
      default:
        return priority;
    }
  };

  const isOverdue = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  const todoTasks = tasks?.filter(t => t.status === "todo" || t.status === "not_started") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">งานของฉัน</h1>
        <p className="text-muted-foreground mt-1">
          รายการงานทั้งหมดที่ได้รับมอบหมาย
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการงาน</CardTitle>
          <CardDescription>
            งานที่ได้รับมอบหมายทั้งหมด
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">ทั้งหมด ({tasks?.length || 0})</TabsTrigger>
              <TabsTrigger value="todo">รอดำเนินการ ({todoTasks.length})</TabsTrigger>
              <TabsTrigger value="in_progress">กำลังทำ ({inProgressTasks.length})</TabsTrigger>
              <TabsTrigger value="completed">เสร็จสิ้น ({completedTasks.length})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              {!tasks || tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีงานในหมวดนี้
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{task.name}</h3>
                          <Badge variant={getStatusBadgeVariant(task.status)}>
                            {getStatusLabel(task.status)}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          {task.endDate && isOverdue(task.endDate) && task.status !== "completed" && (
                            <Badge variant="destructive">เกินกำหนด</Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>โครงการ: {task.projectName}</span>
                          {task.startDate && (
                            <span>เริ่ม: {new Date(task.startDate).toLocaleDateString("th-TH")}</span>
                          )}
                          {task.endDate && (
                            <span>สิ้นสุด: {new Date(task.endDate).toLocaleDateString("th-TH")}</span>
                          )}
                          {task.progress !== undefined && (
                            <span>ความคืบหน้า: {task.progress}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
