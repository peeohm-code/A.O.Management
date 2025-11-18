import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PERMISSION_MODULES = [
  { key: "projects_view", label: "ดูโครงการ", category: "Projects" },
  { key: "projects_create", label: "สร้างโครงการ", category: "Projects" },
  { key: "projects_edit", label: "แก้ไขโครงการ", category: "Projects" },
  { key: "projects_delete", label: "ลบโครงการ", category: "Projects" },
  { key: "tasks_view", label: "ดูงาน", category: "Tasks" },
  { key: "tasks_create", label: "สร้างงาน", category: "Tasks" },
  { key: "tasks_edit", label: "แก้ไขงาน", category: "Tasks" },
  { key: "tasks_delete", label: "ลบงาน", category: "Tasks" },
  { key: "tasks_assign", label: "มอบหมายงาน", category: "Tasks" },
  { key: "inspections_view", label: "ดูการตรวจสอบ", category: "QC" },
  { key: "inspections_create", label: "สร้างการตรวจสอบ", category: "QC" },
  { key: "inspections_edit", label: "แก้ไขการตรวจสอบ", category: "QC" },
  { key: "inspections_approve", label: "อนุมัติการตรวจสอบ", category: "QC" },
  { key: "defects_view", label: "ดูข้อบกพร่อง", category: "Defects" },
  { key: "defects_create", label: "สร้างข้อบกพร่อง", category: "Defects" },
  { key: "defects_edit", label: "แก้ไขข้อบกพร่อง", category: "Defects" },
  { key: "defects_resolve", label: "แก้ไขข้อบกพร่อง", category: "Defects" },
  { key: "users_view", label: "ดูผู้ใช้", category: "Users" },
  { key: "users_create", label: "สร้างผู้ใช้", category: "Users" },
  { key: "users_edit", label: "แก้ไขผู้ใช้", category: "Users" },
  { key: "users_delete", label: "ลบผู้ใช้", category: "Users" },
  { key: "reports_view", label: "ดูรายงาน", category: "Reports" },
  { key: "reports_export", label: "ส่งออกรายงาน", category: "Reports" },
];

interface RoleTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: any;
  onSuccess: () => void;
}

export default function RoleTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: RoleTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const createMutation = trpc.permissions.createRoleTemplate.useMutation({
    onSuccess: () => {
      toast.success("สร้าง role template สำเร็จ");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const updateMutation = trpc.permissions.updateRoleTemplate.useMutation({
    onSuccess: () => {
      toast.success("อัพเดต role template สำเร็จ");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setPermissions(template.permissions || {});
    } else {
      resetForm();
    }
  }, [template, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPermissions({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อ template");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      permissions,
    };

    if (template?.id) {
      updateMutation.mutate({
        templateId: template.id,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleCategory = (category: string) => {
    const categoryPerms = PERMISSION_MODULES.filter((p) => p.category === category);
    const allChecked = categoryPerms.every((p) => permissions[p.key]);

    const newPermissions = { ...permissions };
    categoryPerms.forEach((p) => {
      newPermissions[p.key] = !allChecked;
    });
    setPermissions(newPermissions);
  };

  const getCategories = () => {
    const categories = new Set(PERMISSION_MODULES.map((p) => p.category));
    return Array.from(categories);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "แก้ไข Role Template" : "สร้าง Role Template"}
          </DialogTitle>
          <DialogDescription>
            กำหนดชื่อและสิทธิ์การใช้งานสำหรับ role template นี้
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Project Manager, QC Inspector"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="อธิบายบทบาทและหน้าที่ของ template นี้"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>สิทธิ์การใช้งาน</Label>
              {getCategories().map((category) => {
                const categoryPerms = PERMISSION_MODULES.filter(
                  (p) => p.category === category
                );
                const checkedCount = categoryPerms.filter((p) => permissions[p.key]).length;
                const allChecked = checkedCount === categoryPerms.length;
                const someChecked = checkedCount > 0 && checkedCount < categoryPerms.length;

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id={`category-${category}`}
                        checked={allChecked}
                        onCheckedChange={() => toggleCategory(category)}
                        className={someChecked ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                      <Label
                        htmlFor={`category-${category}`}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {category}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({checkedCount}/{categoryPerms.length})
                        </span>
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      {categoryPerms.map((perm) => (
                        <div key={perm.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.key}
                            checked={!!permissions[perm.key]}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <Label
                            htmlFor={perm.key}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template?.id ? "บันทึก" : "สร้าง Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
