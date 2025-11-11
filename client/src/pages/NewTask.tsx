import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useThaiTextInput } from "@/hooks/useThaiTextInput";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NewTask() {
  const [, setLocation] = useLocation();
  const nameInput = useThaiTextInput("");
  const descriptionInput = useThaiTextInput("");
  const [formData, setFormData] = useState({
    projectId: "",
    parentTaskId: "",
    startDate: "",
    endDate: "",
  });

  const projectsQuery = trpc.project.list.useQuery();
  const projects = projectsQuery.data || [];

  const createTask = trpc.task.create.useMutation({
    onSuccess: (data) => {
      toast.success("สร้างงานสำเร็จ");
      setLocation(`/tasks/${data.id}`);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameInput.value.trim()) {
      toast.error("กรุณากรอกชื่องาน");
      return;
    }

    if (!formData.projectId) {
      toast.error("กรุณาเลือกโครงการ");
      return;
    }

    createTask.mutate({
      name: nameInput.value,
      description: descriptionInput.value || undefined,
      projectId: parseInt(formData.projectId),
      parentTaskId: formData.parentTaskId ? parseInt(formData.parentTaskId) : undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    });
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link href="/tasks">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">สร้างงานใหม่</h1>
        <p className="text-gray-600 mt-1">กรอกข้อมูลงานที่ต้องการสร้าง</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลงาน</CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของงาน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">
                โครงการ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโครงการ" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่องาน <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...nameInput.props}
                placeholder="เช่น งานฐานราก"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                {...descriptionInput.props}
                placeholder="อธิบายรายละเอียดของงาน"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">วันที่เริ่มต้น</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">วันที่สิ้นสุด</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createTask.isPending} className="flex-1">
                {createTask.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้างงาน
              </Button>
              <Link href="/tasks">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
