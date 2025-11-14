import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InspectionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
  taskName: string;
}

export default function InspectionRequestDialog({
  open,
  onOpenChange,
  taskId,
  taskName,
}: InspectionRequestDialogProps) {
  const [inspectorId, setInspectorId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: users } = trpc.user.list.useQuery();
  const createRequest = trpc.inspectionRequest.create.useMutation({
    onSuccess: () => {
      toast.success("ส่งคำขอตรวจงานเรียบร้อย");
      utils.inspectionRequest.getByTask.invalidate({ taskId });
      onOpenChange(false);
      setInspectorId("");
      setNotes("");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const qcInspectors = users?.filter((u) => u.role === "qc_inspector") || [];

  const handleSubmit = () => {
    if (!inspectorId) {
      toast.error("กรุณาเลือกผู้ตรวจ");
      return;
    }

    createRequest.mutate({
      taskId,
      inspectorId: parseInt(inspectorId),
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ขออนุมัติตรวจงาน</DialogTitle>
          <DialogDescription>
            งาน: {taskName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inspector">ผู้ตรวจ (QC Inspector) *</Label>
            <Select value={inspectorId} onValueChange={setInspectorId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผู้ตรวจ" />
              </SelectTrigger>
              <SelectContent>
                {qcInspectors.map((inspector) => (
                  <SelectItem key={inspector.id} value={inspector.id.toString()}>
                    {inspector.name || inspector.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createRequest.isPending}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRequest.isPending}
          >
            {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ส่งคำขอ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
