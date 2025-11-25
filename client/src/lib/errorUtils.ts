import { TRPCClientError } from '@trpc/client';
import { toast } from 'sonner';

export function getErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง';
}

export function showErrorToast(error: unknown, title: string = 'เกิดข้อผิดพลาด') {
  const message = getErrorMessage(error);
  toast.error(title, {
    description: message,
    duration: 5000,
  });
}

export function showSuccessToast(message: string, title: string = 'สำเร็จ') {
  toast.success(title, {
    description: message,
    duration: 3000,
  });
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    return error.data?.code === 'INTERNAL_SERVER_ERROR' || 
           error.message.includes('network') ||
           error.message.includes('fetch');
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof TRPCClientError) {
    return error.data?.code === 'UNAUTHORIZED' || 
           error.data?.code === 'FORBIDDEN';
  }
  return false;
}

export function handleMutationError(error: unknown, customMessage?: string) {
  if (isAuthError(error)) {
    showErrorToast('คุณไม่มีสิทธิ์ในการดำเนินการนี้', 'ไม่มีสิทธิ์');
    return;
  }
  
  if (isNetworkError(error)) {
    showErrorToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    return;
  }
  
  showErrorToast(customMessage || error, 'เกิดข้อผิดพลาด');
}
