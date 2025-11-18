import { useState } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';

export function OfflineIndicator() {
  const { queueItems, isSyncing, syncQueue } = useOfflineQueue();
  const [isOpen, setIsOpen] = useState(false);

  if (queueItems.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <WifiOff className="h-4 w-4 mr-2" />
          ข้อมูลรอส่ง
          <Badge variant="destructive" className="ml-2">
            {queueItems.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ข้อมูลรอส่ง ({queueItems.length} รายการ)</DialogTitle>
          <DialogDescription>
            ข้อมูลเหล่านี้จะถูกส่งอัตโนมัติเมื่อกลับมา online
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {queueItems.map((item: any) => (
            <div
              key={item.id}
              className="p-3 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {item.type === 'comment' && 'ความคิดเห็น'}
                  {item.type === 'progress' && 'อัปเดตความคืบหน้า'}
                  {item.type === 'inspection' && 'ผลการตรวจสอบ'}
                  {item.type === 'task' && 'งาน'}
                  {item.type === 'defect' && 'CAR/NCR'}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(item.timestamp).toLocaleString('th-TH')}
                </div>
              </div>

              {item.lastError && (
                <div className="text-xs text-destructive">
                  ข้อผิดพลาด: {item.lastError}
                </div>
              )}

              {item.retryCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  พยายามส่งแล้ว {item.retryCount} ครั้ง
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            ปิด
          </Button>
          <Button
            onClick={async () => {
              await syncQueue();
              if (queueItems.length === 0) {
                setIsOpen(false);
              }
            }}
            disabled={isSyncing || !navigator.onLine}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                ส่งข้อมูลตอนนี้
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
