import { useState, useEffect } from 'react';
import { getQueueItems, removeFromQueue, updateQueueItem, type QueueItem } from '@/lib/offlineQueue';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function useOfflineQueue() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const utils = trpc.useUtils();

  // Load queue items
  const loadQueue = async () => {
    try {
      const items = await getQueueItems();
      setQueueItems(items);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  };

  // Sync queue items when online
  const syncQueue = async () => {
    if (!navigator.onLine || queueItems.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of queueItems) {
      try {
        // Process based on type
        switch (item.type) {
          case 'comment':
            // await trpc.comment.create.mutate(item.data);
            break;
          case 'progress':
            // await trpc.task.updateProgress.mutate(item.data);
            break;
          case 'inspection':
            // await trpc.checklist.submitInspection.mutate(item.data);
            break;
          default:
            console.warn('Unknown queue item type:', item.type);
        }

        await removeFromQueue(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        failCount++;

        // Update retry count
        await updateQueueItem(item.id, {
          retryCount: item.retryCount + 1,
          lastError: (error as Error).message,
        });
      }
    }

    setIsSyncing(false);
    await loadQueue();

    if (successCount > 0) {
      toast.success(`ส่งข้อมูลสำเร็จ ${successCount} รายการ`);
      // Invalidate relevant queries
      utils.invalidate();
    }

    if (failCount > 0) {
      toast.error(`ส่งข้อมูลไม่สำเร็จ ${failCount} รายการ`);
    }
  };

  // Listen for online/offline events
  useEffect(() => {
    loadQueue();

    const handleOnline = () => {
      toast.info('กลับมา online แล้ว กำลังส่งข้อมูล...');
      syncQueue();
    };

    const handleOffline = () => {
      toast.warning('ออฟไลน์ - ข้อมูลจะถูกบันทึกชั่วคราว');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reload queue when items change
  useEffect(() => {
    const interval = setInterval(loadQueue, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    queueItems,
    isSyncing,
    syncQueue,
    loadQueue,
  };
}
