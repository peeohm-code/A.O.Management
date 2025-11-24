import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/const";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

export default function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
}: CreateTaskDialogProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: "",
  });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างงานสำเร็จ");
      utils.tasks.listByProject.invalidate({ projectId });
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("กรุณาระบุชื่องาน");
      return;
    }

    createTask.mutate({
      projectId,
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>เพิ่มงานใหม่</DialogTitle>
            <DialogDescription>
              สร้างงานใหม่ในโครงการนี้
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">ชื่องาน *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="เช่น เทพื้นชั้น 1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="อธิบายรายละเอียดงาน"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">ความสำคัญ</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">กำหนดเสร็จ</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "กำลังสร้าง..." : "สร้างงาน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
