import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

interface OpenProjectDialogProps {
  projectId: number;
  projectName: string;
  onSuccess?: () => void;
}

export function OpenProjectDialog({ projectId, projectName, onSuccess }: OpenProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<"planning" | "active">("planning");

  const validationQuery = trpc.project.validateCompleteness.useQuery(
    { id: projectId },
    { enabled: open }
  );

  const openProjectMutation = trpc.project.openProject.useMutation({
    onSuccess: () => {
      toast.success("เปิดโครงการเรียบร้อยแล้ว");
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "ไม่สามารถเปิดโครงการได้");
    },
  });

  const handleOpenProject = async () => {
    await openProjectMutation.mutateAsync({
      id: projectId,
      newStatus: selectedStatus,
    });
  };

  const validation = validationQuery.data;
  const isLoading = validationQuery.isLoading;
  const canOpen = validation?.isValid ?? false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <FolderOpen className="w-4 h-4" />
          เปิดโครงการ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>เปิดโครงการ: {projectName}</DialogTitle>
          <DialogDescription>
            ตรวจสอบความสมบูรณ์ของโครงการก่อนเปิด (ต้องการอย่างน้อย 70%)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : validation ? (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>ความสมบูรณ์ของโครงการ</Label>
                <span className={`text-lg font-bold ${canOpen ? "text-green-600" : "text-red-600"}`}>
                  {validation.percentage}%
                </span>
              </div>
              <Progress value={validation.percentage} className="h-3" />
              {!canOpen && (
                <p className="text-sm text-red-600">
                  ต้องการอย่างน้อย 70% จึงจะสามารถเปิดโครงการได้
                </p>
              )}
            </div>

            {/* Checklist Details */}
            <div className="space-y-3">
              <Label>รายละเอียดความสมบูรณ์</Label>
              <div className="space-y-2">
                {validation.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      detail.status === "complete"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {detail.status === "complete" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{detail.category}</p>
                      <p className="text-sm text-gray-600">{detail.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Selection */}
            {canOpen && (
              <div className="space-y-2">
                <Label htmlFor="status">เลือกสถานะโครงการ</Label>
                <Select value={selectedStatus} onValueChange={(v: any) => setSelectedStatus(v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">วางแผน (Planning)</SelectItem>
                    <SelectItem value="active">กำลังดำเนินการ (Active)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleOpenProject}
            disabled={!canOpen || openProjectMutation.isPending}
          >
            {openProjectMutation.isPending && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
            เปิดโครงการ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
