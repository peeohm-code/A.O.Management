import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock, XCircle, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface ChecklistInstanceListProps {
  taskId: number;
  onViewInstance?: (instanceId: number) => void;
}

export function ChecklistInstanceList({ taskId, onViewInstance }: ChecklistInstanceListProps) {
  const { data: instances, isLoading } = trpc.checklist.listInstancesByTask.useQuery({ taskId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มี checklist instance</p>
            <p className="text-sm mt-1">สร้าง instance จาก template เพื่อเริ่มต้น</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      in_progress: "secondary",
      not_started: "outline",
    };

    const labels: Record<string, string> = {
      completed: "เสร็จสมบูรณ์",
      failed: "ล้มเหลว",
      in_progress: "กำลังดำเนินการ",
      not_started: "ยังไม่เริ่ม",
      pending_inspection: "รอตรวจสอบ",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      pre_execution: "ก่อนดำเนินการ",
      in_progress: "ระหว่างดำเนินการ",
      post_execution: "หลังดำเนินการ",
    };
    return labels[stage] || stage;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Checklist Instances</span>
          <Badge variant="secondary">{instances.length} รายการ</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {instances.map((instance) => (
            <Card key={instance.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(instance.status)}
                      <span className="font-medium">
                        Instance #{instance.id}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getStageLabel(instance.stage)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      สร้างเมื่อ: {format(new Date(instance.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(instance.status)}
                    {onViewInstance && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewInstance(instance.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ความคืบหน้า</span>
                    <span className="font-medium">{instance.completionPercentage}%</span>
                  </div>
                  <Progress value={instance.completionPercentage} className="h-2" />
                </div>

                {instance.inspectedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ตรวจสอบล่าสุด: {format(new Date(instance.inspectedAt), "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
