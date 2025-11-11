import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, User, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface QCTabProps {
  projectId: number;
}

export function QCTab({ projectId }: QCTabProps) {
  const [, setLocation] = useLocation();
  const { data: inspections, isLoading } = trpc.checklist.getByProject.useQuery({ projectId });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "ยังไม่เริ่ม",
      pending_inspection: "รอตรวจ",
      in_progress: "กำลังตรวจ",
      completed: "เสร็จสิ้น",
      failed: "ไม่ผ่าน",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-700",
      pending_inspection: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      not_started: <Clock className="w-3 h-3" />,
      pending_inspection: <AlertCircle className="w-3 h-3" />,
      in_progress: <FileText className="w-3 h-3" />,
      completed: <CheckCircle2 className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,
    };
    return icons[status] || <Clock className="w-3 h-3" />;
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      pre_execution: "ก่อนดำเนินงาน",
      in_progress: "ระหว่างดำเนินงาน",
      post_execution: "หลังดำเนินงาน",
    };
    return labels[stage] || stage;
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "ไม่ระบุ";
    const d = new Date(date);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!inspections || inspections.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-lg">ยังไม่มีรายการตรวจสอบคุณภาพ</p>
        <p className="text-gray-400 text-sm mt-2">
          รายการตรวจสอบจะถูกสร้างอัตโนมัติเมื่อมีการกำหนด Checklist ให้กับงาน
        </p>
      </div>
    );
  }

  // Group by status
  const stats = {
    total: inspections.length,
    notStarted: inspections.filter((i: any) => i.status === "not_started").length,
    pending: inspections.filter((i: any) => i.status === "pending_inspection").length,
    inProgress: inspections.filter((i: any) => i.status === "in_progress").length,
    completed: inspections.filter((i: any) => i.status === "completed").length,
    failed: inspections.filter((i: any) => i.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">ทั้งหมด</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <div className="text-sm text-gray-600">ยังไม่เริ่ม</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอตรวจ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">กำลังตรวจ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">เสร็จสิ้น</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">ไม่ผ่าน</div>
          </CardContent>
        </Card>
      </div>

      {/* Inspection List */}
      <div className="space-y-3">
        {inspections.map((inspection: any) => (
          <Card
            key={inspection.id}
            className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation(`/qc-inspection`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{inspection.templateName}</h4>
                    <Badge variant="outline">{getStageLabel(inspection.stage)}</Badge>
                    <Badge className={`flex items-center gap-1 ${getStatusColor(inspection.status)}`}>
                      {getStatusIcon(inspection.status)}
                      {getStatusLabel(inspection.status)}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">งาน:</span> {inspection.taskName}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {inspection.items?.length || 0} รายการ
                    </span>
                    {inspection.inspectedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        ตรวจเมื่อ: {formatDate(inspection.inspectedAt)}
                      </span>
                    )}
                    {inspection.inspectedBy && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        ผู้ตรวจ: ID {inspection.inspectedBy}
                      </span>
                    )}
                  </div>

                  {inspection.generalComments && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <span className="font-medium">ความคิดเห็น:</span> {inspection.generalComments}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
