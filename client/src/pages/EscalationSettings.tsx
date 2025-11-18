import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EscalationSettings() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.escalation.listRules.useQuery();

  const createMutation = trpc.escalation.createRule.useMutation({
    onSuccess: () => {
      toast.success("สร้างกฎ Escalation สำเร็จ");
      setIsCreateDialogOpen(false);
      utils.escalation.listRules.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const updateMutation = trpc.escalation.updateRule.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตกฎ Escalation สำเร็จ");
      setIsEditDialogOpen(false);
      setSelectedRule(null);
      utils.escalation.listRules.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deleteMutation = trpc.escalation.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("ลบกฎ Escalation สำเร็จ");
      utils.escalation.listRules.invalidate();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleCreate = (formData: FormData) => {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const triggerType = formData.get("triggerType") as "defect" | "inspection_failed" | "task_overdue";
    const severityLevel = formData.get("severityLevel") as "low" | "medium" | "high" | "critical" | undefined;
    const hoursUntilEscalation = parseInt(formData.get("hoursUntilEscalation") as string);
    const enabled = formData.get("enabled") === "true";

    // รับค่า roles ที่เลือก
    const escalateToRoles: string[] = [];
    if (formData.get("role_admin")) escalateToRoles.push("admin");
    if (formData.get("role_project_manager")) escalateToRoles.push("project_manager");
    if (formData.get("role_owner")) escalateToRoles.push("owner");

    createMutation.mutate({
      name,
      description: description || undefined,
      triggerType,
      severityLevel: severityLevel || undefined,
      hoursUntilEscalation,
      enabled,
      escalateToRoles,
      notificationChannels: ["in_app", "email"],
    });
  };

  const handleUpdate = (formData: FormData) => {
    if (!selectedRule) return;

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const triggerType = formData.get("triggerType") as "defect" | "inspection_failed" | "task_overdue";
    const severityLevel = formData.get("severityLevel") as "low" | "medium" | "high" | "critical" | undefined;
    const hoursUntilEscalation = parseInt(formData.get("hoursUntilEscalation") as string);
    const enabled = formData.get("enabled") === "true";

    const escalateToRoles: string[] = [];
    if (formData.get("role_admin")) escalateToRoles.push("admin");
    if (formData.get("role_project_manager")) escalateToRoles.push("project_manager");
    if (formData.get("role_owner")) escalateToRoles.push("owner");

    updateMutation.mutate({
      id: selectedRule.id,
      name,
      description: description || undefined,
      triggerType,
      severityLevel: severityLevel || undefined,
      hoursUntilEscalation,
      enabled,
      escalateToRoles,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบกฎนี้?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case "defect": return "Defect ที่ยังไม่แก้ไข";
      case "inspection_failed": return "การตรวจสอบที่ไม่ผ่าน";
      case "task_overdue": return "งานที่เกินกำหนด";
      default: return type;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[severity as keyof typeof colors]}>{severity.toUpperCase()}</Badge>;
  };

  if (user?.role !== "admin" && user?.role !== "owner") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ไม่มีสิทธิ์เข้าถึง
            </CardTitle>
            <CardDescription>
              เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถจัดการการตั้งค่า Escalation ได้
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              สร้างกฎใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreate(new FormData(e.currentTarget));
            }}>
              <DialogHeader>
                <DialogTitle>สร้างกฎ Escalation ใหม่</DialogTitle>
                <DialogDescription>
                  กำหนดเงื่อนไขการส่งการแจ้งเตือนไปยังผู้บริหาร
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">ชื่อกฎ *</Label>
                  <Input id="name" name="name" required placeholder="เช่น Critical Defect Escalation" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">คำอธิบาย</Label>
                  <Textarea id="description" name="description" placeholder="อธิบายวัตถุประสงค์ของกฎนี้" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="triggerType">ประเภทเหตุการณ์ *</Label>
                    <Select name="triggerType" required defaultValue="inspection_failed">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection_failed">การตรวจสอบที่ไม่ผ่าน</SelectItem>
                        <SelectItem value="defect">Defect ที่ยังไม่แก้ไข</SelectItem>
                        <SelectItem value="task_overdue">งานที่เกินกำหนด</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="severityLevel">ระดับความรุนแรง</Label>
                    <Select name="severityLevel">
                      <SelectTrigger>
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hoursUntilEscalation">จำนวนชั่วโมงก่อน Escalate *</Label>
                  <Input 
                    id="hoursUntilEscalation" 
                    name="hoursUntilEscalation" 
                    type="number" 
                    min="1" 
                    required 
                    defaultValue="24"
                    placeholder="24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>แจ้งเตือนไปยัง</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="role_admin" name="role_admin" defaultChecked />
                      <label htmlFor="role_admin" className="text-sm font-medium">Admin</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="role_project_manager" name="role_project_manager" />
                      <label htmlFor="role_project_manager" className="text-sm font-medium">Project Manager</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="role_owner" name="role_owner" defaultChecked />
                      <label htmlFor="role_owner" className="text-sm font-medium">Owner</label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="enabled" name="enabled" defaultChecked value="true" />
                  <Label htmlFor="enabled">เปิดใช้งานกฎนี้</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "กำลังสร้าง..." : "สร้างกฎ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">กำลังโหลด...</div>
      ) : rules && rules.length > 0 ? (
        <div className="grid gap-4">
          {rules.map((rule: any) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      {rule.enabled ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="secondary">ปิดใช้งาน</Badge>
                      )}
                    </CardTitle>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRule(rule);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">ประเภทเหตุการณ์</div>
                    <div className="font-medium">{getTriggerTypeLabel(rule.triggerType)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ระดับความรุนแรง</div>
                    <div>{getSeverityBadge(rule.severityLevel) || "ทั้งหมด"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">เวลาก่อน Escalate</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {rule.hoursUntilEscalation} ชั่วโมง
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">แจ้งเตือนไปยัง</div>
                    <div className="font-medium">
                      {rule.escalateToRoles ? JSON.parse(rule.escalateToRoles).join(", ") : "ไม่ระบุ"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ยังไม่มีกฎ Escalation</p>
            <p className="text-sm text-muted-foreground mt-2">
              คลิกปุ่ม "สร้างกฎใหม่" เพื่อเริ่มต้น
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
