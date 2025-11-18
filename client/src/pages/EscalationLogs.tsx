import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export default function EscalationLogs() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [filterResolved, setFilterResolved] = useState<string>("all");

  const utils = trpc.useUtils();
  const { data: logs, isLoading } = trpc.escalation.listLogs.useQuery({
    resolved: filterResolved === "all" ? undefined : filterResolved === "resolved",
    limit: 100,
  });

  const resolveMutation = trpc.escalation.resolveLog.useMutation({
    onSuccess: () => {
      toast.success("แก้ไข Escalation สำเร็จ");
      setIsResolveDialogOpen(false);
      setSelectedLog(null);
      utils.escalation.listLogs.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleResolve = (formData: FormData) => {
    if (!selectedLog) return;

    const resolutionNotes = formData.get("resolutionNotes") as string;

    resolveMutation.mutate({
      id: selectedLog.id,
      resolutionNotes: resolutionNotes || undefined,
    });
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case "defect": return "Defect";
      case "inspection": return "การตรวจสอบ";
      case "task": return "งาน";
      default: return type;
    }
  };

  const getEntityTypeBadge = (type: string) => {
    const colors = {
      defect: "bg-red-100 text-red-800",
      inspection: "bg-blue-100 text-blue-800",
      task: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[type as keyof typeof colors]}>{getEntityTypeLabel(type)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-48">
          <Select value={filterResolved} onValueChange={setFilterResolved}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="unresolved">ยังไม่แก้ไข</SelectItem>
              <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">กำลังโหลด...</div>
      ) : logs && logs.length > 0 ? (
        <div className="grid gap-4">
          {logs.map((log: any) => (
            <Card key={log.id} className={log.resolved ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getEntityTypeBadge(log.entityType)}
                      <span className="text-muted-foreground text-sm font-normal">
                        #{log.entityId}
                      </span>
                      {log.resolved ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          แก้ไขแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          รอดำเนินการ
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Escalated {formatDistanceToNow(new Date(log.escalatedAt), { addSuffix: true, locale: th })}
                    </CardDescription>
                  </div>
                  {!log.resolved && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsResolveDialogOpen(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      ทำเครื่องหมายว่าแก้ไขแล้ว
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">โครงการ</div>
                    <div className="font-medium">
                      {log.projectId ? `#${log.projectId}` : "ไม่ระบุ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">งาน</div>
                    <div className="font-medium">
                      {log.taskId ? `#${log.taskId}` : "ไม่ระบุ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">การแจ้งเตือนที่ส่ง</div>
                    <div className="font-medium">{log.notificationsSent} ครั้ง</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">แจ้งเตือนไปยัง</div>
                    <div className="font-medium">
                      {log.escalatedToUserIds ? JSON.parse(log.escalatedToUserIds).length : 0} คน
                    </div>
                  </div>
                </div>
                {log.resolved && log.resolutionNotes && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">หมายเหตุการแก้ไข</div>
                        <div className="text-sm text-muted-foreground mt-1">{log.resolutionNotes}</div>
                        {log.resolvedAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            แก้ไขเมื่อ {formatDistanceToNow(new Date(log.resolvedAt), { addSuffix: true, locale: th })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ยังไม่มีประวัติ Escalation</p>
            <p className="text-sm text-muted-foreground mt-2">
              เมื่อมีการ escalate จะแสดงที่นี่
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleResolve(new FormData(e.currentTarget));
          }}>
            <DialogHeader>
              <DialogTitle>ทำเครื่องหมายว่าแก้ไขแล้ว</DialogTitle>
              <DialogDescription>
                บันทึกหมายเหตุการแก้ไขปัญหา
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resolutionNotes">หมายเหตุการแก้ไข</Label>
                <Textarea
                  id="resolutionNotes"
                  name="resolutionNotes"
                  placeholder="อธิบายว่าได้แก้ไขปัญหาอย่างไร..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={resolveMutation.isPending}>
                {resolveMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
