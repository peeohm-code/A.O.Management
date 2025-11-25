import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { toast } from "sonner";

/**
 * Offline Sync Status Component
 * แสดงสถานะการเชื่อมต่อและ sync queue
 */

export function OfflineSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { queueItems, isSyncing, syncQueue, loadQueue } = useOfflineQueue();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("เชื่อมต่ออินเทอร์เน็ตแล้ว");
      // Auto sync when coming back online
      if (queueItems.length > 0) {
        syncQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load queue on mount
    loadQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queueItems.length, syncQueue, loadQueue]);

  const pendingCount = queueItems.filter((item: any) => item.status === "pending").length;
  const failedCount = queueItems.filter((item: any) => item.status === "failed").length;

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("ไม่สามารถซิงค์ได้ เนื่องจากไม่มีการเชื่อมต่ออินเทอร์เน็ต");
      return;
    }
    await syncQueue();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label="สถานะการเชื่อมต่อ"
        >
          {isOnline ? (
            <Cloud className="h-5 w-5 text-green-600" />
          ) : (
            <CloudOff className="h-5 w-5 text-destructive" />
          )}
          {pendingCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Cloud className="h-5 w-5 text-green-600" />
                  <span className="font-medium">ออนไลน์</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-5 w-5 text-destructive" />
                  <span className="font-medium">ออฟไลน์</span>
                </>
              )}
            </div>
            {isOnline && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                เชื่อมต่อแล้ว
              </Badge>
            )}
          </div>

          {/* Sync Status */}
          {queueItems.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                รายการรอซิงค์
              </div>

              {/* Queue Summary */}
              <div className="space-y-2">
                {pendingCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span>รอดำเนินการ</span>
                    </div>
                    <Badge variant="secondary">{pendingCount}</Badge>
                  </div>
                )}

                {failedCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span>ล้มเหลว</span>
                    </div>
                    <Badge variant="destructive">{failedCount}</Badge>
                  </div>
                )}

                {isSyncing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>กำลังซิงค์...</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                )}
              </div>

              {/* Queue Items List */}
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                {queueItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between text-sm p-2 rounded bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getQueueItemLabel(item.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date((item as any).createdAt || (item as any).timestamp).toLocaleString("th-TH")}
                      </div>
                      {item.lastError && (
                        <div className="text-xs text-destructive mt-1">
                          {item.lastError}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={(item as any).status === "failed" ? "destructive" : "secondary"}
                      className="ml-2"
                    >
                      {(item as any).status === "pending" ? "รอ" : "ล้มเหลว"}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Sync Button */}
              <Button
                onClick={handleManualSync}
                disabled={!isOnline || isSyncing || pendingCount === 0}
                className="w-full"
                size="sm"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    กำลังซิงค์...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    ซิงค์ทันที
                  </>
                )}
              </Button>
            </div>
          )}

          {/* No Queue Items */}
          {queueItems.length === 0 && isOnline && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
              <p className="text-sm font-medium">ซิงค์ข้อมูลเรียบร้อย</p>
              <p className="text-xs text-muted-foreground mt-1">
                ไม่มีรายการรอซิงค์
              </p>
            </div>
          )}

          {/* Offline Message */}
          {!isOnline && (
            <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg bg-muted/50">
              <CloudOff className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">โหมดออฟไลน์</p>
              <p className="text-xs text-muted-foreground mt-1">
                การเปลี่ยนแปลงจะถูกบันทึกและซิงค์เมื่อกลับมาออนไลน์
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Get Queue Item Label
 */
function getQueueItemLabel(type: string): string {
  const labels: Record<string, string> = {
    comment: "ความคิดเห็น",
    progress: "อัปเดตความคืบหน้า",
    inspection: "ผลการตรวจสอบ",
    task: "งาน",
    defect: "ข้อบกพร่อง",
  };
  return labels[type] || type;
}

/**
 * Compact Sync Status Badge (for mobile)
 */
export function CompactSyncStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { queueItems } = useOfflineQueue();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const pendingCount = queueItems.filter((item: any) => item.status === "pending").length;

  if (isOnline && pendingCount === 0) {
    return null; // Hide when online and no pending items
  }

  return (
    <Badge
      variant={isOnline ? "secondary" : "destructive"}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      {isOnline ? (
        <>
          <RefreshCw className="h-3 w-3 mr-1" />
          รอซิงค์ {pendingCount}
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3 mr-1" />
          ออฟไลน์
        </>
      )}
    </Badge>
  );
}
