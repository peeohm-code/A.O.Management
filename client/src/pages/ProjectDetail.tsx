import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from "@/const";
import CreateTaskDialog from "@/components/CreateTaskDialog";

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ? parseInt(params.id) : 0;
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.listByProject.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const { data: qcChecklists, isLoading: qcLoading } = trpc.qcChecklists.listByProject.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  if (projectLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ไม่พบโครงการ</h3>
            <Link href="/projects">
              <Button variant="outline">กลับไปหน้ารายการโครงการ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskStats = tasks
    ? {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "completed").length,
        inProgress: tasks.filter((t) => t.status === "in_progress").length,
        todo: tasks.filter((t) => t.status === "todo").length,
      }
    : { total: 0, completed: 0, inProgress: 0, todo: 0 };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้ารายการโครงการ
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <Badge className={PROJECT_STATUS_COLORS[project.status]}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              งานทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              เสร็จสิ้น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              กำลังทำ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รอดำเนินการ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{taskStats.todo}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="tasks">งาน ({taskStats.total})</TabsTrigger>
          <TabsTrigger value="qc">QC ({qcChecklists?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดโครงการ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <h4 className="font-semibold mb-2">คำอธิบาย</h4>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {project.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold">สถานที่</h4>
                      <p className="text-muted-foreground">{project.location}</p>
                    </div>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold">งบประมาณ</h4>
                      <p className="text-muted-foreground">
                        {project.budget.toLocaleString('th-TH')} บาท
                      </p>
                    </div>
                  </div>
                )}
                {project.startDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold">วันที่เริ่มต้น</h4>
                      <p className="text-muted-foreground">
                        {new Date(project.startDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-semibold">วันที่สิ้นสุด</h4>
                      <p className="text-muted-foreground">
                        {new Date(project.endDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">งานในโครงการ</h2>
            <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มงาน
            </Button>
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Circle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีงาน</h3>
                <p className="text-muted-foreground text-center mb-4">
                  เริ่มต้นเพิ่มงานเพื่อติดตามความคืบหน้าของโครงการ
                </p>
                <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มงาน
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : task.status === "in_progress" ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <h3 className="font-semibold">{task.title}</h3>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Badge className={TASK_STATUS_COLORS[task.status]}>
                            {TASK_STATUS_LABELS[task.status]}
                          </Badge>
                          <Badge className={TASK_PRIORITY_COLORS[task.priority]}>
                            {TASK_PRIORITY_LABELS[task.priority]}
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString('th-TH')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="qc" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">รายการตรวจสอบคุณภาพ</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่ม QC Checklist
            </Button>
          </div>

          {qcLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !qcChecklists || qcChecklists.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีรายการตรวจสอบ</h3>
                <p className="text-muted-foreground text-center mb-4">
                  สร้างรายการตรวจสอบคุณภาพเพื่อติดตามมาตรฐานการก่อสร้าง
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่ม QC Checklist
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {qcChecklists.map((checklist) => (
                <Card key={checklist.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{checklist.title}</CardTitle>
                        {checklist.category && (
                          <CardDescription>{checklist.category}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {checklist.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {checklist.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={isCreateTaskDialogOpen}
        onOpenChange={setIsCreateTaskDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
