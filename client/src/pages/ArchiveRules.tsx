import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ArchiveRules() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectStatus: "",
    daysAfterCompletion: "",
    daysAfterEndDate: "",
  });

  const { data: rules, refetch } = trpc.archiveRules.list.useQuery();
  const createMutation = trpc.archiveRules.create.useMutation();
  const updateMutation = trpc.archiveRules.update.useMutation();
  const deleteMutation = trpc.archiveRules.delete.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        projectStatus: formData.projectStatus as any || undefined,
        daysAfterCompletion: formData.daysAfterCompletion ? parseInt(formData.daysAfterCompletion) : undefined,
        daysAfterEndDate: formData.daysAfterEndDate ? parseInt(formData.daysAfterEndDate) : undefined,
      });
      toast.success("สร้างกฎสำเร็จ!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleUpdate = async () => {
    if (!editingRule) return;
    try {
      await updateMutation.mutateAsync({
        id: editingRule.id,
        name: formData.name,
        description: formData.description || undefined,
        projectStatus: formData.projectStatus as any || undefined,
        daysAfterCompletion: formData.daysAfterCompletion ? parseInt(formData.daysAfterCompletion) : undefined,
        daysAfterEndDate: formData.daysAfterEndDate ? parseInt(formData.daysAfterEndDate) : undefined,
      });
      toast.success("อัปเดตกฎสำเร็จ!");
      setEditingRule(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, enabled: !enabled });
      toast.success(enabled ? "ปิดใช้งานกฎแล้ว" : "เปิดใช้งานกฎแล้ว");
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณต้องการลบกฎนี้หรือไม่?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("ลบกฎสำเร็จ!");
      refetch();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      projectStatus: "",
      daysAfterCompletion: "",
      daysAfterEndDate: "",
    });
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      projectStatus: rule.projectStatus || "",
      daysAfterCompletion: rule.daysAfterCompletion?.toString() || "",
      daysAfterEndDate: rule.daysAfterEndDate?.toString() || "",
    });
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">กฎ Auto-Archive</h1>
          <p className="text-muted-foreground mt-1">
            จัดการกฎสำหรับ archive โครงการอัตโนมัติ
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          สร้างกฎใหม่
        </Button>
      </div>

      <div className="grid gap-4">
        {rules?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              ยังไม่มีกฎ Auto-Archive
            </CardContent>
          </Card>
        )}

        {rules?.map((rule: any) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle>{rule.name}</CardTitle>
                    {rule.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <CardDescription className="mt-2">{rule.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggle(rule.id, rule.enabled)}
                  />
                  <Button variant="outline" size="icon" onClick={() => openEdit(rule)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(rule.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                {rule.projectStatus && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">สถานะโครงการ:</span>
                    <span className="capitalize">{rule.projectStatus}</span>
                  </div>
                )}
                {rule.daysAfterCompletion && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Archive {rule.daysAfterCompletion} วันหลังจากเสร็จสมบูรณ์</span>
                  </div>
                )}
                {rule.daysAfterEndDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Archive {rule.daysAfterEndDate} วันหลังจากวันสิ้นสุด</span>
                  </div>
                )}
                {rule.lastRunAt && (
                  <div className="text-muted-foreground text-xs mt-2">
                    รันล่าสุด: {new Date(rule.lastRunAt).toLocaleString("th-TH")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingRule} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingRule(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "แก้ไขกฎ" : "สร้างกฎใหม่"}</DialogTitle>
            <DialogDescription>
              กำหนดเงื่อนไขสำหรับ archive โครงการอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">ชื่อกฎ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น Archive โครงการเสร็จแล้ว 90 วัน"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายเงื่อนไขของกฎ"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="projectStatus">สถานะโครงการ</Label>
              <Select
                value={formData.projectStatus}
                onValueChange={(value) => setFormData({ ...formData, projectStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ (ไม่บังคับ)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                  <SelectItem value="on_hold">พักงาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="daysAfterCompletion">วันหลังเสร็จสมบูรณ์</Label>
              <Input
                id="daysAfterCompletion"
                type="number"
                value={formData.daysAfterCompletion}
                onChange={(e) => setFormData({ ...formData, daysAfterCompletion: e.target.value })}
                placeholder="เช่น 90"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="daysAfterEndDate">วันหลังวันสิ้นสุด</Label>
              <Input
                id="daysAfterEndDate"
                type="number"
                value={formData.daysAfterEndDate}
                onChange={(e) => setFormData({ ...formData, daysAfterEndDate: e.target.value })}
                placeholder="เช่น 30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false);
              setEditingRule(null);
              resetForm();
            }}>
              ยกเลิก
            </Button>
            <Button onClick={editingRule ? handleUpdate : handleCreate}>
              {editingRule ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
