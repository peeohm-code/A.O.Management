import { useState, useCallback } from 'react';
import { addToQueue } from '@/lib/offlineQueue';
import { toast } from 'sonner';

interface UseOfflineFormOptions<TData = any> {
  type: 'comment' | 'progress' | 'inspection' | 'task' | 'defect';
  onlineSubmit: (data: TData) => Promise<any>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook สำหรับจัดการ form ที่รองรับ offline mode
 * จะบันทึกข้อมูลลง queue เมื่อ offline และ sync เมื่อกลับมา online
 */
export function useOfflineForm<TData = any>({
  type,
  onlineSubmit,
  onSuccess,
  onError,
}: UseOfflineFormOptions<TData>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (data: TData) => {
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
            try {
              const registration = await navigator.serviceWorker.ready;
              await (registration as any).sync.register('sync-offline-queue');
            } catch (error) {
              console.warn('Background sync registration failed:', error);
            }
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
    isOnline: navigator.onLine,
  };
}
