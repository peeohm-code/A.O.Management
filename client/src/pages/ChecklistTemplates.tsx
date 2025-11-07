import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

export default function ChecklistTemplates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<any>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateStage, setTemplateStage] = useState<"pre_execution" | "in_progress" | "post_execution">("pre_execution");
  const [templateDescription, setTemplateDescription] = useState("");
  const [allowGeneralComments, setAllowGeneralComments] = useState(true);
  const [allowPhotos, setAllowPhotos] = useState(true);
  const [items, setItems] = useState<Array<{ itemText: string; order: number }>>([
    { itemText: "", order: 0 }
  ]);

  const templatesQuery = trpc.checklist.templates.useQuery();
  const createTemplateMutation = trpc.checklist.createTemplate.useMutation();
  const updateTemplateMutation = trpc.checklist.updateTemplate.useMutation();
  const deleteTemplateMutation = trpc.checklist.deleteTemplate.useMutation();
  
  // Query task checklists for the template being deleted
  const taskChecklistsQuery = trpc.checklist.getTaskChecklistsByTemplateId.useQuery(
    { templateId: deletingTemplateId! },
    { enabled: deletingTemplateId !== null }
  );

  const allTemplates = [
    ...(templatesQuery.data?.preExecution || []),
    ...(templatesQuery.data?.inProgress || []),
    ...(templatesQuery.data?.postExecution || []),
  ];
  
  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = allTemplates;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t: any) => 
        t.name?.toLowerCase().includes(query) ||
        t.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by stage
    if (stageFilter !== 'all') {
      filtered = filtered.filter((t: any) => t.stage === stageFilter);
    }
    
    return filtered;
  }, [allTemplates, searchQuery, stageFilter]);

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
    setItems([...items, { itemText: "", order: items.length }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], itemText: value };
    setItems(newItems);
  };

  const resetForm = () => {
    setTemplateName("");
    setTemplateCategory("");
    setTemplateStage("pre_execution");
    setTemplateDescription("");
    setAllowGeneralComments(true);
    setAllowPhotos(true);
    setItems([{ itemText: "", order: 0 }]);
    setEditingTemplate(null);
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
        allowGeneralComments,
        allowPhotos,
        items: validItems.map((item, index) => ({
          itemText: item.itemText,
          order: index,
        })),
      });

      toast.success("สร้าง Template สำเร็จ");
      setIsCreateDialogOpen(false);
      resetForm();
      templatesQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้าง Template");
      console.error(error);
    }
  };

  const handleEditClick = (template: any) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateCategory(template.category || "");
    setTemplateStage(template.stage);
    setTemplateDescription(template.description || "");
    setAllowGeneralComments(template.allowGeneralComments ?? true);
    setAllowPhotos(template.allowPhotos ?? true);
    setItems(
      template.items && template.items.length > 0
        ? template.items.map((item: any) => ({
            itemText: item.itemText,
            order: item.order,
          }))
        : [{ itemText: "", order: 0 }]
    );
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (template: any) => {
    setDeletingTemplate(template);
    setDeletingTemplateId(template.id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    try {
      await deleteTemplateMutation.mutateAsync({ id: deletingTemplate.id });
      toast.success("ลบ Template สำเร็จ");
      setIsDeleteDialogOpen(false);
      setDeletingTemplate(null);
      setDeletingTemplateId(null);
      templatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบ Template");
      console.error(error);
    }
  };

  const handleUpdateTemplate = async () => {
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
      await updateTemplateMutation.mutateAsync({
        id: editingTemplate.id,
        name: templateName,
        category: templateCategory || undefined,
        stage: templateStage,
        description: templateDescription || undefined,
        allowGeneralComments,
        allowPhotos,
        items: validItems.map((item, index) => ({
          itemText: item.itemText,
          order: index,
        })),
      });

      toast.success("แก้ไข Template สำเร็จ");
      setIsEditDialogOpen(false);
      resetForm();
      templatesQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไข Template");
      console.error(error);
    }
  };

  const renderTemplateForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อ Template *</Label>
        <Input
          id="name"
          placeholder="เช่น การตรวจสอบงานคอนกรีต"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">หมวดหมู่</Label>
        <Select value={templateCategory} onValueChange={setTemplateCategory}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="งานเตรียมงาน">งานเตรียมงาน</SelectItem>
            <SelectItem value="งานโครงสร้าง">งานโครงสร้าง</SelectItem>
            <SelectItem value="งานสถาปัตย์">งานสถาปัตย์</SelectItem>
            <SelectItem value="งานระบบ">งานระบบ</SelectItem>
            <SelectItem value="งานอื่นๆ">งานอื่นๆ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">ระยะการตรวจสอบ *</Label>
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

      <div className="space-y-2">
        <Label htmlFor="description">คำอธิบาย</Label>
        <Textarea
          id="description"
          placeholder="รายละเอียดเพิ่มเติม..."
          value={templateDescription}
          onChange={(e) => setTemplateDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowComments"
              checked={allowGeneralComments}
              onCheckedChange={(checked) => setAllowGeneralComments(checked as boolean)}
            />
            <Label htmlFor="allowComments" className="font-normal cursor-pointer">
              อนุญาตให้เพิ่มความเห็นทั่วไป
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>รายการตรวจสอบ *</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มรายการ
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label>รายการที่ {index + 1}</Label>
                <Input
                  placeholder="รายละเอียดการตรวจสอบ..."
                  value={item.itemText}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            if (editingTemplate) {
              setIsEditDialogOpen(false);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          ยกเลิก
        </Button>
        <Button
          onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
        >
          {editingTemplate ? "บันทึกการแก้ไข" : "สร้าง Template"}
        </Button>
      </div>
    </div>
  );

  if (templatesQuery.isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Checklist Templates</h1>
          <p className="text-muted-foreground mt-1">
            จัดการแม่แบบ Checklist สำหรับการตรวจสอบคุณภาพ
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              สร้าง Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>สร้าง Checklist Template ใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลและเพิ่มรายการตรวจสอบ
              </DialogDescription>
            </DialogHeader>
            {renderTemplateForm()}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>แก้ไข Checklist Template</DialogTitle>
              <DialogDescription>
                แก้ไขรายการตรวจสอบและข้อมูล Template
              </DialogDescription>
            </DialogHeader>
            {renderTemplateForm()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters - Simple style like Tasks page */}
      <div className="mb-6 flex gap-4">
        {/* Search Box */}
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        {/* Stage Filter Dropdown */}
        <Select 
          value={stageFilter} 
          onValueChange={setStageFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="pre_execution">ก่อนเริ่มงาน</SelectItem>
            <SelectItem value="in_progress">ระหว่างทำงาน</SelectItem>
            <SelectItem value="post_execution">หลังเสร็จงาน</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Active Filters Display */}
      {(searchQuery || stageFilter !== 'all') && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">กรองโดย:</span>
            {searchQuery && (
              <Badge variant="secondary">
                ค้นหา: "{searchQuery}"
              </Badge>
            )}
            {stageFilter !== 'all' && (
              <Badge variant="secondary">
                ระยะ: {getStageLabel(stageFilter)}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">({filteredTemplates.length} รายการ)</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStageFilter("all");
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template: any) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.category || "ไม่มีหมวดหมู่"}</CardDescription>
                    </div>
                    <Badge className={getStageColor(template.stage)}>
                      {getStageLabel(template.stage)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{template.items?.length || 0} รายการ</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(template)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        แก้ไข
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(template)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {filteredTemplates.length === 0 && searchQuery === "" && stageFilter === "all" && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">ยังไม่มี Template</p>
          <p className="text-sm text-muted-foreground mt-1">
            คลิกปุ่ม "สร้าง Template" เพื่อเริ่มต้น
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ Template</DialogTitle>
            <DialogDescription>
              คุณต้องการลบ template <strong>"{deletingTemplate?.name}"</strong> หรือไม่?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {taskChecklistsQuery.isLoading && (
              <div className="text-sm text-muted-foreground">กำลังตรวจสอบการใช้งาน...</div>
            )}

            {taskChecklistsQuery.data && taskChecklistsQuery.data.length > 0 && (
              <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">เตือน: Template นี้กำลังถูกใช้งานอยู่</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      Template นี้ถูกใช้ใน <strong>{taskChecklistsQuery.data.length}</strong> checklist:
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {taskChecklistsQuery.data.map((checklist: any) => (
                    <li key={checklist.id} className="text-sm bg-white p-2 rounded border border-yellow-100">
                      <div className="font-medium text-gray-900">{checklist.taskName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Stage: {checklist.stage} • Status: {checklist.status}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {taskChecklistsQuery.data && taskChecklistsQuery.data.length === 0 && (
              <div className="text-sm text-muted-foreground">
                ไม่มี checklist ใดใช้ template นี้
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingTemplate(null);
                setDeletingTemplateId(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={deleteTemplateMutation.isPending || (taskChecklistsQuery.data && taskChecklistsQuery.data.length > 0)}
            >
              {deleteTemplateMutation.isPending ? "กำลังลบ..." : "ลบ Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
