import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { KeyMetrics } from "@/components/dashboard/KeyMetrics";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { WorkOverview } from "@/components/dashboard/WorkOverview";
import { FeaturedProjects } from "@/components/dashboard/FeaturedProjects";
import { AllProjectsTable } from "@/components/dashboard/AllProjectsTable";
import { AllProjectsCards } from "@/components/dashboard/AllProjectsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DateRange = "today" | "week" | "month" | "quarter" | "all";

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("all");
  
  const statsQuery = trpc.dashboard.getStats.useQuery();
  const projectsQuery = trpc.project.list.useQuery();
  const notificationsQuery = trpc.notification.list.useQuery();

  // Loading state with Skeleton
  if (statsQuery.isLoading || projectsQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = statsQuery.data;
  const allProjects = projectsQuery.data || [];
  const notifications = notificationsQuery.data || [];

  // Filter projects by date range
  const getDateRangeFilter = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case "today":
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      case "week":
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      case "quarter":
        const quarterAgo = new Date();
        quarterAgo.setMonth(now.getMonth() - 3);
        return quarterAgo;
      case "all":
      default:
        return null;
    }
  };

  const filterProjectsByDateRange = (projects: any[]) => {
    const filterDate = getDateRangeFilter(dateRange);
    if (!filterDate) return projects;

    return projects.filter((project) => {
      const projectDate = project.createdAt ? new Date(project.createdAt) : null;
      return projectDate && projectDate >= filterDate;
    });
  };

  const filteredProjects = filterProjectsByDateRange(allProjects);

  // Filter active projects only
  const activeProjects = filteredProjects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled"
  );

  const getDateRangeLabel = (range: DateRange): string => {
    switch (range) {
      case "today":
        return "วันนี้";
      case "week":
        return "สัปดาห์นี้";
      case "month":
        return "เดือนนี้";
      case "quarter":
        return "ไตรมาสนี้";
      case "all":
      default:
        return "ทั้งหมด";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="space-y-8 pb-8">
        {/* Header with Date Range Filter */}
        <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                ยินดีต้อนรับ, <span className="font-semibold text-gray-800">{user?.name}</span>
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
              <Calendar className="w-5 h-5 text-[#00366D]" />
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0">
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">📅 วันนี้</SelectItem>
                  <SelectItem value="week">📊 สัปดาห์นี้</SelectItem>
                  <SelectItem value="month">📈 เดือนนี้</SelectItem>
                  <SelectItem value="quarter">📉 ไตรมาสนี้</SelectItem>
                  <SelectItem value="all">🌐 ทั้งหมด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Info Banner */}
          {dateRange !== "all" && (
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00366D] rounded-full animate-pulse" />
                <span className="text-sm text-[#00366D] font-medium">
                  กำลังแสดงข้อมูล: <strong>{getDateRangeLabel(dateRange)}</strong>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange("all")}
                className="text-[#00366D] hover:text-blue-800 hover:bg-blue-100"
              >
                <X className="w-4 h-4 mr-1" />
                แสดงทั้งหมด
              </Button>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="px-6">
          <KeyMetrics 
            stats={stats as any || { projectStats: { active: 0, onTrack: 0, at_risk: 0, delayed: 0, total: 0 }, trends: { active: 0, onTrack: 0, at_risk: 0, delayed: 0 } }} 
            projects={filteredProjects} 
          />
        </div>

        {/* Featured Projects */}
        <div className="px-6">
          <FeaturedProjects projects={activeProjects} />
        </div>

        {/* Main Content Grid: Desktop 2-column, Mobile 1-column */}
        <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (70% on desktop) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Work Overview */}
            <WorkOverview stats={stats || {}} />

            {/* All Projects - Desktop: Table, Mobile: Cards */}
            <div className="hidden md:block">
              <AllProjectsTable projects={activeProjects} />
            </div>
            <div className="md:hidden">
              <AllProjectsCards projects={activeProjects} />
            </div>
          </div>

          {/* Sidebar (30% on desktop) - Hidden on mobile, shown at bottom */}
          <div className="hidden lg:block space-y-6">
            {/* Quick Actions */}
            <QuickActions />

            {/* Notifications */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#00366D] rounded-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">การแจ้งเตือน</CardTitle>
                    <CardDescription className="text-xs">อัปเดตล่าสุด</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">ไม่มีการแจ้งเตือน</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notif: any) => (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <Badge variant="default" className="text-xs bg-[#00366D]">
                            ใหม่
                          </Badge>
                        )}
                      </div>
                    ))}
                    {notifications.length > 5 && (
                      <Link href="/notifications">
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          ดูทั้งหมด ({notifications.length})
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Quick Actions - Shown at bottom on mobile */}
        <div className="lg:hidden px-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
