import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRoleLabel } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, User, Mail, Calendar, Shield, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 text-purple-800 border-purple-300",
  admin: "bg-red-100 text-red-800 border-red-300",
  project_manager: "bg-blue-100 text-blue-800 border-blue-300",
  qc_inspector: "bg-green-100 text-green-800 border-green-300",
  field_engineer: "bg-yellow-100 text-yellow-800 border-yellow-300",
  user: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function UserProfile() {
  const { user, loading } = useAuth();
  const roleLabel = useRoleLabel();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตข้อมูลส่วนตัวสำเร็จ");
      setIsEditing(false);
      // Refresh user data
      window.location.reload();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("กรุณากรอกชื่อ");
      return;
    }

    updateProfileMutation.mutate({
      name: formData.name,
      email: formData.email || undefined,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">ไม่พบข้อมูลผู้ใช้</CardTitle>
            <CardDescription>กรุณาเข้าสู่ระบบอีกครั้ง</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">โปรไฟล์ของฉัน</h1>
          <p className="text-gray-600 mt-1">ดูและแก้ไขข้อมูลส่วนตัว</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            แก้ไขข้อมูล
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.name || "ไม่ระบุชื่อ"}</h2>
                <Badge className={roleColors[user.role]} variant="outline">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-gray-600">{user.email || "ไม่ระบุอีเมล"}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="w-4 h-4 inline mr-2" />
                  ชื่อ *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อของคุณ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="กรอกอีเมลของคุณ"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {updateProfileMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">ชื่อ</span>
                </div>
                <p className="text-lg">{user.name || "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">อีเมล</span>
                </div>
                <p className="text-lg">{user.email || "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">บทบาท</span>
                </div>
                <div>
                  <Badge className={roleColors[user.role]} variant="outline">
                    {roleLabel}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">วิธีเข้าสู่ระบบ</span>
                </div>
                <p className="text-lg">{user.loginMethod || "-"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">เข้าสู่ระบบล่าสุด</span>
                </div>
                <p className="text-lg">
                  {user.lastSignedIn
                    ? new Date(user.lastSignedIn).toLocaleString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">สมาชิกเมื่อ</span>
                </div>
                <p className="text-lg">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-[#00366D] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">เกี่ยวกับบทบาทของคุณ</p>
              <p className="text-sm text-blue-800">
                บทบาท <strong>{roleLabel}</strong> กำหนดสิทธิ์การเข้าถึงและการใช้งานฟีเจอร์ต่างๆ ในระบบ
                หากต้องการเปลี่ยนบทบาท กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
