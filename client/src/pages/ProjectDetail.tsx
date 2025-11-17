import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS, TASK_STATUS, TASK_PRIORITY, ISSUE_STATUS, ISSUE_SEVERITY } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery({ id: projectId });
  const { data: tasks } = trpc.tasks.listByProject.useQuery({ projectId });
  const { data: issues } = trpc.issues.listByProject.useQuery({ projectId });
  const { data: qcChecklists } = trpc.qcChecklists.listByProject.useQuery({ projectId });

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="text-center py-12 text-muted-foreground">Loading project...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Project not found</p>
            <Link href="/projects">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
            <Badge className={PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS].color}>
              {PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS].label}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            {project.location && (
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">{project.location}</p>
              </div>
            )}
            {project.startDate && (
              <div>
                <span className="text-muted-foreground">Start Date:</span>
                <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
            )}
            {project.endDate && (
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks?.length || 0})</TabsTrigger>
            <TabsTrigger value="qc">QC Checklists ({qcChecklists?.length || 0})</TabsTrigger>
            <TabsTrigger value="issues">Issues ({issues?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <Button size="sm" onClick={() => toast.info("Task creation dialog coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].color}>
                            {TASK_PRIORITY[task.priority as keyof typeof TASK_PRIORITY].label}
                          </Badge>
                          <Badge className={TASK_STATUS[task.status as keyof typeof TASK_STATUS].color}>
                            {TASK_STATUS[task.status as keyof typeof TASK_STATUS].label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No tasks yet. Click "Add Task" to create one.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="qc" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">QC Checklists</h2>
              <Button size="sm" onClick={() => toast.info("QC checklist creation dialog coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Checklist
              </Button>
            </div>
            {qcChecklists && qcChecklists.length > 0 ? (
              <div className="space-y-2">
                {qcChecklists.map((checklist) => (
                  <Card key={checklist.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-1">{checklist.title}</h3>
                      {checklist.description && (
                        <p className="text-sm text-muted-foreground">{checklist.description}</p>
                      )}
                      {checklist.category && (
                        <Badge variant="outline" className="mt-2">{checklist.category}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No QC checklists yet. Click "Add Checklist" to create one.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Issues</h2>
              <Button size="sm" onClick={() => toast.info("Issue creation dialog coming soon")}>
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
            {issues && issues.length > 0 ? (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <Card key={issue.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{issue.title}</h3>
                          {issue.description && (
                            <p className="text-sm text-muted-foreground">{issue.description}</p>
                          )}
                          {issue.location && (
                            <p className="text-sm text-muted-foreground mt-1">📍 {issue.location}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={ISSUE_SEVERITY[issue.severity as keyof typeof ISSUE_SEVERITY].color}>
                            {ISSUE_SEVERITY[issue.severity as keyof typeof ISSUE_SEVERITY].label}
                          </Badge>
                          <Badge className={ISSUE_STATUS[issue.status as keyof typeof ISSUE_STATUS].color}>
                            {ISSUE_STATUS[issue.status as keyof typeof ISSUE_STATUS].label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No issues reported yet. Click "Report Issue" to create one.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
