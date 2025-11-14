import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface NewTaskDialogProps {
  projectId: number;
}

export default function NewTaskDialog({ projectId }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("preparation");
  const [status, setStatus] = useState<string>("todo");
  const [priority, setPriority] = useState<string>("medium");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const utils = trpc.useUtils();
  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างงานใหม่เรียบร้อยแล้ว");
      utils.task.list.invalidate({ projectId });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("ไม่สามารถสร้างงานได้: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setCategory("preparation");
    setStatus("todo");
    setPriority("medium");
    setStartDate("");
    setEndDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    createTaskMutation.mutate({
      projectId,
      name,
      category,
      status: status as any,
      priority: priority as any,
      startDate: startDate, // Already in YYYY-MM-DD format from input[type="date"]
      endDate: endDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างงานใหม่</DialogTitle>
            <DialogDescription>
              เพิ่มงานใหม่ในโครงการ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่องาน *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น งานฐานราก"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">หมวดหมู่ *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">สถานะ *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">ยังไม่เริ่ม</SelectItem>
                    <SelectItem value="ready_to_start">พร้อมเริ่ม</SelectItem>
                    <SelectItem value="in_progress">กำลังทำ</SelectItem>
                    <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                    <SelectItem value="delayed">ล่าช้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">ความสำคัญ *</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">ต่ำ</SelectItem>
                    <SelectItem value="medium">ปานกลาง</SelectItem>
                    <SelectItem value="high">สูง</SelectItem>
                    <SelectItem value="urgent">เร่งด่วน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">วันเริ่มต้น *</Label>
                <DatePicker
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date ? format(date, 'yyyy-MM-dd') : '');
                  }}
                  placeholder="เลือกวันที่เริ่มต้น"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">วันสิ้นสุด *</Label>
                <DatePicker
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date ? format(date, 'yyyy-MM-dd') : '');
                  }}
                  placeholder="เลือกวันที่สิ้นสุด"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? "กำลังสร้าง..." : "สร้างงาน"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
