import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

/**
 * NewTemplate Page - สร้าง Checklist Template ใหม่
 */
export default function NewTemplate() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<"pre" | "in_progress" | "post">("pre");
  const [items, setItems] = useState<Array<{ description: string; order: number }>>([
    { description: "", order: 1 },
  ]);

  // Create template mutation
  const createTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("สร้าง Template สำเร็จ");
      utils.templates.list.invalidate();
      navigate("/templates");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  // Add item
  const addItem = () => {
    setItems([...items, { description: "", order: items.length + 1 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("ต้องมีอย่างน้อย 1 รายการ");
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    // Re-order
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    setItems(newItems);
  };

  // Update item
  const updateItem = (index: number, description: string) => {
    const newItems = [...items];
    newItems[index].description = description;
    setItems(newItems);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อ Template");
      return;
    }

    if (!stage) {
      toast.error("กรุณาเลือกขั้นตอน");
      return;
    }

    const validItems = items.filter((item) => item.description.trim() !== "");
    if (validItems.length === 0) {
      toast.error("กรุณากรอกรายการตรวจสอบอย่างน้อย 1 รายการ");
      return;
    }

    // Submit
    createTemplate.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      stage,
      items: validItems.map((item, index) => ({
        description: item.description.trim(),
        order: index + 1,
      })),
    });
  };

  // Stage labels
  const stageLabels: Record<string, string> = {
    pre: "ก่อนดำเนินการ",
    in_progress: "ระหว่างดำเนินการ",
    post: "หลังดำเนินการ",
  };

  return (
    <div className="h-full flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] via-[#006b7a] to-[#00CE81] bg-clip-text text-transparent">
            สร้าง Template ใหม่
          </h1>
          <p className="text-base text-muted-foreground">
            สร้าง Checklist Template สำหรับการตรวจสอบคุณภาพงาน
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
            <CardDescription>กรอกข้อมูลพื้นฐานของ Template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                ชื่อ Template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="เช่น ตรวจสอบโครงสร้างก่อนเทคอนกรีต"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                placeholder="อธิบายรายละเอียดของ Template (ไม่บังคับ)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">
                ขั้นตอน <span className="text-red-500">*</span>
              </Label>
              <Select value={stage} onValueChange={(value: any) => setStage(value)}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="เลือกขั้นตอน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre">ก่อนดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">ระหว่างดำเนินการ</SelectItem>
                  <SelectItem value="post">หลังดำเนินการ</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                ขั้นตอนปัจจุบัน: <span className="font-medium">{stageLabels[stage]}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายการตรวจสอบ</CardTitle>
                <CardDescription>
                  เพิ่มรายการที่ต้องการตรวจสอบ (อย่างน้อย 1 รายการ)
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center font-semibold text-muted-foreground">
                  {index + 1}.
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="กรอกรายการที่ต้องการตรวจสอบ..."
                    value={item.description}
                    onChange={(e) => updateItem(index, e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>ยังไม่มีรายการตรวจสอบ</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มรายการแรก
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/templates">
            <Button type="button" variant="outline">
              ยกเลิก
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createTemplate.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {createTemplate.isPending ? "กำลังบันทึก..." : "บันทึก Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
