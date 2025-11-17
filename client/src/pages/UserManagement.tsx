import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserCog, Shield } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  owner: "เจ้าของระบบ",
  admin: "ผู้ดูแลระบบ",
  project_manager: "ผู้จัดการโครงการ",
  qc_inspector: "QC Inspector",
  field_engineer: "วิศวกรสนาม",
  user: "ผู้ใช้ทั่วไป",
};

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 border-purple-300",
  admin: "bg-red-100 text-red-800 border-red-300",
  project_manager: "bg-blue-100 text-blue-800 border-blue-300",
  qc_inspector: "bg-green-100 text-green-800 border-green-300",
  field_engineer: "bg-yellow-100 text-yellow-800 border-yellow-300",
  user: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function UserManagement() {
  const { isAdmin } = usePermissions('users');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const usersQuery = trpc.user.list.useQuery();
  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      toast.success("อัปเดต Role สำเร็จ");
      setIsDialogOpen(false);
      setSelectedUser(null);
      setNewRole("");
      usersQuery.refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const users = usersQuery.data || [];
  const filteredUsers = users.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeRole = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsDialogOpen(true);
  };

  const handleConfirmChange = () => {
    if (!selectedUser || !newRole) return;
    updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole as any,
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              ไม่มีสิทธิ์เข้าถึง
            </CardTitle>
            <CardDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการผู้ใช้ เฉพาะ Admin เท่านั้นที่สามารถจัดการผู้ใช้ได้
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (usersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="w-8 h-8" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">จัดการผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = users.filter((u: any) => u.role === role).length;
          return (
            <Card key={role}>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">{label}</CardDescription>
                <CardTitle className="text-2xl">{count}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${roleColors[role].split(' ')[0]}`}
                    style={{ width: `${users.length > 0 ? (count / users.length) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="ค้นหาผู้ใช้ด้วยชื่อหรืออีเมล..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ใช้ทั้งหมด ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>วิธีเข้าสู่ระบบ</TableHead>
                <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "-"}</TableCell>
                  <TableCell>{user.email || "-"}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]} variant="outline">
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.loginMethod || "-"}</TableCell>
                  <TableCell>
                    {user.lastSignedIn
                      ? new Date(user.lastSignedIn).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeRole(user)}
                    >
                      เปลี่ยน Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">ไม่พบผู้ใช้</div>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยน Role ของผู้ใช้</DialogTitle>
            <DialogDescription>
              เลือก Role ใหม่สำหรับ <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role ปัจจุบัน</label>
              <div>
                <Badge className={roleColors[selectedUser?.role || "user"]} variant="outline">
                  {roleLabels[selectedUser?.role || "user"]}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role ใหม่</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">เจ้าของระบบ (Owner)</SelectItem>
                  <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                  <SelectItem value="project_manager">ผู้จัดการโครงการ (PM)</SelectItem>
                  <SelectItem value="qc_inspector">QC Inspector</SelectItem>
                  <SelectItem value="field_engineer">วิศวกรสนาม</SelectItem>
                  <SelectItem value="user">ผู้ใช้ทั่วไป</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={updateRoleMutation.isPending || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? "กำลังบันทึก..." : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
