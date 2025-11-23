import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import { ChecklistInstanceList } from "@/components/checklist/ChecklistInstanceList";
import { ChecklistInstanceDetail } from "@/components/checklist/ChecklistInstanceDetail";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChecklistWorkflow() {
  const params = useParams();
  const [, navigate] = useLocation();
  const taskId = params.taskId ? parseInt(params.taskId) : null;
  const instanceId = params.instanceId ? parseInt(params.instanceId) : null;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const { data: templates } = trpc.checklist.templates.useQuery();
  const { data: task } = trpc.task.getById.useQuery(
    { id: taskId! },
    { enabled: !!taskId }
  );

  const createInstanceMutation = trpc.checklist.createInstance.useMutation({
    onSuccess: (data) => {
      toast.success("สร้าง checklist instance สำเร็จ");
      setCreateDialogOpen(false);
      setSelectedTemplateId(null);
      // Navigate to the new instance
      if (data.instanceId) {
        navigate(`/checklist/${taskId}/instance/${data.instanceId}`);
      }
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleCreateInstance = () => {
    if (!taskId || !selectedTemplateId) {
      toast.error("กรุณาเลือก template");
      return;
    }

    createInstanceMutation.mutate({
      taskId,
      templateId: selectedTemplateId,
    });
  };

  const handleViewInstance = (id: number) => {
    navigate(`/checklist/${taskId}/instance/${id}`);
  };

  const handleBackToList = () => {
    navigate(`/checklist/${taskId}`);
  };

  if (!taskId) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">
              ไม่พบข้อมูล Task ID
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Flatten all templates from all stages
  const allTemplates = templates
    ? [
        ...(templates.preExecution || []),
        ...(templates.inProgress || []),
        ...(templates.postExecution || []),
      ]
    : [];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {instanceId && (
              <Button variant="ghost" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
            )}
            <h1 className="text-3xl font-bold">Checklist Workflow</h1>
          </div>
          {task && (
            <p className="text-muted-foreground">
              Task: <Badge variant="outline">{task.name}</Badge>
            </p>
          )}
        </div>

        {!instanceId && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                สร้าง Instance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>สร้าง Checklist Instance</DialogTitle>
                <DialogDescription>
                  เลือก template เพื่อสร้าง checklist instance ใหม่
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={selectedTemplateId?.toString()}
                    onValueChange={(value) => setSelectedTemplateId(parseInt(value))}
                  >
                    <SelectTrigger id="template">
                      <SelectValue placeholder="เลือก template" />
                    </SelectTrigger>
                    <SelectContent>
                      {allTemplates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                          {template.stage && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {template.stage === "pre_execution"
                                ? "ก่อนดำเนินการ"
                                : template.stage === "in_progress"
                                ? "ระหว่างดำเนินการ"
                                : "หลังดำเนินการ"}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleCreateInstance}
                  disabled={!selectedTemplateId || createInstanceMutation.isPending}
                >
                  สร้าง
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      {instanceId ? (
        <ChecklistInstanceDetail instanceId={instanceId} />
      ) : (
        <ChecklistInstanceList taskId={taskId} onViewInstance={handleViewInstance} />
      )}
    </div>
  );
}
