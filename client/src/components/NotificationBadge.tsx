import React, { useState } from "react";
import { Bell, Check, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRealtimeNotifications, RealtimeNotification } from "@/hooks/useRealtimeNotifications";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useLocation } from "wouter";

export default function NotificationBadge() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    isConnected,
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
  } = useRealtimeNotifications({
    showToast: true,
    playSound: true,
  });

  const handleNotificationClick = (notification: RealtimeNotification) => {
    // Navigate to relevant page based on notification type
    if (notification.data?.taskId) {
      setLocation(`/tasks/${notification.data.taskId}`);
      setIsOpen(false);
    } else if (notification.data?.defectId) {
      setLocation(`/defects/${notification.data.defectId}`);
      setIsOpen(false);
    } else if (notification.data?.inspectionId) {
      setLocation(`/inspections/${notification.data.inspectionId}`);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "defect_created":
        return "🔴";
      case "task_overdue":
        return "⚠️";
      case "task_assigned":
        return "📋";
      case "comment_mention":
        return "💬";
      case "inspection_failed":
        return "❌";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "defect_created":
      case "inspection_failed":
        return "text-red-600";
      case "task_overdue":
        return "text-yellow-600";
      case "task_assigned":
      case "comment_mention":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">การแจ้งเตือน</h3>
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" aria-label="เชื่อมต่อแล้ว" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" aria-label="ไม่ได้เชื่อมต่อ" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                title="ล้างการแจ้งเตือนทั้งหมด"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mb-2 text-gray-300" />
              <p className="text-sm">ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.timestamp && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setLocation("/notifications");
                  setIsOpen(false);
                }}
              >
                ดูการแจ้งเตือนทั้งหมด
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
