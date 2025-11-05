import { useParams } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, User, MessageSquare, FileText, Trash2, ArrowLeft, Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0");
  const [commentText, setCommentText] = useState("");
  const [newProgress, setNewProgress] = useState("");
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const taskQuery = trpc.task.get.useQuery({ id: taskId }, { enabled: !!taskId });
  const projectQuery = trpc.project.get.useQuery(
    { id: taskQuery.data?.projectId || 0 },
    { enabled: !!taskQuery.data?.projectId }
  );
  const commentsQuery = trpc.comment.list.useQuery({ taskId }, { enabled: !!taskId });
  const activityQuery = trpc.activity.getByTask.useQuery({ taskId }, { enabled: !!taskId });
  const addCommentMutation = trpc.comment.add.useMutation();
  const deleteTaskMutation = trpc.task.delete.useMutation();
  const updateTaskMutation = trpc.task.update.useMutation();

  const task = taskQuery.data;
  const project = projectQuery.data;
  const comments = commentsQuery.data || [];
  const activities = activityQuery.data || [];

  // Calculate planned progress based on dates
  const calculatePlannedProgress = () => {
    if (!task?.startDate || !task?.endDate) return null;
    
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / totalDuration) * 100);
  };

  const plannedProgress = calculatePlannedProgress();
  const progressDiff = plannedProgress !== null ? task.progress - plannedProgress : null;

  // Calculate duration
  const calculateDuration = () => {
    if (!task?.startDate || !task?.endDate) return null;
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration();

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        taskId,
        content: commentText,
      });
      setCommentText("");
      toast.success("เพิ่มความเห็นสำเร็จ");
      commentsQuery.refetch();
      activityQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มความเห็น");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-500 text-white",
      in_progress: "bg-blue-500 text-white",
      pending_pre_inspection: "bg-yellow-500 text-white",
      pending_in_progress_inspection: "bg-yellow-600 text-white",
      pending_post_inspection: "bg-orange-500 text-white",
      completed: "bg-green-500 text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: "ยังไม่เริ่ม",
      in_progress: "กำลังทำ",
      pending_pre_inspection: "รอตรวจก่อนเริ่ม",
      ready_to_start: "พร้อมเริ่มงาน",
      pending_in_progress_inspection: "รอตรวจระหว่างทำ",
      pending_final_inspection: "รอตรวจหลังเสร็จ",
      rectification_needed: "ต้องแก้ไข",
      completed: "เสร็จสมบูรณ์",
    };
    return labels[status] || status;
  };

  if (taskQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-500">ไม่พบงานที่ต้องการ</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
            <Badge className={`${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </Badge>
            {user && (user.role === "admin" || user.role === "pm") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    ลบงาน
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบงาน</AlertDialogTitle>
                    <AlertDialogDescription>
                      คุณแน่ใจหรือไม่ที่จะลบงาน "{task.name}" การดำเนินการนี้ไม่สามารถยกเลิกได้
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await deleteTaskMutation.mutateAsync({ id: taskId });
                          toast.success("ลบงานสำเร็จ");
                          setLocation("/tasks");
                        } catch (error) {
                          toast.error("เกิดข้อผิดพลาดในการลบงาน");
                        }
                      }}
                    >
                      ลบงาน
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.name}</h1>
        
        {project && (
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Building2 className="w-4 h-4" />
            <Link href={`/projects/${project.id}`}>
              <span className="hover:text-blue-600 hover:underline cursor-pointer">
                {project.name}
              </span>
            </Link>
          </div>
        )}

        {task.description && (
          <p className="text-gray-600 mt-2">{task.description}</p>
        )}
      </div>

      {/* Task Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card with Change Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">สถานะ</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(task.status)} mb-2`}>
              {getStatusLabel(task.status)}
            </Badge>
            {!showStatusForm ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setNewStatus(task.status);
                  setShowStatusForm(true);
                }}
              >
                เปลี่ยนสถานะ
              </Button>
            ) : (
              <div className="mt-2 space-y-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">ยังไม่เริ่ม</SelectItem>
                    <SelectItem value="in_progress">กำลังทำ</SelectItem>
                    <SelectItem value="pending_pre_inspection">รอตรวจก่อนเริ่ม</SelectItem>
                    <SelectItem value="ready_to_start">พร้อมเริ่มงาน</SelectItem>
                    <SelectItem value="pending_in_progress_inspection">รอตรวจระหว่างทำ</SelectItem>
                    <SelectItem value="pending_final_inspection">รอตรวจหลังเสร็จ</SelectItem>
                    <SelectItem value="rectification_needed">ต้องแก้ไข</SelectItem>
                    <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        await updateTaskMutation.mutateAsync({
                          id: taskId,
                          status: newStatus as any,
                        });
                        toast.success("เปลี่ยนสถานะสำเร็จ");
                        setShowStatusForm(false);
                        taskQuery.refetch();
                        activityQuery.refetch();
                      } catch (error) {
                        toast.error("เกิดข้อผิดพลาด");
                      }
                    }}
                  >
                    บันทึก
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStatusForm(false)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Card with Plan vs Actual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ความคืบหน้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">จริง</span>
                  <span className="text-lg font-bold">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {plannedProgress !== null && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">แผน</span>
                    <span className="text-sm font-semibold text-gray-600">{plannedProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gray-400 h-1.5 rounded-full"
                      style={{ width: `${plannedProgress}%` }}
                    />
                  </div>
                  
                  {progressDiff !== null && (
                    <div className="flex items-center gap-1 mt-2">
                      {progressDiff > 5 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">
                            เร็วกว่าแผน {progressDiff}%
                          </span>
                        </>
                      ) : progressDiff < -5 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">
                            ช้ากว่าแผน {Math.abs(progressDiff)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">
                            ตามแผน
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!showProgressForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNewProgress(task.progress.toString());
                    setShowProgressForm(true);
                  }}
                >
                  อัปเดต
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    placeholder="0-100"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={async () => {
                        try {
                          await updateTaskMutation.mutateAsync({
                            id: taskId,
                            progress: parseInt(newProgress),
                          });
                          toast.success("อัปเดตความคืบหน้าสำเร็จ");
                          setShowProgressForm(false);
                          taskQuery.refetch();
                          activityQuery.refetch();
                        } catch (error) {
                          toast.error("เกิดข้อผิดพลาด");
                        }
                      }}
                    >
                      บันทึก
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowProgressForm(false)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Combined Timeline Card */}
        {(task.startDate || task.endDate) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                ระยะเวลา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.startDate && (
                  <div>
                    <p className="text-xs text-gray-500">เริ่ม</p>
                    <p className="text-sm font-semibold">
                      {new Date(task.startDate).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                )}
                {task.endDate && (
                  <div>
                    <p className="text-xs text-gray-500">สิ้นสุด</p>
                    <p className="text-sm font-semibold">
                      {new Date(task.endDate).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                )}
                {duration !== null && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">ระยะเวลา</p>
                    <p className="text-sm font-semibold">{duration} วัน</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignee Card */}
        {task.assigneeId && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                ผู้รับผิดชอบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">User #{task.assigneeId}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            ความเห็น ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <FileText className="w-4 h-4 mr-2" />
            ไฟล์แนบ
          </TabsTrigger>
          <TabsTrigger value="activity">
            <FileText className="w-4 h-4 mr-2" />
            Activity Log ({activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เพิ่มความเห็น</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="เขียนความเห็น..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                เพิ่มความเห็น
              </Button>
            </CardContent>
          </Card>

          {comments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ยังไม่มีความเห็น
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">User #{comment.userId}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleString("th-TH")}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attachments">
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              ยังไม่มีไฟล์แนบ
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {activities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ยังไม่มีประวัติการเปลี่ยนแปลง
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activities.map((activity: any) => (
                <Card key={activity.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">User #{activity.userId}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString("th-TH")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {activity.action === "task_created" && "สร้างงาน"}
                          {activity.action === "task_updated" && "อัปเดตงาน"}
                          {activity.action === "comment_added" && "เพิ่มความเห็น"}
                          {activity.action === "status_changed" && "เปลี่ยนสถานะ"}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
