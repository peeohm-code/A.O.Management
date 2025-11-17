import React, { useState } from "react";
import { useLocation } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useThaiTextInput } from "@/hooks/useThaiTextInput";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

export default function NewTemplate() {
  const [, setLocation] = useLocation();
  
  const templateNameInput = useThaiTextInput("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateStage, setTemplateStage] = useState<"pre_execution" | "in_progress" | "post_execution">("pre_execution");
  const templateDescriptionInput = useThaiTextInput("");
  const [allowGeneralComments, setAllowGeneralComments] = useState(true);
  const [allowPhotos, setAllowPhotos] = useState(true);
  const [items, setItems] = useState<Array<{ itemText: string; order: number }>>([
    { itemText: "", order: 0 }
  ]);

  const createTemplateMutation = trpc.checklist.createTemplate.useMutation();

  const addItem = () => {
    setItems([...items, { itemText: "", order: items.length }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems.map((item, i) => ({ ...item, order: i })));
    }
  };

  const updateItemText = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index].itemText = text;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateNameInput.value.trim()) {
      toast.error("กรุณากรอกชื่อเทมเพลต");
      return;
    }

    const validItems = items.filter(item => item.itemText.trim());
    if (validItems.length === 0) {
      toast.error("กรุณาเพิ่มรายการตรวจสอบอย่างน้อย 1 รายการ");
      return;
    }

    try {
      await createTemplateMutation.mutateAsync({
        name: templateNameInput.value,
        category: templateCategory || null,
        stage: templateStage,
        description: templateDescriptionInput.value || null,
        allowGeneralComments,
        allowPhotos,
        items: validItems.map((item, index) => ({
          itemText: item.itemText,
          order: index,
        })),
      });

      toast.success("สร้างเทมเพลตสำเร็จ");
      setLocation("/templates");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการสร้างเทมเพลต");
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "pre_execution": return "ก่อนเริ่มงาน";
      case "in_progress": return "ระหว่างทำงาน";
      case "post_execution": return "หลังเสร็จงาน";
      default: return stage;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/templates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <div>
          <h1 className="text-3xl font-bold">สร้างเทมเพลตใหม่</h1>
          <p className="text-muted-foreground">สร้างเทมเพลต Checklist สำหรับการตรวจสอบคุณภาพงาน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลเทมเพลต</CardTitle>
            <CardDescription>กรอกข้อมูลพื้นฐานของเทมเพลต</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อเทมเพลต *</Label>
              <Input
                id="name"
                {...templateNameInput}
                placeholder="เช่น การตรวจสอบโครงสร้างคอนกรีต"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">หมวดหมู่</Label>
              <Input
                id="category"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="เช่น โครงสร้าง, ระบบไฟฟ้า, ระบบประปา"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">ช่วงเวลาการตรวจสอบ *</Label>
              <Select
                value={templateStage}
                onValueChange={(value: any) => setTemplateStage(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_execution">
                    {getStageLabel("pre_execution")}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {getStageLabel("in_progress")}
                  </SelectItem>
                  <SelectItem value="post_execution">
                    {getStageLabel("post_execution")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                {...templateDescriptionInput}
                placeholder="อธิบายรายละเอียดของเทมเพลตนี้"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>ตัวเลือกเพิ่มเติม</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowGeneralComments"
                  checked={allowGeneralComments}
                  onCheckedChange={(checked) => setAllowGeneralComments(checked as boolean)}
                />
                <Label htmlFor="allowGeneralComments" className="font-normal cursor-pointer">
                  อนุญาตให้เพิ่มความคิดเห็นทั่วไป
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowPhotos"
                  checked={allowPhotos}
                  onCheckedChange={(checked) => setAllowPhotos(checked as boolean)}
                />
                <Label htmlFor="allowPhotos" className="font-normal cursor-pointer">
                  อนุญาตให้แนบรูปภาพ
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>รายการตรวจสอบ</CardTitle>
            <CardDescription>เพิ่มรายการที่ต้องการตรวจสอบ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={item.itemText}
                    onChange={(e) => updateItemText(index, e.target.value)}
                    placeholder={`รายการที่ ${index + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายการ
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/templates")}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={createTemplateMutation.isPending}
          >
            {createTemplateMutation.isPending ? "กำลังสร้าง..." : "สร้างเทมเพลต"}
          </Button>
        </div>
      </form>
    </div>
  );
}
