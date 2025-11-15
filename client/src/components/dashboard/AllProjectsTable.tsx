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

interface AllProjectsTableProps {
  projects: Project[];
}

export function AllProjectsTable({ projects }: AllProjectsTableProps) {
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
    <Card>
      <CardHeader>
        <CardTitle>All Active Projects</CardTitle>
        <CardDescription>โครงการทั้งหมดที่กำลังดำเนินการ</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Project Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Tasks</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    ไม่มีโครงการที่กำลังดำเนินการ
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <Link href={`/projects/${project.id}`}>
                        <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                          {project.name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 min-w-[40px]">
                          {project.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {project.completedTaskCount || 0}/{project.taskCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(project.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
