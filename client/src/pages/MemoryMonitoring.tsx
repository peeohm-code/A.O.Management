import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Activity, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function MemoryMonitoring() {
  const { user, loading: authLoading } = useAuth();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // ดึงข้อมูล memory statistics
  const { data: stats, isLoading: statsLoading } = trpc.memoryMonitoring.getStatistics.useQuery({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 ชั่วโมงที่แล้ว
    endDate: new Date(),
  });

  // ดึงข้อมูล memory logs (100 records ล่าสุด)
  const { data: logs, isLoading: logsLoading } = trpc.memoryMonitoring.getLogs.useQuery({
    limit: 100,
  });

  // ดึงข้อมูล OOM events
  const { data: oomEvents, isLoading: oomLoading, refetch: refetchOomEvents } = trpc.memoryMonitoring.getOomEvents.useQuery({
    resolved: false,
    limit: 50,
  });

  // ดึงข้อมูล OOM statistics
  const { data: oomStats } = trpc.memoryMonitoring.getOomStatistics.useQuery();

  // Mutation สำหรับแก้ไข OOM event
  const resolveOomMutation = trpc.memoryMonitoring.resolveOomEvent.useMutation({
    onSuccess: () => {
      toast.success("แก้ไข OOM event สำเร็จ");
      setResolveDialogOpen(false);
      setResolutionNotes("");
      refetchOomEvents();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleResolveClick = (eventId: number) => {
    setSelectedEventId(eventId);
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = () => {
    if (!selectedEventId) return;
    resolveOomMutation.mutate({
      eventId: selectedEventId,
      resolutionNotes,
    });
  };

  // คำนวณ RAM upgrade recommendation
  const shouldUpgradeRAM = stats && stats.avgUsage >= 70;
  const ramRecommendation = shouldUpgradeRAM
    ? "แนะนำให้ upgrade RAM เป็น 8 GB เนื่องจาก memory usage เฉลี่ยเกิน 70%"
    : "Memory usage อยู่ในระดับปกติ ยังไม่จำเป็นต้อง upgrade RAM";

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "วิกฤติ";
      case "high":
        return "สูง";
      case "medium":
        return "ปานกลาง";
      case "low":
        return "ต่ำ";
      default:
        return severity;
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Memory Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            ติดตาม memory usage และ OOM events ของระบบ
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage เฉลี่ย</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-2xl font-bold">--</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.avgUsage || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ใน 24 ชั่วโมงที่แล้ว
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-2xl font-bold">--</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.maxUsage || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    สูงสุดใน 24 ชั่วโมง
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OOM Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{oomStats?.unresolved || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ยังไม่ได้แก้ไข
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLogs || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                บันทึกใน 24 ชั่วโมง
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RAM Upgrade Recommendation */}
        <Card className={shouldUpgradeRAM ? "border-orange-300 bg-orange-50" : "border-green-300 bg-green-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {shouldUpgradeRAM ? (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              คำแนะนำการ Upgrade RAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={shouldUpgradeRAM ? "text-orange-800" : "text-green-800"}>
              {ramRecommendation}
            </p>
            {shouldUpgradeRAM && stats && stats.peakTimes && stats.peakTimes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-orange-800 mb-2">Peak Usage Times:</p>
                <div className="space-y-1">
                  {stats.peakTimes.slice(0, 5).map((peak: any, idx: any) => (
                    <div key={idx} className="text-xs text-orange-700">
                      {new Date(peak.timestamp).toLocaleString("th-TH")} - {peak.usage}%
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Memory Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage History</CardTitle>
            <CardDescription>100 บันทึกล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.usagePercentage >= 70 ? "destructive" : "secondary"}
                        >
                          {log.usagePercentage}%
                        </Badge>
                        <span className="text-sm">
                          {log.usedMemoryMB} MB / {log.totalMemoryMB} MB
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString("th-TH")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OOM Events */}
        <Card>
          <CardHeader>
            <CardTitle>OOM Events (ยังไม่ได้แก้ไข)</CardTitle>
            <CardDescription>
              รายการ Out of Memory events ที่ยังไม่ได้แก้ไข
            </CardDescription>
          </CardHeader>
          <CardContent>
            {oomLoading ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
            ) : !oomEvents || oomEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ไม่มี OOM events ที่ยังไม่ได้แก้ไข
              </div>
            ) : (
              <div className="space-y-3">
                {oomEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {getSeverityLabel(event.severity)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString("th-TH")}
                          </span>
                        </div>
                        {event.processName && (
                          <div className="text-sm">
                            <span className="font-medium">Process:</span> {event.processName}
                            {event.processId && ` (PID: ${event.processId})`}
                          </div>
                        )}
                        {event.killedProcessName && (
                          <div className="text-sm text-red-600">
                            <span className="font-medium">Killed:</span> {event.killedProcessName}
                            {event.killedProcessId && ` (PID: ${event.killedProcessId})`}
                          </div>
                        )}
                        {event.memoryUsedMB && (
                          <div className="text-sm">
                            <span className="font-medium">Memory Used:</span> {event.memoryUsedMB} MB
                          </div>
                        )}
                        {event.logMessage && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                            {event.logMessage}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveClick(event.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        แก้ไขแล้ว
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolve OOM Event Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไข OOM Event</DialogTitle>
            <DialogDescription>
              บันทึกวิธีการแก้ไขและทำเครื่องหมายว่าแก้ไขแล้ว
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">หมายเหตุการแก้ไข (ไม่บังคับ)</label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="อธิบายวิธีการแก้ไข..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleResolveSubmit} disabled={resolveOomMutation.isPending}>
              {resolveOomMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
