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
import { Loader2, Calendar, User, MessageSquare, FileText, Trash2, ArrowLeft, Building2, TrendingUp, TrendingDown, Minus, Upload, File, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChecklistsTab } from "@/components/ChecklistsTab";
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

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    // Check file size (max 16MB)
    const maxSize = 16 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("ไฟล์มีขนาดใหญ่เกินไป (max 16MB)");
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const fileContent = await base64Promise;

      await uploadAttachmentMutation.mutateAsync({
        taskId,
        fileName: selectedFile.name,
        fileContent,
        mimeType: selectedFile.type,
      });

      setSelectedFile(null);
      toast.success("อัพโหลดไฟล์สำเร็จ");
      attachmentsQuery.refetch();
      activityQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัพโหลดไฟล์");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachmentMutation.mutateAsync({ id: attachmentId });
      toast.success("ลบไฟล์สำเร็จ");
      attachmentsQuery.refetch();
      activityQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบไฟล์");
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Combined Progress & Timeline Card - First (spans 2 columns) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ความคืบหน้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Timeline Info */}
              {(task.startDate || task.endDate) && (
                <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ระยะเวลา</p>
                    <p className="text-lg font-bold">{duration || 0} วัน</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">เหลือเวลา</p>
                    <p className="text-lg font-bold">
                      {(() => {
                        if (!task.endDate) return "-";
                        const end = new Date(task.endDate).getTime();
                        const now = Date.now();
                        const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                        return remaining > 0 ? `${remaining} วัน` : "หมดเวลา";
                      })()}
                    </p>
                  </div>
                  {task.startDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">เริ่ม</p>
                      <p className="text-sm font-semibold">
                        {new Date(task.startDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  )}
                  {task.endDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">สิ้นสุด</p>
                      <p className="text-sm font-semibold">
                        {new Date(task.endDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actual Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Actual Progress</span>
                  <span className="text-2xl font-bold text-blue-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Update Progress Button */}
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

        {/* Status & Assignee Card - Second */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">สถานะและผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Section */}
              <div>
                <p className="text-xs text-gray-500 mb-2">สถานะ</p>
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
              </div>

              {/* Assignee Section */}
              {task.assigneeId && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    ผู้รับผิดชอบ
                  </p>
                  <p className="text-sm font-semibold">User #{task.assigneeId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            ความเห็น ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <FileText className="w-4 h-4 mr-2" />
            ไฟล์แนบ
          </TabsTrigger>
          <TabsTrigger value="checklists">
            <FileText className="w-4 h-4 mr-2" />
            Checklists
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

        <TabsContent value="attachments" className="space-y-4">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">อัพโหลดไฟล์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <div className="text-sm text-gray-600">
                    เลือก: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังอัพโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      อัพโหลดไฟล์
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attachments List */}
          {attachments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                ยังไม่มีไฟล์แนบ
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attachments.map((attachment: any) => {
                const isImage = attachment.mimeType?.startsWith("image/");
                const canDelete =
                  user?.id === attachment.uploadedBy ||
                  user?.role === "admin" ||
                  user?.role === "pm";

                return (
                  <Card key={attachment.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* File Preview */}
                        {isImage ? (
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-full h-48 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        ) : (
                          <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border">
                            <File className="w-16 h-16 text-gray-400" />
                          </div>
                        )}

                        {/* File Info */}
                        <div>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm hover:text-blue-600 break-all"
                          >
                            {attachment.fileName}
                          </a>
                          <div className="text-xs text-gray-500 mt-1">
                            {attachment.fileSize &&
                              `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`}
                            {" • "}
                            {new Date(attachment.createdAt).toLocaleDateString("th-TH")}
                          </div>
                          <div className="text-xs text-gray-500">
                            อัพโหลดโดย: User #{attachment.uploadedBy}
                          </div>
                        </div>

                        {/* Delete Button */}
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            ลบไฟล์
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <ChecklistsTab taskId={taskId} />
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
