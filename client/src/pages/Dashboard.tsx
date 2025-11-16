import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap
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
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data
  const { data: projects = [], isLoading: projectsLoading } = trpc.project.list.useQuery();
  const { data: allTasks = [] } = trpc.task.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );
  const { data: allDefects = [] } = trpc.defect.list.useQuery(
    { taskId: 0 },
    { enabled: false }
  );

  // Get active projects
  const activeProjects = useMemo(() => 
    projects.filter(p => p.status === 'active'),
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
    return allTasks.filter(task => 
      task.assigneeId === user.id && task.status !== 'completed'
    ).slice(0, 5);
  }, [allTasks, user]);

  // Project Statistics
  const projectStats = useMemo(() => {
    if (!selectedProjectId) return null;

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;

    const openDefects = allDefects.filter(d => d.status !== 'resolved').length;
    const criticalDefects = allDefects.filter(d => 
      d.severity === 'critical' && d.status !== 'resolved'
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      openDefects,
      criticalDefects,
      completionRate
    };
  }, [selectedProjectId, allTasks, allDefects]);

  // Recent Activities
  const recentActivities = useMemo(() => {
    const activities: Array<{
      type: 'task' | 'defect' | 'inspection';
      title: string;
      description: string;
      time: Date;
      link?: string;
    }> = [];

    // Recent completed tasks
    allTasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(task => {
        activities.push({
          type: 'task',
          title: 'Task Completed',
          description: task.name,
          time: new Date(task.updatedAt),
          link: `/tasks/${task.id}`
        });
      });

    // Recent defects
    allDefects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .forEach(defect => {
        activities.push({
          type: 'defect',
          title: 'Defect Reported',
          description: defect.title,
          time: new Date(defect.createdAt),
          link: `/defects/${defect.id}`
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
      <div className="space-y-6">
        {/* Header with Project Selector */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <Select 
            value={selectedProjectId?.toString() || ""} 
            onValueChange={(value) => setSelectedProjectId(Number(value))}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map(project => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href={`/projects/${selectedProjectId}/tasks/new`}>
                <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">Create Task</span>
                </Button>
              </Link>
              <Link href={`/qc/inspections/new`}>
                <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  <span className="text-sm">Start Inspection</span>
                </Button>
              </Link>
              <Link href={`/defects/new`}>
                <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">Report Defect</span>
                </Button>
              </Link>
              <Link href={`/projects/${selectedProjectId}`}>
                <Button variant="outline" className="w-full h-auto flex-col py-4 gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">View Project</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Project Statistics */}
            {projectStats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projectStats.totalTasks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {projectStats.inProgressTasks} in progress
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{projectStats.completionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {projectStats.completedTasks} completed
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{projectStats.overdueTasks}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Need attention
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Defects</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{projectStats.openDefects}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {projectStats.criticalDefects} critical
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Project Progress */}
            {currentProject && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Project Progress
                  </CardTitle>
                  <CardDescription>{currentProject.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Completion</span>
                      <span className="text-sm font-bold">{projectStats?.completionRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${projectStats?.completionRate || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{projectStats?.totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{projectStats?.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{projectStats?.inProgressTasks}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{projectStats?.overdueTasks}</div>
                      <div className="text-xs text-muted-foreground">Overdue</div>
                    </div>
                  </div>

                  {currentProject.startDate && currentProject.endDate && (
                    <div className="flex items-center justify-between pt-4 border-t text-sm">
                      <div>
                        <span className="text-muted-foreground">Start: </span>
                        <span className="font-medium">
                          {format(new Date(currentProject.startDate), 'dd MMM yyyy', { locale: th })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End: </span>
                        <span className="font-medium">
                          {format(new Date(currentProject.endDate), 'dd MMM yyyy', { locale: th })}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
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
                  <div className="space-y-3">
                    {recentActivities.map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="mt-0.5">
                          {activity.type === 'task' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {activity.type === 'defect' && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          {activity.type === 'inspection' && (
                            <ClipboardCheck className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(activity.time, 'dd MMM yyyy HH:mm', { locale: th })}
                          </p>
                        </div>
                        {activity.link && (
                          <Link href={activity.link}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tasks Tab */}
          <TabsContent value="mytasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  My Tasks
                </CardTitle>
                <CardDescription>Tasks assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {myTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                    <p>No pending tasks</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map(task => {
                      const isOverdue = task.endDate && new Date(task.endDate) < new Date();
                      
                      return (
                        <Link key={task.id} href={`/tasks/${task.id}`}>
                          <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold">{task.name}</h3>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            <Badge
                              variant={
                                task.status === 'in_progress' ? 'default' :
                                task.status === 'todo' ? 'secondary' : 'outline'
                              }
                            >
                              {task.status}
                            </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {task.endDate && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(task.endDate), 'dd MMM yyyy', { locale: th })}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              )}
                              <span>Progress: {task.progress || 0}%</span>
                            </div>

                            <div className="w-full bg-secondary rounded-full h-2 mt-3">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${task.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
