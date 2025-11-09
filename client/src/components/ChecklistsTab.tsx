import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, FileText, CheckCircle, XCircle, Clock, AlertCircle, Pause } from "lucide-react";
import { toast } from "sonner";

interface ChecklistsTabProps {
  taskId: number;
}

export function ChecklistsTab({ taskId }: ChecklistsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [checklistToDelete, setChecklistToDelete] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: taskChecklists, isLoading: checklistsLoading } = trpc.checklist.getTaskChecklists.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  const { data: templates } = trpc.checklist.listTemplates.useQuery({});

  // Mutations
  const assignChecklistMutation = trpc.checklist.assignToTask.useMutation({
    onSuccess: () => {
      toast.success("เพิ่ม Checklist สำเร็จ");
      utils.checklist.getTaskChecklists.invalidate({ taskId });
      setIsAddDialogOpen(false);
      setSelectedTemplateId("");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const removeChecklistMutation = trpc.checklist.removeFromTask.useMutation({
    onSuccess: () => {
      toast.success("ลบ Checklist สำเร็จ");
      utils.checklist.getTaskChecklists.invalidate({ taskId });
      setChecklistToDelete(null);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.checklist.updateChecklistStatus.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตสถานะสำเร็จ");
      utils.checklist.getTaskChecklists.invalidate({ taskId });
      setEditingStatusId(null);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleAddChecklist = () => {
    if (!selectedTemplateId) {
      toast.error("กรุณาเลือก Checklist Template");
      return;
    }

    assignChecklistMutation.mutate({
      taskId,
      templateId: parseInt(selectedTemplateId),
    });
  };

  const handleRemoveChecklist = (checklistId: number) => {
    removeChecklistMutation.mutate({ id: checklistId });
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      before: "ก่อนเริ่มงาน",
      during: "ระหว่างทำงาน",
      after: "หลังเสร็จงาน",
      pre_execution: "ก่อนเริ่มงาน",
      in_progress: "ระหว่างทำงาน",
      post_execution: "หลังเสร็จงาน",
    };
    return labels[stage] || stage;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: "ยังไม่เริ่ม",
      pending_inspection: "รอการตรวจสอบ",
      in_progress: "กำลังตรวจสอบ",
      completed: "ผ่าน",
      failed: "ไม่ผ่าน",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-700 border-gray-300",
      pending_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      in_progress: "bg-blue-100 text-blue-700 border-blue-300",
      completed: "bg-green-100 text-green-700 border-green-300",
      failed: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (checklistsLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">กำลังโหลด...</p>
        </CardContent>
      </Card>
    );
  }

  // Sort checklists by priority: failed > pending_inspection > in_progress > not_started > completed
  const priorityOrder = { failed: 1, pending_inspection: 2, in_progress: 3, not_started: 4, completed: 5 };
  const sortedChecklists = [...(taskChecklists || [])].sort((a, b) => {
    return (priorityOrder[a.status as keyof typeof priorityOrder] || 99) - (priorityOrder[b.status as keyof typeof priorityOrder] || 99);
  });

  // Calculate statistics
  const stats = {
    total: taskChecklists?.length || 0,
    not_started: taskChecklists?.filter(c => c.status === 'not_started').length || 0,
    pending: taskChecklists?.filter(c => c.status === 'pending_inspection').length || 0,
    in_progress: taskChecklists?.filter(c => c.status === 'in_progress').length || 0,
    completed: taskChecklists?.filter(c => c.status === 'completed').length || 0,
    failed: taskChecklists?.filter(c => c.status === 'failed').length || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'pending_inspection': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'not_started': return <Pause className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      {stats.total > 0 && (
        <div className="flex gap-2 flex-wrap text-sm">
          <Badge variant="outline" className="bg-gray-50">ทั้งหมด: {stats.total}</Badge>
          {stats.not_started > 0 && <Badge variant="outline" className="bg-gray-100">ยังไม่เริ่ม: {stats.not_started}</Badge>}
          {stats.pending > 0 && <Badge variant="outline" className="bg-yellow-100 text-yellow-700">รอตรวจ: {stats.pending}</Badge>}
          {stats.in_progress > 0 && <Badge variant="outline" className="bg-blue-100 text-blue-700">กำลังตรวจ: {stats.in_progress}</Badge>}
          {stats.completed > 0 && <Badge variant="outline" className="bg-green-100 text-green-700">ผ่าน: {stats.completed}</Badge>}
          {stats.failed > 0 && <Badge variant="outline" className="bg-red-100 text-red-700">ไม่ผ่าน: {stats.failed}</Badge>}
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Checklists</CardTitle>
              <CardDescription>
                กำหนด Checklist สำหรับงานนี้
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่ม Checklist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่ม Checklist</DialogTitle>
                  <DialogDescription>
                    เลือก Checklist Template ที่ต้องการกำหนดให้กับงานนี้
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก Checklist Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name} ({getStageLabel(template.stage)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddChecklist} disabled={assignChecklistMutation.isPending}>
                    {assignChecklistMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่ม"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!taskChecklists || taskChecklists.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>ยังไม่มี Checklist กำหนดไว้</p>
              <p className="text-sm mt-1">คลิกปุ่ม "เพิ่ม Checklist" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedChecklists.map((checklist: any) => (
                <Card 
                  key={checklist.id} 
                  className="border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-4">
                    <div 
                      className="flex items-start justify-between cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
                      onClick={(e) => {
                        // Don't expand if clicking on buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        setExpandedChecklistId(expandedChecklistId === checklist.id ? null : checklist.id);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{checklist.templateName}</h4>
                          <Badge variant="outline">
                            {getStageLabel(checklist.stage)}
                          </Badge>
                          <Badge className={`flex items-center gap-1 ${getStatusColor(checklist.status)}`}>
                            {getStatusIcon(checklist.status)}
                            {getStatusLabel(checklist.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {checklist.items?.length || 0} รายการ
                          </span>
                        </div>
                        {/* Request Inspection Button - Only show for not_started status */}
                        {checklist.status === "not_started" && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({
                                  id: checklist.id,
                                  status: 'pending_inspection' as any,
                                });
                              }}
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending ? "กำลังบันทึก..." : "ขอตรวจ →"}
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChecklistToDelete(checklist.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Expanded Checklist Items */}
                    {expandedChecklistId === checklist.id && checklist.items && checklist.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <h5 className="font-semibold text-sm text-gray-700 mb-3">รายการตรวจสอบ:</h5>
                        {checklist.items.map((item: any, index: number) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm">
                            <span className="text-gray-500 min-w-[24px]">{index + 1}.</span>
                            <span className="text-gray-700">{item.itemText}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={checklistToDelete !== null} onOpenChange={() => setChecklistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ Checklist นี้ออกจากงาน? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => checklistToDelete && handleRemoveChecklist(checklistToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              {removeChecklistMutation.isPending ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
