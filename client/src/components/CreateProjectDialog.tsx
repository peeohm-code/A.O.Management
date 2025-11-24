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
import { PROJECT_STATUS_LABELS } from "@/const";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    status: "planning" as const,
    startDate: "",
    endDate: "",
    budget: "",
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างโครงการสำเร็จ");
      utils.projects.list.invalidate();
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        location: "",
        status: "planning",
        startDate: "",
        endDate: "",
        budget: "",
      });
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("กรุณาระบุชื่อโครงการ");
      return;
    }

    createProject.mutate({
      name: formData.name,
      description: formData.description || undefined,
      location: formData.location || undefined,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      budget: formData.budget ? parseInt(formData.budget) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างโครงการใหม่</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลโครงการก่อสร้างของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อโครงการ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="เช่น อาคารสำนักงาน ABC"
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
                placeholder="อธิบายรายละเอียดโครงการ"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">สถานที่</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="ที่อยู่หรือสถานที่ตั้งโครงการ"
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
                    {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">งบประมาณ (บาท)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
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
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "กำลังสร้าง..." : "สร้างโครงการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
