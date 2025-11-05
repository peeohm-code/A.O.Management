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
import { Plus, Trash2, CheckCircle2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface ChecklistsTabProps {
  taskId: number;
}

export function ChecklistsTab({ taskId }: ChecklistsTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [checklistToDelete, setChecklistToDelete] = useState<number | null>(null);

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
    };
    return labels[stage] || stage;
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

  return (
    <div className="space-y-4">
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
              {taskChecklists.map((checklist: any) => (
                <Card key={checklist.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{checklist.templateName}</h4>
                          <Badge variant="outline">
                            {getStageLabel(checklist.stage)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {checklist.items?.length || 0} รายการ
                          </span>
                          {checklist.completedAt ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              ตรวจสอบแล้ว
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Clock className="w-4 h-4" />
                              รอการตรวจสอบ
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChecklistToDelete(checklist.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
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
