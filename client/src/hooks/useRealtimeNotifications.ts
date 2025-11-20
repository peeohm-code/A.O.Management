import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export interface RealtimeNotification {
  type: "defect_created" | "task_overdue" | "task_assigned" | "comment_mention" | "inspection_failed" | "connected";
  title?: string;
  message?: string;
  data?: any;
  timestamp?: string;
}

interface UseRealtimeNotificationsOptions {
  onNotification?: (notification: RealtimeNotification) => void;
  showToast?: boolean;
  playSound?: boolean;
}

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    onNotification,
    showToast = true,
    playSound = true,
  } = options;

  // Initialize audio for notification sound
  useEffect(() => {
    if (playSound && typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, [playSound]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (playSound && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.warn("Failed to play notification sound:", error);
      });
    }
  }, [playSound]);

  // Show toast notification
  const showNotificationToast = useCallback((notification: RealtimeNotification) => {
    if (!showToast) return;

    const title = notification.title || "แจ้งเตือนใหม่";
    const message = notification.message || "";

    switch (notification.type) {
      case "defect_created":
        toast.error(title, {
          description: message,
          duration: 5000,
        });
        break;
      case "task_overdue":
        toast.warning(title, {
          description: message,
          duration: 5000,
        });
        break;
      case "task_assigned":
        toast.info(title, {
          description: message,
          duration: 4000,
        });
        break;
      case "comment_mention":
        toast.info(title, {
          description: message,
          duration: 4000,
        });
        break;
      case "inspection_failed":
        toast.error(title, {
          description: message,
          duration: 5000,
        });
        break;
      default:
        toast(title, {
          description: message,
          duration: 3000,
        });
    }
  }, [showToast]);

  // Handle incoming notification
  const handleNotification = useCallback((notification: RealtimeNotification) => {
    if (notification.type === "connected") {
      setIsConnected(true);
      return;
    }

    // Add to notifications list
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount((prev) => prev + 1);

    // Play sound
    playNotificationSound();

    // Show toast
    showNotificationToast(notification);

    // Call custom handler
    if (onNotification) {
      onNotification(notification);
    }
  }, [onNotification, playNotificationSound, showNotificationToast]);

  // Connect to SSE
  useEffect(() => {
    if (!user?.id) return;

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`/api/notifications/stream?userId=${user.id}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log("[SSE] Connection opened");
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const notification: RealtimeNotification = JSON.parse(event.data);
            handleNotification(notification);
          } catch (error) {
            console.error("[SSE] Failed to parse notification:", error);
          }
        };

        eventSource.onerror = (error) => {
          // Only log actual errors, not normal connection close events
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log("[SSE] Connection closed");
          } else if (eventSource.readyState === EventSource.CONNECTING) {
            console.log("[SSE] Reconnecting...");
          } else {
            // Silently handle connection errors without logging to console
            // This prevents spam in the console for normal network interruptions
          }
          setIsConnected(false);

          // Close and cleanup
          eventSource.close();
          
          // Only reconnect if user is still logged in
          if (user?.id) {
            setTimeout(() => {
              connectSSE();
            }, 5000);
          }
        };
      } catch (error) {
        console.error("[SSE] Failed to connect:", error);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user?.id, handleNotification]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
  };
}
