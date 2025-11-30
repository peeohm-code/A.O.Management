import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Image as ImageIcon,
  History,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";

interface DefectApprovalWorkflowProps {
  defectId: number;
  defect: any;
}

export function DefectApprovalWorkflow({ defectId, defect }: DefectApprovalWorkflowProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Fix Plan states
  const [showFixPlanForm, setShowFixPlanForm] = useState(false);
  const [fixPlanDescription, setFixPlanDescription] = useState(defect?.fixPlanDescription || "");
  const [fixPlanMethod, setFixPlanMethod] = useState(defect?.fixPlanMethod || "");

  // Resolution states
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionDescription, setResolutionDescription] = useState("");
  const [resolutionPhotos, setResolutionPhotos] = useState<string[]>([]);

  // Approval states
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState<"fix_plan" | "resolution">("fix_plan");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComments, setApprovalComments] = useState("");

  // History state
  const [showHistory, setShowHistory] = useState(false);

  // Queries
  const approvalsQuery = trpc.defect.getApprovals.useQuery({ defectId });

  // Mutations
  const submitFixPlanMutation = trpc.defect.submitFixPlan.useMutation({
    onSuccess: () => {
      toast.success("ส่งแผนแก้ไขสำเร็จ");
      setShowFixPlanForm(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดในการส่งแผนแก้ไข");
    },
  });

  const approveFixPlanMutation = trpc.defect.approveFixPlan.useMutation({
    onSuccess: () => {
      toast.success("อนุมัติแผนแก้ไขสำเร็จ");
      setShowApprovalDialog(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  const rejectFixPlanMutation = trpc.defect.rejectFixPlan.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธแผนแก้ไขสำเร็จ");
      setShowApprovalDialog(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  const submitResolutionMutation = trpc.defect.submitResolution.useMutation({
    onSuccess: () => {
      toast.success("ส่งผลการแก้ไขสำเร็จ");
      setShowResolutionForm(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดในการส่งผลการแก้ไข");
    },
  });

  const approveResolutionMutation = trpc.defect.approveResolution.useMutation({
    onSuccess: () => {
      toast.success("อนุมัติผลการแก้ไขสำเร็จ");
      setShowApprovalDialog(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  const rejectResolutionMutation = trpc.defect.rejectResolution.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธผลการแก้ไขสำเร็จ");
      setShowApprovalDialog(false);
      utils.defect.getById.invalidate({ id: defectId });
      utils.defect.getApprovals.invalidate({ defectId });
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    },
  });

  // Permission checks
  const isSiteEngineer = user?.role === "site_engineer";
  const isApprover = user?.role === "project_manager" || user?.role === "office_engineer" || user?.role === "admin" || user?.role === "owner";

  // Status helpers
  const getFixPlanStatusBadge = () => {
    switch (defect?.fixPlanStatus) {
      case "draft":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />ร่าง</Badge>;
      case "pending_approval":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />รออนุมัติ</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />ปฏิเสธ</Badge>;
      default:
        return null;
    }
  };

  const getResolutionStatusBadge = () => {
    switch (defect?.resolutionStatus) {
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />รอดำเนินการ</Badge>;
      case "pending_approval":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />รออนุมัติ</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />อนุมัติแล้ว</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />ปฏิเสธ</Badge>;
      default:
        return null;
    }
  };

  // Handlers
  const handleSubmitFixPlan = () => {
    if (!fixPlanDescription || !fixPlanMethod) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    submitFixPlanMutation.mutate({
      defectId,
      description: fixPlanDescription,
      method: fixPlanMethod,
    });
  };

  const handleApproveFixPlan = () => {
    approveFixPlanMutation.mutate({
      defectId,
      comments: approvalComments,
    });
  };

  const handleRejectFixPlan = () => {
    if (!approvalComments) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    rejectFixPlanMutation.mutate({
      defectId,
      reason: approvalComments,
    });
  };

  const handleSubmitResolution = () => {
    if (!resolutionDescription) {
      toast.error("กรุณากรอกรายละเอียดการแก้ไข");
      return;
    }

    submitResolutionMutation.mutate({
      defectId,
      description: resolutionDescription,
      photoUrls: resolutionPhotos,
    });
  };

  const handleApproveResolution = () => {
    approveResolutionMutation.mutate({
      defectId,
      comments: approvalComments,
    });
  };

  const handleRejectResolution = () => {
    if (!approvalComments) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    rejectResolutionMutation.mutate({
      defectId,
      reason: approvalComments,
    });
  };

  const openApprovalDialog = (type: "fix_plan" | "resolution", action: "approve" | "reject") => {
    setApprovalType(type);
    setApprovalAction(action);
    setApprovalComments("");
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (approvalType === "fix_plan") {
      if (approvalAction === "approve") {
        handleApproveFixPlan();
      } else {
        handleRejectFixPlan();
      }
    } else {
      if (approvalAction === "approve") {
        handleApproveResolution();
      } else {
        handleRejectResolution();
      }
    }
  };

  if (!defect) return null;

  return (
    <div className="space-y-6">
      {/* Fix Plan Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <CardTitle>แผนการแก้ไข</CardTitle>
              {getFixPlanStatusBadge()}
            </div>
            <div className="flex gap-2">
              {isSiteEngineer && (defect.fixPlanStatus === "draft" || defect.fixPlanStatus === "rejected") && (
                <Button size="sm" onClick={() => setShowFixPlanForm(true)}>
                  <Send className="h-4 w-4 mr-1" />
                  {defect.fixPlanStatus === "draft" ? "เสนอแผนแก้ไข" : "ส่งแผนใหม่"}
                </Button>
              )}
              {isApprover && defect.fixPlanStatus === "pending_approval" && (
                <>
                  <Button size="sm" variant="default" onClick={() => openApprovalDialog("fix_plan", "approve")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    อนุมัติ
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openApprovalDialog("fix_plan", "reject")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    ปฏิเสธ
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {defect.fixPlanDescription ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">รายละเอียดปัญหา</Label>
                <p className="mt-1">{defect.fixPlanDescription}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">วิธีการแก้ไข</Label>
                <p className="mt-1">{defect.fixPlanMethod}</p>
              </div>
              {defect.fixPlanSubmittedAt && (
                <div className="text-sm text-muted-foreground">
                  ส่งเมื่อ: {format(new Date(defect.fixPlanSubmittedAt), "dd/MM/yyyy HH:mm")}
                </div>
              )}
              {defect.fixPlanStatus === "rejected" && defect.fixPlanRejectionReason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <Label className="text-sm font-medium text-destructive">เหตุผลที่ปฏิเสธ</Label>
                  <p className="mt-1 text-sm">{defect.fixPlanRejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">ยังไม่มีแผนการแก้ไข</p>
          )}
        </CardContent>
      </Card>

      {/* Resolution Section - Only show if fix plan is approved */}
      {defect.fixPlanStatus === "approved" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>ผลการแก้ไข</CardTitle>
                {getResolutionStatusBadge()}
              </div>
              <div className="flex gap-2">
                {isSiteEngineer && (defect.resolutionStatus === "pending" || defect.resolutionStatus === "rejected") && (
                  <Button size="sm" onClick={() => setShowResolutionForm(true)}>
                    <Send className="h-4 w-4 mr-1" />
                    {defect.resolutionStatus === "pending" ? "ส่งผลการแก้ไข" : "ส่งใหม่"}
                  </Button>
                )}
                {isApprover && defect.resolutionStatus === "pending_approval" && (
                  <>
                    <Button size="sm" variant="default" onClick={() => openApprovalDialog("resolution", "approve")}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      อนุมัติ
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openApprovalDialog("resolution", "reject")}>
                      <XCircle className="h-4 w-4 mr-1" />
                      ปฏิเสธ
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {defect.resolutionDescription || defect.resolutionPhotoUrls ? (
              <div className="space-y-4">
                {defect.resolutionDescription && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">รายละเอียดการแก้ไข</Label>
                    <p className="mt-1">{defect.resolutionDescription}</p>
                  </div>
                )}
                {defect.resolutionPhotoUrls && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">รูปภาพหลังแก้ไข</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {JSON.parse(defect.resolutionPhotoUrls).map((url: string, idx: number) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Resolution ${idx + 1}`}
                          className="rounded-lg border w-full h-32 object-cover cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {defect.resolutionSubmittedAt && (
                  <div className="text-sm text-muted-foreground">
                    ส่งเมื่อ: {format(new Date(defect.resolutionSubmittedAt), "dd/MM/yyyy HH:mm")}
                  </div>
                )}
                {defect.resolutionStatus === "rejected" && defect.resolutionRejectionReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <Label className="text-sm font-medium text-destructive">เหตุผลที่ปฏิเสธ</Label>
                    <p className="mt-1 text-sm">{defect.resolutionRejectionReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">ยังไม่มีผลการแก้ไข</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval History Button */}
      <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
        <History className="h-4 w-4 mr-1" />
        ประวัติการอนุมัติ
      </Button>

      {/* Fix Plan Form Dialog */}
      <Dialog open={showFixPlanForm} onOpenChange={setShowFixPlanForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เสนอแผนการแก้ไข</DialogTitle>
            <DialogDescription>
              กรอกรายละเอียดปัญหาและวิธีการแก้ไขเพื่อส่งให้ PM/OE อนุมัติ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>รายละเอียดปัญหา *</Label>
              <Textarea
                placeholder="อธิบายปัญหาที่พบ..."
                value={fixPlanDescription}
                onChange={(e) => setFixPlanDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>วิธีการแก้ไข *</Label>
              <Textarea
                placeholder="อธิบายวิธีการแก้ไข ขั้นตอน และวัสดุที่ต้องใช้..."
                value={fixPlanMethod}
                onChange={(e) => setFixPlanMethod(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFixPlanForm(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmitFixPlan} disabled={submitFixPlanMutation.isPending}>
              {submitFixPlanMutation.isPending ? "กำลังส่ง..." : "ส่งแผนแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolution Form Dialog */}
      <Dialog open={showResolutionForm} onOpenChange={setShowResolutionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ส่งผลการแก้ไข</DialogTitle>
            <DialogDescription>
              กรอกรายละเอียดการแก้ไขและแนบรูปภาพหลังแก้ไขเสร็จ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>รายละเอียดการแก้ไข *</Label>
              <Textarea
                placeholder="อธิบายสิ่งที่ได้ทำเพื่อแก้ไขปัญหา..."
                value={resolutionDescription}
                onChange={(e) => setResolutionDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>รูปภาพหลังแก้ไข</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  // TODO: Upload files and get URLs
                  toast.info("การอัปโหลดรูปภาพจะทำงานหลังจากเชื่อมต่อ API");
                }}
              />
              <p className="text-sm text-muted-foreground">
                อัปโหลดรูปภาพหลังจากแก้ไขเสร็จเพื่อแสดงผลลัพธ์
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolutionForm(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmitResolution} disabled={submitResolutionMutation.isPending}>
              {submitResolutionMutation.isPending ? "กำลังส่ง..." : "ส่งผลการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "อนุมัติ" : "ปฏิเสธ"}
              {approvalType === "fix_plan" ? "แผนการแก้ไข" : "ผลการแก้ไข"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "คุณต้องการอนุมัติหรือไม่?"
                : "กรุณาระบุเหตุผลในการปฏิเสธ"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{approvalAction === "approve" ? "ความเห็น (ไม่บังคับ)" : "เหตุผลในการปฏิเสธ *"}</Label>
              <Textarea
                placeholder={approvalAction === "approve" ? "ความเห็นเพิ่มเติม..." : "ระบุเหตุผล..."}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              variant={approvalAction === "approve" ? "default" : "destructive"}
              onClick={handleConfirmApproval}
              disabled={
                approveFixPlanMutation.isPending ||
                rejectFixPlanMutation.isPending ||
                approveResolutionMutation.isPending ||
                rejectResolutionMutation.isPending
              }
            >
              {approvalAction === "approve" ? "อนุมัติ" : "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>ประวัติการอนุมัติ</DialogTitle>
            <DialogDescription>รายการการอนุมัติทั้งหมดของ Defect นี้</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {approvalsQuery.isLoading ? (
              <p className="text-center text-muted-foreground">กำลังโหลด...</p>
            ) : approvalsQuery.data && approvalsQuery.data.length > 0 ? (
              approvalsQuery.data.map((approval: any) => (
                <Card key={approval.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {approval.approvalType === "fix_plan" ? "แผนการแก้ไข" : "ผลการแก้ไข"}
                        </span>
                        <Badge variant={approval.status === "approved" ? "default" : approval.status === "rejected" ? "destructive" : "secondary"}>
                          {approval.status === "approved" ? "อนุมัติ" : approval.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ผู้ขอ: {approval.requester?.name || "ไม่ทราบ"} • {format(new Date(approval.requestedAt), "dd/MM/yyyy HH:mm")}
                      </div>
                      {approval.reviewedBy && (
                        <div className="text-sm text-muted-foreground">
                          ผู้อนุมัติ: {approval.reviewer?.name || "ไม่ทราบ"} • {format(new Date(approval.reviewedAt), "dd/MM/yyyy HH:mm")}
                        </div>
                      )}
                      {approval.comments && (
                        <p className="text-sm">ความเห็น: {approval.comments}</p>
                      )}
                      {approval.rejectionReason && (
                        <p className="text-sm text-destructive">เหตุผล: {approval.rejectionReason}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">ยังไม่มีประวัติการอนุมัติ</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
