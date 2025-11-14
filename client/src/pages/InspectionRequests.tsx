import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function InspectionRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectedReason, setRejectedReason] = useState("");

  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.inspectionRequest.list.useQuery();
  
  const approveMutation = trpc.inspectionRequest.approve.useMutation({
    onSuccess: () => {
      toast.success("อนุมัติคำขอตรวจงานเรียบร้อย");
      utils.inspectionRequest.list.invalidate();
      setShowApproveDialog(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const rejectMutation = trpc.inspectionRequest.reject.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธคำขอตรวจงานเรียบร้อย");
      utils.inspectionRequest.list.invalidate();
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectedReason("");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "รอดำเนินการ", icon: Clock },
      approved: { variant: "default", label: "อนุมัติ", icon: CheckCircle2 },
      rejected: { variant: "destructive", label: "ปฏิเสธ", icon: XCircle },
      completed: { variant: "outline", label: "เสร็จสิ้น", icon: CheckCircle2 },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({ id: selectedRequest.id });
  };

  const confirmReject = () => {
    if (!selectedRequest || !rejectedReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.id,
      rejectedReason: rejectedReason.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">คำขอตรวจงาน</h1>
        <p className="text-gray-600 mt-2">จัดการคำขอตรวจงานจากทีม</p>
      </div>

      {!requests || requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">ไม่มีคำขอตรวจงาน</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request: any) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/tasks/${request.taskId}`} className="hover:underline">
                        {request.taskName || `งาน #${request.taskId}`}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      โครงการ: {request.projectName || "ไม่ระบุ"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ผู้ขอ</p>
                      <p className="font-medium">{request.requesterName || "ไม่ระบุ"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ผู้ตรวจ</p>
                      <p className="font-medium">{request.inspectorName || "ไม่ระบุ"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">วันที่ขอ</p>
                      <p className="font-medium">
                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString('th-TH') : "ไม่ระบุ"}
                      </p>
                    </div>
                    {request.approvedAt && (
                      <div>
                        <p className="text-gray-500">วันที่อนุมัติ/ปฏิเสธ</p>
                        <p className="font-medium">
                          {new Date(request.approvedAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    )}
                  </div>

                  {request.notes && (
                    <div>
                      <p className="text-gray-500 text-sm">หมายเหตุ</p>
                      <p className="text-sm">{request.notes}</p>
                    </div>
                  )}

                  {request.rejectedReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm font-medium">เหตุผลในการปฏิเสธ</p>
                      <p className="text-red-600 text-sm mt-1">{request.rejectedReason}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        ปฏิเสธ
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการอนุมัติ</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการอนุมัติคำขอตรวจงานนี้?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={approveMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธคำขอตรวจงาน</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผลในการปฏิเสธ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">เหตุผล *</Label>
            <Textarea
              id="reason"
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              placeholder="ระบุเหตุผลในการปฏิเสธ"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectedReason("");
              }}
              disabled={rejectMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectedReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
