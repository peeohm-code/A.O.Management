import { useState, useCallback } from 'react';
import { addToQueue } from '@/lib/offlineQueue';
import { toast } from 'sonner';

interface UseOfflineFormOptions {
  type: 'comment' | 'progress' | 'inspection' | 'task' | 'defect';
  onlineSubmit: (data: any) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useOfflineForm({
  type,
  onlineSubmit,
  onSuccess,
  onError,
}: UseOfflineFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline] = useState(() => navigator.onLine);

  const submit = useCallback(
    async (data: any) => {
      setIsSubmitting(true);

      try {
        if (navigator.onLine) {
          // Online: submit immediately
          await onlineSubmit(data);
          toast.success('บันทึกข้อมูลสำเร็จ');
          onSuccess?.();
        } else {
          // Offline: add to queue
          await addToQueue({ type, data });
          toast.info('บันทึกข้อมูลชั่วคราว จะส่งเมื่อกลับมา online');
          onSuccess?.();

          // Register background sync if available
          if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('sync-offline-queue');
          }
        }
      } catch (error) {
        console.error('Submit error:', error);
        toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        onError?.(error as Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [type, onlineSubmit, onSuccess, onError]
  );

  return {
    submit,
    isSubmitting,
    isOnline,
  };
}
