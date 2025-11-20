import { Bell, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function NotificationDropdown() {
  const [, setLocation] = useLocation();
  const notificationsQuery = trpc.notification.list.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();

  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const unreadCount = notifications.filter((n) => n && !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      notificationsQuery.refetch();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600";
      case "high": return "text-orange-600";
      case "normal": return "text-blue-600";
      case "low": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getNotificationIcon = (type: string) => {
    // System health alerts
    if (type === 'system_health_critical') {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (type === 'system_health_warning') {
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
    if (type === 'system_health_info') {
      return <Info className="h-4 w-4 text-blue-600" />;
    }
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          การแจ้งเตือน
          {unreadCount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({unreadCount} รายการใหม่)
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentNotifications.length > 0 ? (
          <>
            {recentNotifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notif.isRead ? 'bg-accent/30' : ''}`}
                onClick={() => {
                  if (!notif.isRead) {
                    handleMarkAsRead(notif.id);
                  }
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notif.type)}
                      <p className={`text-sm font-medium ${getPriorityColor(notif.priority)}`}>
                        {notif.title}
                      </p>
                    </div>
                    {notif.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notif.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center justify-center text-sm text-primary cursor-pointer"
              onClick={() => setLocation("/notifications")}
            >
              ดูทั้งหมด
            </DropdownMenuItem>
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            ไม่มีการแจ้งเตือน
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
