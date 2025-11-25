import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckSquare, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: myTasks, isLoading: tasksLoading } = trpc.tasks.listByAssignee.useQuery();

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeProjects = projects?.filter(p => p.status === 'active') || [];
  const completedTasks = myTasks?.filter(t => t.status === 'completed') || [];
  const pendingTasks = myTasks?.filter(t => t.status !== 'completed') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">ภาพรวมระบบจัดการงานก่อสร้างและ QC</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">โครงการทั้งหมด</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects.length} โครงการกำลังดำเนินการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานของฉัน</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {pendingTasks.length} งานที่ยังไม่เสร็จ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานเสร็จสิ้น</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              จากทั้งหมด {myTasks?.length || 0} งาน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสาร</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              รอการอัพโหลด
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>โครงการล่าสุด</CardTitle>
            <CardDescription>โครงการที่สร้างล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.location || 'ไม่ระบุสถานที่'}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'active' ? 'bg-green-100 text-green-700' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status === 'active' ? 'กำลังดำเนินการ' :
                         project.status === 'completed' ? 'เสร็จสิ้น' :
                         project.status === 'on-hold' ? 'พักงาน' :
                         project.status === 'planning' ? 'วางแผน' : 'ยกเลิก'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">ยังไม่มีโครงการ</p>
                <Link href="/projects">
                  <Button>สร้างโครงการแรก</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>งานที่ต้องทำ</CardTitle>
            <CardDescription>งานที่ได้รับมอบหมาย</CardDescription>
          </CardHeader>
          <CardContent>
            {myTasks && myTasks.length > 0 ? (
              <div className="space-y-3">
                {myTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.dueDate ? `ครบกำหนด: ${new Date(task.dueDate).toLocaleDateString('th-TH')}` : 'ไม่มีกำหนดเวลา'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'completed' ? 'เสร็จสิ้น' :
                       task.status === 'in-progress' ? 'กำลังทำ' :
                       task.status === 'review' ? 'รอตรวจสอบ' : 'รอดำเนินการ'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">ไม่มีงานที่ต้องทำ</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
