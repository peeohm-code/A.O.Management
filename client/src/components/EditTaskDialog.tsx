import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  projectId: number;
}

export function EditTaskDialog({ open, onOpenChange, task, projectId }: EditTaskDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setCategory(task.category || "");
      setStatus(task.status || "");
      setPriority(task.priority || "");
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
      setEndDate(task.endDate ? new Date(task.endDate).toISOString().split("T")[0] : "");
      setProgress(task.progress || 0);
    }
  }, [task]);

  const updateTask = trpc.task.update.useMutation({
    onSuccess: () => {
      toast.success("อัพเดทงานสำเร็จ");
      utils.task.getByProject.invalidate({ projectId });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบงานสำเร็จ");
      utils.task.getByProject.invalidate({ projectId });
      onOpenChange(false);
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteTask.mutate({ id: task.id });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("กรุณากรอกชื่องาน");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("กรุณาเลือกวันเริ่มต้นและวันสิ้นสุด");
      return;
    }

    // Read progress value directly from DOM input to ensure we get the latest value
    // This handles cases where the input value changes without triggering React's onChange
    const progressInput = document.getElementById('edit-progress') as HTMLInputElement;
    const progressValue = progressInput ? progressInput.value : String(progress);
    
    // Ensure progress is a valid number between 0-100
    const progressNum = parseInt(progressValue, 10);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      toast.error("ความคืบหน้าต้องอยู่ระหว่าง 0-100");
      return;
    }

    updateTask.mutate({
      id: task.id,
      name: name.trim(),
      category,
      status,
      priority,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      progress: progressNum,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>แก้ไขงาน</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">ชื่องาน</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ระบุชื่องาน"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">หมวดหมู่</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparation">งานเตรียมงาน</SelectItem>
                <SelectItem value="structure">งานโครงสร้าง</SelectItem>
                <SelectItem value="architecture">งานสถาปัตย์</SelectItem>
                <SelectItem value="mep">งานระบบ</SelectItem>
                <SelectItem value="other">งานอื่นๆ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">สถานะ</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="edit-status">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">ยังไม่เริ่ม</SelectItem>
                <SelectItem value="in_progress">กำลังทำ</SelectItem>
                <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                <SelectItem value="delayed">ล่าช้า</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-priority">ความสำคัญ</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="edit-priority">
                <SelectValue placeholder="เลือกความสำคัญ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">ต่ำ</SelectItem>
                <SelectItem value="medium">ปานกลาง</SelectItem>
                <SelectItem value="high">สูง</SelectItem>
                <SelectItem value="critical">วิกฤต</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">วันเริ่มต้น</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">วันสิ้นสุด</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-progress">ความคืบหน้า (%)</Label>
            <Input
              id="edit-progress"
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const val = e.target.value;
                // Parse as number, handling leading zeros
                const num = val === '' ? 0 : parseInt(val, 10);
                setProgress(isNaN(num) ? 0 : Math.min(100, Math.max(0, num)));
              }}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ลบงาน
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบงาน "{task?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? "กำลังลบ..." : "ลบงาน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
