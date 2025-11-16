import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, AlertTriangle, CheckCircle2, Upload, X, Image as ImageIcon, Clock, FileWarning, TrendingUp, RefreshCw, XCircle, PieChart as PieChartIcon, Plus } from "lucide-react";
import { CardSkeleton } from "@/components/skeletons";
import FloatingActionButton from "@/components/FloatingActionButton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "@/components/LazyChart";
import { SwipeableCard } from "@/components/SwipeableCard";
import { PullToRefresh } from "@/components/PullToRefresh";
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
import { usePermissions, useCanDeleteDefect } from "@/hooks/usePermissions";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison";
import { FileUpload } from "@/components/FileUpload";
import { ExportButton } from "@/components/ExportButton";

export default function Defects() {
  const [, setLocation] = useLocation();
  // Permission checks
  const permissions = usePermissions('defects');
  const canDeleteDefect = useCanDeleteDefect();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedDefect, setSelectedDefect] = useState<any>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  
  // Dashboard queries
  const utils = trpc.useUtils();
  const metricsQuery = trpc.defect.getMetrics.useQuery();
  const statsByStatusQuery = trpc.defect.getStatsByStatus.useQuery();
  const statsByTypeQuery = trpc.defect.getStatsByType.useQuery();
  const statsByPriorityQuery = trpc.defect.getStatsByPriority.useQuery();
  
  const handleRefresh = async () => {
    await Promise.all([
      utils.defect.getMetrics.invalidate(),
      utils.defect.getStatsByStatus.invalidate(),
      utils.defect.getStatsByType.invalidate(),
      utils.defect.getStatsByPriority.invalidate(),
      utils.defect.list.invalidate(),
    ]);
  };
  const metrics = metricsQuery.data || { total: 0, open: 0, closed: 0, pendingVerification: 0, overdue: 0 };
  
  // RCA & Action Plan states
  const [showRCAForm, setShowRCAForm] = useState(false);
  const [showActionPlanForm, setShowActionPlanForm] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [analysisMethod, setAnalysisMethod] = useState("5_whys");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");
  
  // Fix Thai text input timeout - track composition state
  const [isComposing, setIsComposing] = useState(false);
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
  
  // Implementation states (for "implemented" status)
  const [showImplementationForm, setShowImplementationForm] = useState(false);
  const [implementationMethod, setImplementationMethod] = useState("");
  const [implementationPhotos, setImplementationPhotos] = useState<File[]>([]);
  const [uploadingImplementationPhotos, setUploadingImplementationPhotos] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  
  // Closure states (for "closed" status)
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [closureNotes, setClosureNotes] = useState("");
  
  // Inline status change state
  const [updatingDefectId, setUpdatingDefectId] = useState<number | null>(null);

  const allDefectsQuery = trpc.defect.allDefects.useQuery();
  const updateDefectMutation = trpc.defect.update.useMutation();
  const usersQuery = trpc.user.list.useQuery();

  const defects = allDefectsQuery.data || [];

  let filteredDefects = defects.filter((d) =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.taskName && d.taskName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.checklistTemplateName && d.checklistTemplateName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (statusFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.status === statusFilter);
  }

  if (typeFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.type === typeFilter);
  }

  if (severityFilter !== "all") {
    filteredDefects = filteredDefects.filter((d) => d.severity === severityFilter);
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
      case "reported":
        return "bg-orange-100 text-orange-800";
      case "analysis":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      reported: "รายงานปัญหา",
      analysis: "วิเคราะห์สาเหตุ",
      in_progress: "กำลังแก้ไข",
      resolved: "แก้ไขเสร็จ",
      closed: "ปิดงาน",
    };
    return labels[status] || status;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CAR":
        return "bg-yellow-100 text-yellow-800";
      case "PAR":
        return "bg-blue-100 text-blue-800";
      case "NCR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper functions for inline status buttons
  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      reported: 'analysis',
      analysis: 'in_progress',
      in_progress: 'resolved',
      resolved: 'closed',
    };
    return statusFlow[currentStatus] || null;
  };

  const getStatusButtonContent = (status: string) => {
    switch (status) {
      case 'reported':
        return (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            วิเคราะห์สาเหตุ
          </>
        );
      case 'analysis':
        return (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            เริ่มแก้ไข
          </>
        );
      case 'in_progress':
        return (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            บันทึกการแก้ไข
          </>
        );
      case 'resolved':
        return (
          <>
            <XCircle className="w-4 h-4 mr-2" />
            ปิดงาน
          </>
        );
      default:
        return null;
    }
  };

  const handleQuickStatusChange = async (defectId: number, currentStatus: string) => {
    // Instead of immediate status change, navigate to DefectDetail page
    // where users can fill in all required information before saving
    setLocation(`/defects/${defectId}`);
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
        status: "analysis" as any,
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
        status: "in_progress" as any,
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

  const handleSaveImplementation = async () => {
    if (!selectedDefect || !implementationMethod.trim() || !resolutionNotes.trim()) {
      toast.error("กรุณากรอกวิธีการดำเนินการแก้ไขและหมายเหตุการแก้ไข");
      return;
    }

    try {
      // Upload implementation photos first if any
      let photoUrls: string[] = [];
      if (implementationPhotos.length > 0) {
        setUploadingImplementationPhotos(true);
        
        for (const photo of implementationPhotos) {
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
          photoUrls.push(url);
          
          // Save attachment record
          await uploadAttachmentMutation.mutateAsync({
            defectId: selectedDefect.id,
            fileUrl: url,
            fileKey: key,
            fileName: photo.name,
            fileType: photo.type,
            fileSize: photo.size,
            attachmentType: 'supporting' as const,
          });
        }
        
        setUploadingImplementationPhotos(false);
      }

      // Update defect with implementation details
      await updateDefectMutation.mutateAsync({
        id: selectedDefect.id,
        implementationMethod,
        afterPhotos: photoUrls.length > 0 ? JSON.stringify(photoUrls) : undefined,
        resolutionNotes,
        status: "resolved" as any,
      });

      toast.success("บันทึกการแก้ไขสำเร็จ");
      setShowImplementationForm(false);
      setSelectedDefect(null);
      // Reset form
      setImplementationMethod("");
      setImplementationPhotos([]);
      setResolutionNotes("");
      allDefectsQuery.refetch();
    } catch (error) {
      setUploadingImplementationPhotos(false);
      console.error('Error saving Implementation:', error);
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const stats = {
    total: defects.length,
    critical: defects.filter((d) => d.severity === "critical").length,
    high: defects.filter((d) => d.severity === "high").length,
    open: defects.filter((d) => d.status === "reported").length,
  };

  if (allDefectsQuery.isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">CAR/PAR/NCR</h1>
            <p className="text-gray-500">จัดการข้อบกพร่องและการแก้ไข</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Defect Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor and manage construction defects</p>
      </div>

      {/* Dashboard Metrics with Pie Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Defect Tracking Overview</CardTitle>
          </div>
          <CardDescription>สถิติ Defect ทั้งหมดแบ่งตามสถานะ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'รอตรวจสอบ', value: metrics.pendingVerification, color: '#FBBF24' },
                      { name: 'เปิดอยู่', value: metrics.open, color: '#F97316' },
                      { name: 'ปิดแล้ว', value: metrics.closed, color: '#10B981' },
                      { name: 'เกินกำหนด', value: metrics.overdue, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${((entry.value / metrics.total) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'รอตรวจสอบ', value: metrics.pendingVerification, color: '#FBBF24' },
                      { name: 'เปิดอยู่', value: metrics.open, color: '#F97316' },
                      { name: 'ปิดแล้ว', value: metrics.closed, color: '#10B981' },
                      { name: 'เกินกำหนด', value: metrics.overdue, color: '#EF4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{metrics.pendingVerification}</div>
                  <div className="text-sm text-muted-foreground">รอตรวจสอบ</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'all' ? 'all' : 'all')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{metrics.open}</div>
                  <div className="text-sm text-muted-foreground">เปิดอยู่</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'closed' ? 'all' : 'closed')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{metrics.closed}</div>
                  <div className="text-sm text-muted-foreground">ปิดแล้ว</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setStatusFilter('all');
                  toast.info('กรองแสดง Defect ที่เกินกำหนด');
                }}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{metrics.overdue}</div>
                  <div className="text-sm text-muted-foreground">เกินกำหนด</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="ค้นหา Defects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {filteredDefects.length > 0 && filteredDefects[0]?.projectId && (
          <ExportButton projectId={filteredDefects[0].projectId} type="defects" />
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="CAR">CAR</SelectItem>
            <SelectItem value="PAR">PAR</SelectItem>
            <SelectItem value="NCR">NCR</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="ความรุนแรง" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกระดับ</SelectItem>
            <SelectItem value="critical">วิกฤต</SelectItem>
            <SelectItem value="high">สูง</SelectItem>
            <SelectItem value="medium">ปานกลาง</SelectItem>
            <SelectItem value="low">ต่ำ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="reported">รายงานปัญหา</SelectItem>
            <SelectItem value="analysis">วิเคราะห์สาเหตุ</SelectItem>
            <SelectItem value="in_progress">กำลังแก้ไข</SelectItem>
            <SelectItem value="resolved">แก้ไขเสร็จ</SelectItem>
            <SelectItem value="closed">ปิดงาน</SelectItem>
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
          filteredDefects.map((defect) => {
            const nextStatus = getNextStatus(defect.status);
            const canEdit = permissions.canEdit;
            
            const swipeLeftActions: any[] = [];
            const swipeRightActions: any[] = [];
            
            // Add status change action if available
            if (canEdit && nextStatus) {
              const getStatusIcon = (status: string) => {
                switch (status) {
                  case 'reported':
                    return <CheckCircle2 className="h-5 w-5" />;
                  case 'analysis':
                    return <RefreshCw className="h-5 w-5" />;
                  case 'in_progress':
                    return <CheckCircle2 className="h-5 w-5" />;
                  case 'resolved':
                    return <XCircle className="h-5 w-5" />;
                  default:
                    return <CheckCircle2 className="h-5 w-5" />;
                }
              };
              
              const getStatusButtonText = (status: string) => {
                switch (status) {
                  case 'reported':
                    return 'วิเคราะห์สาเหตุ';
                  case 'analysis':
                    return 'เริ่มแก้ไข';
                  case 'in_progress':
                    return 'บันทึกการแก้ไข';
                  case 'resolved':
                    return 'ปิดงาน';
                  default:
                    return 'อัพเดต';
                }
              };
              
              swipeLeftActions.push({
                label: getStatusButtonText(defect.status),
                color: "#10b981",
                icon: getStatusIcon(defect.status),
                onAction: () => handleQuickStatusChange(defect.id, defect.status),
              });
            }
            
            return (
              <SwipeableCard
                key={defect.id}
                leftActions={swipeLeftActions}
                rightActions={swipeRightActions}
                disabled={updatingDefectId === defect.id}
              >
                <Card 
                  className="hover:shadow-md transition cursor-pointer"
                  onClick={() => setLocation(`/defects/${defect.id}`)}
                >
                    <CardContent className="pt-4 pb-14">
                      <div className="space-y-2.5">
                        {/* Title with Icon */}
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <h3 className="font-semibold text-base leading-tight flex-1">{defect.title}</h3>
                        </div>
                        
                        {/* Description - Compact */}
                        {defect.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">{defect.description}</p>
                        )}
                        
                        {/* Badges - Horizontal scroll on mobile */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          <Badge className={`${getTypeColor(defect.type)} text-xs px-2 py-0.5`}>
                            {defect.type}
                          </Badge>
                          <Badge className={`${getSeverityColor(defect.severity)} text-xs px-2 py-0.5`}>
                            {defect.severity.toUpperCase()}
                          </Badge>
                          <StatusBadge 
                            status={defect.status}
                            label={getStatusLabel(defect.status)}
                            className="text-xs px-2 py-0.5"
                          />
                        </div>
                        
                        {/* Metadata - Single line */}
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="truncate">
                            งาน: {defect.taskName || 'Unknown Task'}
                          </div>
                          <div className="truncate">
                            {new Date(defect.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                </Card>
                
                {/* Inline status change button */}
                {canEdit && nextStatus && (
                  <div className="absolute bottom-4 right-4 z-10">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickStatusChange(defect.id, defect.status);
                      }}
                      disabled={updatingDefectId === defect.id}
                      className="shadow-md"
                    >
                      {updatingDefectId === defect.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        getStatusButtonContent(defect.status)
                      )}
                    </Button>
                  </div>
                )}
              </SwipeableCard>
            );
          })
        )}
      </div>

      {/* Defect Detail Dialog */}
      <Dialog open={!!selectedDefect && !showRCAForm && !showActionPlanForm && !showImplementationForm} onOpenChange={(open) => !open && setSelectedDefect(null)}>
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
                    <StatusBadge 
                      status={selectedDefect.status}
                      label={getStatusLabel(selectedDefect.status)}
                    />
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
                    <p className="text-xs text-[#00CE81] mt-2">กำหนดเสร็จ: {new Date(selectedDefect.dueDate).toLocaleDateString('th-TH')}</p>
                  )}
                </div>
              )}

              {/* Before-After Photos Comparison */}
              {selectedDefect.beforePhotos && selectedDefect.afterPhotos && (() => {
                try {
                  const beforePhotos = JSON.parse(selectedDefect.beforePhotos);
                  const afterPhotos = JSON.parse(selectedDefect.afterPhotos);
                  if (Array.isArray(beforePhotos) && beforePhotos.length > 0 && Array.isArray(afterPhotos) && afterPhotos.length > 0) {
                    return (
                      <div className="border-t pt-4">
                        <BeforeAfterComparison
                          beforePhotos={beforePhotos}
                          afterPhotos={afterPhotos}
                        />
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing photos:', e);
                }
                return null;
              })()}

              {/* Action Buttons based on status */}
              <div className="flex gap-2">
                {selectedDefect.status === "reported" && (
                  <Button
                    onClick={() => setShowRCAForm(true)}
                    className="flex-1 bg-[#00366D] hover:bg-blue-700"
                  >
                    วิเคราะห์สาเหตุต้นตอ
                  </Button>
                )}
                {selectedDefect.status === "analysis" && !selectedDefect.correctiveAction && (
                  <Button
                    onClick={() => setShowActionPlanForm(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    สร้างแผนการแก้ไข
                  </Button>
                )}
                {(selectedDefect.status === "in_progress" || (selectedDefect.status === "analysis" && selectedDefect.correctiveAction)) && (
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
                    onClick={() => setShowImplementationForm(true)}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    แก้ไขเสร็จแล้ว
                  </Button>
                )}
                {selectedDefect.status === "resolved" && (
                  <Button
                    onClick={() => handleUpdateDefect("closed")}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-[#00366D] hover:bg-blue-700"
                  >
                    ขอตรวจสอบ
                  </Button>
                )}
                {selectedDefect.status === "resolved" && false && (
                  <Button
                    onClick={() => setShowVerificationForm(true)}
                    disabled={updateDefectMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    ตรวจสอบผลการแก้ไข
                  </Button>
                )}
                {selectedDefect.status === "resolved" && false && (
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
              <Search className="w-5 h-5 text-[#00366D]" />
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
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
                className="flex-1 bg-[#00366D] hover:bg-blue-700"
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
              <CheckCircle2 className="w-5 h-5 text-[#00CE81]" />
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
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
              
              {/* File Upload Component */}
              <FileUpload
                onFilesSelected={setAfterPhotos}
                maxFiles={10}
                maxSizeMB={10}
                acceptedTypes={["image/jpeg", "image/png", "image/webp", "image/jpg", "image/heic"]}
                multiple={true}
              />
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
                    <div className="w-3 h-3 rounded-full bg-[#00CE81]"></div>
                    <h4 className="font-semibold text-[#00CE81]">หลังแก้ไข (After)</h4>
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
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
                      status: "analysis" as any,
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
                      status: "closed" as any,
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
              <CheckCircle2 className="w-5 h-5 text-[#00CE81]" />
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
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
                      status: "analysis" as any,
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
                onClick={() => {
                  setShowEffectivenessForm(false);
                  setShowClosureForm(true);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                มีประสิทธิผล - ปิด CAR/NCR (Effective)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Implementation Form Dialog */}
      <Dialog open={showImplementationForm} onOpenChange={setShowImplementationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              บันทึกการแก้ไข - {selectedDefect?.type}
            </DialogTitle>
            <DialogDescription>
              กรอกวิธีการดำเนินการแก้ไขและอัปโหลดรูปภาพหลังการแก้ไข
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display Before Photos if they exist */}
            {selectedDefect?.beforePhotos && (() => {
              try {
                const beforePhotos = JSON.parse(selectedDefect.beforePhotos);
                if (Array.isArray(beforePhotos) && beforePhotos.length > 0) {
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                        รูปภาพปัญหา (Before Photos)
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {beforePhotos.map((url: string, index: number) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Before ${index + 1}`}
                            className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    </div>
                  );
                }
              } catch (e) {
                console.error('Error parsing before photos:', e);
              }
              return null;
            })()}

            <div className="space-y-2">
              <Label htmlFor="implementationMethod" className="text-sm font-semibold">
                วิธีการดำเนินการแก้ไข <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="implementationMethod"
                placeholder="ระบุวิธีการและขั้นตอนการดำเนินการแก้ไข..."
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                value={implementationMethod}
                onChange={(e) => setImplementationMethod(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolutionNotes" className="text-sm font-semibold">
                หมายเหตุการแก้ไข <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="resolutionNotes"
                placeholder="บันทึกหมายเหตุ ข้อสังเกต และผลการแก้ไข..."
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                รูปภาพหลังการแก้ไข (After Photos)
              </Label>
              <FileUpload
                onFilesSelected={setImplementationPhotos}
                maxFiles={10}
                maxSizeMB={10}
                acceptedTypes={["image/jpeg", "image/png", "image/webp", "image/jpg"]}
                multiple={true}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImplementationForm(false);
                  setImplementationMethod("");
                  setImplementationPhotos([]);
                  setResolutionNotes("");
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSaveImplementation}
                disabled={!implementationMethod.trim() || !resolutionNotes.trim() || updateDefectMutation.isPending || uploadingImplementationPhotos}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {(updateDefectMutation.isPending || uploadingImplementationPhotos) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadingImplementationPhotos ? 'กำลังอัปโหลดรูป...' : 'กำลังบันทึก...'}
                  </>
                ) : (
                  "บันทึกการแก้ไข"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Closure Form Dialog */}
      <Dialog open={showClosureForm} onOpenChange={setShowClosureForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00CE81]" />
              ปิด {selectedDefect?.type}
            </DialogTitle>
            <DialogDescription>
              กรอกหมายเหตุการอนุมัติและปิดเคส
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="closureNotes" className="text-sm font-semibold">
                หมายเหตุการอนุมัติ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="closureNotes"
                placeholder="บันทึกหมายเหตุการอนุมัติและปิดเคส..."
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowClosureForm(false);
                  setClosureNotes("");
                }}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedDefect || !closureNotes.trim()) {
                    toast.error("กรุณากรอกหมายเหตุการอนุมัติ");
                    return;
                  }
                  try {
                    await updateDefectMutation.mutateAsync({
                      id: selectedDefect.id,
                      status: "closed" as any,
                      closureNotes: closureNotes,
                    });
                    toast.success("ปิด CAR/NCR สำเร็จ");
                    setShowClosureForm(false);
                    setSelectedDefect(null);
                    setClosureNotes("");
                    allDefectsQuery.refetch();
                  } catch (error) {
                    toast.error("เกิดข้อผิดพลาด");
                  }
                }}
                disabled={!closureNotes.trim() || updateDefectMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updateDefectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "ปิด CAR/NCR"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button - สร้าง Defect ใหม่ */}
      {permissions.canCreate && (
        <FloatingActionButton
          onClick={() => setLocation('/qc-inspection')}
          icon={AlertTriangle}
          label="รายงานปัญหา"
          variant="destructive"
        />
      )}
      </div>
    </PullToRefresh>
  );
}
