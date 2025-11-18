import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  User, 
  Filter, 
  Calendar,
  FileText,
  Eye,
  Search,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export default function UserActivityLog() {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [selectedAction, setSelectedAction] = useState<string | undefined>();
  const [selectedModule, setSelectedModule] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: users, isLoading: usersLoading } = trpc.team.getAllUsers.useQuery();
  
  const { data: activityLogs, isLoading: logsLoading, refetch } = trpc.userManagement.getAllActivityLogs.useQuery({
    userId: selectedUserId,
    action: selectedAction,
    module: selectedModule,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: 100,
  });

  const handleClearFilters = () => {
    setSelectedUserId(undefined);
    setSelectedAction(undefined);
    setSelectedModule(undefined);
    setStartDate("");
    setEndDate("");
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="h-4 w-4" />;
    if (action.includes('create')) return <FileText className="h-4 w-4" />;
    if (action.includes('view')) return <Eye className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('create')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    return 'outline';
  };

  const formatActionName = (action: string) => {
    const actionMap: Record<string, string> = {
      'login': 'เข้าสู่ระบบ',
      'logout': 'ออกจากระบบ',
      'create_project': 'สร้างโครงการ',
      'update_project': 'แก้ไขโครงการ',
      'delete_project': 'ลบโครงการ',
      'create_task': 'สร้างงาน',
      'update_task': 'แก้ไขงาน',
      'delete_task': 'ลบงาน',
      'create_user': 'สร้างผู้ใช้',
      'update_user': 'แก้ไขผู้ใช้',
      'delete_user': 'ลบผู้ใช้',
      'bulk_import_users': 'นำเข้าผู้ใช้จำนวนมาก',
      'update_user_permission': 'แก้ไขสิทธิ์ผู้ใช้',
      'bulk_update_user_permissions': 'แก้ไขสิทธิ์ผู้ใช้แบบกลุ่ม',
    };
    return actionMap[action] || action;
  };

  const formatModuleName = (module: string | null) => {
    if (!module) return '-';
    const moduleMap: Record<string, string> = {
      'projects': 'โครงการ',
      'tasks': 'งาน',
      'users': 'ผู้ใช้',
      'inspections': 'การตรวจสอบ',
      'defects': 'ข้อบกพร่อง',
      'reports': 'รายงาน',
      'settings': 'การตั้งค่า',
      'dashboard': 'แดชบอร์ด',
    };
    return moduleMap[module] || module;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ประวัติการใช้งาน</h1>
        <p className="text-muted-foreground mt-2">
          ติดตามและตรวจสอบกิจกรรมของผู้ใช้ในระบบ
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            กรองข้อมูล
          </CardTitle>
          <CardDescription>
            เลือกเงื่อนไขเพื่อกรองประวัติการใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* User Filter */}
            <div className="space-y-2">
              <Label>ผู้ใช้</Label>
              {usersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedUserId?.toString() || "all"}
                  onValueChange={(value) => setSelectedUserId(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Module Filter */}
            <div className="space-y-2">
              <Label>โมดูล</Label>
              <Select
                value={selectedModule || "all"}
                onValueChange={(value) => setSelectedModule(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="projects">โครงการ</SelectItem>
                  <SelectItem value="tasks">งาน</SelectItem>
                  <SelectItem value="users">ผู้ใช้</SelectItem>
                  <SelectItem value="inspections">การตรวจสอบ</SelectItem>
                  <SelectItem value="defects">ข้อบกพร่อง</SelectItem>
                  <SelectItem value="reports">รายงาน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label>การกระทำ</Label>
              <Select
                value={selectedAction || "all"}
                onValueChange={(value) => setSelectedAction(value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทั้งหมด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
                  <SelectItem value="logout">ออกจากระบบ</SelectItem>
                  <SelectItem value="create_project">สร้างโครงการ</SelectItem>
                  <SelectItem value="update_project">แก้ไขโครงการ</SelectItem>
                  <SelectItem value="create_task">สร้างงาน</SelectItem>
                  <SelectItem value="update_task">แก้ไขงาน</SelectItem>
                  <SelectItem value="bulk_import_users">นำเข้าผู้ใช้</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>วันที่สิ้นสุด</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 flex items-end">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  ล้างตัวกรอง
                </Button>
                <Button
                  onClick={() => refetch()}
                  className="flex-1 gap-2"
                >
                  <Search className="h-4 w-4" />
                  ค้นหา
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            รายการกิจกรรม
          </CardTitle>
          <CardDescription>
            {activityLogs && `แสดง ${activityLogs.length} รายการ`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activityLogs && activityLogs.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เวลา</TableHead>
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>การกระทำ</TableHead>
                    <TableHead>โมดูล</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log: any) => {
                    const user = users?.find((u: any) => u.id === log.userId);
                    let details = null;
                    try {
                      details = log.details ? JSON.parse(log.details) : null;
                    } catch (e) {
                      details = log.details;
                    }

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{new Date(log.createdAt).toLocaleDateString('th-TH')}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user?.name || user?.email || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
                            {getActionIcon(log.action)}
                            {formatActionName(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatModuleName(log.module)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {details && (
                            <div className="text-sm text-muted-foreground truncate">
                              {typeof details === 'object' ? JSON.stringify(details) : details}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ไม่พบประวัติการใช้งาน</p>
              <p className="text-sm mt-2">ลองปรับเงื่อนไขการกรองใหม่</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
