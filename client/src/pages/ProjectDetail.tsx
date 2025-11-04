import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { Link } from "wouter";
import GanttChart from "@/components/GanttChart";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");

  const projectQuery = trpc.project.get.useQuery({ id: projectId }, { enabled: !!projectId });
  const projectTasksQuery = trpc.task.list.useQuery({ projectId }, { enabled: !!projectId });

  if (projectQuery.isLoading || projectTasksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = projectTasksQuery.data || [];

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskStatusColor = (status: string) => {
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

  const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.code && <p className="text-gray-600 mt-1">Code: {project.code}</p>}
        </div>
        <Badge className={`${getStatusColor(project.status)}`}>{project.status}</Badge>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {project.location && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">{project.location}</p>
            </CardContent>
          </Card>
        )}

        {project.startDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {new Date(project.startDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {project.endDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {new Date(project.endDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {project.budget && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">฿{project.budget.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tasks Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedTasks}/{totalTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length > 0 && (
            <GanttChart
              tasks={tasks.map((t: any) => ({
                id: t.id,
                name: t.name,
                startDate: t.startDate,
                endDate: t.endDate,
                progress: t.progress,
                status: t.status,
              }))}
            />
          )}
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No tasks in this project</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task: any) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <Card className="hover:shadow-md transition cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.name}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge className={`${getTaskStatusColor(task.status)}`}>
                            {task.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{task.progress}%</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>Members working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Team information coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>Files and documents related to this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Documents coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
