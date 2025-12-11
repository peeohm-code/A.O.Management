import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Plus,
  Edit,
  X,
  Filter,
  List,
  Grid,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from "date-fns";
import { th } from "date-fns/locale";

export default function QCScheduling() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Date range for filtering
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  // Filter states
  const [selectedQCFilter, setSelectedQCFilter] = useState<number | undefined>(undefined);

  // Schedule dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState({
    scheduledDate: "",
    assignedQCInspector: "",
    scheduledLocation: "",
    scheduledNotes: "",
  });

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelingInspection, setCancelingInspection] = useState<any>(null);

  // Permission check
  const canSchedule = ["project_manager", "office_engineer", "admin", "owner"].includes(user?.role || "");

  // Queries
  const scheduledInspectionsQuery = trpc.checklist.getScheduledInspections.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    assignedQCInspector: selectedQCFilter,
  });

  const allChecklistsQuery = trpc.checklist.getAllTaskChecklists.useQuery();
  const usersQuery = trpc.team.listAllUsers.useQuery();

  // Get QC inspectors only
  const qcInspectors = usersQuery.data?.filter((u: any) => u.role === "qc_inspector") || [];

  // Get unscheduled checklists
  const unscheduledChecklists = allChecklistsQuery.data?.filter(
    (c: any) => !c.scheduledDate && c.status !== "completed"
  ) || [];

  // Mutations
  const scheduleInspectionMutation = trpc.checklist.scheduleInspection.useMutation({
    onSuccess: () => {
      toast.success("กำหนดวันนัดหมาย QC สำเร็จ");
      setShowScheduleDialog(false);
      resetScheduleForm();
      utils.checklist.getScheduledInspections.invalidate();
      utils.checklist.getAllTaskChecklists.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  const updateScheduledInspectionMutation = trpc.checklist.updateScheduledInspection.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขนัดหมาย QC สำเร็จ");
      setShowEditDialog(false);
      setEditingInspection(null);
      utils.checklist.getScheduledInspections.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  const cancelScheduledInspectionMutation = trpc.checklist.cancelScheduledInspection.useMutation({
    onSuccess: () => {
      toast.success("ยกเลิกนัดหมาย QC สำเร็จ");
      setShowCancelDialog(false);
      setCancelingInspection(null);
      setCancelReason("");
      utils.checklist.getScheduledInspections.invalidate();
      utils.checklist.getAllTaskChecklists.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  // Handlers
  const resetScheduleForm = () => {
    setScheduleData({
      scheduledDate: "",
      assignedQCInspector: "",
      scheduledLocation: "",
      scheduledNotes: "",
    });
    setSelectedChecklist(null);
  };

  const handleSchedule = () => {
    if (!selectedChecklist || !scheduleData.scheduledDate || !scheduleData.assignedQCInspector) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    scheduleInspectionMutation.mutate({
      checklistId: selectedChecklist.id,
      scheduledDate: new Date(scheduleData.scheduledDate).toISOString(),
      assignedQCInspector: Number(scheduleData.assignedQCInspector),
      scheduledLocation: scheduleData.scheduledLocation,
      scheduledNotes: scheduleData.scheduledNotes,
    });
  };

  const handleEdit = () => {
    if (!editingInspection) return;

    const updateData: any = {};
    if (scheduleData.scheduledDate) {
      updateData.scheduledDate = new Date(scheduleData.scheduledDate).toISOString();
    }
    if (scheduleData.assignedQCInspector) {
      updateData.assignedQCInspector = Number(scheduleData.assignedQCInspector);
    }
    if (scheduleData.scheduledLocation !== undefined) {
      updateData.scheduledLocation = scheduleData.scheduledLocation;
    }
    if (scheduleData.scheduledNotes !== undefined) {
      updateData.scheduledNotes = scheduleData.scheduledNotes;
    }

    updateScheduledInspectionMutation.mutate({
      checklistId: editingInspection.id,
      ...updateData,
    });
  };

  const handleCancel = () => {
    if (!cancelingInspection) return;

    cancelScheduledInspectionMutation.mutate({
      checklistId: cancelingInspection.id,
      reason: cancelReason,
    });
  };

  const openScheduleDialog = (checklist: any) => {
    setSelectedChecklist(checklist);
    setShowScheduleDialog(true);
  };

  const openEditDialog = (inspection: any) => {
    setEditingInspection(inspection);
    setScheduleData({
      scheduledDate: inspection.scheduledDate ? format(new Date(inspection.scheduledDate), "yyyy-MM-dd'T'HH:mm") : "",
      assignedQCInspector: inspection.assignedQCInspector?.toString() || "",
      scheduledLocation: inspection.scheduledLocation || "",
      scheduledNotes: inspection.scheduledNotes || "",
    });
    setShowEditDialog(true);
  };

  const openCancelDialog = (inspection: any) => {
    setCancelingInspection(inspection);
    setShowCancelDialog(true);
  };

  const getStatusBadge = (inspection: any) => {
    if (inspection.status === "completed") {
      return <Badge variant="default" className="bg-green-500">เสร็จสิ้น</Badge>;
    }
    if (inspection.status === "in_progress") {
      return <Badge variant="secondary">กำลังดำเนินการ</Badge>;
    }
    return <Badge variant="outline">รอตรวจสอบ</Badge>;
  };

  if (!canSchedule && user?.role !== "qc_inspector") {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">การนัดหมาย QC Inspection</h1>
          <p className="text-muted-foreground mt-1">
            จัดการตารางนัดหมายการตรวจสอบคุณภาพ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            รายการ
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Grid className="h-4 w-4 mr-1" />
            ปฏิทิน
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรอง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>เดือน</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  ←
                </Button>
                <div className="flex-1 text-center py-2 border rounded">
                  {format(currentMonth, "MMMM yyyy", { locale: th })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  →
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>QC Inspector</Label>
              <Select
                value={selectedQCFilter?.toString() || "all"}
                onValueChange={(value) => setSelectedQCFilter(value === "all" ? undefined : Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {qcInspectors.map((qc: any) => (
                    <SelectItem key={qc.id} value={qc.id.toString()}>
                      {qc.name || qc.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Inspections List */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>รายการนัดหมาย</CardTitle>
            <CardDescription>
              นัดหมาย QC ทั้งหมดในเดือน {format(currentMonth, "MMMM yyyy", { locale: th })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledInspectionsQuery.isLoading ? (
              <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
            ) : scheduledInspectionsQuery.data && scheduledInspectionsQuery.data.length > 0 ? (
              <div className="space-y-3">
                {scheduledInspectionsQuery.data.map((inspection: any) => (
                  <Card key={inspection.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{inspection.templateName}</h4>
                            {getStatusBadge(inspection)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              {format(new Date(inspection.scheduledDate), "dd MMMM yyyy HH:mm น.", { locale: th })}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              QC: {inspection.assignedQCName}
                            </div>
                            {inspection.scheduledLocation && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {inspection.scheduledLocation}
                              </div>
                            )}
                            {inspection.scheduledNotes && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                {inspection.scheduledNotes}
                              </p>
                            )}
                          </div>
                        </div>
                        {canSchedule && inspection.status !== "completed" && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(inspection)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openCancelDialog(inspection)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                ไม่มีนัดหมาย QC ในเดือนนี้
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle>ปฏิทินนัดหมาย</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Calendar view - Coming soon (ใช้ library เช่น react-big-calendar)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unscheduled Checklists */}
      {canSchedule && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>รายการตรวจสอบที่ยังไม่ได้นัดหมาย</CardTitle>
                <CardDescription>เลือกเพื่อกำหนดวันนัดหมาย QC</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {unscheduledChecklists.length > 0 ? (
              <div className="space-y-2">
                {unscheduledChecklists.map((checklist: any) => (
                  <div
                    key={checklist.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{checklist.name}</p>
                      <p className="text-sm text-muted-foreground">งาน: {checklist.taskName}</p>
                    </div>
                    <Button size="sm" onClick={() => openScheduleDialog(checklist)}>
                      <Plus className="h-4 w-4 mr-1" />
                      นัดหมาย
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                ไม่มีรายการตรวจสอบที่ต้องนัดหมาย
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>กำหนดวันนัดหมาย QC</DialogTitle>
            <DialogDescription>
              {selectedChecklist?.name} - {selectedChecklist?.taskName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>วันและเวลานัดหมาย *</Label>
              <Input
                type="datetime-local"
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>มอบหมายให้ QC Inspector *</Label>
              <Select
                value={scheduleData.assignedQCInspector}
                onValueChange={(value) => setScheduleData({ ...scheduleData, assignedQCInspector: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือก QC Inspector" />
                </SelectTrigger>
                <SelectContent>
                  {qcInspectors.map((qc: any) => (
                    <SelectItem key={qc.id} value={qc.id.toString()}>
                      {qc.name || qc.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>สถานที่ตรวจสอบ</Label>
              <Input
                placeholder="เช่น ชั้น 3 อาคาร A"
                value={scheduleData.scheduledLocation}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledLocation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea
                placeholder="ข้อมูลเพิ่มเติมสำหรับ QC Inspector"
                value={scheduleData.scheduledNotes}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSchedule} disabled={scheduleInspectionMutation.isPending}>
              {scheduleInspectionMutation.isPending ? "กำลังบันทึก..." : "กำหนดนัดหมาย"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขนัดหมาย QC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>วันและเวลานัดหมาย</Label>
              <Input
                type="datetime-local"
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>มอบหมายให้ QC Inspector</Label>
              <Select
                value={scheduleData.assignedQCInspector}
                onValueChange={(value) => setScheduleData({ ...scheduleData, assignedQCInspector: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qcInspectors.map((qc: any) => (
                    <SelectItem key={qc.id} value={qc.id.toString()}>
                      {qc.name || qc.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>สถานที่ตรวจสอบ</Label>
              <Input
                value={scheduleData.scheduledLocation}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledLocation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={scheduleData.scheduledNotes}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledNotes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEdit} disabled={updateScheduledInspectionMutation.isPending}>
              {updateScheduledInspectionMutation.isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยกเลิกนัดหมาย QC</DialogTitle>
            <DialogDescription>คุณแน่ใจหรือไม่ที่จะยกเลิกนัดหมายนี้?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>เหตุผลในการยกเลิก (ไม่บังคับ)</Label>
              <Textarea
                placeholder="ระบุเหตุผล..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              ไม่ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelScheduledInspectionMutation.isPending}
            >
              {cancelScheduledInspectionMutation.isPending ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
