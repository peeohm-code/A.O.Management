import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  BarChart3,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Dashboard - Project-specific Dashboard
 * เน้นข้อมูลเฉพาะโครงการที่เลือก พร้อม Quick Actions และ My Tasks
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } =
    trpc.project.list.useQuery();
  const { data: allTasks = [] } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: allDefects = [] } = trpc.defect.list.useQuery(
    { taskId: 0 },
    { enabled: false }
  );

  // Get active projects
  const activeProjects = useMemo(
    () => projects.filter(p => p.status === "active"),
    [projects]
  );

  // Auto-select first active project if none selected
  const currentProject = useMemo(() => {
    if (!selectedProjectId && activeProjects.length > 0) {
      setSelectedProjectId(activeProjects[0].id);
      return activeProjects[0];
    }
    return projects.find(p => p.id === selectedProjectId);
  }, [selectedProjectId, projects, activeProjects]);

  // My Tasks (assigned to current user)
  const myTasks = useMemo(() => {
    if (!user) return [];
    return allTasks
      .filter(
        task => task.assigneeId === user.id && task.status !== "completed"
      )
      .slice(0, 5);
  }, [allTasks, user]);

  // Project Statistics
  const projectStats = useMemo(() => {
    if (!selectedProjectId) return null;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(
      t => t.status === "completed"
    ).length;
    const inProgressTasks = allTasks.filter(
      t => t.status === "in_progress"
    ).length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === "completed") return false;
      if (!t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;

    const openDefects = allDefects.filter(d => d.status !== "resolved").length;
    const criticalDefects = allDefects.filter(
      d => d.severity === "critical" && d.status !== "resolved"
    ).length;

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      openDefects,
      criticalDefects,
      completionRate,
    };
  }, [selectedProjectId, allTasks, allDefects]);

  // Recent Activities
  const recentActivities = useMemo(() => {
    const activities: Array<{
      type: "task" | "defect" | "inspection";
      title: string;
      description: string;
      time: Date;
      link?: string;
    }> = [];

    // Recent completed tasks
    allTasks
      .filter(t => t.status === "completed")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 3)
      .forEach(task => {
        activities.push({
          type: "task",
          title: "Task Completed",
          description: task.name,
          time: new Date(task.updatedAt),
          link: `/tasks/${task.id}`,
        });
      });

    // Recent defects
    allDefects
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 2)
      .forEach(defect => {
        activities.push({
          type: "defect",
          title: "Defect Reported",
          description: defect.title,
          time: new Date(defect.createdAt),
          link: `/defects/${defect.id}`,
        });
      });

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);
  }, [allTasks, allDefects]);

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-semibold mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first project to get started
            </p>
            <Link href="/projects/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Project Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Welcome back,{" "}
              <span className="font-medium text-foreground">{user?.name}</span>
            </p>
          </div>
          <Select
            value={selectedProjectId?.toString() || ""}
            onValueChange={value => setSelectedProjectId(Number(value))}
          >
            <SelectTrigger className="w-full lg:w-[320px] h-11 border-2 hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map(project => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  <span className="font-medium">{project.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used actions for faster workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href={`/projects/${selectedProjectId}/tasks/new`}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col py-6 gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Create Task</span>
                </Button>
              </Link>
              <Link href={`/qc/inspections/new`}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col py-6 gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <ClipboardCheck className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Start Inspection</span>
                </Button>
              </Link>
              <Link href={`/defects/new`}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col py-6 gap-3 hover:bg-destructive/5 hover:border-destructive/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <span className="text-sm font-medium">Report Defect</span>
                </Button>
              </Link>
              <Link href={`/projects/${selectedProjectId}`}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col py-6 gap-3 hover:bg-blue-500/5 hover:border-blue-500/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">View Project</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Project Statistics */}
        {projectStats && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-[#00366D] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#00366D]/10">
                  <FileText className="h-4 w-4 text-[#00366D]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#00366D]">
                  {projectStats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {projectStats.inProgressTasks} in progress
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#00CE81] shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#00CE81]/10">
                  <Target className="h-4 w-4 text-[#00CE81]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#00CE81]">
                  {projectStats.completionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {projectStats.completedTasks} of {projectStats.totalTasks}{" "}
                  completed
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue Tasks
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {projectStats.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Defects
                </CardTitle>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {projectStats.openDefects}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {projectStats.criticalDefects} critical
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Tasks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Tasks
                </CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </div>
              <Link href="/tasks">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              task.status === "completed"
                                ? "default"
                                : task.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {task.status === "completed"
                              ? "Completed"
                              : task.status === "in_progress"
                                ? "In Progress"
                                : task.status === "pending_pre_inspection"
                                  ? "Pending Inspection"
                                  : "Not Started"}
                          </Badge>
                          {task.endDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.endDate), "dd MMM yyyy", {
                                locale: th,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.endDate &&
                        new Date(task.endDate) < new Date() &&
                        task.status !== "completed" && (
                          <AlertCircle className="h-5 w-5 text-red-500 ml-2 shrink-0" />
                        )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest updates in this project</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div
                      className={`mt-1 rounded-full p-2 shrink-0 ${
                        activity.type === "task"
                          ? "bg-blue-100 text-blue-600"
                          : activity.type === "defect"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                      }`}
                    >
                      {activity.type === "task" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : activity.type === "defect" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(activity.time, "dd MMM yyyy HH:mm", {
                          locale: th,
                        })}
                      </p>
                    </div>
                    {activity.link && (
                      <Link href={activity.link}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Progress */}
        {currentProject && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Project Progress
              </CardTitle>
              <CardDescription>{currentProject.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Overall Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {projectStats?.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${projectStats?.completionRate || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium">
                      {format(
                        new Date(currentProject.startDate),
                        "dd MMM yyyy",
                        { locale: th }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(currentProject.endDate), "dd MMM yyyy", {
                        locale: th,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
