import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Bell, 
  Trash2, 
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCheck,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationCenter() {
  const notificationsQuery = trpc.notification.list.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();

  // Ensure notifications is always an array with comprehensive checks
  const notifications = Array.isArray(notificationsQuery.data) 
    ? notificationsQuery.data 
    : [];

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case "task_assigned":
        return <ClipboardList {...iconProps} className="w-5 h-5 text-blue-600" />;
      case "inspection_requested":
        return <Search {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case "inspection_completed":
        return <CheckCircle2 {...iconProps} className="w-5 h-5 text-green-600" />;
      case "inspection_passed":
        return <CheckCheck {...iconProps} className="w-5 h-5 text-green-600" />;
      case "inspection_failed":
        return <XCircle {...iconProps} className="w-5 h-5 text-red-600" />;
      case "defect_assigned":
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-red-600" />;
      case "defect_resolved":
        return <Wrench {...iconProps} className="w-5 h-5 text-purple-600" />;
      case "comment_mention":
        return <MessageSquare {...iconProps} className="w-5 h-5 text-pink-600" />;
      case "task_updated":
        return <RefreshCw {...iconProps} className="w-5 h-5 text-indigo-600" />;
      case "deadline_reminder":
        return <Clock {...iconProps} className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "bg-blue-50 border-l-4 border-blue-500";
      case "inspection_requested":
        return "bg-yellow-50 border-l-4 border-yellow-500";
      case "inspection_completed":
      case "inspection_passed":
        return "bg-green-50 border-l-4 border-green-500";
      case "inspection_failed":
        return "bg-red-50 border-l-4 border-red-500";
      case "defect_assigned":
        return "bg-red-50 border-l-4 border-red-500";
      case "defect_resolved":
        return "bg-purple-50 border-l-4 border-purple-500";
      case "comment_mention":
        return "bg-pink-50 border-l-4 border-pink-500";
      case "task_updated":
        return "bg-indigo-50 border-l-4 border-indigo-500";
      case "deadline_reminder":
        return "bg-orange-50 border-l-4 border-orange-500";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      notificationsQuery.refetch();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  // Safe filtering with null checks
  const unreadCount = notifications.filter((n) => n && !n.isRead).length;
  const readNotifications = notifications.filter((n) => n && n.isRead);
  const unreadNotifications = notifications.filter((n) => n && !n.isRead);

  if (notificationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Bell className="w-8 h-8 text-blue-600" />
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Unread</h2>
          <div className="space-y-3">
            {unreadNotifications.map((notif) => (
              <Card key={notif.id} className={getNotificationColor(notif.type)}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{notif.title}</p>
                        {notif.content && (
                          <p className="text-sm text-gray-700 mt-1">{notif.content}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="flex-shrink-0"
                    >
                      ✓
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-600">Earlier</h2>
          <div className="space-y-2">
            {readNotifications.map((notif) => (
              <Card key={notif.id} className="bg-gray-50 opacity-75">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5 opacity-60">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-700">{notif.title}</p>
                        {notif.content && (
                          <p className="text-xs text-gray-600 mt-1">{notif.content}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-2">
                You will receive notifications when important events occur
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
