import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Bell, 
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  MessageSquare,
  RefreshCw,
  Clock,
  CheckCheck,
  XCircle,
  AlertCircle,
  Zap,
  Filter,
  X
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const notificationsQuery = trpc.notification.list.useQuery();
  const markAsReadMutation = trpc.notification.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation();

  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Zap className="w-4 h-4 text-red-600" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "normal":
        return <Bell className="w-4 h-4 text-[#00366D]" />;
      case "low":
        return <Bell className="w-4 h-4 text-gray-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "เร่งด่วนมาก";
      case "high": return "สำคัญ";
      case "normal": return "ปกติ";
      case "low": return "ไม่เร่งด่วน";
      default: return priority;
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case "task_assigned":
      case "task_status_changed":
      case "task_updated":
        return <ClipboardList {...iconProps} className="w-5 h-5 text-[#00366D]" />;
      case "task_deadline_approaching":
      case "task_overdue":
      case "deadline_reminder":
      case "defect_deadline_approaching":
        return <Clock {...iconProps} className="w-5 h-5 text-orange-600" />;
      case "inspection_requested":
      case "checklist_assigned":
        return <Search {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case "inspection_completed":
      case "inspection_passed":
        return <CheckCheck {...iconProps} className="w-5 h-5 text-[#00CE81]" />;
      case "inspection_failed":
      case "reinspection_required":
        return <XCircle {...iconProps} className="w-5 h-5 text-red-600" />;
      case "defect_assigned":
      case "defect_created":
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-red-600" />;
      case "defect_resolved":
      case "defect_status_changed":
        return <Wrench {...iconProps} className="w-5 h-5 text-purple-600" />;
      case "comment_mention":
      case "task_comment_mention":
      case "comment_added":
        return <MessageSquare {...iconProps} className="w-5 h-5 text-pink-600" />;
      case "task_progress_updated":
        return <RefreshCw {...iconProps} className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBorderColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-red-500";
      case "high":
        return "border-l-4 border-orange-500";
      case "normal":
        return "border-l-4 border-blue-500";
      case "low":
        return "border-l-4 border-gray-400";
      default:
        return "border-l-4 border-gray-500";
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync({ id });
      notificationsQuery.refetch();
      toast.success("ทำเครื่องหมายว่าอ่านแล้ว");
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      notificationsQuery.refetch();
      toast.success("ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว");
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (!n) return false;
    
    // Search filter
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        (!n.content || !n.content.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== "all" && n.priority !== priorityFilter) {
      return false;
    }
    
    // Status filter
    if (statusFilter === "unread" && n.isRead) return false;
    if (statusFilter === "read" && !n.isRead) return false;
    
    return true;
  });

  const unreadCount = notifications.filter((n) => n && !n.isRead).length;
  const hasActiveFilters = searchQuery || priorityFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setStatusFilter("all");
  };

  if (notificationsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">การแจ้งเตือน</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount} รายการที่ยังไม่ได้อ่าน
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="w-4 h-4 mr-2" />
            ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="ค้นหาการแจ้งเตือน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="ความสำคัญ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกระดับ</SelectItem>
            <SelectItem value="urgent">เร่งด่วนมาก</SelectItem>
            <SelectItem value="high">สำคัญ</SelectItem>
            <SelectItem value="normal">ปกติ</SelectItem>
            <SelectItem value="low">ไม่เร่งด่วน</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="unread">ยังไม่ได้อ่าน</SelectItem>
            <SelectItem value="read">อ่านแล้ว</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Active Filters Badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>กรองโดย:</span>
          {searchQuery && <Badge variant="secondary">ค้นหา: "{searchQuery}"</Badge>}
          {priorityFilter !== "all" && <Badge variant="secondary">ความสำคัญ: {getPriorityLabel(priorityFilter)}</Badge>}
          {statusFilter !== "all" && <Badge variant="secondary">สถานะ: {statusFilter === "unread" ? "ยังไม่ได้อ่าน" : "อ่านแล้ว"}</Badge>}
          <span className="ml-2">({filteredNotifications.length} รายการ)</span>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notif) => (
          <Card 
            key={notif.id} 
            className={`${getNotificationBorderColor(notif.priority)} ${!notif.isRead ? 'bg-accent/30' : 'bg-card opacity-75'} transition-all hover:shadow-md`}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notif.title}
                      </p>
                      <Badge variant="outline" className={`${getPriorityColor(notif.priority)} text-xs flex items-center gap-1`}>
                        {getPriorityIcon(notif.priority)}
                        {getPriorityLabel(notif.priority)}
                      </Badge>
                      {!notif.isRead && (
                        <Badge className="bg-[#00366D] text-white text-xs">ใหม่</Badge>
                      )}
                    </div>
                    {notif.content && (
                      <p className={`text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notif.content}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="flex-shrink-0"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {hasActiveFilters ? "ไม่พบการแจ้งเตือนที่ตรงกับเงื่อนไข" : "ยังไม่มีการแจ้งเตือน"}
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                {hasActiveFilters ? "ลองปรับเปลี่ยนตัวกรอง" : "คุณจะได้รับการแจ้งเตือนเมื่อมีเหตุการณ์สำคัญเกิดขึ้น"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
