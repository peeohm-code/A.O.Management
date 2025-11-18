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
import { Loader2, Calendar, User, MessageSquare, FileText, Trash2, ArrowLeft, Building2, TrendingUp, TrendingDown, Minus, Upload, File, Image as ImageIcon, X, CheckSquare, AlertTriangle, Clock, Edit } from "lucide-react";
import { toast } from "sonner";
import { parseDate, daysBetween } from "@/lib/dateUtils";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useThaiTextInput } from "@/hooks/useThaiTextInput";
import { ChecklistsTab } from "@/components/ChecklistsTab";
import { DefectsTab } from "@/components/DefectsTab";
import { useOfflineForm } from "@/hooks/useOfflineForm";
import { MobileDocumentViewer, ImageGalleryViewer } from "@/components/MobileDocumentViewer";
import { useIsMobile } from "@/hooks/useMobile";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id || "0");
  const commentTextInput = useThaiTextInput("");
  const [newProgress, setNewProgress] = useState("");
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; fileName: string; mimeType?: string } | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{ url: string; fileName?: string }>>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const isMobile = useIsMobile();
  
  // Edit task state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    assigneeId: 0,
  });

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
  
  // Offline-capable comment submission
  const offlineComment = useOfflineForm({
    type: 'comment',
    onlineSubmit: async (data: any) => {
      await addCommentMutation.mutateAsync(data);
    },
    onSuccess: () => {
      commentTextInput.reset("");
      commentsQuery.refetch();
      activityQuery.refetch();
    },
  });
  
  // Offline-capable progress update
  const offlineProgress = useOfflineForm({
    type: 'progress',
    onlineSubmit: async (data: any) => {
      await updateTaskMutation.mutateAsync(data);
    },
    onSuccess: () => {
      setShowProgressForm(false);
      setNewProgress("");
      taskQuery.refetch();
      activityQuery.refetch();
    },
  });

  const task = taskQuery.data;
  const project = projectQuery.data;
  const comments = commentsQuery.data || [];
  const attachments = attachmentsQuery.data || [];
  const activities = activityQuery.data || [];

  // Calculate duration
  const calculateDuration = () => {
    if (!task?.startDate || !task?.endDate) return null;
    return daysBetween(task.startDate, task.endDate);
  };

  const duration = calculateDuration();

  const handleAddComment = async () => {
    if (!commentTextInput.value.trim()) return;
    
    // Use offline-capable submission
    offlineComment.submit({
      taskId,
      content: commentTextInput.value,
    });
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
          fileContent: base64,
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

  const handleEditTask = () => {
    if (!task) return;
    setEditForm({
      name: task.name,
      description: task.description || "",
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
      endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : "",
      assigneeId: task.assigneeId || 0,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData: any = {
        id: taskId,
      };
      
      // Only include fields that have values
      if (editForm.name && editForm.name.trim()) {
        updateData.name = editForm.name.trim();
      }
      
      if (editForm.description !== undefined && editForm.description !== null) {
        updateData.description = editForm.description;
      }
      
      if (editForm.startDate) {
        updateData.startDate = editForm.startDate;
      }
      
      if (editForm.endDate) {
        updateData.endDate = editForm.endDate;
      }
      
      // Only include assigneeId if it's a valid value (not 0)
      if (editForm.assigneeId && editForm.assigneeId > 0) {
        updateData.assigneeId = editForm.assigneeId;
      }
      
      await updateTaskMutation.mutateAsync(updateData);
      setShowEditDialog(false);
      taskQuery.refetch();
      activityQuery.refetch();
      toast.success("แก้ไขงานสำเร็จ");
    } catch (error) {
      console.error('[Edit Task Error]', error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขงาน");
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
      in_progress: "bg-blue-100 text-[#00366D] border-blue-300",
      pending_pre_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      ready_to_start: "bg-green-100 text-[#00CE81] border-green-300",
      pending_in_progress_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      pending_final_inspection: "bg-yellow-100 text-yellow-700 border-yellow-300",
      rectification_needed: "bg-red-100 text-red-700 border-red-300",
      completed: "bg-green-100 text-[#00CE81] border-green-300",
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
        <Loader2 className="w-8 h-8 animate-spin text-[#00366D]" />
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
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับ</span>
        </Link>
      </div>

      {/* Consolidated Task & Project Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Task Name */}
            <h2 className="text-2xl font-bold text-gray-900">{task.name}</h2>
            
            {/* Task Description */}
            {task.description && (
              <p className="text-gray-600 text-sm">{task.description}</p>
            )}

            {/* Project Info */}
            {project && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Building2 className="w-4 h-4" />
                  <Link href={`/projects/${project.id}`}>
                    <span className="font-semibold hover:text-[#00366D] hover:underline cursor-pointer">
                      โครงการ: {project.name}
                    </span>
                  </Link>
                </div>
                {/* Note: description field doesn't exist in projects schema */}
              </div>
            )}

            {/* Main Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* Date Range */}
              <div>
                <p className="text-xs text-gray-500 mb-1">ระยะเวลา</p>
                <p className="text-sm font-medium">
                  {task.startDate && task.endDate
                    ? `${parseDate(task.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })} - ${parseDate(task.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })} (${duration} วัน)`
                    : "-"}
                </p>
              </div>

              {/* Progress */}
              <div>
                <p className="text-xs text-gray-500 mb-1">ความคืบหน้า</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-[#00366D] h-2 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-[#00366D]">{task.progress}%</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-gray-500 mb-1">สถานะ</p>
                <div className="flex flex-col gap-1">
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                  {task.endDate && parseDate(task.endDate) < new Date() && task.status !== 'completed' && (
                    <Badge className="bg-red-100 text-red-700 border-red-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      ล่าช้า {Math.abs(daysBetween(new Date(), task.endDate))} วัน
                    </Badge>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <p className="text-xs text-gray-500 mb-1">ผู้รับผิดชอบ</p>
                <p className="text-sm font-medium">{task.assigneeId ? `User #${task.assigneeId}` : "ไม่ได้กำหนด"}</p>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs text-gray-500 mb-1">ความสำคัญ</p>
                <Badge className={
                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {task.priority === 'urgent' ? 'เร่งด่วน' :
                   task.priority === 'high' ? 'สูง' :
                   task.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                </Badge>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-gray-500 mb-1">หมวดหมู่</p>
                {task.category ? (
                  <Badge variant="outline">{task.category}</Badge>
                ) : (
                  <p className="text-sm text-gray-400">ไม่ระบุ</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={handleEditTask}>
                <Edit className="w-4 h-4 mr-1" />
                แก้ไข
              </Button>

              <Button size="sm" variant="outline" onClick={() => {
                setNewProgress(task.progress.toString());
                setShowProgressForm(true);
              }}>
                อัปเดตความคืบหน้า
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-1" />
                    ลบ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบงาน</AlertDialogTitle>
                    <AlertDialogDescription>
                      คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={async () => {
                        try {
                          await deleteTaskMutation.mutateAsync({ id: taskId });
                          toast.success("ลบงานสำเร็จ");
                          setLocation("/tasks");
                        } catch (error) {
                          toast.error("เกิดข้อผิดพลาด");
                        }
                      }}
                    >
                      ลบ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Progress Update Form */}
            {showProgressForm && (
              <div className="space-y-2 pt-2 border-t">
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
                    disabled={!newProgress || parseInt(newProgress) < 0 || parseInt(newProgress) > 100}
                    onClick={() => {
                      offlineProgress.submit({
                        id: taskId,
                        progress: parseInt(newProgress),
                      });
                    }}
                  >
                    บันทึก
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowProgressForm(false)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs - 5 tabs: Checklists | Defects | Photos | Documents | Activity Log */}
      <Tabs defaultValue="checklists" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="checklists">
            <CheckSquare className="w-4 h-4 mr-2" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="defects">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Defects
          </TabsTrigger>
          <TabsTrigger value="photos">
            <ImageIcon className="w-4 h-4 mr-2" />
            รูปภาพ
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            เอกสาร
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="w-4 h-4 mr-2" />
            Activity Log ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="space-y-4">
          <ChecklistsTab taskId={taskId} />
        </TabsContent>

        {/* Defects Tab */}
        <TabsContent value="defects" className="space-y-4">
          <DefectsTab taskId={taskId} />
        </TabsContent>

        {/* Photos Tab - Image Gallery */}
        <TabsContent value="photos" className="space-y-4">
          {/* Photo Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>อัปโหลดรูปภาพ</CardTitle>
              <CardDescription>อัปโหลดรูปภาพงาน (JPG, PNG, GIF, WebP)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
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

          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>คลังรูปภาพ ({attachments.filter((a: any) => a.mimeType?.startsWith('image/')).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.filter((a: any) => a.mimeType?.startsWith('image/')).length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {attachments
                    .filter((a: any) => a.mimeType?.startsWith('image/'))
                    .map((photo: any) => (
                      <div
                        key={photo.id}
                        className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={photo.fileUrl}
                          alt={photo.fileName}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(photo.fileUrl, '_blank')}
                        />
                        {user && (user.role === "admin" || user.role === "project_manager" || photo.uploadedBy === user.id) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteAttachment(photo.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs truncate">
                          <p className="truncate">{photo.fileName}</p>
                          <p className="text-gray-300">
                            {new Date(photo.createdAt).toLocaleDateString('th-TH')} • {photo.fileSize ? (photo.fileSize / 1024).toFixed(1) : '0'} KB
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab - Non-image files only */}
        <TabsContent value="documents" className="space-y-4">
          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>อัปโหลดเอกสาร</CardTitle>
              <CardDescription>อัปโหลดไฟล์เอกสาร (PDF, Word, Excel, ฯลฯ)</CardDescription>
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
              <CardTitle>เอกสารทั้งหมด ({attachments.filter((a: any) => !a.mimeType?.startsWith('image/')).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.filter((a: any) => !a.mimeType?.startsWith('image/')).length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">ยังไม่มีเอกสาร</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.filter((a: any) => !a.mimeType?.startsWith('image/')).map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => {
                              if (isMobile) {
                                setSelectedDocument({
                                  url: attachment.fileUrl,
                                  fileName: attachment.fileName,
                                  mimeType: attachment.mimeType || undefined,
                                });
                                setDocumentViewerOpen(true);
                              } else {
                                window.open(attachment.fileUrl, '_blank');
                              }
                            }}
                            className="text-sm font-medium text-[#00366D] hover:underline block truncate text-left"
                          >
                            {attachment.fileName}
                          </button>
                          <p className="text-xs text-gray-500">
                            {new Date(attachment.createdAt).toLocaleDateString("th-TH")} •{" "}
                            {attachment.fileSize ? (attachment.fileSize / 1024).toFixed(1) : '0'} KB
                          </p>
                        </div>
                      </div>
                      {user && (user.role === "admin" || user.role === "project_manager" || attachment.uploadedBy === user.id) && (
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


          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>เพิ่มความเห็น</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="เขียนความเห็น..."
                {...commentTextInput.props}
                rows={4}
              />
              <Button onClick={handleAddComment} disabled={!commentTextInput.value.trim()}>
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
                  {comments.map((comment: any) => (
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
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="w-2 h-2 bg-[#00366D] rounded-full mt-2 flex-shrink-0" />
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

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขงาน</DialogTitle>
            <DialogDescription>
              แก้ไขรายละเอียดของงาน
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">ชื่องาน *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="ชื่องาน"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">รายละเอียด</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="รายละเอียดงาน"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">วันเริ่มต้น</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">วันสิ้นสุด</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name.trim()}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Document Viewer */}
      {selectedDocument && (
        <MobileDocumentViewer
          url={selectedDocument.url}
          fileName={selectedDocument.fileName}
          mimeType={selectedDocument.mimeType}
          open={documentViewerOpen}
          onClose={() => {
            setDocumentViewerOpen(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Image Gallery Viewer - Mobile */}
      <ImageGalleryViewer
        images={galleryImages}
        initialIndex={galleryInitialIndex}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

    </div>
  );
}
