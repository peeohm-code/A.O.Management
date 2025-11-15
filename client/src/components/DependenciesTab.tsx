import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, ArrowRight, GitBranch, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface DependenciesTabProps {
  taskId: number;
  projectId: number;
}

export function DependenciesTab({ taskId, projectId }: DependenciesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [dependencyType, setDependencyType] = useState<string>("finish_to_start");

  const utils = trpc.useUtils();
  const dependenciesQuery = trpc.task.getDependencies.useQuery({ taskId });
  const blockingQuery = trpc.task.getBlockingDependencies.useQuery({ taskId });
  const validateQuery = trpc.task.validateCanStart.useQuery({ taskId });
  const projectTasksQuery = trpc.task.list.useQuery({ projectId });
  const addDependencyMutation = trpc.task.addDependency.useMutation();
  const removeDependencyMutation = trpc.task.removeDependency.useMutation();

  const handleAddDependency = async () => {
    if (!selectedTaskId) {
      toast.error("กรุณาเลือกงานที่ต้องทำก่อน");
      return;
    }

    try {
      await addDependencyMutation.mutateAsync({
        taskId,
        dependsOnTaskId: parseInt(selectedTaskId),
        type: dependencyType as "finish_to_start" | "start_to_start" | "finish_to_finish",
      });

      toast.success("เพิ่ม dependency สำเร็จ");
      utils.task.getDependencies.invalidate({ taskId });
      setIsAddDialogOpen(false);
      setSelectedTaskId("");
      setDependencyType("finish_to_start");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่ม dependency");
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId: number) => {
    try {
      await removeDependencyMutation.mutateAsync({
        taskId,
        dependsOnTaskId,
      });

      toast.success("ลบ dependency สำเร็จ");
      utils.task.getDependencies.invalidate({ taskId });
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบ dependency");
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case "finish_to_start":
        return "เสร็จ → เริ่ม";
      case "start_to_start":
        return "เริ่ม → เริ่ม";
      case "finish_to_finish":
        return "เสร็จ → เสร็จ";
      default:
        return type;
    }
  };

  const getDependencyTypeDescription = (type: string) => {
    switch (type) {
      case "finish_to_start":
        return "งานต้นทางต้องเสร็จก่อนงานปลายทางจะเริ่มได้";
      case "start_to_start":
        return "งานต้นทางเริ่มแล้วงานปลายทางถึงจะเริ่มได้";
      case "finish_to_finish":
        return "งานต้นทางเสร็จแล้วงานปลายทางถึงจะเสร็จได้";
      default:
        return "";
    }
  };

  if (dependenciesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dependencies = dependenciesQuery.data || [];
  const blockingDeps = blockingQuery.data || [];
  const validation = validateQuery.data;
  const availableTasks = (projectTasksQuery.data || []).filter(
    (task) => task.id !== taskId && !dependencies.some((dep) => dep.dependsOnTaskId === task.id)
  );

  return (
    <div className="space-y-6">
      {/* Blocking Dependencies Warning */}
      {blockingDeps.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              งานนี้ถูกบล็อกโดยงานอื่นที่ยังไม่เสร็จ
            </CardTitle>
            <CardDescription className="text-yellow-700">
              งานเหล่านี้ต้องเสร็จก่อนจึงจะเริ่มงานน้ีได้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockingDeps.map((blocking) => (
                <div
                  key={blocking.id}
                  className="flex items-center justify-between p-3 bg-white border border-yellow-300 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ArrowRight className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{blocking.taskName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getDependencyTypeLabel(blocking.type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-400 text-yellow-800">
                          ยังไม่เสร็จ
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Link href={`/tasks/${blocking.dependsOnTaskId}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                งานที่ต้องทำก่อน (Dependencies)
              </CardTitle>
              <CardDescription>
                งานเหล่านี้ต้องเสร็จก่อนงานนี้จึงจะเริ่มได้
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่ม Dependency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่ม Task Dependency</DialogTitle>
                  <DialogDescription>
                    เลือกงานที่ต้องทำก่อนงานนี้
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">งานที่ต้องทำก่อน</label>
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกงาน" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">ประเภทความสัมพันธ์</label>
                    <Select value={dependencyType} onValueChange={setDependencyType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finish_to_start">
                          เสร็จ → เริ่ม (Finish-to-Start)
                        </SelectItem>
                        <SelectItem value="start_to_start">
                          เริ่ม → เริ่ม (Start-to-Start)
                        </SelectItem>
                        <SelectItem value="finish_to_finish">
                          เสร็จ → เสร็จ (Finish-to-Finish)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getDependencyTypeDescription(dependencyType)}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddDependency} disabled={addDependencyMutation.isPending}>
                    {addDependencyMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    เพิ่ม
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>ไม่มี dependencies</p>
              <p className="text-sm">งานนี้สามารถเริ่มได้ทันทีโดยไม่ต้องรองานอื่น</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dep) => {
                const dependsOnTask = projectTasksQuery.data?.find(
                  (t) => t.id === dep.dependsOnTaskId
                );
                return (
                  <div
                    key={dep.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{dependsOnTask?.name || "Unknown Task"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getDependencyTypeLabel(dep.type)}
                          </Badge>
                          {dependsOnTask && (
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: dependsOnTask.displayStatusColor + "20",
                                borderColor: dependsOnTask.displayStatusColor,
                                color: dependsOnTask.displayStatusColor,
                              }}
                              className="text-xs"
                            >
                              {dependsOnTask.displayStatusLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/tasks/${dep.dependsOnTaskId}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDependency(dep.dependsOnTaskId)}
                        disabled={removeDependencyMutation.isPending}
                      >
                        <X className="h-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
