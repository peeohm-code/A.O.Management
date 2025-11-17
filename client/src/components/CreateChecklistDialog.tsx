import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateChecklistDialog({ open, onOpenChange, onSuccess }: CreateChecklistDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: projectsData } = trpc.project.list.useQuery();
  const { data: templatesData } = trpc.checklistTemplate.list.useQuery();
  const { data: tasksData } = trpc.task.getByProject.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  const projects = Array.isArray(projectsData) ? projectsData : [];
  const templates = Array.isArray(templatesData) ? templatesData : [];
  const tasks = Array.isArray(tasksData) ? tasksData : [];

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    const query = templateSearchQuery.toLowerCase();
    return templates.filter((t: any) =>
      t.name?.toLowerCase().includes(query)
    );
  }, [templates, templateSearchQuery]);

  // Mutation
  const createChecklistMutation = trpc.checklist.createTaskChecklist.useMutation({
    onSuccess: () => {
      toast.success("สร้าง Checklist สำเร็จ");
      utils.checklist.getAllTaskChecklists.invalidate();
      utils.checklist.getByTask.invalidate();
      handleClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleClose = () => {
    setSelectedProjectId("");
    setSelectedTaskId("");
    setSelectedTemplateId("");
    setTemplateSearchQuery("");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!selectedTaskId) {
      toast.error("กรุณาเลือกงาน");
      return;
    }
    if (!selectedTemplateId) {
      toast.error("กรุณาเลือก Template");
      return;
    }

    createChecklistMutation.mutate({
      taskId: parseInt(selectedTaskId),
      templateId: parseInt(selectedTemplateId),
    });
  };

  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      foundation: "งานฐานราก",
      structure: "งานโครงสร้าง",
      architecture: "งานสถาปัตย์",
      mep: "งานระบบ",
      finishing: "งานตกแต่ง",
      landscape: "งานภูมิทัศน์",
    };
    return stageMap[stage] || stage;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>สร้าง Checklist ใหม่</DialogTitle>
          <DialogDescription>
            เลือกโครงการ งาน และ Template เพื่อสร้าง Checklist สำหรับการตรวจสอบ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">โครงการ *</Label>
            <Select value={selectedProjectId} onValueChange={(value) => {
              setSelectedProjectId(value);
              setSelectedTaskId(""); // Reset task when project changes
            }}>
              <SelectTrigger id="project">
                <SelectValue placeholder="เลือกโครงการ" />
              </SelectTrigger>
              <SelectContent>
                {projects.length > 0 ? (
                  projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    ไม่พบโครงการ
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Task Selection */}
          <div className="space-y-2">
            <Label htmlFor="task">งาน *</Label>
            <Select 
              value={selectedTaskId} 
              onValueChange={setSelectedTaskId}
              disabled={!selectedProjectId}
            >
              <SelectTrigger id="task">
                <SelectValue placeholder={selectedProjectId ? "เลือกงาน" : "เลือกโครงการก่อน"} />
              </SelectTrigger>
              <SelectContent>
                {tasks.length > 0 ? (
                  tasks.map((task: any) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    {selectedProjectId ? "ไม่พบงานในโครงการนี้" : "เลือกโครงการก่อน"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Template Search */}
          <div className="space-y-2">
            <Label htmlFor="template-search">ค้นหา Template</Label>
            <Input
              id="template-search"
              type="text"
              placeholder="พิมพ์เพื่อค้นหา..."
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Checklist Template *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="เลือก Checklist Template" />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template: any) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} ({getStageLabel(template.stage)})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    {templateSearchQuery ? "ไม่พบ template ที่ตรงกับคำค้นหา" : "ไม่พบ template"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createChecklistMutation.isPending || !selectedTaskId || !selectedTemplateId}
          >
            {createChecklistMutation.isPending ? "กำลังสร้าง..." : "สร้าง Checklist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
