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
import { Loader2, Calendar, User, MessageSquare, FileText, Trash2, ArrowLeft, Building2, TrendingUp, TrendingDown, Minus, Upload, File, Image as ImageIcon, X, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChecklistsTab } from "@/components/ChecklistsTab";
import { DependenciesTab } from "@/components/DependenciesTab";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const taskQuery = trpc.task.get.useQuery({ id: taskId }, { enabled: !!taskId });
  const projectQuery = trpc.project.get.useQuery(
    { id: taskQuery.data?.projectId || 0 },
    { enabled: !!taskQuery.data?.projectId }
  );
  const commentsQuery = trpc.comment.list.useQuery({ taskId }, { enabled: !!taskId });
  const attachmentsQuery = trpc.attachment.list.useQuery({ taskId }, { enabled: !!taskId });
  const activityQuery = trpc.activity.getByTask.useQuery({ taskId }, { enabled: !!taskId });
  const addCommentMutation = trpc.comment.add.useMutation();
  const uploadAttachmentMutation = trpc.attachment.upload.useMutation();
  const deleteAttachmentMutation = trpc.attachment.delete.useMutation();
  const deleteTaskMutation = trpc.task.delete.useMutation();
  const updateTaskMutation = trpc.task.update.useMutation();

  const task = taskQuery.data;
  const project = projectQuery.data;
  const comments = commentsQuery.data || [];
  const attachments = attachmentsQuery.data || [];
  const activities = activityQuery.data || [];

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
      commentsQuery.refetch();
      activityQuery.refetch();
      toast.success("เพิ่มความเห็นสำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มความเห็น");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadAttachmentMutation.mutateAsync({
          taskId,
          fileName: selectedFile.name,
          fileData: base64,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
        });
        setSelectedFile(null);
        attachmentsQuery.refetch();
        activityQuery.refetch();
        toast.success("อัปโหลดไฟล์สำเร็จ");
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachmentMutation.mutateAsync({ id: attachmentId });
      attachmentsQuery.refetch();
      activityQuery.refetch();
      toast.success("ลบไฟล์สำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบไฟล์");
    }
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
      not_started: "ยังไม่เริ่ม",
      delayed: "ล่าช้า",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: "bg-gray-100 text-gray-700 border-gray-300",
      in_progress: "bg-blue-100 text-blue-700 border-blue-300",
      pending_pre_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      ready_to_start: "bg-green-100 text-green-700 border-green-300",
      pending_in_progress_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      pending_final_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      rectification_needed: "bg-red-100 text-red-700 border-red-300",
      completed: "bg-green-100 text-green-700 border-green-300",
      not_started: "bg-gray-100 text-gray-700 border-gray-300",
      delayed: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      task_created: "สร้างงาน",
      task_updated: "อัปเดตงาน",
      task_deleted: "ลบงาน",
      status_changed: "เปลี่ยนสถานะ",
      progress_updated: "อัปเดตความคืบหน้า",
      comment_added: "เพิ่มความเห็น",
      attachment_uploaded: "อัปโหลดไฟล์",
      attachment_deleted: "ลบไฟล์",
    };
    return labels[action] || action;
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
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบงาน</h2>
        <Link href="/tasks">
          <Button>กลับไปหน้ารายการงาน</Button>
        </Link>
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
            <Badge className={task.displayStatusColor}>
              {task.displayStatusLabel}
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

      {/* Unified Task Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">ข้อมูลงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Timeline & Progress */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">ระยะเวลา</p>
                {(task.startDate || task.endDate) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ระยะเวลา</span>
                      <span className="text-lg font-bold">{duration || 0} วัน</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">เหลือเวลา</span>
                      <span className="text-lg font-bold">
                        {(() => {
                          if (!task.endDate) return "-";
                          const end = new Date(task.endDate).getTime();
                          const now = Date.now();
                          const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                          return remaining > 0 ? `${remaining} วัน` : "หมดเวลา";
                        })()}
                      </span>
                    </div>
                    {task.startDate && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">เริ่ม</p>
                        <p className="text-sm font-semibold">
                          {new Date(task.startDate).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                    {task.endDate && (
                      <div>
                        <p className="text-xs text-gray-500">สิ้นสุด</p>
                        <p className="text-sm font-semibold">
                          {new Date(task.endDate).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Progress */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">ความคืบหน้า</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-2xl font-bold text-blue-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
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
                    อัปเดตความคืบหน้า
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
                        disabled={!newProgress || parseInt(newProgress) < 0 || parseInt(newProgress) > 100}
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
            </div>

            {/* Column 3: Assignee */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  ผู้รับผิดชอบ
                </p>
                {task.assigneeId ? (
                  <p className="text-sm font-semibold">User #{task.assigneeId}</p>
                ) : (
                  <p className="text-sm text-gray-400">ไม่ได้กำหนด</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Reordered: Checklists → Attachments → Comments → Activity Log */}
      <Tabs defaultValue="checklists" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="checklists">
            <CheckSquare className="w-4 h-4 mr-2" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <FileText className="w-4 h-4 mr-2" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <FileText className="w-4 h-4 mr-2" />
            ไฟล์แนบ
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            ความเห็น ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <FileText className="w-4 h-4 mr-2" />
            Activity Log ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="space-y-4">
          <ChecklistsTab taskId={taskId} />
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="space-y-4">
          <DependenciesTab taskId={taskId} projectId={task.projectId} />
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>อัปโหลดไฟล์</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      อัปโหลด
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ไฟล์แนบทั้งหมด ({attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีไฟล์แนบ</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {attachment.mimeType?.startsWith("image/") ? (
                          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline block truncate"
                          >
                            {attachment.fileName}
                          </a>
                          <p className="text-xs text-gray-500">
                            {new Date(attachment.createdAt).toLocaleDateString("th-TH")} •{" "}
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      {user && (user.role === "admin" || user.role === "pm" || attachment.uploadedBy === user.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
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
                rows={4}
              />
              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                <MessageSquare className="w-4 h-4 mr-2" />
                เพิ่มความเห็น
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ความเห็นทั้งหมด ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีความเห็น</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-sm">User #{comment.userId}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString("th-TH")}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log ({activities.length})</CardTitle>
              <CardDescription>ประวัติการเปลี่ยนแปลงทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีกิจกรรม</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">User #{activity.userId}</span>
                          <Badge variant="outline" className="text-xs">
                            {getActionLabel(activity.action)}
                          </Badge>
                        </div>
                        {activity.details && (
                          <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
