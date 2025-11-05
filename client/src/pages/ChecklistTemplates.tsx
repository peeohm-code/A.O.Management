import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

export default function ChecklistTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateStage, setTemplateStage] = useState<"pre_execution" | "in_progress" | "post_execution">("pre_execution");
  const [templateDescription, setTemplateDescription] = useState("");
  const [items, setItems] = useState<Array<{ itemText: string; requirePhoto: boolean; acceptanceCriteria: string; order: number }>>([
    { itemText: "", requirePhoto: false, acceptanceCriteria: "", order: 0 }
  ]);

  const templatesQuery = trpc.checklist.templates.useQuery();
  const createTemplateMutation = trpc.checklist.createTemplate.useMutation();

  const allTemplates = [
    ...(templatesQuery.data?.preExecution || []),
    ...(templatesQuery.data?.inProgress || []),
    ...(templatesQuery.data?.postExecution || []),
  ];

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "pre_execution": return "ก่อนเริ่มงาน";
      case "in_progress": return "ระหว่างทำงาน";
      case "post_execution": return "หลังเสร็จงาน";
      default: return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pre_execution": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "post_execution": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddItem = () => {
    setItems([...items, { itemText: "", requirePhoto: false, acceptanceCriteria: "", order: items.length }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("กรุณากรอกชื่อ Template");
      return;
    }

    const validItems = items.filter(item => item.itemText.trim() !== "");
    if (validItems.length === 0) {
      toast.error("กรุณาเพิ่มรายการตรวจสอบอย่างน้อย 1 รายการ");
      return;
    }

    try {
      await createTemplateMutation.mutateAsync({
        name: templateName,
        category: templateCategory || undefined,
        stage: templateStage,
        description: templateDescription || undefined,
        items: validItems,
      });

      toast.success("สร้าง Checklist Template สำเร็จ");
      setIsCreateDialogOpen(false);
      setTemplateName("");
      setTemplateCategory("");
      setTemplateDescription("");
      setItems([{ itemText: "", requirePhoto: false, acceptanceCriteria: "", order: 0 }]);
      templatesQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Checklist Templates</h1>
          <p className="text-gray-600 mt-1">จัดการแม่แบบ Checklist สำหรับการตรวจสอบคุณภาพ</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              สร้าง Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>สร้าง Checklist Template ใหม่</DialogTitle>
              <DialogDescription>
                กำหนดรายการตรวจสอบที่ใช้ซ้ำได้สำหรับงานต่างๆ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>ชื่อ Template *</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="เช่น การตรวจสอบงานฐานราก"
                />
              </div>
              <div>
                <Label>หมวดหมู่</Label>
                <Input
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="เช่น โครงสร้าง, สถาปัตยกรรม, MEP"
                />
              </div>
              <div>
                <Label>ระยะการตรวจสอบ *</Label>
                <Select value={templateStage} onValueChange={(value: any) => setTemplateStage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_execution">ก่อนเริ่มงาน</SelectItem>
                    <SelectItem value="in_progress">ระหว่างทำงาน</SelectItem>
                    <SelectItem value="post_execution">หลังเสร็จงาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>คำอธิบาย</Label>
                <Textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">รายการตรวจสอบ *</Label>
                  <Button size="sm" variant="outline" onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มรายการ
                  </Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <Label className="text-xs">รายการที่ {index + 1}</Label>
                              <Input
                                value={item.itemText}
                                onChange={(e) => handleItemChange(index, "itemText", e.target.value)}
                                placeholder="รายละเอียดการตรวจสอบ..."
                              />
                            </div>
                            {items.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">เกณฑ์การยอมรับ</Label>
                            <Textarea
                              value={item.acceptanceCriteria}
                              onChange={(e) => handleItemChange(index, "acceptanceCriteria", e.target.value)}
                              placeholder="เกณฑ์ที่ต้องผ่าน..."
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.requirePhoto}
                              onChange={(e) => handleItemChange(index, "requirePhoto", e.target.checked)}
                              className="rounded"
                            />
                            <Label className="text-xs">ต้องแนบรูปภาพ</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  สร้าง Template
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      {templatesQuery.isLoading ? (
        <div className="text-center py-12">กำลังโหลด...</div>
      ) : allTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">ยังไม่มี Checklist Template</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              สร้าง Template แรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.category && (
                      <CardDescription className="mt-1">{template.category}</CardDescription>
                    )}
                  </div>
                  <Badge className={getStageColor(template.stage)}>
                    {getStageLabel(template.stage)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    แก้ไข
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
