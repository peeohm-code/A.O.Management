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

export default function NewProject() {
  const [, setLocation] = useLocation();
  const nameInput = useThaiTextInput("");
  const codeInput = useThaiTextInput("");
  const locationInput = useThaiTextInput("");
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
  });

  const createProject = trpc.project.create.useMutation({
    onSuccess: (data) => {
      toast.success("สร้างโครงการสำเร็จ");
      setLocation(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameInput.value.trim()) {
      toast.error("กรุณากรอกชื่อโครงการ");
      return;
    }

    createProject.mutate({
      name: nameInput.value,
      code: codeInput.value || undefined,
      location: locationInput.value || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    });
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">สร้างโครงการใหม่</h1>
        <p className="text-gray-600 mt-1">กรอกข้อมูลโครงการก่อสร้าง</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโครงการ</CardTitle>
          <CardDescription>กรอกข้อมูลพื้นฐานของโครงการ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่อโครงการ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...nameInput.props}
                placeholder="เช่น อาคารสำนักงาน ABC Tower"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">รหัสโครงการ</Label>
              <Input
                id="code"
                {...codeInput.props}
                placeholder="เช่น PRJ-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">สถานที่</Label>
              <Input
                id="location"
                {...locationInput.props}
                placeholder="เช่น กรุงเทพมหานคร"
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
              <Button type="submit" disabled={createProject.isPending} className="flex-1">
                {createProject.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                สร้างโครงการ
              </Button>
              <Link href="/projects">
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
