import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "project_status" | "task_status" | "task_assigned" | "comment_added" | "defect_reported";
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Connect to Socket.io server
    const socketInstance = io({
      path: "/api/socket.io",
    });

    socketInstance.on("connect", () => {
      console.log("[Socket.io] Connected");
      // Join user-specific room
      socketInstance.emit("join", user.id.toString());
    });

    socketInstance.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
    });

    // Listen for notifications
    socketInstance.on("notification", (notification: Notification) => {
      console.log("[Socket.io] Received notification:", notification);
      
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      
      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: "ดูรายละเอียด",
          onClick: () => window.location.href = notification.link!,
        } : undefined,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
