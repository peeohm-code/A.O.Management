import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Calendar, User, CheckCircle2, XCircle, AlertCircle, Eye } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Inspection History Page
 * แสดงประวัติการตรวจสอบทั้งหมดของ Task
 */
export default function InspectionHistory() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/tasks/:taskId/inspections");
  const [, navigate] = useLocation();
  const taskId = params?.taskId ? parseInt(params.taskId) : null;

  // Fetch task info
  const { data: task, isLoading: taskLoading } = trpc.task.get.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );

  // Fetch inspection history
  const { data: inspections, isLoading: inspectionsLoading } = trpc.checklist.getTaskInspectionHistory.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId }
  );

  // Fetch inspection summary
  const { data: summary } = trpc.checklist.getInspectionSummary.useQuery(
    { taskId: taskId! },
    { enabled: !!taskId }
  );

  if (authLoading || taskLoading || inspectionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">ไม่พบข้อมูลงาน</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      not_started: { label: "ยังไม่เริ่ม", variant: "secondary" as const },
      pending_inspection: { label: "รอตรวจสอบ", variant: "default" as const },
      in_progress: { label: "กำลังตรวจสอบ", variant: "default" as const },
      completed: { label: "ผ่าน", variant: "default" as const },
      failed: { label: "ไม่ผ่าน", variant: "destructive" as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    const stageMap = {
      pre_execution: { label: "ก่อนดำเนินการ", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "ระหว่างดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
      post_execution: { label: "หลังดำเนินการ", color: "bg-green-100 text-green-800" },
    };
    const config = stageMap[stage as keyof typeof stageMap] || stageMap.pre_execution;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/tasks/${taskId}`)}
              className="mb-2"
            >
              ← กลับไปที่งาน
            </Button>
            <h1 className="text-3xl font-bold">ประวัติการตรวจสอบ</h1>
            <p className="text-muted-foreground mt-1">
              งาน: {task.name}
            </p>
          </div>
          {task.projectId && (
            <ExportButton projectId={task.projectId} type="inspections" />
          )}
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  การตรวจสอบทั้งหมด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ผ่านการตรวจสอบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {summary.completedCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  ไม่ผ่านการตรวจสอบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">
                    {summary.failedCount}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  อัตราการผ่าน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.total > 0
                    ? Math.round((summary.completedCount / summary.total) * 100)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inspection List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              รายการการตรวจสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!inspections || inspections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มีประวัติการตรวจสอบ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inspections.map((inspection: any) => (
                  <Card key={inspection.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Template Name & Stage */}
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">
                              {inspection.templateName || "ไม่ระบุชื่อ"}
                            </h3>
                            {getStageBadge(inspection.stage)}
                            {getStatusBadge(inspection.status)}
                          </div>

                          {/* Inspector & Date */}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {inspection.inspectorName && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>ผู้ตรวจสอบ: {inspection.inspectorName}</span>
                              </div>
                            )}
                            {inspection.inspectedAt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  ตรวจสอบเมื่อ:{" "}
                                  {format(new Date(inspection.inspectedAt), "d MMM yyyy HH:mm", {
                                    locale: th,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Re-inspection indicator */}
                          {inspection.originalInspectionId && (
                            <Badge variant="outline" className="w-fit">
                              การตรวจสอบซ้ำ (ครั้งที่ {inspection.reinspectionCount + 1})
                            </Badge>
                          )}

                          {/* Comments */}
                          {inspection.generalComments && (
                            <div className="text-sm bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">ความเห็น:</p>
                              <p className="text-muted-foreground whitespace-pre-wrap">
                                {inspection.generalComments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/inspections/${inspection.id}`)}
                          className="ml-4"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
