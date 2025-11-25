import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  TrendingUp,
  Calendar,
  FileText
} from "lucide-react";
import { Link } from "wouter";

export function RoleBasedDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = trpc.team.getRoleDashboardData.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted" />
            <CardContent className="h-16 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboardData || !user) return null;

  // Render based on role
  switch (user.role) {
    case "owner":
    case "admin":
      return <AdminDashboard data={dashboardData} />;
    case "project_manager":
      return <ProjectManagerDashboard data={dashboardData} />;
    case "qc_inspector":
      return <QCInspectorDashboard data={dashboardData} />;
    case "worker":
      return <WorkerDashboard data={dashboardData} />;
    default:
      return null;
  }
}

function AdminDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">ภาพรวมระบบ</h2>
        <p className="text-muted-foreground">สถิติและข้อมูลทั้งหมดในระบบ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการทั้งหมด</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects || 0}</div>
            <Link href="/projects">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูทั้งหมด →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks || 0}</div>
            <Link href="/tasks">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูทั้งหมด →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปัญหาที่พบ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDefects || 0}</div>
            <Link href="/defects">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูทั้งหมด →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ใช้ในระบบ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers || 0}</div>
            <Link href="/team">
              <Button variant="link" className="px-0 h-auto text-xs">
                จัดการทีม →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProjectManagerDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">โครงการของฉัน</h2>
        <p className="text-muted-foreground">โครงการที่คุณรับผิดชอบ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการที่ดูแล</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProjects || 0}</div>
            <Link href="/projects">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูโครงการ →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks || 0}</div>
            <Link href="/tasks">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูงาน →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปัญหาที่ต้องติดตาม</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDefects || 0}</div>
            <Link href="/defects">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูปัญหา →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {data.projects && data.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>โครงการที่กำลังดูแล</CardTitle>
            <CardDescription>รายการโครงการที่คุณเป็น Project Manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.projects.slice(0, 5).map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                    </div>
                    <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QCInspectorDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">งานตรวจสอบคุณภาพ</h2>
        <p className="text-muted-foreground">งานตรวจสอบและปัญหาที่ต้องดำเนินการ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การตรวจสอบทั้งหมด</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalInspections || 0}</div>
            <Link href="/qc">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูการตรวจสอบ →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอตรวจสอบ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingInspections || 0}</div>
            <Link href="/qc">
              <Button variant="link" className="px-0 h-auto text-xs">
                เริ่มตรวจสอบ →
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ปัญหาที่พบ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalDefects || 0}</div>
            <Link href="/defects">
              <Button variant="link" className="px-0 h-auto text-xs">
                ดูปัญหา →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WorkerDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">งานของฉัน</h2>
        <p className="text-muted-foreground">งานที่ได้รับมอบหมายและความคืบหน้า</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todoTasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังทำ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inProgressTasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedTasks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {data.tasks && data.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>งานล่าสุด</CardTitle>
            <CardDescription>งานที่ได้รับมอบหมาย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tasks.slice(0, 5).map((task: any) => (
                <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">{task.projectName}</p>
                    </div>
                    <Badge variant={task.status === "in_progress" ? "default" : "secondary"}>
                      {task.status === "todo" ? "รอทำ" : task.status === "in_progress" ? "กำลังทำ" : "เสร็จสิ้น"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/my-tasks">
              <Button variant="outline" className="w-full mt-4">
                ดูงานทั้งหมด
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
