import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const { data: vapidKey } = trpc.pushNotifications.getVapidPublicKey.useQuery();
  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('[Push] Error checking subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือน');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        return true;
      } else if (result === 'denied') {
        toast.error('คุณได้ปฏิเสธการแจ้งเตือน กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์');
      }
      return false;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      toast.error('ไม่สามารถขออนุญาตการแจ้งเตือนได้');
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือน');
      return false;
    }

    if (!vapidKey?.publicKey) {
      toast.error('ไม่สามารถเชื่อมต่อกับระบบแจ้งเตือนได้');
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.publicKey),
      });

      // Send subscription to server
      const subscriptionJSON = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: subscriptionJSON.keys!.p256dh!,
        auth: subscriptionJSON.keys!.auth!,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success('เปิดการแจ้งเตือนสำเร็จ');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      toast.error('ไม่สามารถเปิดการแจ้งเตือนได้');
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove subscription from server
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });

        setIsSubscribed(false);
        toast.success('ปิดการแจ้งเตือนสำเร็จ');
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      toast.error('ไม่สามารถปิดการแจ้งเตือนได้');
      setIsLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}
