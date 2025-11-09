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
import { Bell } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
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

  // Filter active projects only
  const activeProjects = allProjects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Key Metrics */}
      <KeyMetrics stats={stats || {}} />

      {/* Featured Projects */}
      <FeaturedProjects projects={activeProjects} />

      {/* Main Content Grid: Desktop 2-column, Mobile 1-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (70% on desktop) */}
        <div className="lg:col-span-2 space-y-6">
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
              <CardDescription>การแจ้งเตือนล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  ไม่มีการแจ้งเตือน
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notif: any) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <Badge variant="default" className="text-xs">
                          ใหม่
                        </Badge>
                      )}
                    </div>
                  ))}
                  <Link href="/notifications">
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer block text-center">
                      ดูทั้งหมด →
                    </span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile: Quick Actions + Notifications at bottom */}
      <div className="lg:hidden space-y-6">
        <QuickActions />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>การแจ้งเตือนล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                ไม่มีการแจ้งเตือน
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif: any) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Badge variant="default" className="text-xs">
                        ใหม่
                      </Badge>
                    )}
                  </div>
                ))}
                <Link href="/notifications">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer block text-center">
                    ดูทั้งหมด →
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
