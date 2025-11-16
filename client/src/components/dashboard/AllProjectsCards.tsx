import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  taskCount?: number;
  completedTaskCount?: number;
}

interface AllProjectsCardsProps {
  projects: Project[];
}

export function AllProjectsCards({ projects }: AllProjectsCardsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />เสร็จสมบูรณ์</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />กำลังดำเนินการ</Badge>;
      case "at_risk":
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />ต้องติดตาม</Badge>;
      case "delayed":
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />ล่าช้า</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">All Active Projects</h2>
        <span className="text-sm text-gray-600">{projects.length} โครงการ</span>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            ไม่มีโครงการที่กำลังดำเนินการ
          </CardContent>
        </Card>
      ) : (
        projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tasks</span>
                  <span className="font-medium">
                    {project.completedTaskCount || 0}/{project.taskCount || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
