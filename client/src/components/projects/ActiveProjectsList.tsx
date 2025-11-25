import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { EmptyState } from "@/components/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, MapPin, Calendar, Clock, Edit, Eye, Download, TrendingUp, AlertTriangle, CheckCircle2, Building2 } from "lucide-react";
import { ProjectListSkeleton } from "@/components/skeletons";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { parseDate } from "@/lib/dateUtils";
import ExcelJS from 'exceljs';

export function ActiveProjectsList() {
  const { canCreate } = usePermissions('projects');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isOpen, setIsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    startDate: "",
    endDate: "",
    ownerName: "",
    color: "#3B82F6",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    location: "",
    color: "#3B82F6",
    startDate: "",
    endDate: "",
    ownerName: "",
    status: "active" as "planning" | "active" | "on_hold" | "completed" | "cancelled",
  });

  const utils = trpc.useUtils();
  const projectsQuery = trpc.project.list.useQuery({ page: currentPage, limit: pageSize });
  const createProjectMutation = trpc.project.create.useMutation();
  const updateProjectMutation = trpc.project.update.useMutation();

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: formData.name,
        code: formData.code || undefined,
        location: formData.location || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        ownerName: formData.ownerName || undefined,
        color: formData.color || "#3B82F6",
      });

      toast.success("Project created successfully");
      setFormData({ name: "", code: "", location: "", startDate: "", endDate: "", ownerName: "", color: "#3B82F6" });
      setIsOpen(false);
      projectsQuery.refetch();
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create project";
      toast.error(errorMessage);
    }
  };

  const handleEditClick = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    
    const formatDate = (date: any) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };
    
    setEditFormData({
      name: project.name || "",
      code: project.code || "",
      location: project.location || "",
      color: project.color || "#3B82F6",
      startDate: formatDate(project.startDate),
      endDate: formatDate(project.endDate),
      ownerName: project.ownerName || "",
      status: project.status || "active",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        name: editFormData.name,
        code: editFormData.code || undefined,
        location: editFormData.location || undefined,
        color: editFormData.color || "#3B82F6",
        startDate: editFormData.startDate || undefined,
        endDate: editFormData.endDate || undefined,
        ownerName: editFormData.ownerName || undefined,
        status: editFormData.status,
      });

      toast.success("Project updated successfully");
      setEditDialogOpen(false);
      setEditingProject(null);
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to update project");
    }
  };

  const projects = projectsQuery.data?.items || [];
  const pagination = projectsQuery.data?.pagination;
  
  let filteredProjects = projects.filter((p) => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || p.status === filters.status;
    
    return matchesSearch && matchesStatus;
  });

  filteredProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "date":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "progress":
        return (b.progressPercentage || 0) - (a.progressPercentage || 0);
      case "status":
        const statusOrder = { delayed: 0, at_risk: 1, on_track: 2, completed: 3 };
        return (statusOrder[a.projectStatus as keyof typeof statusOrder] || 4) - 
               (statusOrder[b.projectStatus as keyof typeof statusOrder] || 4);
      default:
        return 0;
    }
  });

  const stats = {
    total: projects.length,
    on_track: filteredProjects.filter(p => p.projectStatus === 'on_track').length,
    delayed: filteredProjects.filter(p => p.projectStatus === 'delayed').length,
    overdue: filteredProjects.filter(p => p.projectStatus === 'overdue').length,
  };

  const getProjectStatusLabel = (status: string) => {
    switch (status) {
      case "on_track": return "ตามแผน";
      case "at_risk": return "เสี่ยง";
      case "delayed": return "ล่าช้า";
      case "completed": return "เสร็จสิ้น";
      default: return "ไม่ทราบ";
    }
  };

  const calculateDaysRemaining = (endDate: string | Date | null) => {
    if (!endDate) return null;
    const end = parseDate(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (projectsQuery.isLoading) {
    return <ProjectListSkeleton />;
  }

  if (projectsQuery.error) {
    return (
      <QueryErrorBoundary onReset={() => projectsQuery.refetch()}>
        <div>Error loading projects</div>
      </QueryErrorBoundary>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">โครงการที่กำลังดำเนินการ</h2>
          <p className="text-gray-600 mt-1">จัดการและติดตามโครงการก่อสร้างของคุณ</p>
        </div>
        {canCreate && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#00CE81] hover:bg-[#00CE81]/90 text-white shadow-md">
                <Plus className="w-4 h-4" />
                สร้างโครงการใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>สร้างโครงการใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลโครงการก่อสร้างใหม่</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="name">ชื่อโครงการ *</Label>
                  <Input
                    id="name"
                    placeholder="เช่น โครงการบ้านพักอาศัย 2 ชั้น"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">รหัสโครงการ</Label>
                  <Input
                    id="code"
                    placeholder="เช่น HOUSE-2025-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">สถานที่</Label>
                  <Input
                    id="location"
                    placeholder="เช่น ชลบุรี"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">วันเริ่มโครงการ</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">วันสิ้นสุดโครงการ</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">ชื่อเจ้าของโครงการ</Label>
                  <Input
                    id="ownerName"
                    placeholder="เช่น คุณสมชาย ใจดี"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="color">สีประจำโครงการ</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{formData.color}</span>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#00CE81] hover:bg-[#00CE81]/90" 
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    "สร้างโครงการ"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Quick Stats Cards */}
      <div className="grid card-spacing grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">โครงการทั้งหมด</p>
                <p className="metric-value text-[#00366D]">{stats.total}</p>
              </div>
              <div className="p-3 bg-[#00366D]/10 rounded-full">
                <Building2 className="w-6 h-6 text-[#00366D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">กำลังดำเนินการ</p>
                <p className="metric-value text-[#00CE81]">{stats.on_track}</p>
              </div>
              <div className="p-3 bg-[#00CE81]/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-[#00CE81]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">ล่าช้า</p>
                <p className="metric-value text-yellow-600">{stats.delayed}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">เลยกำหนด</p>
                <p className="metric-value text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter, and Sort */}
      <Card className="border-[#00366D]/20 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <SearchBar
              placeholder="ค้นหาโครงการตามชื่อหรือรหัส..."
              onSearch={setSearchTerm}
              className="flex-1 w-full lg:w-auto"
            />
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                statusOptions={[
                  { value: "active", label: "กำลังดำเนินการ" },
                  { value: "planning", label: "วางแผน" },
                  { value: "on_hold", label: "พักไว้" },
                  { value: "completed", label: "เสร็จสิ้น" },
                  { value: "cancelled", label: "ยกเลิก" },
                ]}
                showAssignee={false}
                showCategory={false}
                showPriority={false}
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="เรียงตาม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">ชื่อโครงการ</SelectItem>
                  <SelectItem value="date">วันที่สร้าง</SelectItem>
                  <SelectItem value="progress">ความคืบหน้า</SelectItem>
                  <SelectItem value="status">สถานะ</SelectItem>
                </SelectContent>
              </Select>
              {filteredProjects.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const workbook = new ExcelJS.Workbook();
                      const worksheet = workbook.addWorksheet('Projects');

                      // Define columns
                      worksheet.columns = [
                        { header: 'รหัสโครงการ', key: 'code', width: 15 },
                        { header: 'ชื่อโครงการ', key: 'name', width: 30 },
                        { header: 'สถานที่', key: 'location', width: 20 },
                        { header: 'วันที่เริ่ม', key: 'startDate', width: 15 },
                        { header: 'วันที่สิ้นสุด', key: 'endDate', width: 15 },
                        { header: 'ความคืบหน้า (%)', key: 'progress', width: 15 },
                        { header: 'จำนวนงาน', key: 'taskCount', width: 12 },
                        { header: 'งานเสร็จ', key: 'completedTasks', width: 12 },
                        { header: 'สถานะ', key: 'status', width: 15 },
                      ];

                      // Add rows
                      filteredProjects.forEach(p => {
                        worksheet.addRow({
                          code: p.code || '',
                          name: p.name || '',
                          location: p.location || '',
                          startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('th-TH') : '',
                          endDate: p.endDate ? new Date(p.endDate).toLocaleDateString('th-TH') : '',
                          progress: p.progressPercentage || 0,
                          taskCount: p.taskCount || 0,
                          completedTasks: p.completedTasks || 0,
                          status: getProjectStatusLabel(p.projectStatus),
                        });
                      });

                      // Style header row
                      worksheet.getRow(1).font = { bold: true };
                      worksheet.getRow(1).fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' },
                      };

                      // Write to file
                      const buffer = await workbook.xlsx.writeBuffer();
                      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'projects.xlsx';
                      link.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('ส่งออกไฟล์ Excel สำเร็จ');
                    } catch (error) {
                      toast.error('เกิดข้อผิดพลาดในการส่งออกไฟล์');
                    }
                  }}
                  className="whitespace-nowrap"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-6">
        {filteredProjects.map((project: any) => {
          const daysRemaining = calculateDaysRemaining(project.endDate);
          
          return (
            <Card 
              key={project.id} 
              className="group hover:shadow-xl transition-all duration-300 border-l-4"
              style={{ borderLeftColor: project.color || '#00CE81' }}
            >
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="text-xl font-bold text-gray-900 hover:text-[#00CE81] transition-colors cursor-pointer truncate">
                            {project.name}
                          </h3>
                        </Link>
                        {project.code && (
                          <p className="text-sm text-gray-600 font-mono mt-1">{project.code}</p>
                        )}
                      </div>
                      <StatusBadge 
                        status={project.status === 'active' ? 'in_progress' : 
                               project.status === 'planning' ? 'not_started' :
                               project.status === 'on_hold' ? 'delayed' :
                               project.status === 'completed' ? 'completed' : 'delayed'}
                        label={project.status === 'active' ? 'กำลังดำเนินการ' : 
                               project.status === 'planning' ? 'วางแผน' :
                               project.status === 'on_hold' ? 'พักไว้' :
                               project.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {project.ownerName && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#00366D]">เจ้าของ:</span>
                          <span>{project.ownerName}</span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#00CE81]" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#00366D]" />
                          <span>
                            {project.startDate && parseDate(project.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                            {project.startDate && project.endDate && ' - '}
                            {project.endDate && parseDate(project.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      )}
                      {daysRemaining !== null && (
                        <div className="flex items-center gap-1.5">
                          <Clock className={`w-4 h-4 ${daysRemaining < 0 ? 'text-red-500' : daysRemaining < 7 ? 'text-yellow-500' : 'text-[#00CE81]'}`} />
                          <span className={daysRemaining < 0 ? 'text-red-600 font-medium' : ''}>
                            {daysRemaining < 0 ? `เกินกำหนด ${Math.abs(daysRemaining)} วัน` : `เหลือ ${daysRemaining} วัน`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{project.completedTasks || 0}/{project.taskCount || 0} งาน</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-72">
                    <div className="flex-1">
                      <ProgressBar 
                        value={project.progressPercentage}
                        showLabel={true}
                        size="md"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end lg:justify-between gap-3">
                      <StatusBadge 
                        status={project.projectStatus === 'on_track' ? 'completed' : 
                               project.projectStatus === 'at_risk' ? 'in_progress' :
                               project.projectStatus === 'delayed' ? 'delayed' : 'completed'}
                        label={getProjectStatusLabel(project.projectStatus)}
                      />
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/projects/${project.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-[#00CE81]/10 hover:text-[#00CE81]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-[#00366D]/10 hover:text-[#00366D]"
                          onClick={(e) => handleEditClick(project, e)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <EmptyState
          icon={Building2}
          title={searchTerm || Object.keys(filters).length > 0 ? "ไม่พบโครงการที่ตรงกับเงื่อนไข" : "ยังไม่มีโครงการ"}
          description={searchTerm || Object.keys(filters).length > 0 ? "ลองปรับเงื่อนไขการค้นหาหรือตัวกรอง หรือล้างค่าการค้นหา" : "เริ่มต้นด้วยการสร้างโครงการแรกของคุณ"}
          action={canCreate ? {
            label: "สร้างโครงการใหม่",
            onClick: () => setIsOpen(true)
          } : undefined}
          secondaryAction={searchTerm || Object.keys(filters).length > 0 ? {
            label: "ล้างค่าการค้นหา",
            onClick: () => {
              setSearchTerm("");
              setFilters({});
            }
          } : undefined}
        />
      )}

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>แก้ไขโครงการ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลโครงการก่อสร้าง</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">ชื่อโครงการ *</Label>
              <Input
                id="edit-name"
                placeholder="เช่น โครงการบ้านพักอาศัย 2 ชั้น"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-code">รหัสโครงการ</Label>
              <Input
                id="edit-code"
                placeholder="เช่น HOUSE-2025-001"
                value={editFormData.code}
                onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-location">สถานที่</Label>
              <Input
                id="edit-location"
                placeholder="เช่น ชลบุรี"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-startDate">วันเริ่มโครงการ</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={editFormData.startDate}
                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-endDate">วันสิ้นสุดโครงการ</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={editFormData.endDate}
                onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-ownerName">ชื่อเจ้าของโครงการ</Label>
              <Input
                id="edit-ownerName"
                placeholder="เช่น คุณสมชาย ใจดี"
                value={editFormData.ownerName}
                onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">สีประจำโครงการ</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-color"
                  type="color"
                  value={editFormData.color}
                  onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{editFormData.color}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">สถานะโครงการ</Label>
              <Select 
                value={editFormData.status} 
                onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">วางแผน</SelectItem>
                  <SelectItem value="active">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="on_hold">พักไว้</SelectItem>
                  <SelectItem value="completed">เสร็จสิ้น</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#00CE81] hover:bg-[#00CE81]/90" 
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการแก้ไข"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-600">
            แสดง {projects.length} จาก {pagination.totalItems} โครงการ
          </div>
          <div className="flex items-center gap-4">
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / หน้า</SelectItem>
                <SelectItem value="25">25 / หน้า</SelectItem>
                <SelectItem value="50">50 / หน้า</SelectItem>
                <SelectItem value="100">100 / หน้า</SelectItem>
              </SelectContent>
            </Select>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={!pagination.hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    className={!pagination.hasMore ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
