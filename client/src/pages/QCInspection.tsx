import { useState } from "react";
import * as React from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ClipboardCheck, PieChart as PieChartIcon, Calendar, User, AlertTriangle, Plus } from "lucide-react";
import { CardSkeleton } from "@/components/skeletons";
import FloatingActionButton from "@/components/FloatingActionButton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "@/components/LazyChart";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { SwipeableCard } from "@/components/SwipeableCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useOfflineForm } from "@/hooks/useOfflineForm";

type InspectionResult = "pass" | "fail" | "na";

interface ItemResult {
  itemId: number;
  result: InspectionResult | null;
  photoUrls?: string[];
}

interface CreateDefectFormData {
  type: "CAR" | "PAR" | "NCR";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  ncrLevel?: "major" | "minor";
  assignedTo?: number;
}

export default function QCInspection() {
  const { canCreate } = usePermissions('defects');
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [itemResults, setItemResults] = useState<Record<number, ItemResult>>({});
  const [generalComments, setGeneralComments] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isCreatingDefect, setIsCreatingDefect] = useState(false);
  const [defectChecklistId, setDefectChecklistId] = useState<number | null>(null);
  const [defectForm, setDefectForm] = useState<CreateDefectFormData>({
    type: "CAR",
    title: "",
    description: "",
    severity: "medium",
  });
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [defectPhotos, setDefectPhotos] = useState<string[]>([]);
  const [inspectorSignature, setInspectorSignature] = useState<string | null>(null);
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);
  const [newInspectionForm, setNewInspectionForm] = useState({
    projectId: 0,
    taskId: 0,
    templateId: 0,
  });

  
  // Read status from URL parameter
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('status');
    }
    return null;
  });
  
  // Additional filters
  const [searchQuery, setSearchQuery] = useState("");

  // Queries - get all checklists (taskName already included from backend)
  const utils = trpc.useUtils();
  const { data: checklistsData, refetch: refetchChecklists, isLoading: checklistsLoading } = trpc.checklist.getAllTaskChecklists.useQuery();
  const { data: users } = trpc.user.list.useQuery();
  const { data: projects } = trpc.project.list.useQuery();
  const { data: templates } = trpc.checklist.templates.useQuery();
  const { data: allTasks } = trpc.task.list.useQuery({});
  
  const handleRefresh = async () => {
    await Promise.all([
      utils.checklist.getAllTaskChecklists.invalidate(),
      utils.user.list.invalidate(),
      utils.project.list.invalidate(),
    ]);
  };
  
  // Use checklists directly (taskName is already included from backend JOIN)
  const allChecklists = React.useMemo(() => {
    if (!checklistsData) return [];
    return checklistsData.map(checklist => ({
      ...checklist,
      taskName: checklist.taskName || "Unknown Task"
    }));
  }, [checklistsData]);

  // Calculate real stats from all checklists
  const checklistStats = React.useMemo(() => {
    return allChecklists.reduce((acc: any, checklist: any) => {
      const status = checklist.status || 'not_started';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allChecklists]);

  const stats = {
    not_started: checklistStats.not_started || 0,
    pending_inspection: checklistStats.pending_inspection || 0,
    completed: checklistStats.completed || 0,
    failed: checklistStats.failed || 0,
  };

  // Filter checklists by all criteria
  const filteredChecklists = React.useMemo(() => {
    let filtered = allChecklists;
    
    // Filter by status (from URL or manual selection)
    if (statusFilter) {
      filtered = filtered.filter(c => (c.status || 'not_started') === statusFilter);
    }
    
    // Filter by search query (task name or template name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.taskName?.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.templateName?.toLowerCase().includes(query)
      );
    }
    
    // Stage filter removed for simplicity
    
    return filtered;
  }, [allChecklists, statusFilter, searchQuery]);

  const selectedChecklist = allChecklists.find(c => c.id === selectedChecklistId);

  const createSignatureMutation = trpc.signature.create.useMutation();

  const updateChecklistMutation = trpc.checklist.updateChecklistStatus.useMutation();
  
  // Offline-capable inspection submission
  const offlineInspection = useOfflineForm({
    type: 'inspection',
    onlineSubmit: async (data: any) => {
      await updateChecklistMutation.mutateAsync(data);
      
      // Save signature after checklist update
      if (inspectorSignature) {
        try {
          await createSignatureMutation.mutateAsync({
            checklistId: data.id,
            signatureData: inspectorSignature,
            signedBy: 1, // TODO: Use actual user ID from context
          });
        } catch (error: any) {
          console.error("Failed to save signature:", error);
        }
      }
    },
    onSuccess: () => {
      setIsInspecting(false);
      setSelectedChecklistId(null);
      setItemResults({});
      setGeneralComments("");
      setInspectorSignature(null);
      refetchChecklists();
    },
    onError: (error: any) => {
      console.error('Inspection submission error:', error);
    },
  });

  const createDefectMutation = trpc.defect.create.useMutation();

  const createInspectionMutation = trpc.checklist.assignToTask.useMutation({
    onSuccess: () => {
      toast.success("สร้าง Inspection สำเร็จ");
      setIsCreatingInspection(false);
      setNewInspectionForm({ projectId: 0, taskId: 0, templateId: 0 });
      refetchChecklists();
    },
    onError: (error: any) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });
  
  const uploadAttachmentMutation = trpc.defect.uploadAttachment.useMutation();

  const handleStartInspection = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setIsInspecting(true);
    setItemResults({});
    setGeneralComments("");
    setBeforePhotos([]);
  };

  const handleCreateDefect = (checklistId: number) => {
    const checklist = allChecklists.find(c => c.id === checklistId);
    if (!checklist) return;
    
    setDefectChecklistId(checklistId);
    setDefectForm({
      type: "CAR",
      title: `${checklist.name} - ไม่ผ่านการตรวจสอบ`,
      description: `Checklist: ${checklist.name}\nงาน: ${checklist.taskName}`,
      severity: "medium",
    });
    setIsCreatingDefect(true);
  };

  const handleCreateInspection = () => {
    if (!newInspectionForm.projectId || !newInspectionForm.taskId || !newInspectionForm.templateId) {
      toast.error("กรุณาเลือกข้อมูลให้ครบถ้วน");
      return;
    }

    createInspectionMutation.mutate({
      taskId: newInspectionForm.taskId,
      templateId: newInspectionForm.templateId,
    });
  };

  const handleSubmitDefect = async () => {
    const checklist = allChecklists.find((c: any) => c.id === defectChecklistId);
    if (!checklist || !defectForm.title) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      // Create defect with photo URLs
      await createDefectMutation.mutateAsync({
        projectId: checklist.projectId || 0,
        taskId: checklist.taskId,
        checklistId: checklist.id,
        type: defectForm.type,
        title: defectForm.title,
        description: defectForm.description,
        severity: defectForm.severity,
        ncrLevel: defectForm.ncrLevel,
        assignedTo: defectForm.assignedTo,
        photoUrls: defectPhotos.length > 0 ? JSON.stringify(defectPhotos) : undefined,
      });
      
      toast.success("สร้าง " + defectForm.type + " สำเร็จ");
      
      // Reset form
      setIsCreatingDefect(false);
      setDefectChecklistId(null);
      setDefectForm({
        type: "CAR",
        title: "",
        description: "",
        severity: "medium",
      });
      setDefectPhotos([]);
      refetchChecklists();
    } catch (error: any) {
      console.error('Error creating defect:', error);
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleItemResult = (itemId: number, result: InspectionResult) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], itemId, result }
    }));
  };

  const handleItemPhotos = (itemId: number, photoUrls: string[]) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], itemId, photoUrls }
    }));
  };

  const handleSubmitInspection = async () => {
    if (!selectedChecklist) return;

    const items = selectedChecklist.items as any[];
    const allItemsChecked = items.every(item => itemResults[item.id]?.result);

    if (!allItemsChecked) {
      toast.error("กรุณาตรวจสอบรายการให้ครบทุกข้อ");
      return;
    }

    if (!inspectorSignature) {
      toast.error("กรุณาเซ็นลายเซ็นผู้ตรวจสอบ");
      return;
    }

    const hasFailures = Object.values(itemResults).some(r => r.result === "fail");
    const finalStatus = hasFailures ? "failed" : "completed";

    // Use offline-capable submission
    offlineInspection.submit({
      id: selectedChecklist.id,
      status: finalStatus,
      generalComments: generalComments || undefined,
      photoUrls: beforePhotos.length > 0 ? JSON.stringify(beforePhotos) : undefined,
      signature: inspectorSignature || undefined,
      itemResults: Object.entries(itemResults).map(([itemId, data]) => ({
        templateItemId: parseInt(itemId),
        result: data.result as "pass" | "fail" | "na",
        photoUrls: data.photoUrls && data.photoUrls.length > 0 ? JSON.stringify(data.photoUrls) : undefined,
      })),
    });
    
    // Reset photos after successful submission
    setBeforePhotos([]);
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  if (checklistsLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">QC Inspection Overview</h1>
          <p className="text-muted-foreground mt-1">
            ระบบตรวจสอบคุณภาพงานก่อสร้าง
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QC Inspection Overview</h1>
          <p className="text-muted-foreground mt-1">
            ระบบตรวจสอบคุณภาพงานก่อสร้าง
          </p>
        </div>
      </div>

      {/* Search and Filters - Moved to top */}
      <div className="mb-6 flex gap-4">
        {/* Search Box */}
        <Input
          placeholder="ค้นหา checklist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        {/* Status Filter Dropdown */}
        <Select 
          value={statusFilter || 'all'} 
          onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ทุกสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="not_started">ยังไม่เริ่ม</SelectItem>
            <SelectItem value="pending_inspection">รอตรวจสอบ</SelectItem>
            <SelectItem value="completed">ผ่าน</SelectItem>
            <SelectItem value="failed">ไม่ผ่าน</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Active Filters Display - Only show if filters are active */}
      {(searchQuery || statusFilter) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">กรองโดย:</span>
            {searchQuery && (
              <Badge variant="secondary">
                ค้นหา: "{searchQuery}"
              </Badge>
            )}
            {statusFilter && (
              <Badge variant="secondary">
                สถานะ: {statusFilter === 'not_started' ? 'ยังไม่เริ่ม' : statusFilter === 'pending_inspection' ? 'รอตรวจสอบ' : statusFilter === 'completed' ? 'ผ่าน' : 'ไม่ผ่าน'}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">({filteredChecklists.length} รายการ)</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter(null);
              }}
            >
              ล้างตัวกรอง
            </Button>
          </div>
        </div>
      )}
      {/* Checklist Overview Stats */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>สรุปสถานะ Checklists ทั้งหมด</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'รอตรวจสอบ', value: stats.pending_inspection, color: '#FBBF24' },
                      { name: 'ผ่าน', value: stats.completed, color: '#10B981' },
                      { name: 'ไม่ผ่าน', value: stats.failed, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'รอตรวจสอบ', value: stats.pending_inspection, color: '#FBBF24' },
                      { name: 'ผ่าน', value: stats.completed, color: '#10B981' },
                      { name: 'ไม่ผ่าน', value: stats.failed, color: '#EF4444' },
                    ].map((entry, index: any) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'not_started' ? null : 'not_started')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{stats.not_started}</div>
                  <div className="text-sm text-muted-foreground">ยังไม่เริ่ม</div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'pending_inspection' ? null : 'pending_inspection')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending_inspection}</div>
                  <div className="text-sm text-muted-foreground">รอตรวจสอบ</div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'completed' ? null : 'completed')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-[#00CE81]">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">ผ่าน</div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(statusFilter === 'failed' ? null : 'failed')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">ไม่ผ่าน</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            Checklists ({filteredChecklists.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((checklist: any) => (
            <SwipeableCard
              key={checklist.id}
              leftActions={[
                {
                  label: "ตรวจสอบ",
                  color: "#3b82f6",
                  icon: <ClipboardCheck className="h-5 w-5" />,
                  onAction: () => handleStartInspection(checklist.id),
                },
              ]}
              rightActions={checklist.status === 'failed' && canCreate ? [
                {
                  label: "สร้าง CAR/NCR",
                  color: "#ef4444",
                  icon: <AlertTriangle className="h-5 w-5" />,
                  onAction: () => handleCreateDefect(checklist.id),
                },
              ] : []}
              disabled={checklist.status === 'completed'}
            >
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStartInspection(checklist.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{checklist.templateName || checklist.name}</CardTitle>
                      <CardDescription className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="truncate">งาน: {checklist.taskName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="truncate">🏗️ {checklist.projectName || 'ไม่ระบุ'}</span>
                        </div>
                      </CardDescription>
                    </div>
                    {getStatusBadge(checklist.status || 'not_started')}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>{(checklist.items as any[])?.length || 0} รายการ</span>
                      </div>
                      {checklist.inspectedBy && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span className="truncate">User #{checklist.inspectedBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 mt-3">
                      <Button 
                        className="w-full h-9 text-sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartInspection(checklist.id);
                        }}
                        disabled={checklist.status === 'completed'}
                      >
                        {checklist.status === 'completed' ? 'ตรวจสอบแล้ว' : 'เริ่มตรวจสอบ'}
                      </Button>
                      {checklist.status === 'failed' && canCreate && (
                        <Button 
                          className="w-full h-9 text-sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateDefect(checklist.id);
                          }}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                          Create CAR/NCR
                        </Button>
                      )}
                    </div>
                </div>
              </CardContent>
            </Card>
          </SwipeableCard>
          ))}
        </div>
      </div>

      {/* Inspection Dialog */}
      <Dialog open={isInspecting} onOpenChange={setIsInspecting}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.templateName || selectedChecklist?.name}</DialogTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>📋 งาน: {selectedChecklist?.taskName}</div>
              <div>🏗️ โครงการ: {selectedChecklist?.projectName || 'ไม่ระบุ'}</div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Inspection Items - All in one card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">รายการตรวจสอบ</h3>
                <div className="space-y-4">
                  {(selectedChecklist?.items as any[] || []).map((item, index: any) => (
                    <div key={item.id} className="pb-4 border-b last:border-b-0 last:pb-0">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{index + 1}. {item.description}</p>
                          {item.acceptanceCriteria && (
                            <p className="text-sm text-muted-foreground mt-1">
                              เกณฑ์: {item.acceptanceCriteria}
                            </p>
                          )}
                        </div>
                        <RadioGroup
                          value={itemResults[item.id]?.result || ""}
                          onValueChange={(value) => handleItemResult(item.id, value as InspectionResult)}
                        >
                          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                            <div className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-green-50 transition-colors" onClick={() => handleItemResult(item.id, 'pass')}>
                              <RadioGroupItem value="pass" id={`pass-${item.id}`} className="w-5 h-5" />
                              <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-2 cursor-pointer font-medium text-base">
                                <CheckCircle2 className="h-6 w-6 text-[#00CE81]" />
                                ผ่าน
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors" onClick={() => handleItemResult(item.id, 'fail')}>
                              <RadioGroupItem value="fail" id={`fail-${item.id}`} className="w-5 h-5" />
                              <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-2 cursor-pointer font-medium text-base">
                                <XCircle className="h-6 w-6 text-red-600" />
                                ไม่ผ่าน
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                        
                        {/* Photo upload for this item */}
                        <div className="mt-3 space-y-2">
                          <Label className="text-sm text-muted-foreground">รูปภาพประกอบ (ถ้ามี)</Label>
                          <ImageUpload
                            value={itemResults[item.id]?.photoUrls || []}
                            onChange={(urls) => handleItemPhotos(item.id, urls)}
                            maxImages={5}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>รูปภาพประกอบการตรวจสอบ</Label>
              <ImageUpload
                value={beforePhotos}
                onChange={setBeforePhotos}
                maxImages={10}
              />
            </div>

            {/* General Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">ความเห็นเพิ่มเติม</Label>
              <Textarea
                id="comments"
                placeholder="ระบุความเห็นหรือข้อสังเกต (ถ้ามี)"
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                rows={4}
              />
            </div>

            {/* Inspector Signature */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">ลายเซ็นผู้ตรวจสอบ *</Label>
              <SignatureCanvas
                onSignatureChange={setInspectorSignature}
                label=""
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsInspecting(false)} className="w-full sm:w-auto h-12 text-base">
                ยกเลิก
              </Button>
              <Button onClick={handleSubmitInspection} disabled={updateChecklistMutation.isPending} className="w-full sm:w-auto h-12 text-base font-semibold">
                {updateChecklistMutation.isPending ? "กำลังบันทึก..." : "✓ บันทึกผลการตรวจสอบ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create CAR/PAR/NCR Dialog - Improved UX/UI */}
      <Dialog open={isCreatingDefect} onOpenChange={setIsCreatingDefect}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              สร้างรายงาน CAR/PAR/NCR
            </DialogTitle>
            <DialogDescription className="text-base">
              บันทึกข้อบกพร่องที่พบจากการตรวจสอบเพื่อดำเนินการแก้ไขและป้องกัน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Traceability Info - Improved with icons */}
            <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ClipboardCheck className="h-5 w-5 text-[#00366D] dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">ข้อมูลการตรวจสอบ</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#00366D] dark:text-blue-400" />
                        <div>
                          <span className="text-muted-foreground">Checklist:</span>
                          <p className="font-medium">{allChecklists.find((c: any) => c.id === defectChecklistId)?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00366D] dark:text-blue-400" />
                        <div>
                          <span className="text-muted-foreground">งาน:</span>
                          <p className="font-medium">{allChecklists.find((c: any) => c.id === defectChecklistId)?.taskName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏗️</span>
                        <div>
                          <span className="text-muted-foreground">โครงการ:</span>
                          <p className="font-medium">{allChecklists.find((c: any) => c.id === defectChecklistId)?.projectName || 'ไม่ระบุ'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type Selection - Color coded with icons */}
            <div className="space-y-3">
              <Label htmlFor="defect-type" className="text-base font-semibold">ประเภทรายงาน *</Label>
              <Select 
                value={defectForm.type} 
                onValueChange={(value: "CAR" | "PAR" | "NCR") => setDefectForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="defect-type" className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAR" className="text-base py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div>
                        <div className="font-semibold">CAR - Corrective Action Request</div>
                        <div className="text-xs text-muted-foreground">คำขอดำเนินการแก้ไข</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="PAR" className="text-base py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#00366D]"></div>
                      <div>
                        <div className="font-semibold">PAR - Preventive Action Request</div>
                        <div className="text-xs text-muted-foreground">คำขอดำเนินการป้องกัน</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="NCR" className="text-base py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div>
                        <div className="font-semibold">NCR - Non-Conformance Report</div>
                        <div className="text-xs text-muted-foreground">รายงานความไม่สอดคล้อง</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className={`p-3 rounded-lg text-sm ${
                defectForm.type === "CAR" ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800" :
                defectForm.type === "PAR" ? "bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800" :
                "bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100 border border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    {defectForm.type === "CAR" && "ใช้สำหรับแก้ไขปัญหาที่เกิดขึ้นแล้ว เพื่อป้องกันไม่ให้เกิดซ้ำ"}
                    {defectForm.type === "PAR" && "ใช้สำหรับป้องกันปัญหาที่อาจเกิดขึ้นในอนาคต โดยวิเคราะห์จากความเสี่ยง"}
                    {defectForm.type === "NCR" && "ใช้สำหรับรายงานความไม่สอดคล้องตามมาตรฐาน ข้อกำหนด หรือคุณภาพที่กำหนด"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Information Section */}
            <div className="space-y-4 p-5 rounded-lg border bg-card">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ข้อมูลปัญหา
              </h3>
              
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="defect-title" className="text-sm font-medium">
                  หัวข้อปัญหา <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="defect-title"
                  value={defectForm.title}
                  onChange={(e) => setDefectForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="เช่น: พบรอยแตกที่คานคอนกรีต"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">ระบุสรุปปัญหาที่พบให้ชัดเจนและกระชับ</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="defect-description" className="text-sm font-medium">
                  รายละเอียดปัญหา
                </Label>
                <Textarea
                  id="defect-description"
                  value={defectForm.description}
                  onChange={(e) => setDefectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="อธิบายรายละเอียดปัญหา ตำแหน่งที่พบ และผลกระทบที่อาจเกิดขึ้น"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">ระบุรายละเอียดให้ครบถ้วนเพื่อการวิเคราะห์และแก้ไขที่ถูกต้อง</p>
              </div>
            </div>

            {/* Priority & Assignment Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Severity */}
              <div className="space-y-2">
                <Label htmlFor="defect-severity" className="text-sm font-medium">
                  ระดับความรุนแรง <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={defectForm.severity} 
                  onValueChange={(value: "low" | "medium" | "high" | "critical") => setDefectForm(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger id="defect-severity" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00CE81]"></div>
                        <span>ต่ำ - Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium" className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>ปานกลาง - Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high" className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>สูง - High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical" className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>วิกฤต - Critical</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">ประเมินผลกระทบและความเร่งด่วนในการแก้ไข</p>
              </div>

              {/* NCR Level (only for NCR) */}
              {defectForm.type === "NCR" && (
                <div className="space-y-2">
                  <Label htmlFor="ncr-level" className="text-sm font-medium">
                    ระดับ NCR
                  </Label>
                  <Select 
                    value={defectForm.ncrLevel || ""} 
                    onValueChange={(value: "major" | "minor") => setDefectForm(prev => ({ ...prev, ncrLevel: value }))}
                  >
                    <SelectTrigger id="ncr-level" className="h-11">
                      <SelectValue placeholder="เลือกระดับ NCR" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="major" className="py-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Major - รุนแรง</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="minor" className="py-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span>Minor - เล็กน้อย</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Major: ส่งผลกระทบต่อคุณภาพหลัก, Minor: ส่งผลกระทบเล็กน้อย</p>
                </div>
              )}

              {/* Assign To */}
              <div className="space-y-2">
                <Label htmlFor="defect-assignee" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  มอบหมายให้
                </Label>
                <Select 
                  value={defectForm.assignedTo?.toString() || ""} 
                  onValueChange={(value) => setDefectForm(prev => ({ ...prev, assignedTo: value ? parseInt(value) : undefined }))}
                >
                  <SelectTrigger id="defect-assignee" className="h-11">
                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || []).map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()} className="py-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {user.name || user.email || `User #${user.id}`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">ระบุผู้รับผิดชอบในการดำเนินการแก้ไข (ถ้ามี)</p>
              </div>
            </div>

            {/* Before Photos Upload Section */}
            <div className="space-y-3 p-5 rounded-lg border bg-card">
              <h3 className="font-semibold text-base">
                รูปภาพประกอบปัญหา
              </h3>
              <p className="text-sm text-muted-foreground">
                อัปโหลดรูปภาพแสดงสภาพปัญหาก่อนดำเนินการแก้ไข
              </p>
              
              <ImageUpload
                value={defectPhotos}
                onChange={setDefectPhotos}
                maxImages={10}
              />
            </div>
          </div>

          <DialogFooter className="mt-8 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreatingDefect(false)}
              className="h-11 px-6"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleSubmitDefect} 
              disabled={createDefectMutation.isPending || !defectForm.title}
              className={`h-11 px-6 ${
                defectForm.type === "CAR" ? "bg-yellow-600 hover:bg-yellow-700" :
                defectForm.type === "PAR" ? "bg-[#00366D] hover:bg-blue-700" :
                "bg-red-600 hover:bg-red-700"
              }`}
            >
              {createDefectMutation.isPending ? 'กำลังสร้าง...' : `สร้าง ${defectForm.type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Inspection Dialog */}
      <Dialog open={isCreatingInspection} onOpenChange={setIsCreatingInspection}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้าง Inspection ใหม่</DialogTitle>
            <DialogDescription>
              เลือกโครงการ งาน และ Checklist Template เพื่อสร้าง Inspection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">โครงการ *</Label>
              <Select
                value={newInspectionForm.projectId.toString()}
                onValueChange={(value) => {
                  setNewInspectionForm({ ...newInspectionForm, projectId: parseInt(value), taskId: 0 });
                }}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="เลือกโครงการ" />
                </SelectTrigger>
                <SelectContent>
                  {(projects?.items || []).map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label htmlFor="task">งาน *</Label>
              <Select
                value={newInspectionForm.taskId.toString()}
                onValueChange={(value) => {
                  setNewInspectionForm({ ...newInspectionForm, taskId: parseInt(value) });
                }}
                disabled={!newInspectionForm.projectId}
              >
                <SelectTrigger id="task">
                  <SelectValue placeholder="เลือกงาน" />
                </SelectTrigger>
                <SelectContent>
                  {allTasks?.items
                    ?.filter((task: any) => task.projectId === newInspectionForm.projectId)
                    .map((task: any) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Checklist Template *</Label>
              <Select
                value={newInspectionForm.templateId.toString()}
                onValueChange={(value) => {
                  setNewInspectionForm({ ...newInspectionForm, templateId: parseInt(value) });
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="เลือก Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates && (
                    <>
                      {templates.preExecution?.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Pre-Execution
                          </div>
                          {templates.preExecution.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {templates.inProgress?.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            In-Progress
                          </div>
                          {templates.inProgress.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {templates.postExecution?.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            Post-Execution
                          </div>
                          {templates.postExecution.map((template: any) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingInspection(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateInspection}
              disabled={createInspectionMutation.isPending}
            >
              {createInspectionMutation.isPending ? "กำลังสร้าง..." : "สร้าง Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button - สร้าง Inspection ใหม่ */}
      {canCreate && (
        <FloatingActionButton
          onClick={() => {
            // เลือก checklist แรกที่ยังไม่ได้ตรวจ
            const pendingChecklist = filteredChecklists.find((c: any) => c.status === 'pending_inspection');
            if (pendingChecklist) {
              setSelectedChecklistId(pendingChecklist.id);
              setIsInspecting(true);
            } else {
              toast.info('ไม่มี Checklist ที่รอตรวจสอบ');
            }
          }}
          icon={ClipboardCheck}
          label="ตรวจสอบ"
        />
      )}
    </PullToRefresh>
  );
}
