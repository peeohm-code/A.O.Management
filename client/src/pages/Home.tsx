import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, CheckSquare, ClipboardList, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: checklists, isLoading: checklistsLoading } = trpc.qc.listChecklists.useQuery();

  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.status === "in_progress").length || 0,
    completedProjects: projects?.filter(p => p.status === "completed").length || 0,
    totalChecklists: checklists?.length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ด</h1>
            <p className="text-muted-foreground mt-1">
              ภาพรวมระบบจัดการก่อสร้างและ Quality Control
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              สร้างโครงการใหม่
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">โครงการทั้งหมด</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                จำนวนโครงการในระบบ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                โครงการที่กำลังทำงาน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสมบูรณ์</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                โครงการที่เสร็จแล้ว
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QC Checklists</CardTitle>
              <ClipboardList className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChecklists}</div>
              <p className="text-xs text-muted-foreground mt-1">
                รายการตรวจสอบคุณภาพ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>โครงการล่าสุด</CardTitle>
                <CardDescription>โครงการที่เพิ่งสร้างหรืออัพเดท</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  ดูทั้งหมด
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                กำลังโหลด...
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{project.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.location || "ไม่ระบุสถานที่"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">ยังไม่มีโครงการ</h3>
                <p className="text-muted-foreground mb-4">
                  เริ่มต้นโดยการสร้างโครงการแรกของคุณ
                </p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    สร้างโครงการใหม่
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
