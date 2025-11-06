import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertTriangle, CheckCircle2, Upload, X, Image as ImageIcon, Clock, FileWarning, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Defects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  
  // Dashboard queries
  const metricsQuery = trpc.defect.getMetrics.useQuery();
  const statsByStatusQuery = trpc.defect.getStatsByStatus.useQuery();
  const statsByTypeQuery = trpc.defect.getStatsByType.useQuery();
  const statsByPriorityQuery = trpc.defect.getStatsByPriority.useQuery();
  const metrics = metricsQuery.data || { total: 0, open: 0, closed: 0, pendingVerification: 0, overdue: 0 };
  
  // RCA & Action Plan states
  const [showRCAForm, setShowRCAForm] = useState(false);
  const [showActionPlanForm, setShowActionPlanForm] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [analysisMethod, setAnalysisMethod] = useState("5_whys");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [uploadingAfterPhotos, setUploadingAfterPhotos] = useState(false);
  
  // Verification states
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationComment, setVerificationComment] = useState("");
  
  // Effectiveness Check states
  const [showEffectivenessForm, setShowEffectivenessForm] = useState(false);
  const [effectivenessComment, setEffectivenessComment] = useState("");

  const allDefectsQuery = trpc.defect.allDefects.useQuery();
  const updateDefectMutation = trpc.defect.update.useMutation();
  const usersQuery = trpc.user.list.useQuery();

  const defects = allDefectsQuery.data || [];

  let filteredDefects = defects.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (severityFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.severity === severityFilter);
  }

  if (statusFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.status === statusFilter);
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      case "verified":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateDefect = async (newStatus: string) => {
    if (!selectedDefect) return;

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        status: newStatus as any,
        resolutionComment: resolutionComment || undefined,
      });

      toast.success("Defect updated successfully");
      setSelectedDefect(null);
      setResolutionComment("");
      allDefectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to update defect");
    }
  };

  const handleSaveRCA = async () => {
    if (!selectedDefect || !rootCause.trim()) {
      toast.error("Please fill in root cause");
      return;
    }

    try {
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        rootCause,
        status: "action_plan" as any,
      });

      toast.success("RCA saved successfully");
      setShowRCAForm(false);
      setShowActionPlanForm(true);
      allDefectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save RCA");
    }
  };

  const uploadAttachmentMutation = trpc.defect.uploadAttachment.useMutation();
  const getAttachmentsByTypeQuery = trpc.defect.getAttachmentsByType.useQuery(
    { 
      defectId: selectedDefect?.id || 0,
      attachmentType: 'before'
    },
    { enabled: !!selectedDefect?.id && showVerificationForm }
  );
  const getAfterAttachmentsQuery = trpc.defect.getAttachmentsByType.useQuery(
    { 
      defectId: selectedDefect?.id || 0,
      attachmentType: 'after'
    },
    { enabled: !!selectedDefect?.id && showVerificationForm }
  );

  const handleSaveActionPlan = async () => {
    if (!selectedDefect || !correctiveAction.trim()) {
      toast.error("Please fill in corrective action");
      return;
    }

    try {
      // Save action plan first
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        correctiveAction,
        preventiveAction: preventiveAction || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo: assignedTo || undefined,
        status: "assigned" as any,
      });

      // Upload after photos if any
      if (afterPhotos.length > 0) {
        setUploadingAfterPhotos(true);
        
        for (const photo of afterPhotos) {
          // Upload to S3
          const formData = new FormData();
          formData.append('file', photo);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${photo.name}`);
          }
          
          const { url, key } = await uploadResponse.json();
          
          // Save attachment record
          await uploadAttachmentMutation.mutateAsync({
            defectId: selectedDefect.id,
            fileUrl: url,
            fileKey: key,
            fileName: photo.name,
            fileType: photo.type,
            fileSize: photo.size,
            attachmentType: 'after' as const,
          });
        }
        
        setUploadingAfterPhotos(false);
      }

      toast.success("Action Plan saved successfully");
      setShowActionPlanForm(false);
      setSelectedDefect(null);
      // Reset form
      setRootCause("");
      setCorrectiveAction("");
      setPreventiveAction("");
      setDueDate("");
      setAssignedTo(null);
      setAfterPhotos([]);
      allDefectsQuery.refetch();
    } catch (error) {
      setUploadingAfterPhotos(false);
      console.error('Error saving Action Plan:', error);
      toast.error("Failed to save Action Plan: " + (error as Error).message);
    }
  };

  const stats = {
    total: defects.length,
    critical: defects.filter((d) => d.severity === "critical").length,
    high: defects.filter((d) => d.severity === "high").length,
    open: defects.filter((d) => d.status === "open").length,
  };

  if (allDefectsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Defect Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor and manage construction defects</p>
      </div>

      {/* Dashboard Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Defect Tracking Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">ทั้งหมด</CardTitle>
              <FileWarning className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold">{metrics.total}</div>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("all")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">เปิดอยู่</CardTitle>
              <AlertTriangle className="h-3 w-3 text-orange-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-orange-600">{metrics.open}</div>
              <p className="text-[10px] text-muted-foreground">Open</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setStatusFilter("closed")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">ปิดแล้ว</CardTitle>
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-green-600">{metrics.closed}</div>
              <p className="text-[10px] text-muted-foreground">Closed</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50"
            onClick={() => setStatusFilter("verification")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">รอตรวจสอบ</CardTitle>
              <Clock className="h-3 w-3 text-yellow-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-yellow-600">{metrics.pendingVerification}</div>
              <p className="text-[10px] text-yellow-700">Verification</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-red-200 bg-red-50"
            onClick={() => {
              // Filter overdue defects - will need custom filter logic
              toast.info("กรองแสดง Defect ที่เกินกำหนด");
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
              <CardTitle className="text-xs font-medium">เกินกำหนด</CardTitle>
              <TrendingUp className="h-3 w-3 text-red-600" />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-red-600">{metrics.overdue}</div>
              <p className="text-[10px] text-red-700">Overdue</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search defects..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
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
      </div>

      {/* Defects List */}
      <div className="space-y-3">
        {filteredDefects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                {defects.length === 0 ? "No defects reported" : "No defects match your filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDefects.map((defect) => (
            <Card
              key={defect.id}
              className="hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedDefect(defect)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-lg">{defect.title}</h3>
                    </div>
                    {defect.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{defect.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className={`${getSeverityColor(defect.severity)}`}>
                        {defect.severity.toUpperCase()}
                      </Badge>
                      <Badge className={`${getStatusColor(defect.status)}`}>
                        {defect.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Reported: {new Date(defect.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Defect Detail Dialog */}
      <Dialog open={!!selectedDefect && !showRCAForm && !showActionPlanForm && !showVerificationForm && !showEffectivenessForm} onOpenChange={(open) => !open && setSelectedDefect(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              {selectedDefect?.type || 'Defect'} Details
            </DialogTitle>
            <DialogDescription>{selectedDefect?.title}</DialogDescription>
          </DialogHeader>

          {selectedDefect && (
            <div className="space-y-4">
              {/* Type Badge */}
              {selectedDefect.type && (
                <div>
                  <Label className="text-xs font-semibold">Type</Label>
                  <div className="mt-1">
                    <Badge className={selectedDefect.type === 'CAR' ? 'bg-yellow-100 text-yellow-800' : selectedDefect.type === 'PAR' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                      {selectedDefect.type}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Severity</Label>
                  <div className="mt-1">
                    <Badge className={`${getSeverityColor(selectedDefect.severity)}`}>
                      {selectedDefect.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Status</Label>
                  <div className="mt-1">
                    <Badge className={`${getStatusColor(selectedDefect.status)}`}>
                      {selectedDefect.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedDefect.description && (
                <div>
                  <Label className="text-xs font-semibold">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedDefect.description}</p>
                </div>
              )}

              {/* Show RCA if exists */}
              {selectedDefect.rootCause && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <Label className="text-xs font-semibold text-blue-900">การวิเคราะห์สาเหตุต้นตอ (RCA)</Label>
                  <p className="text-sm text-blue-800 mt-1">{selectedDefect.rootCause}</p>
                </div>
              )}

              {/* Show Action Plan if exists */}
              {selectedDefect.correctiveAction && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <Label className="text-xs font-semibold text-green-900">การแก้ไข (Corrective Action)</Label>
                  <p className="text-sm text-green-800 mt-1">{selectedDefect.correctiveAction}</p>
                  {selectedDefect.preventiveAction && (
                    <>
                      <Label className="text-xs font-semibold text-green-900 mt-2 block">การป้องกัน (Preventive Action)</Label>
                      <p className="text-sm text-green-800 mt-1">{selectedDefect.preventiveAction}</p>
                    </>
                  )}
                  {selectedDefect.dueDate && (
                    <p className="text-xs text-green-700 mt-2">กำหนดเสร็จ: {new Date(selectedDefect.dueDate).toLocaleDateString('th-TH')}</p>
                  )}
                </div>
              )}

              {/* Action Buttons based on status */}
              <div className="flex gap-2">
                {selectedDefect.status === "reported" && (
                  <Button
                    onClick={() => setShowRCAForm(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    วิเคราะห์สาเหตุต้นตอ
                  </Button>
                )}
                {selectedDefect.status === "action_plan" && !selectedDefect.correctiveAction && (
                  <Button
                    onClick={() => setShowActionPlanForm(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    สร้างแผนการแก้ไข
                  </Button>
                )}
                {(selectedDefect.status === "assigned" || (selectedDefect.status === "action_plan" && selectedDefect.correctiveAction)) && (
                  <Button
                    onClick={() => handleUpdateDefect("in_progress")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    เริ่มดำเนินการ
                  </Button>
                )}
                {selectedDefect.status === "in_progress" && (
                  <Button
                    onClick={() => handleUpdateDefect("implemented")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    แก้ไขเสร็จแล้ว
                  </Button>
                )}
                {selectedDefect.status === "implemented" && (
                  <Button
                    onClick={() => handleUpdateDefect("verification")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    ขอตรวจสอบ
                  </Button>
                )}
                {selectedDefect.status === "verification" && (
                  <Button
                    onClick={() => setShowVerificationForm(true)}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    ตรวจสอบผลการแก้ไข
                  </Button>
                )}
                {selectedDefect.status === "effectiveness_check" && (
                  <Button
                    onClick={() => setShowEffectivenessForm(true)}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    ตรวจสอบประสิทธิผล
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RCA Form Dialog */}
      <Dialog open={showRCAForm} onOpenChange={setShowRCAForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              การวิเคราะห์สาเหตุต้นตอ (Root Cause Analysis)
            </DialogTitle>
            <DialogDescription>
              วิเคราะห์หาสาเหตุต้นตอของ: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="analysisMethod" className="text-sm font-semibold">
                วิธีการวิเคราะห์
              </Label>
              <Select value={analysisMethod} onValueChange={setAnalysisMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5_whys">5 Whys (ถามทำไม 5 ครั้ง)</SelectItem>
                  <SelectItem value="fishbone">Fishbone Diagram (แผนภาพกระดูกปลา)</SelectItem>
                  <SelectItem value="pareto">Pareto Analysis (การวิเคราะห์พาเรโต)</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rootCause" className="text-sm font-semibold">
                สาเหตแท้จริง (Root Cause) <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                ระบุสาเหตุที่แท้จริงของปัญหาที่เกิดขึ้น
              </p>
              <Textarea
                id="rootCause"
                placeholder="ตัวอย่าง: พนักงานขาดการอบรมเรื่องอัตราส่วนผสมคอนกรีตที่ถูกต้อง ทำให้ผสมไม่ได้คุณภาพตามมาตรฐาน..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="mt-2"
                rows={6}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRCAForm(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSaveRCA}
                disabled={!rootCause.trim() || updateDefectMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateDefectMutation.isPending ? "กำลังบันทึก..." : "บันทึก RCA และดำเนินการต่อ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Plan Form Dialog */}
      <Dialog open={showActionPlanForm} onOpenChange={setShowActionPlanForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              สร้างแผนการแก้ไข (Action Plan)
            </DialogTitle>
            <DialogDescription>
              กำหนดมาตรการแก้ไขและป้องกันสำหรับ: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="correctiveAction" className="text-sm font-semibold">
                การแก้ไข (Corrective Action) <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                มาตรการเพื่อแก้ไขปัญหาที่เกิดขึ้นในปัจจุบัน
              </p>
              <Textarea
                id="correctiveAction"
                placeholder="ตัวอย่าง: ทำการถลกคอนกรีตส่วนที่มีปัญหาแล้วเทใหม่ จัดอบรมพนักงานเรื่องวิธีผสมคอนกรีตที่ถูกต้องทันที..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            {(selectedDefect?.type === 'PAR' || selectedDefect?.type === 'NCR') && (
              <div>
                <Label htmlFor="preventiveAction" className="text-sm font-semibold">
                  การป้องกัน (Preventive Action)
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  มาตรการเพื่อป้องกันไม่ให้เกิดปัญหาซ้ำในอนาคต
                </p>
                <Textarea
                  id="preventiveAction"
                  placeholder="ตัวอย่าง: จัดการอบรมบังคับเรื่องการผสมคอนกรีตสำหรับพนักงานทุกคน ติดตั้งคู่มือแสดงภาพประกอบจุดผสม ตรวจสอบแบบสุ่มทุกสัปดาห์..."
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate" className="text-sm font-semibold">
                  กำหนดเสร็จ
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="assignedTo" className="text-sm font-semibold">
                  มอบหมายให้
                </Label>
                <Select value={assignedTo?.toString() || ""} onValueChange={(v) => setAssignedTo(parseInt(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersQuery.data?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* After Photos Upload Section */}
            <div className="space-y-3 p-5 rounded-lg border bg-card">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                รูปภาพหลังแก้ไข (After Photos)
              </h3>
              <p className="text-sm text-muted-foreground">
                อัปโหลดรูปภาพแสดงสภาพหลังดำเนินการแก้ไขเสร็จสิ้น (รองรับ JPG, PNG, HEIC สูงสุด 10MB/ไฟล์)
              </p>
              
              {/* File Input */}
              <div className="space-y-3">
                <label htmlFor="after-photos" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-primary/50 hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">คลิกเพื่อเลือกรูปภาพ</p>
                        <p className="text-sm text-muted-foreground mt-1">หรือลากไฟล์มาวางที่นี่</p>
                      </div>
                    </div>
                  </div>
                  <input
                    id="after-photos"
                    type="file"
                    accept="image/*,.heic"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      // Validate file size (10MB max)
                      const validFiles = files.filter(f => {
                        if (f.size > 10 * 1024 * 1024) {
                          toast.error(`ไฟล์ ${f.name} มีขนาดเกิน 10MB`);
                          return false;
                        }
                        return true;
                      });
                      setAfterPhotos(prev => [...prev, ...validFiles]);
                    }}
                  />
                </label>

                {/* Preview uploaded files */}
                {afterPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {afterPhotos.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`After ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setAfterPhotos(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowActionPlanForm(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSaveActionPlan}
                disabled={!correctiveAction.trim() || updateDefectMutation.isPending || uploadingAfterPhotos}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {(updateDefectMutation.isPending || uploadingAfterPhotos) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingAfterPhotos ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...'}
                  </>
                ) : (
                  "บันทึกแผนการแก้ไข"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Form Dialog */}
      <Dialog open={showVerificationForm} onOpenChange={setShowVerificationForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Verification - {selectedDefect?.type}
            </DialogTitle>
            <DialogDescription>
              Review implementation and compare Before/After photos: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Before/After Photos Comparison */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">เปรียบเทียบรูปภาพ Before/After</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Before Photos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <h4 className="font-semibold text-red-700">ก่อนแก้ไข (Before)</h4>
                  </div>
                  {getAttachmentsByTypeQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                    </div>
                  ) : getAttachmentsByTypeQuery.data && getAttachmentsByTypeQuery.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {getAttachmentsByTypeQuery.data.map((attachment: any) => (
                        <div key={attachment.id} className="relative group">
                          <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{attachment.fileName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">ไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>

                {/* After Photos */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h4 className="font-semibold text-green-700">หลังแก้ไข (After)</h4>
                  </div>
                  {getAfterAttachmentsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                    </div>
                  ) : getAfterAttachmentsQuery.data && getAfterAttachmentsQuery.data.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {getAfterAttachmentsQuery.data.map((attachment: any) => (
                        <div key={attachment.id} className="relative group">
                          <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{attachment.fileName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">ไม่มีรูปภาพ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Implementation Summary */}
            {selectedDefect?.correctiveAction && (
              <div className="space-y-2 p-4 rounded-lg border bg-muted/50">
                <h4 className="font-semibold text-sm">การดำเนินการแก้ไข</h4>
                <p className="text-sm text-muted-foreground">{selectedDefect.correctiveAction}</p>
                {selectedDefect.preventiveAction && (
                  <>
                    <h4 className="font-semibold text-sm mt-3">การป้องกัน</h4>
                    <p className="text-sm text-muted-foreground">{selectedDefect.preventiveAction}</p>
                  </>
                )}
              </div>
            )}

            {/* Verification Comment */}
            <div className="space-y-2 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <Label htmlFor="verificationComment" className="text-sm font-semibold">
                ความคิดเห็นของผู้ตรวจสอบ <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                กรุณาระบุเหตุผลและข้อสังเกตจากการตรวจสอบ (Required)
              </p>
              <Textarea
                id="verificationComment"
                placeholder="ตัวอย่าง: ตรวจสอบแล้วพบว่าการแก้ไขเป็นไปตามแผนที่วางไว้ คุณภาพงานดี ไม่พบข้อบกพร่อง..."
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerificationForm(false);
                  setVerificationComment("");
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDefect) return;
                  if (!verificationComment.trim()) {
                    toast.error("กรุณาระบุความคิดเห็นของผู้ตรวจสอบ");
                    return;
                  }
                  try {
                    await updateDefectMutation.mutateAsync({
                      id: selectedDefect.id,
                      status: "action_plan" as any,
                      verificationComment: verificationComment,
                    });
                    toast.success("ไม่อนุมัติ - ส่งกลับไปแก้ไขใหม่");
                    setShowVerificationForm(false);
                    setSelectedDefect(null);
                    setVerificationComment("");
                    allDefectsQuery.refetch();
                  } catch (error) {
                    toast.error("เกิดข้อผิดพลาด");
                  }
                }}
                disabled={updateDefectMutation.isPending || !verificationComment.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {updateDefectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "ไม่อนุมัติ (Reject)"
                )}
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDefect) return;
                  if (!verificationComment.trim()) {
                    toast.error("กรุณาระบุความคิดเห็นของผู้ตรวจสอบ");
                    return;
                  }
                  try {
                    await updateDefectMutation.mutateAsync({
                      id: selectedDefect.id,
                      status: "effectiveness_check" as any,
                      verificationComment: verificationComment,
                    });
                    toast.success("อนุมัติสำเร็จ - ไปยังขั้นตอน Effectiveness Check");
                    setShowVerificationForm(false);
                    setSelectedDefect(null);
                    setVerificationComment("");
                    allDefectsQuery.refetch();
                  } catch (error) {
                    toast.error("เกิดข้อผิดพลาด");
                  }
                }}
                disabled={updateDefectMutation.isPending || !verificationComment.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updateDefectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "อนุมัติ (Approve)"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Effectiveness Check Form Dialog */}
      <Dialog open={showEffectivenessForm} onOpenChange={setShowEffectivenessForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Effectiveness Check - {selectedDefect?.type}
            </DialogTitle>
            <DialogDescription>
              ตรวจสอบประสิทธิผลของการแก้ไข: {selectedDefect?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
              <div>
                <h4 className="font-semibold text-sm mb-2">การดำเนินการแก้ไข</h4>
                <p className="text-sm text-muted-foreground">{selectedDefect?.correctiveAction}</p>
              </div>
              {selectedDefect?.preventiveAction && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">การป้องกัน</h4>
                  <p className="text-sm text-muted-foreground">{selectedDefect.preventiveAction}</p>
                </div>
              )}
              {selectedDefect?.verificationComment && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">ผลการตรวจสอบ</h4>
                  <p className="text-sm text-muted-foreground">{selectedDefect.verificationComment}</p>
                </div>
              )}
            </div>

            {/* Effectiveness Question */}
            <div className="space-y-3 p-5 rounded-lg border-2 border-primary/20 bg-primary/5">
              <h3 className="font-semibold text-base">
                คำถามสำคัญ: การแก้ไขมีประสิทธิผลหรือไม่?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                <li>• ปัญหาได้รับการแก้ไขอย่างถาวรหรือไม่?</li>
                <li>• มาตรการป้องกันสามารถป้องกันปัญหาซ้ำได้หรือไม่?</li>
                <li>• มีความเสี่ยงที่ปัญหาจะเกิดขึ้นอีกหรือไม่?</li>
                <li>• ผลลัพธ์ตรงตามเป้าหมายที่กำหนดไว้หรือไม่?</li>
              </ul>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="effectivenessComment" className="text-sm font-semibold">
                ความคิดเห็นและข้อสังเกต
              </Label>
              <Textarea
                id="effectivenessComment"
                placeholder="บันทึกผลการตรวจสอบประสิทธิผล ข้อสังเกต และคำแนะนำ..."
                value={effectivenessComment}
                onChange={(e) => setEffectivenessComment(e.target.value)}
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEffectivenessForm(false);
                  setEffectivenessComment("");
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDefect) return;
                  try {
                    await updateDefectMutation.mutateAsync({
                      id: selectedDefect.id,
                      status: "action_plan" as any,
                      effectivenessComment: effectivenessComment || undefined,
                    });
                    toast.success("ไม่มีประสิทธิผล - ส่งกลับไปแก้ไขใหม่");
                    setShowEffectivenessForm(false);
                    setSelectedDefect(null);
                    setEffectivenessComment("");
                    allDefectsQuery.refetch();
                  } catch (error) {
                    toast.error("เกิดข้อผิดพลาด");
                  }
                }}
                disabled={updateDefectMutation.isPending}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {updateDefectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "ไม่มีประสิทธิผล (Not Effective)"
                )}
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDefect) return;
                  try {
                    await updateDefectMutation.mutateAsync({
                      id: selectedDefect.id,
                      status: "closed" as any,
                      effectivenessComment: effectivenessComment || undefined,
                    });
                    toast.success("มีประสิทธิผล - ปิด CAR/NCR สำเร็จ");
                    setShowEffectivenessForm(false);
                    setSelectedDefect(null);
                    setEffectivenessComment("");
                    allDefectsQuery.refetch();
                  } catch (error) {
                    toast.error("เกิดข้อผิดพลาด");
                  }
                }}
                disabled={updateDefectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updateDefectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "มีประสิทธิผล - ปิด CAR/NCR (Effective)"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
