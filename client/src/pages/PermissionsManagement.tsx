import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Save, User, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PermissionsManagement() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permissionChanges, setPermissionChanges] = useState<Map<number, boolean>>(new Map());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: users, isLoading: usersLoading } = trpc.team.getAllUsers.useQuery();
  const { data: allPermissions, isLoading: permissionsLoading } = trpc.userManagement.getAllPermissions.useQuery();
  const { data: userPermissions, isLoading: userPermissionsLoading } = trpc.userManagement.getUserPermissions.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );
  const { data: templates } = trpc.roleTemplates.list.useQuery();

  const bulkSetPermissionsMutation = trpc.userManagement.bulkSetUserPermissions.useMutation({
    onSuccess: () => {
      toast.success("บันทึกสิทธิ์สำเร็จ");
      setPermissionChanges(new Map());
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการบันทึกสิทธิ์");
    },
  });

  const applyTemplateMutation = trpc.roleTemplates.applyToUser.useMutation({
    onSuccess: () => {
      toast.success("นำ template ไปใช้สำเร็จ");
      setSelectedTemplateId("");
      setPermissionChanges(new Map());
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handlePermissionToggle = (permissionId: number, granted: boolean) => {
    const newChanges = new Map(permissionChanges);
    newChanges.set(permissionId, granted);
    setPermissionChanges(newChanges);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId || permissionChanges.size === 0) {
      toast.error("ไม่มีการเปลี่ยนแปลงสิทธิ์");
      return;
    }

    const permissions = Array.from(permissionChanges.entries()).map(([permissionId, granted]) => ({
      permissionId,
      granted,
    }));

    await bulkSetPermissionsMutation.mutateAsync({
      userId: selectedUserId,
      permissions,
    });
  };

  const handleApplyTemplate = async () => {
    if (!selectedUserId || !selectedTemplateId) {
      toast.error("กรุณาเลือก template");
      return;
    }

    await applyTemplateMutation.mutateAsync({
      userId: selectedUserId,
      templateId: parseInt(selectedTemplateId),
    });
  };

  const isPermissionGranted = (permissionId: number): boolean => {
    if (permissionChanges.has(permissionId)) {
      return permissionChanges.get(permissionId)!;
    }
    return userPermissions?.some((up: any) => up.permissionId === permissionId && up.granted) || false;
  };

  // Group permissions by module
  const permissionsByModule = allPermissions?.reduce((acc: Record<string, any[]>, perm: any) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const selectedUser = users?.find((u: any) => u.id === selectedUserId);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">จัดการสิทธิ์ผู้ใช้</h1>
        <p className="text-muted-foreground mt-2">
          กำหนดสิทธิ์การเข้าถึงแบบละเอียดสำหรับแต่ละผู้ใช้
        </p>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            เลือกผู้ใช้
          </CardTitle>
          <CardDescription>
            เลือกผู้ใช้เพื่อจัดการสิทธิ์การเข้าถึง หรือใช้ role template เพื่อกำหนดสิทธิ์อย่างรวดเร็ว
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usersLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedUserId?.toString() || ""}
              onValueChange={(value) => {
                setSelectedUserId(parseInt(value));
                setPermissionChanges(new Map());
              }}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="เลือกผู้ใช้..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{user.name || user.email}</span>
                      <Badge variant="outline" className="ml-2">
                        {user.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedUserId && (
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ใช้ Role Template
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="เลือก template เพื่อนำไปใช้..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId || applyTemplateMutation.isPending}
                  variant="secondary"
                >
                  {applyTemplateMutation.isPending ? "กำลังนำไปใช้..." : "นำไปใช้"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                การใช้ template จะแทนที่สิทธิ์ทั้งหมดของผู้ใช้ด้วยสิทธิ์จาก template
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      {selectedUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              สิทธิ์การเข้าถึง
            </CardTitle>
            <CardDescription>
              {selectedUser && (
                <span>
                  กำหนดสิทธิ์สำหรับ <strong>{selectedUser.name || selectedUser.email}</strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionsLoading || userPermissionsLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {permissionsByModule && Object.entries(permissionsByModule).map(([module, perms]: [string, any[]]) => (
                  <div key={module} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-3">
                      <h3 className="font-semibold capitalize">
                        {module === 'projects' && 'โครงการ'}
                        {module === 'tasks' && 'งาน'}
                        {module === 'inspections' && 'การตรวจสอบ'}
                        {module === 'defects' && 'ข้อบกพร่อง'}
                        {module === 'reports' && 'รายงาน'}
                        {module === 'users' && 'ผู้ใช้'}
                        {module === 'settings' && 'การตั้งค่า'}
                        {module === 'dashboard' && 'แดชบอร์ด'}
                      </h3>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>สิทธิ์</TableHead>
                          <TableHead>คำอธิบาย</TableHead>
                          <TableHead className="text-center">อนุญาต</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {perms.map((perm: any) => {
                          const granted = isPermissionGranted(perm.id);
                          const hasChange = permissionChanges.has(perm.id);

                          return (
                            <TableRow key={perm.id} className={hasChange ? "bg-blue-50" : ""}>
                              <TableCell className="font-medium">
                                {perm.name}
                                {hasChange && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    มีการเปลี่ยนแปลง
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {perm.description}
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={granted}
                                  onCheckedChange={(checked) => {
                                    handlePermissionToggle(perm.id, checked as boolean);
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}

                {permissionChanges.size > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">
                        มีการเปลี่ยนแปลง {permissionChanges.size} รายการ
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPermissionChanges(new Map())}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={handleSavePermissions}
                        disabled={bulkSetPermissionsMutation.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {bulkSetPermissionsMutation.isPending ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedUserId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>กรุณาเลือกผู้ใช้เพื่อจัดการสิทธิ์</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
