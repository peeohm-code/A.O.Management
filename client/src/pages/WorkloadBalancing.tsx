import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function WorkloadBalancing() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  const { data: projects } = trpc.project.list.useQuery();
  const { data: workloadStats, isLoading } = trpc.team.getWorkloadStatistics.useQuery({
    projectId: selectedProjectId,
  });

  const getWorkloadLevel = (todoTasks: number, inProgressTasks: number) => {
    const activeTasks = (todoTasks || 0) + (inProgressTasks || 0);
    if (activeTasks === 0) return { level: "idle", label: "ว่าง", color: "text-gray-500" };
    if (activeTasks <= 2) return { level: "light", label: "เบา", color: "text-green-600" };
    if (activeTasks <= 5) return { level: "normal", label: "ปกติ", color: "text-blue-600" };
    if (activeTasks <= 8) return { level: "heavy", label: "หนัก", color: "text-orange-600" };
    return { level: "overload", label: "โหลดหนักมาก", color: "text-red-600" };
  };

  const getWorkloadBadgeVariant = (level: string) => {
    switch (level) {
      case "idle":
        return "outline";
      case "light":
        return "secondary";
      case "normal":
        return "default";
      case "heavy":
        return "default";
      case "overload":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getWorkloadProgress = (todoTasks: number, inProgressTasks: number) => {
    const activeTasks = (todoTasks || 0) + (inProgressTasks || 0);
    const maxTasks = 10; // Assume 10 tasks is 100% workload
    return Math.min((activeTasks / maxTasks) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  const canViewWorkload = user?.role === "owner" || user?.role === "admin" || user?.role === "project_manager";

  if (!canViewWorkload) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate team statistics
  const totalMembers = workloadStats?.length || 0;
  const idleMembers = workloadStats?.filter((m: any) => {
    const activeTasks = (m.todoTasks || 0) + (m.inProgressTasks || 0);
    return activeTasks === 0;
  }).length || 0;
  const overloadedMembers = workloadStats?.filter((m: any) => {
    const activeTasks = (m.todoTasks || 0) + (m.inProgressTasks || 0);
    return activeTasks > 8;
  }).length || 0;
  const totalActiveTasks = workloadStats?.reduce((sum: any, m: any) => 
    sum + (m.todoTasks || 0) + (m.inProgressTasks || 0), 0
  ) || 0;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workload Balancing</h1>
          <p className="text-muted-foreground mt-1">
            ภาพรวมภาระงานของทีมและการกระจายงาน
          </p>
        </div>
        {projects && projects.length > 0 && (
          <Select
            value={selectedProjectId?.toString() || "all"}
            onValueChange={(v) => setSelectedProjectId(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="เลือกโครงการ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกโครงการ</SelectItem>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Team Statistics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สมาชิกทีมทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานที่กำลังดำเนินการ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สมาชิกที่ว่าง</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idleMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สมาชิกโหลดหนัก</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overloadedMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ภาระงานของทีม</CardTitle>
          <CardDescription>
            แสดงภาระงานของแต่ละคนและการกระจายงาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!workloadStats || workloadStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่มีข้อมูลภาระงาน
            </div>
          ) : (
            <div className="space-y-6">
              {workloadStats.map((member: any) => {
                const workload = getWorkloadLevel(member.todoTasks || 0, member.inProgressTasks || 0);
                const progress = getWorkloadProgress(member.todoTasks || 0, member.inProgressTasks || 0);
                const activeTasks = (member.todoTasks || 0) + (member.inProgressTasks || 0);

                return (
                  <div key={member.userId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {member.userName?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.userName || "ไม่ระบุชื่อ"}</p>
                          <p className="text-sm text-muted-foreground">{member.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={getWorkloadBadgeVariant(workload.level)}>
                          {workload.label}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{activeTasks} งานที่กำลังทำ</p>
                          <p className="text-xs text-muted-foreground">
                            {member.completedTasks || 0} งานเสร็จสิ้น
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ภาระงาน</span>
                        <span className={workload.color}>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">รอทำ</p>
                          <p className="font-medium">{member.todoTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">กำลังทำ</p>
                          <p className="font-medium">{member.inProgressTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">เสร็จสิ้น</p>
                          <p className="font-medium">{member.completedTasks || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">เกินกำหนด</p>
                          <p className="font-medium text-red-600">{member.overdueTasks || 0}</p>
                        </div>
                      </div>
                    </div>

                    {workload.level === "overload" && (
                      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900">
                            คำแนะนำ: สมาชิกคนนี้มีภาระงานหนักเกินไป
                          </p>
                          <p className="text-sm text-orange-700 mt-1">
                            ควรพิจารณากระจายงานบางส่วนให้สมาชิกคนอื่นที่มีภาระงานน้อยกว่า
                          </p>
                        </div>
                      </div>
                    )}

                    {workload.level === "idle" && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            สมาชิกคนนี้ว่าง สามารถมอบหมายงานเพิ่มได้
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
