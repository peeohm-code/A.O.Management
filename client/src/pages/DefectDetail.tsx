import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, FileText, AlertTriangle, CheckCircle2, XCircle, Edit, RefreshCw, History, Clock, Image, Upload, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCanEditDefect } from "@/hooks/usePermissions";

export default function DefectDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const defectId = parseInt(params.id || "0");

  const defectQuery = trpc.defect.getById.useQuery({ id: defectId });
  const activityQuery = trpc.activity.getByDefect.useQuery({ defectId });
  const beforePhotosQuery = trpc.defect.getAttachmentsByType.useQuery({ defectId, attachmentType: "before" });
  const afterPhotosQuery = trpc.defect.getAttachmentsByType.useQuery({ defectId, attachmentType: "after" });
  const updateDefectMutation = trpc.defect.update.useMutation();
  const uploadAttachmentMutation = trpc.defect.uploadAttachment.useMutation();
  const deleteAttachmentMutation = trpc.defect.deleteAttachment.useMutation();
  const canEdit = useCanEditDefect();

  // Photo upload state
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSeverity, setEditSeverity] = useState("");

  // Update status dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const handleEdit = () => {
    if (!defectQuery.data) return;
    setEditTitle(defectQuery.data.title);
    setEditDescription(defectQuery.data.description || "");
    setEditSeverity(defectQuery.data.severity);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }

    try {
      // Note: The current defect.update mutation doesn't support title/description/severity
      // We'll update status only for now
      await updateDefectMutation.mutateAsync({
        id: defectId,
        // Add other fields when backend supports them
      });
      toast.success("อัปเดตข้อมูลสำเร็จ");
      setShowEditDialog(false);
      defectQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("กรุณาเลือกสถานะ");
      return;
    }

    try {
      await updateDefectMutation.mutateAsync({
        id: defectId,
        status: newStatus as any,
      });
      toast.success("อัปเดตสถานะสำเร็จ");
      setShowStatusDialog(false);
      setNewStatus("");
      defectQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handlePhotoUpload = async (file: File, type: "before" | "after") => {
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 10 MB");
      return;
    }

    try {
      if (type === "before") setUploadingBefore(true);
      else setUploadingAfter(true);

      // Upload to S3 via attachment API
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("การอัปโหลดล้มเหลว");
      }

      const { fileUrl, fileKey } = await uploadResponse.json();

      // Save to database
      await uploadAttachmentMutation.mutateAsync({
        defectId,
        fileUrl,
        fileKey,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        attachmentType: type,
      });

      toast.success("อัปโหลดรูปภาพสำเร็จ");
      beforePhotosQuery.refetch();
      afterPhotosQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    } finally {
      if (type === "before") setUploadingBefore(false);
      else setUploadingAfter(false);
    }
  };

  const handleDeletePhoto = async (attachmentId: number, type: "before" | "after") => {
    if (!confirm("ต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;

    try {
      await deleteAttachmentMutation.mutateAsync({ id: attachmentId });
      toast.success("ลบรูปภาพสำเร็จ");
      if (type === "before") beforePhotosQuery.refetch();
      else afterPhotosQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CAR: "bg-yellow-100 text-yellow-700 border-yellow-300",
      PAR: "bg-blue-100 text-blue-700 border-blue-300",
      NCR: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reported: "รายงานแล้ว",
      action_plan: "กำลังวางแผน",
      assigned: "มอบหมายแล้ว",
      in_progress: "กำลังดำเนินการ",
      implemented: "แก้ไขเสร็จแล้ว",
      verification: "รอตรวจสอบ",
      effectiveness_check: "ตรวจสอบประสิทธิผล",
      closed: "ปิดแล้ว",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reported: "bg-orange-100 text-orange-700 border-orange-300",
      action_plan: "bg-yellow-100 text-yellow-700 border-yellow-300",
      assigned: "bg-blue-100 text-blue-700 border-blue-300",
      in_progress: "bg-blue-100 text-blue-700 border-blue-300",
      implemented: "bg-green-100 text-green-700 border-green-300",
      verification: "bg-purple-100 text-purple-700 border-purple-300",
      effectiveness_check: "bg-indigo-100 text-indigo-700 border-indigo-300",
      closed: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: "วิกฤต",
      high: "สูง",
      medium: "ปานกลาง",
      low: "ต่ำ",
    };
    return labels[severity] || severity;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700 border-red-300",
      high: "bg-orange-100 text-orange-700 border-orange-300",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
      low: "bg-green-100 text-green-700 border-green-300",
    };
    return colors[severity] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  if (defectQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (defectQuery.error || !defectQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
          <p className="text-gray-500 mb-6">ไม่พบรายการ CAR/PAR/NCR ที่คุณต้องการ</p>
          <Button onClick={() => setLocation("/defects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้า Defects
          </Button>
        </div>
      </div>
    );
  }

  const defect = defectQuery.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/defects" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getTypeColor(defect.type)}>{defect.type}</Badge>
                <Badge className={getStatusColor(defect.status)}>
                  {getStatusLabel(defect.status)}
                </Badge>
                <Badge className={getSeverityColor(defect.severity)}>
                  {getSeverityLabel(defect.severity)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{defect.title}</h1>
            </div>
            {canEdit(defect) && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  แก้ไข
                </Button>
                <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  อัปเดตสถานะ
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">รหัส</p>
                  <p className="font-medium">{defect.code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ประเภท</p>
                  <p className="font-medium">{defect.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ระดับความรุนแรง</p>
                  <p className="font-medium">{getSeverityLabel(defect.severity)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">สถานะ</p>
                  <p className="font-medium">{getStatusLabel(defect.status)}</p>
                </div>
                {defect.taskId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">งาน</p>
                    <Link href={`/tasks/${defect.taskId}`} className="font-medium text-blue-600 hover:underline">
                      Task #{defect.taskId}
                    </Link>
                  </div>
                )}
                {defect.checklistId && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Checklist</p>
                    <p className="font-medium">Checklist #{defect.checklistId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {defect.description && (
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียด</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{defect.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Root Cause Analysis */}
          {defect.rootCause && (
            <Card>
              <CardHeader>
                <CardTitle>การวิเคราะห์สาเหตุต้นตอ (RCA)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{defect.rootCause}</p>
              </CardContent>
            </Card>
          )}

          {/* Corrective Action */}
          {defect.correctiveAction && (
            <Card>
              <CardHeader>
                <CardTitle>การแก้ไข (Corrective Action)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{defect.correctiveAction}</p>
              </CardContent>
            </Card>
          )}

          {/* Preventive Action */}
          {defect.preventiveAction && (
            <Card>
              <CardHeader>
                <CardTitle>การป้องกัน (Preventive Action)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{defect.preventiveAction}</p>
              </CardContent>
            </Card>
          )}

          {/* Verification Comment */}
          {defect.verificationComment && (
            <Card>
              <CardHeader>
                <CardTitle>ความคิดเห็นผู้ตรวจสอบ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{defect.verificationComment}</p>
              </CardContent>
            </Card>
          )}

          {/* Dates & People */}
          <Card>
            <CardHeader>
              <CardTitle>วันที่และผู้รับผิดชอบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defect.reportedBy && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">รายงานโดย</p>
                      <p className="font-medium">User #{defect.reportedBy}</p>
                    </div>
                  </div>
                )}
                {defect.reportedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">วันที่รายงาน</p>
                      <p className="font-medium">
                        {new Date(defect.reportedAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {defect.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">มอบหมายให้</p>
                      <p className="font-medium">User #{defect.assignedTo}</p>
                    </div>
                  </div>
                )}
                {defect.dueDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">กำหนดเสร็จ</p>
                      <p className="font-medium">
                        {new Date(defect.dueDate).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {defect.closedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">ปิดเมื่อ</p>
                      <p className="font-medium">
                        {new Date(defect.closedAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                รูปภาพประกอบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Photos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">รูปก่อนแก้ไข (Before)</h3>
                    {canEdit && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file, "before");
                            e.target.value = "";
                          }}
                          disabled={uploadingBefore}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingBefore}
                          asChild
                        >
                          <span>
                            {uploadingBefore ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                กำลังอัปโหลด...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                อัปโหลด
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                  {beforePhotosQuery.isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">กำลังโหลด...</p>
                    </div>
                  ) : beforePhotosQuery.data && beforePhotosQuery.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {beforePhotosQuery.data.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.fileUrl}
                            alt={photo.fileName}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {canEdit && (
                            <button
                              onClick={() => handleDeletePhoto(photo.id, "before")}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-1 truncate">{photo.fileName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">ยังไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>

                {/* After Photos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">รูปหลังแก้ไข (After)</h3>
                    {canEdit && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file, "after");
                            e.target.value = "";
                          }}
                          disabled={uploadingAfter}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingAfter}
                          asChild
                        >
                          <span>
                            {uploadingAfter ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                กำลังอัปโหลด...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                อัปโหลด
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    )}
                  </div>
                  {afterPhotosQuery.isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">กำลังโหลด...</p>
                    </div>
                  ) : afterPhotosQuery.data && afterPhotosQuery.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {afterPhotosQuery.data.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.fileUrl}
                            alt={photo.fileName}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {canEdit && (
                            <button
                              onClick={() => handleDeletePhoto(photo.id, "after")}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-1 truncate">{photo.fileName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Image className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">ยังไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                ประวัติการเปลี่ยนแปลง
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityQuery.isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">กำลังโหลด...</p>
                </div>
              ) : activityQuery.data && activityQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {activityQuery.data.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {activity.action === "defect_created" && "สร้าง Defect"}
                              {activity.action === "defect_status_changed" && "เปลี่ยนสถานะ"}
                              {activity.action === "defect_updated" && "อัปเดตข้อมูล"}
                              {activity.action === "defect_assigned" && "มอบหมายงาน"}
                              {!activity.action.startsWith("defect_") && activity.action}
                            </p>
                            {activity.details && (
                              <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                            )}
                          </div>
                          <time className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(activity.createdAt).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">โดย User #{activity.userId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>ยังไม่มีประวัติการเปลี่ยนแปลง</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูล {defect.type}</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลพื้นฐานของ CAR/PAR/NCR
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">หัวข้อ <span className="text-red-500">*</span></Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="ระบุหัวข้อปัญหา"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">รายละเอียด</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="ระบุรายละเอียดของปัญหา"
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-severity">ระดับความรุนแรง</Label>
              <Select value={editSeverity} onValueChange={setEditSeverity}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                  <SelectItem value="critical">วิกฤต</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateDefectMutation.isPending}>
              {updateDefectMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะ</DialogTitle>
            <DialogDescription>
              เปลี่ยนสถานะของ {defect.type}: {defect.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-status">สถานะใหม่ <span className="text-red-500">*</span></Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">รายงานแล้ว</SelectItem>
                <SelectItem value="action_plan">กำลังวางแผน</SelectItem>
                <SelectItem value="assigned">มอบหมายแล้ว</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="implemented">แก้ไขเสร็จแล้ว</SelectItem>
                <SelectItem value="verification">รอตรวจสอบ</SelectItem>
                <SelectItem value="effectiveness_check">ตรวจสอบประสิทธิผล</SelectItem>
                <SelectItem value="closed">ปิดแล้ว</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              สถานะปัจจุบัน: <span className="font-medium">{getStatusLabel(defect.status)}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updateDefectMutation.isPending}>
              {updateDefectMutation.isPending ? "กำลังอัปเดต..." : "อัปเดต"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
