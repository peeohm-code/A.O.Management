import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, CheckCircle2, AlertCircle, Clock, ListTodo, ClipboardCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const statsQuery = trpc.dashboard.getStats.useQuery();
  const projectsQuery = trpc.project.list.useQuery();
  const myTasksQuery = trpc.task.myTasks.useQuery();
  const notificationsQuery = trpc.notification.list.useQuery();

  if (statsQuery.isLoading || projectsQuery.isLoading || myTasksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const stats = statsQuery.data;
  const projects = projectsQuery.data || [];
  const myTasks = myTasksQuery.data || [];
  const notifications = notificationsQuery.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending_pre_inspection":
      case "pending_final_inspection":
        return "bg-yellow-100 text-yellow-800";
      case "rectification_needed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending_pre_inspection":
      case "pending_final_inspection":
        return <Clock className="w-4 h-4" />;
      case "rectification_needed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projectCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.myTasksCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.taskStats.in_progress || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.taskStats.completed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-600" />
            <CardTitle>Task Overview</CardTitle>
          </div>
          <CardDescription>สรุปสถานะงานทั้งหมดในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Total Tasks */}
            <div className="text-center p-4 border rounded-lg bg-gray-50">
              <div className="text-3xl font-bold text-gray-900">{stats?.taskStats.total || 0}</div>
              <div className="text-sm text-gray-600 mt-1">งานทั้งหมด</div>
            </div>

            {/* Not Started */}
            <Link href="/tasks">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="text-3xl font-bold text-gray-700">{stats?.taskStats.not_started || 0}</div>
                <div className="text-sm text-gray-600 mt-1">ยังไม่เริ่ม</div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: stats?.taskStats.total
                          ? `${((stats.taskStats.not_started / stats.taskStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* In Progress */}
            <Link href="/tasks">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-blue-50 hover:bg-blue-100">
                <div className="text-3xl font-bold text-blue-700">{stats?.taskStats.in_progress || 0}</div>
                <div className="text-sm text-blue-600 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  กำลังทำ
                </div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: stats?.taskStats.total
                          ? `${((stats.taskStats.in_progress / stats.taskStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Delayed */}
            <Link href="/tasks">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-red-50 hover:bg-red-100">
                <div className="text-3xl font-bold text-red-700">{stats?.taskStats.delayed || 0}</div>
                <div className="text-sm text-red-600 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  ล่าช้า
                </div>
                <div className="mt-2">
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: stats?.taskStats.total
                          ? `${((stats.taskStats.delayed / stats.taskStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Completed */}
            <Link href="/tasks">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-green-50 hover:bg-green-100">
                <div className="text-3xl font-bold text-green-700">{stats?.taskStats.completed || 0}</div>
                <div className="text-sm text-green-600 mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  เสร็จสมบูรณ์
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: stats?.taskStats.total
                          ? `${((stats.taskStats.completed / stats.taskStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <CardTitle>Checklist Overview</CardTitle>
          </div>
          <CardDescription>สรุปสถานะ Checklist ทั้งหมดในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Total Checklists */}
            <div className="text-center p-4 border rounded-lg bg-gray-50">
              <div className="text-3xl font-bold text-gray-900">{stats?.checklistStats.total || 0}</div>
              <div className="text-sm text-gray-600 mt-1">Checklist ทั้งหมด</div>
            </div>

            {/* Not Started */}
            <Link href="/qc">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="text-3xl font-bold text-gray-700">{stats?.checklistStats.not_started || 0}</div>
                <div className="text-sm text-gray-600 mt-1">ยังไม่เริ่ม</div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: stats?.checklistStats.total
                          ? `${((stats.checklistStats.not_started / stats.checklistStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Pending Inspection */}
            <Link href="/qc">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-yellow-50 hover:bg-yellow-100">
                <div className="text-3xl font-bold text-yellow-700">{stats?.checklistStats.pending_inspection || 0}</div>
                <div className="text-sm text-yellow-600 mt-1">รอการตรวจสอบ</div>
                <div className="mt-2">
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{
                        width: stats?.checklistStats.total
                          ? `${((stats.checklistStats.pending_inspection / stats.checklistStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* In Progress */}
            <Link href="/qc">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-blue-50 hover:bg-blue-100">
                <div className="text-3xl font-bold text-blue-700">{stats?.checklistStats.in_progress || 0}</div>
                <div className="text-sm text-blue-600 mt-1">กำลังตรวจสอบ</div>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: stats?.checklistStats.total
                          ? `${((stats.checklistStats.in_progress / stats.checklistStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Completed */}
            <Link href="/qc">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-green-50 hover:bg-green-100">
                <div className="text-3xl font-bold text-green-700">{stats?.checklistStats.completed || 0}</div>
                <div className="text-sm text-green-600 mt-1">ผ่าน</div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: stats?.checklistStats.total
                          ? `${((stats.checklistStats.completed / stats.checklistStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>

            {/* Failed */}
            <Link href="/defects">
              <div className="text-center p-4 border rounded-lg hover:shadow-md transition cursor-pointer bg-red-50 hover:bg-red-100">
                <div className="text-3xl font-bold text-red-700">{stats?.checklistStats.failed || 0}</div>
                <div className="text-sm text-red-600 mt-1">ไม่ผ่าน</div>
                <div className="mt-2">
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: stats?.checklistStats.total
                          ? `${((stats.checklistStats.failed / stats.checklistStats.total) * 100).toFixed(0)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks assigned yet</p>
                ) : (
                  myTasks.slice(0, 5).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{task.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Progress: {task.progress}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={task.displayStatusColor}>
                            {task.displayStatusLabel}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {myTasks.length > 5 && (
                <Link href="/tasks">
                  <Button variant="outline" className="w-full mt-4">
                    View All Tasks
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Recent updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No new notifications</p>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div key={notif.id} className="text-sm border-l-2 border-blue-500 pl-3 py-2">
                      <p className="font-medium text-xs text-gray-600">{notif.type.replace(/_/g, " ")}</p>
                      <p className="text-gray-700 mt-1">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your active projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-sm col-span-full">No projects yet</p>
            ) : (
              projects.slice(0, 6).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                    <h3 className="font-semibold text-sm">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{project.location}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
