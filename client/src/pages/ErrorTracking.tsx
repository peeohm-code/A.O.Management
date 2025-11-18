import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  critical: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", label: "วิกฤต" },
  error: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", label: "ข้อผิดพลาด" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", label: "คำเตือน" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", label: "ข้อมูล" },
};

const CATEGORY_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  database: "ฐานข้อมูล",
  external_api: "External API",
  auth: "Authentication",
  file_upload: "อัปโหลดไฟล์",
  other: "อื่นๆ",
};

const STATUS_CONFIG = {
  new: { color: "bg-blue-500", label: "ใหม่" },
  investigating: { color: "bg-yellow-500", label: "กำลังตรวจสอบ" },
  resolved: { color: "bg-green-500", label: "แก้ไขแล้ว" },
  ignored: { color: "bg-gray-500", label: "ละเว้น" },
};

export default function ErrorTracking() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedError, setSelectedError] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { data: errorLogs, refetch } = trpc.errorTracking.getErrorLogs.useQuery({
    severity: selectedSeverity !== "all" ? (selectedSeverity as any) : undefined,
    category: selectedCategory !== "all" ? (selectedCategory as any) : undefined,
    status: selectedStatus !== "all" ? (selectedStatus as any) : undefined,
    limit: 50,
  });

  const { data: errorStats } = trpc.errorTracking.getErrorStatistics.useQuery({});

  const updateStatusMutation = trpc.errorTracking.updateErrorStatus.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตสถานะสำเร็จ");
      refetch();
      setShowDetailDialog(false);
      setResolutionNotes("");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleUpdateStatus = (status: "new" | "investigating" | "resolved" | "ignored") => {
    if (!selectedError) return;
    
    updateStatusMutation.mutate({
      errorId: selectedError.id,
      status,
      resolutionNotes: resolutionNotes || undefined,
    });
  };

  const handleViewDetails = (error: any) => {
    setSelectedError(error);
    setResolutionNotes(error.resolutionNotes || "");
    setShowDetailDialog(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Tracking</h1>
          <p className="text-muted-foreground mt-1">
            ติดตามและจัดการข้อผิดพลาดในระบบ
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {errorStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">ข้อผิดพลาดทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.totalErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">วิกฤต</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorStats.criticalErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">ยังไม่แก้ไข</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{errorStats.unresolvedErrors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">แก้ไขแล้ว</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{errorStats.resolvedErrors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>ระดับความรุนแรง</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="critical">วิกฤต</SelectItem>
                  <SelectItem value="error">ข้อผิดพลาด</SelectItem>
                  <SelectItem value="warning">คำเตือน</SelectItem>
                  <SelectItem value="info">ข้อมูล</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการข้อผิดพลาด</CardTitle>
          <CardDescription>
            แสดง {errorLogs?.length || 0} รายการล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorLogs && errorLogs.length > 0 ? (
            <div className="space-y-3">
              {errorLogs.map((error) => {
                const severityConfig = SEVERITY_CONFIG[error.severity || "error"];
                const SeverityIcon = severityConfig.icon;
                const statusConfig = STATUS_CONFIG[error.status];

                return (
                  <div
                    key={error.id}
                    className={`p-4 rounded-lg border ${severityConfig.bg} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleViewDetails(error)}
                  >
                    <div className="flex items-start gap-3">
                      <SeverityIcon className={`h-5 w-5 ${severityConfig.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          {error.category && (
                            <Badge variant="outline">
                              {CATEGORY_LABELS[error.category as keyof typeof CATEGORY_LABELS]}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(error.timestamp), "dd MMM yyyy HH:mm", { locale: th })}
                          </span>
                        </div>
                        <div className="font-medium text-sm mb-1">{error.errorMessage}</div>
                        {error.url && (
                          <div className="text-xs text-muted-foreground truncate">
                            {error.method} {error.url}
                          </div>
                        )}
                        {error.userName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ผู้ใช้: {error.userName}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              ไม่พบข้อผิดพลาด
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดข้อผิดพลาด</DialogTitle>
            <DialogDescription>
              Error ID: {selectedError?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedError && (
            <div className="space-y-4">
              <div>
                <Label>ข้อความ</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedError.errorMessage}
                </div>
              </div>

              {selectedError.stackTrace && (
                <div>
                  <Label>Stack Trace</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>ระดับความรุนแรง</Label>
                  <div className="mt-1">
                    <Badge>{SEVERITY_CONFIG[selectedError.severity || "error"].label}</Badge>
                  </div>
                </div>

                <div>
                  <Label>หมวดหมู่</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedError.category
                        ? CATEGORY_LABELS[selectedError.category as keyof typeof CATEGORY_LABELS]
                        : "-"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>สถานะ</Label>
                  <div className="mt-1">
                    <Badge className={STATUS_CONFIG[selectedError.status].color}>
                      {STATUS_CONFIG[selectedError.status].label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>เวลา</Label>
                  <div className="mt-1 text-sm">
                    {format(new Date(selectedError.timestamp), "dd MMM yyyy HH:mm:ss", { locale: th })}
                  </div>
                </div>
              </div>

              {selectedError.url && (
                <div>
                  <Label>URL</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm break-all">
                    {selectedError.method} {selectedError.url}
                  </div>
                </div>
              )}

              {selectedError.userAgent && (
                <div>
                  <Label>User Agent</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-xs break-all">
                    {selectedError.userAgent}
                  </div>
                </div>
              )}

              {selectedError.metadata && (
                <div>
                  <Label>Metadata</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <Label>บันทึกการแก้ไข</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="เพิ่มบันทึกการแก้ไขปัญหา..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus("investigating")}
                  disabled={updateStatusMutation.isPending}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  กำลังตรวจสอบ
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleUpdateStatus("resolved")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  แก้ไขแล้ว
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleUpdateStatus("ignored")}
                  disabled={updateStatusMutation.isPending}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  ละเว้น
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
