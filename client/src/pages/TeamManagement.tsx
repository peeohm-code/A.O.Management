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
import { Badge } from "@/components/ui/badge";
import { Users, Shield, UserCog, ClipboardCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const roleIcons = {
  owner: Shield,
  admin: Shield,
  project_manager: UserCog,
  qc_inspector: ClipboardCheck,
  field_engineer: Wrench,
};

const roleLabels = {
  owner: "เจ้าของระบบ",
  admin: "ผู้ดูแลระบบ",
  project_manager: "ผู้จัดการโครงการ",
  qc_inspector: "ผู้ตรวจสอบคุณภาพ",
  field_engineer: "วิศวกรประจำไซต์",
};

const roleColors = {
  owner: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-[#00366D]/10 text-[#00366D] border-[#00366D]/20",
  project_manager: "bg-[#00CE81]/10 text-[#00CE81] border-[#00CE81]/20",
  qc_inspector: "bg-orange-100 text-orange-800 border-orange-200",
  field_engineer: "bg-gray-100 text-gray-800 border-gray-200",
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

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] to-[#00CE81] bg-clip-text text-transparent">
            จัดการทีม
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการสมาชิกทีมและกำหนดสิทธิ์การเข้าถึง
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="font-medium">{users?.length || 0} สมาชิก</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = users?.filter((u) => u.role === role).length || 0;
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
              {users?.map((user) => {
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
    </div>
  );
}
