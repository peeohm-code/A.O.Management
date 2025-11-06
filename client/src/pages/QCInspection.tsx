import { useState } from "react";
import * as React from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ClipboardCheck, PieChart as PieChartIcon, Calendar, User, AlertTriangle, Upload, X, Image as ImageIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

type InspectionResult = "pass" | "fail" | "na";

interface ItemResult {
  itemId: number;
  result: InspectionResult | null;
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
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Read status from URL parameter
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('status');
    }
    return null;
  });

  // Queries - get all tasks and checklists
  const { data: tasks } = trpc.task.list.useQuery({});
  const { data: checklistsData, refetch: refetchChecklists } = trpc.checklist.getAllTaskChecklists.useQuery();
  const { data: users } = trpc.user.list.useQuery();
  
  // Map checklists with task names
  const allChecklists = React.useMemo(() => {
    if (!checklistsData || !tasks) return [];
    return checklistsData.map(checklist => {
      const task = tasks.find(t => t.id === checklist.taskId);
      return { ...checklist, taskName: task?.name || "Unknown Task" };
    });
  }, [checklistsData, tasks]);

  // Calculate real stats from all checklists
  const checklistStats = React.useMemo(() => {
    return allChecklists.reduce((acc, checklist: any) => {
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

  // Filter checklists by status
  const filteredChecklists = React.useMemo(() => {
    if (!statusFilter) return allChecklists;
    return allChecklists.filter(c => (c.status || 'not_started') === statusFilter);
  }, [allChecklists, statusFilter]);

  const selectedChecklist = allChecklists.find(c => c.id === selectedChecklistId);

  const updateChecklistMutation = trpc.checklist.updateChecklistStatus.useMutation({
    onSuccess: () => {
      toast.success("บันทึกผลการตรวจสอบสำเร็จ");
      setIsInspecting(false);
      setSelectedChecklistId(null);
      setItemResults({});
      setGeneralComments("");
      // Refetch checklists
      refetchChecklists();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const createDefectMutation = trpc.defect.create.useMutation();
  
  const uploadAttachmentMutation = trpc.defect.uploadAttachment.useMutation();

  const handleStartInspection = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setIsInspecting(true);
    setItemResults({});
    setGeneralComments("");
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

  const handleSubmitDefect = async () => {
    const checklist = allChecklists.find(c => c.id === defectChecklistId);
    if (!checklist || !defectForm.title) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setUploadingPhotos(true);
      
      // Create defect first
      const defect = await createDefectMutation.mutateAsync({
        taskId: checklist.taskId,
        checklistId: checklist.id,
        type: defectForm.type,
        title: defectForm.title,
        description: defectForm.description,
        severity: defectForm.severity,
        ncrLevel: defectForm.ncrLevel,
        assignedTo: defectForm.assignedTo,
      });

      // Upload before photos if any
      if (beforePhotos.length > 0) {
        for (const photo of beforePhotos) {
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
            defectId: defect.id,
            fileUrl: url,
            fileKey: key,
            fileName: photo.name,
            fileType: photo.type,
            fileSize: photo.size,
            attachmentType: 'before' as const,
          });
        }
      }
      
      setUploadingPhotos(false);
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
      setBeforePhotos([]);
      refetchChecklists();
    } catch (error) {
      setUploadingPhotos(false);
      console.error('Error creating defect:', error);
      toast.error("เกิดข้อผิดพลาด: " + (error as Error).message);
    }
  };

  const handleItemResult = (itemId: number, result: InspectionResult) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { itemId, result }
    }));
  };

  const handleSubmitInspection = () => {
    if (!selectedChecklist) return;

    const items = selectedChecklist.items as any[];
    const allItemsChecked = items.every(item => itemResults[item.id]?.result);

    if (!allItemsChecked) {
      toast.error("กรุณาตรวจสอบรายการให้ครบทุกข้อ");
      return;
    }

    const hasFailures = Object.values(itemResults).some(r => r.result === "fail");
    const finalStatus = hasFailures ? "failed" : "completed";

    updateChecklistMutation.mutate({
      id: selectedChecklist.id,
      status: finalStatus,
      generalComments: generalComments || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      not_started: { label: "ยังไม่เริ่ม", className: "bg-gray-100 text-gray-700" },
      pending_inspection: { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-700" },
      completed: { label: "ผ่าน", className: "bg-green-100 text-green-700" },
      failed: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = config[status] || config.not_started;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QC Inspection Overview</h1>
        <p className="text-muted-foreground mt-1">
          ระบบตรวจสอบคุณภาพงานก่อสร้าง
        </p>
      </div>

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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'รอตรวจสอบ', value: stats.pending_inspection, color: '#FBBF24' },
                      { name: 'ผ่าน', value: stats.completed, color: '#10B981' },
                      { name: 'ไม่ผ่าน', value: stats.failed, color: '#EF4444' },
                    ].map((entry, index) => (
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
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
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

      {/* Checklists Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {statusFilter ? `Checklists - ${getStatusBadge(statusFilter).props.children}` : 'Checklists ทั้งหมด'}
          </h2>
          {statusFilter && (
            <Button variant="outline" onClick={() => setStatusFilter(null)}>
              แสดงทั้งหมด
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChecklists.map((checklist) => (
            <Card 
              key={checklist.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedChecklistId(checklist.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{checklist.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {checklist.taskName}
                    </CardDescription>
                  </div>
                  {getStatusBadge(checklist.status || 'not_started')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>{(checklist.items as any[])?.length || 0} รายการ</span>
                  </div>
                  {checklist.inspectedBy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>ตรวจโดย: User #{checklist.inspectedBy}</span>
                    </div>
                  )}
                  <div className="space-y-2 mt-4">
                    <Button 
                      className="w-full" 
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
                        className="w-full" 
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateDefect(checklist.id);
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Create CAR/NCR
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Inspection Dialog */}
      <Dialog open={isInspecting} onOpenChange={setIsInspecting}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.name}</DialogTitle>
            <DialogDescription>
              งาน: {selectedChecklist?.taskName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Inspection Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">รายการตรวจสอบ</h3>
              {(selectedChecklist?.items as any[] || []).map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{item.description}</p>
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
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                            <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-1 cursor-pointer">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ผ่าน
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                            <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-1 cursor-pointer">
                              <XCircle className="h-4 w-4 text-red-600" />
                              ไม่ผ่าน
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsInspecting(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmitInspection} disabled={updateChecklistMutation.isPending}>
                {updateChecklistMutation.isPending ? "กำลังบันทึก..." : "บันทึกผลการตรวจสอบ"}
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
                  <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">ข้อมูลการตรวจสอบ</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="text-muted-foreground">Checklist:</span>
                          <p className="font-medium">{allChecklists.find(c => c.id === defectChecklistId)?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div>
                          <span className="text-muted-foreground">งาน:</span>
                          <p className="font-medium">{allChecklists.find(c => c.id === defectChecklistId)?.taskName}</p>
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
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
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
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
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
              <h3 className="font-semibold text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                รูปภาพก่อนแก้ไข (Before Photos)
              </h3>
              <p className="text-sm text-muted-foreground">
                อัปโหลดรูปภาพแสดงสภาพปัญหาก่อนดำเนินการแก้ไข (รองรับ JPG, PNG, HEIC สูงสุด 10MB/ไฟล์)
              </p>
              
              {/* File Input */}
              <div className="space-y-3">
                <label htmlFor="before-photos" className="cursor-pointer">
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
                    id="before-photos"
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
                      setBeforePhotos(prev => [...prev, ...validFiles]);
                    }}
                  />
                </label>

                {/* Preview uploaded files */}
                {beforePhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {beforePhotos.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border bg-muted overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Before ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setBeforePhotos(prev => prev.filter((_, i) => i !== index))}
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
              disabled={createDefectMutation.isPending || uploadingPhotos || !defectForm.title}
              className={`h-11 px-6 ${
                defectForm.type === "CAR" ? "bg-yellow-600 hover:bg-yellow-700" :
                defectForm.type === "PAR" ? "bg-blue-600 hover:bg-blue-700" :
                "bg-red-600 hover:bg-red-700"
              }`}
            >
              {(createDefectMutation.isPending || uploadingPhotos) ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {uploadingPhotos ? 'กำลังอัปโหลดรูป...' : 'กำลังสร้าง...'}
                </>
              ) : (
                `สร้าง ${defectForm.type}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
