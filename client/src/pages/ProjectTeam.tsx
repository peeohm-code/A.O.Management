import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Trash2, Mail, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ProjectTeam() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"project_manager" | "qc_inspector" | "worker">("worker");

  const utils = trpc.useUtils();
  const { data: project } = trpc.project.get.useQuery({ id: Number(projectId) });
  const { data: members, isLoading: membersLoading } = trpc.team.getProjectMembers.useQuery(
    { projectId: Number(projectId) },
    { enabled: !!projectId }
  );
  const { data: allUsers } = trpc.team.listAllUsers.useQuery();
  const { data: teamStats } = trpc.team.getTeamStats.useQuery(
    { projectId: Number(projectId) },
    { enabled: !!projectId }
  );

  const addMemberMutation = trpc.team.addProjectMember.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มสมาชิกทีมสำเร็จ");
      setAddMemberOpen(false);
      setSelectedUserId("");
      setSelectedRole("worker");
      utils.team.getProjectMembers.invalidate();
      utils.team.getTeamStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเพิ่มสมาชิกทีม");
    },
  });

  const removeMemberMutation = trpc.team.removeProjectMember.useMutation({
    onSuccess: () => {
      toast.success("ลบสมาชิกทีมสำเร็จ");
      utils.team.getProjectMembers.invalidate();
      utils.team.getTeamStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดในการลบสมาชิกทีม");
    },
  });

  const updateRoleMutation = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตบทบาทสำเร็จ");
      utils.team.getProjectMembers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตบทบาท");
    },
  });

  const handleAddMember = () => {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกสมาชิกทีม");
      return;
    }

    addMemberMutation.mutate({
      projectId: Number(projectId),
      userId: Number(selectedUserId),
      role: selectedRole,
    });
  };

  const handleRemoveMember = (userId: number) => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบสมาชิกคนนี้ออกจากทีม?")) {
      removeMemberMutation.mutate({
        projectId: Number(projectId),
        userId,
      });
    }
  };

  const handleUpdateRole = (userId: number, newRole: "project_manager" | "qc_inspector" | "worker") => {
    updateRoleMutation.mutate({
      projectId: Number(projectId),
      userId,
      role: newRole,
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "project_manager":
        return "default";
      case "qc_inspector":
        return "secondary";
      case "worker":
        return "outline";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "project_manager":
        return "ผู้จัดการโครงการ";
      case "qc_inspector":
        return "ผู้ตรวจสอบ QC";
      case "worker":
        return "พนักงาน";
      case "admin":
        return "ผู้ดูแลระบบ";
      case "owner":
        return "เจ้าของระบบ";
      default:
        return role;
    }
  };

  const canManageTeam = user?.role === "owner" || user?.role === "admin" || user?.role === "project_manager";

  // Filter out users who are already members
  const availableUsers = allUsers?.filter(
    (u: any) => !members?.some((m: any) => m.userId === u.id)
  );

  if (membersLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">จัดการทีมโครงการ</h1>
          <p className="text-muted-foreground mt-1">
            โครงการ: {project?.name}
          </p>
        </div>
        {canManageTeam && (
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                เพิ่มสมาชิกทีม
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มสมาชิกทีม</DialogTitle>
                <DialogDescription>
                  เลือกผู้ใช้และกำหนดบทบาทในโครงการ
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>เลือกสมาชิก</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้ใช้" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.email || `User ${user.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project_manager">ผู้จัดการโครงการ</SelectItem>
                      <SelectItem value="qc_inspector">ผู้ตรวจสอบ QC</SelectItem>
                      <SelectItem value="worker">พนักงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>
                  {addMemberMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่มสมาชิก"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Statistics */}
      {teamStats && teamStats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สมาชิกทีมทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">งานที่กำลังดำเนินการ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamStats.reduce((sum: any, m: any) => sum + (m.taskStats?.inProgressTasks || 0), 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">งานที่เสร็จสิ้น</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamStats.reduce((sum: any, m: any) => sum + (m.taskStats?.completedTasks || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>สมาชิกทีม</CardTitle>
          <CardDescription>
            รายชื่อสมาชิกทีมและบทบาทในโครงการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ยังไม่มีสมาชิกในทีม
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => {
                const memberStats = teamStats?.find((s) => s.userId === member.userId);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {member.userName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.userName || "ไม่ระบุชื่อ"}</p>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                          {member.userRole && member.userRole !== member.role && (
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(member.userRole)}
                            </Badge>
                          )}
                        </div>
                        {member.userEmail && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            {member.userEmail}
                          </div>
                        )}
                        {memberStats && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span>งานทั้งหมด: {memberStats.taskStats?.totalTasks || 0}</span>
                            <span>กำลังดำเนินการ: {memberStats.taskStats?.inProgressTasks || 0}</span>
                            <span>เสร็จสิ้น: {memberStats.taskStats?.completedTasks || 0}</span>
                            <span>อัตราความสำเร็จ: {memberStats.taskStats?.completionRate || 0}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {canManageTeam && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateRole(member.userId, v as any)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="project_manager">ผู้จัดการโครงการ</SelectItem>
                            <SelectItem value="qc_inspector">ผู้ตรวจสอบ QC</SelectItem>
                            <SelectItem value="worker">พนักงาน</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
