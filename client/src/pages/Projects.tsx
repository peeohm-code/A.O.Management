import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Building2, MapPin, Calendar } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Projects() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    status: "planning" as const,
    startDate: "",
    endDate: "",
    budget: "",
  });

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างโครงการสำเร็จ");
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        location: "",
        status: "planning",
        startDate: "",
        endDate: "",
        budget: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      location: formData.location || undefined,
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      budget: formData.budget ? parseInt(formData.budget) * 100 : undefined, // convert to cents
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">โครงการ</h1>
          <p className="text-muted-foreground mt-1">จัดการโครงการก่อสร้างทั้งหมด</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              สร้างโครงการใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>สร้างโครงการใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลโครงการก่อสร้าง</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อโครงการ *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">สถานที่</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">สถานะ</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">วางแผน</SelectItem>
                      <SelectItem value="active">กำลังดำเนินการ</SelectItem>
                      <SelectItem value="on-hold">พักงาน</SelectItem>
                      <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">วันที่เริ่ม</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="budget">งบประมาณ (บาท)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  สร้างโครงการ
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Building2 className="w-8 h-8 text-primary" />
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                      project.status === 'planning' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status === 'active' ? 'กำลังดำเนินการ' :
                       project.status === 'completed' ? 'เสร็จสิ้น' :
                       project.status === 'on-hold' ? 'พักงาน' :
                       project.status === 'planning' ? 'วางแผน' : 'ยกเลิก'}
                    </div>
                  </div>
                  <CardTitle className="mt-4">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'ไม่มีรายละเอียด'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {project.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {project.location}
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(project.startDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                    {project.budget && (
                      <div className="text-muted-foreground">
                        งบประมาณ: {(project.budget / 100).toLocaleString('th-TH')} บาท
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีโครงการ</h3>
            <p className="text-muted-foreground mb-4">เริ่มต้นโดยการสร้างโครงการแรกของคุณ</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างโครงการใหม่
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
