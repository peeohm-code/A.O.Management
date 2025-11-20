import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Calendar, DollarSign, Users, Trash2, Archive, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { parseDate } from "@/lib/dateUtils";
import { lazy, Suspense, useState } from "react";

// Lazy load GanttChart component
const GanttChart = lazy(() => import("@/components/GanttChart"));
const EnhancedGanttChart = lazy(() => import("@/components/EnhancedGanttChart"));
import NewTaskDialog from "@/components/NewTaskDialog";
import { CategoryColorPicker } from "@/components/CategoryColorPicker";
import { QCTab } from "@/components/QCTab";
import { ArchiveHistoryTimeline } from "@/components/ArchiveHistoryTimeline";
import { OpenProjectDialog } from "@/components/OpenProjectDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const projectQuery = trpc.project.get.useQuery({ id: projectId }, { enabled: !!projectId });
  const projectTasksQuery = trpc.task.list.useQuery({ projectId }, { enabled: !!projectId });
  const deleteProjectMutation = trpc.project.delete.useMutation();
  const archiveProjectMutation = trpc.project.archive.useMutation();
  const exportExcelMutation = trpc.project.exportExcel.useMutation();
  const exportPDFMutation = trpc.project.exportPDF.useMutation();
  const [isExporting, setIsExporting] = useState(false);
  const [useEnhancedGantt, setUseEnhancedGantt] = useState(false);

  const handleArchiveProject = async () => {
    try {
      await archiveProjectMutation.mutateAsync({ 
        id: projectId,
        reason: "Archived from project detail page"
      });
      toast.success("โครงการถูก archive เรียบร้อยแล้ว");
      setLocation("/projects");
    } catch (error: any) {
      toast.error("ไม่สามารถ archive โครงการได้");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId });
      toast.success("โครงการถูกลบเรียบร้อยแล้ว");
      setLocation("/projects");
    } catch (error: any) {
      if (error.message?.includes("Only administrators")) {
        toast.error("เฉพาะ Admin เท่านั้นที่สามารถลบโครงการได้");
      } else {
        toast.error("ไม่สามารถลบโครงการได้");
      }
    }
  };

  const downloadFile = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await exportExcelMutation.mutateAsync({ id: projectId });
      downloadFile(result.data, result.filename);
      toast.success('ส่งออกไฟล์ Excel สำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถส่งออกไฟล์ได้');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportPDFMutation.mutateAsync({ id: projectId });
      downloadFile(result.data, result.filename);
      toast.success('ส่งออกไฟล์ PDF สำเร็จ');
    } catch (error) {
      toast.error('ไม่สามารถส่งออกไฟล์ได้');
    } finally {
      setIsExporting(false);
    }
  };

  if (projectQuery.isLoading || projectTasksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = projectTasksQuery.data?.items || [];

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending_pre_inspection":
      case "pending_final_inspection":
        return "bg-yellow-100 text-yellow-800";
      case "rectification_needed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalTasks = tasks.length;
  const notStartedTasks = tasks.filter((t: any) => t.displayStatus === "not_started").length;
  const inProgressTasks = tasks.filter((t: any) => t.displayStatus === "in_progress").length;
  const delayedTasks = tasks.filter((t: any) => t.displayStatus === "delayed").length;
  const completedTasks = tasks.filter((t: any) => t.displayStatus === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {project.startDate && parseDate(project.startDate).toLocaleDateString()}
                  {project.startDate && project.endDate && " - "}
                  {project.endDate && parseDate(project.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {project.code && <p className="text-gray-600 mt-1">Code: {project.code}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(project.status)}`}>{project.status}</Badge>
          {/* Open Project Button (only for draft projects) */}
          {project.status === "draft" && (
            <OpenProjectDialog
              projectId={projectId}
              projectName={project.name}
              onSuccess={() => {
                projectQuery.refetch();
                projectTasksQuery.refetch();
              }}
            />
          )}
          {/* Export Buttons */}
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            ส่งออก Excel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            ส่งออก PDF
          </Button>

          {/* Archive Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive โครงการ</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการ archive โครงการ "{project.name}" หรือไม่?
                  <br />
                  โครงการจะถูกซ่อนจากหน้า Dashboard และ Projects แต่ยังสามารถเข้าถึงได้จากหน้า Archive
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchiveProject}>
                  Archive โครงการ
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Delete Button (Admin only) */}
          {user?.role === "admin" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                  ลบโครงการ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบโครงการ</AlertDialogTitle>
                  <AlertDialogDescription>
                    คุณแน่ใจหรือไม่ว่าต้องการลบโครงการ "{project.name}"?
                    <br />
                    <span className="text-red-600 font-semibold">
                      การดำเนินการนี้จะลบข้อมูลทั้งหมดที่เกี่ยวข้อง (งาน, checklist, defects, ความคิดเห็น) และไม่สามารถกู้คืนได้
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    ลบโครงการ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>



      {/* Tasks Summary */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">งานทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ยังไม่เริ่ม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{notStartedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">กำลังทำ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00366D]">{inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ล่าช้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{delayedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">เสร็จสมบูรณ์</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00CE81]">
              {completedTasks}/{totalTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gantt" className="w-full">
        <TabsList>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="qc">QC</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="history">Archive History</TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="space-y-4">
          <div className="flex justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={useEnhancedGantt ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedGantt(true)}
              >
                Enhanced Gantt
              </Button>
              <Button
                variant={!useEnhancedGantt ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEnhancedGantt(false)}
              >
                Simple Gantt
              </Button>
            </div>
            <div className="flex gap-2">
              <CategoryColorPicker projectId={projectId} />
              <NewTaskDialog projectId={projectId} />
            </div>
          </div>
          {tasks.length > 0 && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-96 bg-card rounded-lg border">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }>
              {useEnhancedGantt ? (
                <EnhancedGanttChart
                  tasks={tasks.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    progress: t.progress,
                    displayStatus: t.displayStatus,
                    displayStatusLabel: t.displayStatusLabel,
                    displayStatusColor: t.displayStatusColor,
                    category: t.category,
                  }))}
                  projectId={projectId}
                />
              ) : (
                <GanttChart
                  tasks={tasks.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    progress: t.progress,
                    displayStatus: t.displayStatus,
                    displayStatusLabel: t.displayStatusLabel,
                    displayStatusColor: t.displayStatusColor,
                    category: t.category,
                  }))}
                  projectId={projectId}
                />
              )}
            </Suspense>
          )}
          {tasks.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No tasks in this project</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>รายการงาน</CardTitle>
              <CardDescription>งานทั้งหมดในโครงการ</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{task.name}</h3>
                              {task.description && (
                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                {task.startDate && (
                                   <span>
                                    เริ่ม: {parseDate(task.startDate).toLocaleDateString('th-TH')}
                                  </span>
                                )}
                                {task.endDate && (
                                   <span>
                                    สิ้นสุด: {parseDate(task.endDate).toLocaleDateString('th-TH')}
                                  </span>
                                )}
                                {task.assigneeName && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {task.assigneeName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium">{task.progress}%</div>
                                <div className="text-xs text-gray-500">ความคืบหน้า</div>
                              </div>
                              <Badge className={task.displayStatusColor}>
                                {task.displayStatusLabel}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">ไม่มีงานในโครงการนี้</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc">
          <Card>
            <CardHeader>
              <CardTitle>QC & Inspection</CardTitle>
              <CardDescription>Quality control and inspection records for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <QCTab projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Files and documents related to this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Document management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>Members working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Team information coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <ArchiveHistoryTimeline projectId={projectId} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Files and documents related to this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Documents coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
