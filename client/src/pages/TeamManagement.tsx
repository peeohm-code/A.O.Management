import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Shield, 
  UserCog, 
  ClipboardCheck, 
  Wrench,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Scale
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const roleIcons = {
  owner: Shield,
  admin: Shield,
  project_manager: UserCog,
  qc_inspector: ClipboardCheck,
  worker: Wrench,
};

const roleLabels = {
  owner: "เจ้าของระบบ",
  admin: "ผู้ดูแลระบบ",
  project_manager: "ผู้จัดการโครงการ",
  qc_inspector: "ผู้ตรวจสอบคุณภาพ",
  worker: "พนักงาน",
};

const roleColors = {
  owner: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-[#00366D]/10 text-[#00366D] border-[#00366D]/20",
  project_manager: "bg-[#00CE81]/10 text-[#00CE81] border-[#00CE81]/20",
  qc_inspector: "bg-orange-100 text-orange-800 border-orange-200",
  worker: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function TeamManagement() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, refetch } = trpc.user.list.useQuery();
  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("อัปเดต role สำเร็จ");
      refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  const { data: projects } = trpc.project.list.useQuery();
  const { data: workloadStats, isLoading: workloadLoading } = trpc.team.getWorkloadStatistics.useQuery({
    projectId: selectedProjectId,
  });

  const handleRoleChange = async (userId: number, newRole: string) => {
    updateRoleMutation.mutate({ userId, role: newRole as any });
    setEditingUserId(null);
  };

  const canEditRole = (targetUser: any) => {
    if (!currentUser) return false;
    // Owner can edit everyone
    if (currentUser.role === "owner") return true;
    // Admin can edit everyone except owner
    if (currentUser.role === "admin" && targetUser.role !== "owner") return true;
    return false;
  };

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

  // Calculate workload statistics
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
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] to-[#00CE81] bg-clip-text text-transparent">
            จัดการทีมและภาระงาน
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการสมาชิกทีม กำหนดสิทธิ์ และติดตามภาระงาน
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="font-medium">{users?.length || 0} สมาชิก</span>
        </div>
      </div>

      {/* Tabs for Team Management and Workload */}
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            สมาชิกทีม
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            ภาระงาน
          </TabsTrigger>
        </TabsList>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(roleLabels).map(([role, label]) => {
              const count = users?.filter((u: any) => u.role === role).length || 0;
              const Icon = roleIcons[role as keyof typeof roleIcons];
              return (
                <Card key={role}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Team Table */}
          <Card>
            <CardHeader>
              <CardTitle>สมาชิกทีม</CardTitle>
              <CardDescription>
                รายชื่อสมาชิกทั้งหมดในระบบและบทบาทของแต่ละคน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>วิธีเข้าสู่ระบบ</TableHead>
                    <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: any) => {
                    const Icon = roleIcons[user.role as keyof typeof roleIcons];
                    const isEditing = editingUserId === user.id;
                    const canEdit = canEditRole(user);

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00366D] to-[#00CE81] flex items-center justify-center text-white font-semibold text-sm">
                              {user.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            {user.name || "ไม่ระบุชื่อ"}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || "-"}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              defaultValue={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(roleLabels).map(([role, label]) => (
                                  <SelectItem key={role} value={role}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={roleColors[user.role as keyof typeof roleColors]}
                            >
                              <Icon className="h-3 w-3 mr-1" />
                              {roleLabels[user.role as keyof typeof roleLabels]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.loginMethod || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.lastSignedIn
                            ? new Date(user.lastSignedIn).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit && !isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUserId(user.id)}
                            >
                              แก้ไข Role
                            </Button>
                          )}
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUserId(null)}
                            >
                              ยกเลิก
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workload Balancing Tab */}
        <TabsContent value="workload" className="space-y-6">
          {/* Project Filter */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">ภาระงานของทีม</h2>
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

          {/* Workload Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle>ภาระงานของแต่ละคน</CardTitle>
              <CardDescription>
                แสดงภาระงานของแต่ละคนและการกระจายงาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workloadLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  กำลังโหลด...
                </div>
              ) : !workloadStats || workloadStats.length === 0 ? (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
