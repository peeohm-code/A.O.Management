import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Projects() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">โครงการ</h1>
            <p className="text-muted-foreground mt-1">
              จัดการโครงการก่อสร้างทั้งหมด
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              สร้างโครงการใหม่
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            กำลังโหลด...
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : project.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : project.status === "planning"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {project.status === "in_progress"
                          ? "กำลังดำเนินการ"
                          : project.status === "completed"
                          ? "เสร็จสมบูรณ์"
                          : project.status === "planning"
                          ? "วางแผน"
                          : "พักงาน"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.description || "ไม่มีคำอธิบาย"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{project.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">ยังไม่มีโครงการ</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                เริ่มต้นโดยการสร้างโครงการแรกของคุณ เพื่อจัดการงานก่อสร้างและ QC
              </p>
              <Link href="/projects/new">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างโครงการใหม่
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
