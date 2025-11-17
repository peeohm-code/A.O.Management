import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  BarChart3,
  Calendar,
  Target,
  Zap
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Overview (Command Center) - ภาพรวมทั้งระบบ
 * แสดงสถานะโครงการทั้งหมด, Critical Alerts, KPI Dashboard, Resource Allocation
 */
export default function Overview() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<string>("30");

  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = trpc.project.list.useQuery();

  // Fetch all tasks across projects
  const { data: allTasks = [] } = trpc.task.list.useQuery(
    { projectId: projects.length > 0 ? projects[0]?.id : 0 },
    { enabled: projects.length > 0 }
  );

  // Fetch all defects
  const { data: allDefects = [] } = trpc.defect.list.useQuery(
    { taskId: 0 },
    { enabled: false }
  );

  // Calculate overall statistics
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalProjects = projects.length;
    
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = allTasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.endDate) return false;
      return new Date(t.endDate) < new Date();
    }).length;

    const criticalDefects = allDefects.filter(d => 
      d.severity === 'critical' && d.status !== 'resolved'
    ).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    return {
      activeProjects,
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      criticalDefects,
      completionRate
    };
  }, [projects, allTasks, allDefects]);

  // Critical alerts
  const criticalAlerts = useMemo(() => {
    const alerts: Array<{
      type: 'defect' | 'overdue' | 'inspection';
      severity: 'critical' | 'high' | 'medium';
      title: string;
      description: string;
      projectId?: number;
      link?: string;
    }> = [];

    // Critical defects
    allDefects
      .filter(d => d.severity === 'critical' && d.status !== 'resolved')
      .slice(0, 3)
      .forEach(defect => {
        alerts.push({
          type: 'defect',
          severity: 'critical',
          title: 'Critical Defect',
          description: defect.title,
          link: `/defects/${defect.id}`
        });
      });

    // Overdue tasks
    allTasks
      .filter(t => {
        if (t.status === 'completed') return false;
        if (!t.endDate) return false;
        return new Date(t.endDate) < new Date();
      })
      .slice(0, 3)
      .forEach(task => {
        alerts.push({
          type: 'overdue',
          severity: 'high',
          title: 'Overdue Task',
          description: task.name,
          link: `/tasks/${task.id}`
        });
      });

    return alerts.slice(0, 5);
  }, [allTasks, allDefects]);

  // Project status breakdown
  const projectStatusBreakdown = useMemo(() => {
    const breakdown = {
      active: 0,
      planning: 0,
      completed: 0,
      onHold: 0
    };

    projects.forEach(p => {
      if (p.status === 'active') breakdown.active++;
      else if (p.status === 'planning') breakdown.planning++;
      else if (p.status === 'completed') breakdown.completed++;
      else if (p.status === 'on_hold') breakdown.onHold++;
    });

    return breakdown;
  }, [projects]);

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading overview...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of all construction projects and operations
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.totalProjects} total projects
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completionRate.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stats.completionRate >= 70 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">On track</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">Needs attention</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTasks > 0 ? ((stats.overdueTasks / stats.totalTasks) * 100).toFixed(1) : 0}% of total tasks
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Defects</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.criticalDefects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Critical Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Critical Alerts
              </CardTitle>
              <CardDescription>Issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {criticalAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No critical alerts</p>
                  <p className="text-sm">All systems operational</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        {alert.type === 'defect' && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        {alert.type === 'overdue' && (
                          <Clock className="h-5 w-5 text-orange-500" />
                        )}
                        {alert.type === 'inspection' && (
                          <FileText className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              alert.severity === 'critical' ? 'destructive' :
                              alert.severity === 'high' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {alert.description}
                        </p>
                      </div>
                      {alert.link && (
                        <Link href={alert.link}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Project Status
              </CardTitle>
              <CardDescription>Current status of all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Active
                    </span>
                    <span className="font-medium">{projectStatusBreakdown.active}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${(projectStatusBreakdown.active / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Planning
                    </span>
                    <span className="font-medium">{projectStatusBreakdown.planning}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(projectStatusBreakdown.planning / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      Completed
                    </span>
                    <span className="font-medium">{projectStatusBreakdown.completed}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full transition-all"
                      style={{ width: `${(projectStatusBreakdown.completed / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      On Hold
                    </span>
                    <span className="font-medium">{projectStatusBreakdown.onHold}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${(projectStatusBreakdown.onHold / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Projects List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              All Projects
            </CardTitle>
            <CardDescription>Quick overview of all construction projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No projects found</p>
                <Link href="/projects/new">
                  <Button className="mt-4">Create First Project</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(project => {
                  const projectTasks = allTasks.filter(t => t.projectId === project.id);
                  const completedCount = projectTasks.filter(t => t.status === 'completed').length;
                  const progress = projectTasks.length > 0 
                    ? (completedCount / projectTasks.length * 100) 
                    : 0;

                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              project.status === 'active' ? 'default' :
                              project.status === 'completed' ? 'secondary' :
                              project.status === 'planning' ? 'outline' : 'destructive'
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {projectTasks.length} tasks
                          </span>
                          {project.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
