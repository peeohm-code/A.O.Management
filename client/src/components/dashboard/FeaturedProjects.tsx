import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  taskCount?: number;
  completedTaskCount?: number;
}

interface FeaturedProjectsProps {
  projects: Project[];
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  // Get featured projects (at risk, delayed, or high progress)
  const featuredProjects = projects
    .filter((p) => p.status === "at_risk" || p.status === "delayed" || p.progress >= 70)
    .slice(0, 3);

  if (featuredProjects.length === 0) {
    return null;
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "at_risk":
        return {
          badge: <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />ต้องติดตาม</Badge>,
          color: "orange",
        };
      case "delayed":
        return {
          badge: <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />ล่าช้า</Badge>,
          color: "red",
        };
      case "in_progress":
        return {
          badge: <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />กำลังดำเนินการ</Badge>,
          color: "blue",
        };
      default:
        return {
          badge: <Badge className="bg-green-100 text-green-800"><TrendingUp className="w-3 h-3 mr-1" />ดำเนินการได้ดี</Badge>,
          color: "green",
        };
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === "delayed") return "bg-red-600";
    if (status === "at_risk") return "bg-orange-600";
    if (progress >= 70) return "bg-green-600";
    return "bg-blue-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Projects</CardTitle>
        <CardDescription>โครงการที่ต้องติดตามเป็นพิเศษ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProjects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const progressColor = getProgressColor(project.progress, project.status);

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition cursor-pointer border-2">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base line-clamp-2">{project.name}</CardTitle>
                      {statusInfo.badge}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-lg font-bold">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${progressColor} h-3 rounded-full transition-all`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Tasks</span>
                      <span className="font-semibold">
                        {project.completedTaskCount || 0}/{project.taskCount || 0}
                      </span>
                    </div>

                    {/* Remaining Tasks */}
                    {project.taskCount && project.completedTaskCount !== undefined && (
                      <div className="text-xs text-gray-500">
                        {project.taskCount - project.completedTaskCount > 0 ? (
                          <span>
                            เหลืออีก <strong>{project.taskCount - project.completedTaskCount}</strong> tasks
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold">
                            ✓ Tasks เสร็จสมบูรณ์
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
