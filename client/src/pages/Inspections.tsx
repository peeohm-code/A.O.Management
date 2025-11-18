import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useLocation } from "wouter";

export default function Inspections() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Queries
  const { data: stats, isLoading: loadingStats } = trpc.inspection.getStats.useQuery();
  const { data: projectsData } = trpc.project.list.useQuery();
  const projects = projectsData?.items || [];
  
  const { data: inspectionsData, isLoading: loadingInspections } = trpc.inspection.list.useQuery({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    projectId: projectFilter !== "all" ? parseInt(projectFilter) : undefined,
  });

  const inspections = inspectionsData?.items || [];
  const pagination = inspectionsData?.pagination;

  // Status badge helper
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      not_started: { label: "ยังไม่เริ่ม", variant: "secondary" },
      pending_inspection: { label: "รอตรวจสอบ", variant: "outline" },
      in_progress: { label: "กำลังตรวจ", variant: "default" },
      completed: { label: "ผ่าน", variant: "default" },
      failed: { label: "ไม่ผ่าน", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">การตรวจสอบคุณภาพ (QC Inspections)</h1>
        <p className="text-muted-foreground mt-1">
          ติดตามและจัดการการตรวจสอบคุณภาพงานก่อสร้าง
        </p>
      </div>

      {/* Search & Filter Bar - Moved to top */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหางาน, โครงการ, checklist..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                <SelectItem value="not_started">ยังไม่เริ่ม</SelectItem>
                <SelectItem value="pending_inspection">รอตรวจสอบ</SelectItem>
                <SelectItem value="in_progress">กำลังตรวจ</SelectItem>
                <SelectItem value="completed">ผ่าน</SelectItem>
                <SelectItem value="failed">ไม่ผ่าน</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={(value) => {
              setProjectFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="โครงการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">โครงการทั้งหมด</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  การตรวจสอบทั้งหมด
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</div>
                <p className="text-xs text-muted-foreground">
                  รอตรวจสอบ/กำลังตรวจ
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผ่านการตรวจ</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats?.passed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  อัตราผ่าน {stats?.passRate || 0}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ไม่ผ่านการตรวจ</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  ต้องแก้ไข/ตรวจซ้ำ
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Inspection List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการตรวจสอบ</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInspections ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">ไม่พบรายการตรวจสอบ</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== "all" || projectFilter !== "all"
                  ? "ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง"
                  : "ยังไม่มีรายการตรวจสอบในระบบ"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>โครงการ</TableHead>
                      <TableHead>งาน</TableHead>
                      <TableHead>Checklist</TableHead>
                      <TableHead>ขั้นตอน</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>ผู้ตรวจ</TableHead>
                      <TableHead>วันที่ตรวจ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspections.map((inspection: any) => (
                      <TableRow 
                        key={inspection.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setLocation(`/inspections/${inspection.id}`)}
                      >
                        <TableCell className="font-medium">#{inspection.id}</TableCell>
                        <TableCell>{inspection.projectName || "-"}</TableCell>
                        <TableCell>{inspection.taskName || "-"}</TableCell>
                        <TableCell>{inspection.templateName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {inspection.stage === "pre_execution" && "ก่อนเริ่มงาน"}
                            {inspection.stage === "in_progress" && "ระหว่างดำเนินงาน"}
                            {inspection.stage === "post_execution" && "หลังเสร็จงาน"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(inspection.status)}</TableCell>
                        <TableCell>{inspection.inspectorName || "-"}</TableCell>
                        <TableCell>
                          {inspection.inspectedAt
                            ? format(new Date(inspection.inspectedAt), "dd MMM yyyy", { locale: th })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    แสดง {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, pagination.totalItems)} จาก {pagination.totalItems} รายการ
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      ก่อนหน้า
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">
                        หน้า {page} / {pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasMore}
                    >
                      ถัดไป
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
