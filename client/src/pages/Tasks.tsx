import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Checkbox } from "@/components/ui/checkbox";
import { SimplePagination } from "@/components/ui/simple-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, User, Building2, CheckSquare, X, PieChart as PieChartIcon, Flag, Tag, ListTodo, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { TaskCardSkeleton } from "@/components/skeletons";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "@/components/LazyChart";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link } from "wouter";
import FloatingActionButton from "@/components/FloatingActionButton";
import NewTaskDialog from "@/components/NewTaskDialog";
import { SwipeableCard } from "@/components/SwipeableCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Plus, Edit, Trash2, CheckCircle, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { parseDate } from "@/lib/dateUtils";
import { useLocation } from "wouter";
import { exportTasksToExcel } from "@/lib/excelExport";
import { ExportButton } from "@/components/ExportButton";

export default function Tasks() {
  const { canCreate, canEdit } = usePermissions('tasks');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [displayStatusFilter, setDisplayStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<number | undefined>(undefined);
  const [assigneeFilter, setAssigneeFilter] = useState<number | undefined>(undefined);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkAssignee, setBulkAssignee] = useState<string>("");
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Use search query with filters and pagination
  const searchQuery = trpc.task.search.useQuery({
    query: searchTerm,
    projectId: projectFilter,
    status: displayStatusFilter !== 'all' ? displayStatusFilter : undefined,
    assigneeId: assigneeFilter,
    page: currentPage,
    limit: itemsPerPage,
  });
  
  const projectsQuery = trpc.project.list.useQuery();
  const utils = trpc.useUtils();
  
  const handleRefresh = async () => {
    await searchQuery.refetch();
  };

  const bulkUpdateStatusMutation = trpc.task.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`อัปเดตสถานะสำเร็จ ${data.updated}/${data.total} งาน`);
      setSelectedTasks(new Set());
      setShowBulkStatusDialog(false);
      searchQuery.refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const bulkAssignMutation = trpc.task.bulkAssign.useMutation({
    onSuccess: (data) => {
      toast.success(`มอบหมายงานสำเร็จ ${data.assigned}/${data.total} งาน`);
      setSelectedTasks(new Set());
      setShowBulkAssignDialog(false);
      searchQuery.refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.task.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`ลบงานสำเร็จ ${data.deletedCount} งาน`);
      setSelectedTasks(new Set());
      setShowBulkDeleteDialog(false);
      searchQuery.refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const [, navigate] = useLocation();

  const updateTaskStatusMutation = trpc.task.update.useMutation({
    onSuccess: () => {
      toast.success('อัปเดตสถานะสำเร็จ');
      searchQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deleteTaskMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success('ลบงานสำเร็จ');
      searchQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleCompleteTask = (taskId: number) => {
    updateTaskStatusMutation.mutate({ id: taskId, status: 'completed' });
  };

  const handleEditTask = (taskId: number) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  // Get tasks from search query
  const tasks = searchQuery.data?.items || [];
  const totalTasks = searchQuery.data?.total || 0;
  const totalPages = searchQuery.data?.totalPages || 1;
  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  
  // Extract unique assignees from tasks
  const members = Array.from(
    new Map(
      tasks
        .filter((t: any) => t.assigneeId && t.assigneeName)
        .map((t: any) => [t.assigneeId, { userId: t.assigneeId, userName: t.assigneeName }])
    ).values()
  );

  const filteredTasks = tasks;

  const stats = {
    total: totalTasks,
    not_started: tasks.filter((t: any) => (t as any).displayStatus === "not_started").length,
    in_progress: tasks.filter((t: any) => (t as any).displayStatus === "in_progress").length,
    delayed: tasks.filter((t: any) => (t as any).displayStatus === "delayed").length,
    completed: tasks.filter((t: any) => (t as any).displayStatus === "completed").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending_pre_inspection":
      case "pending_final_inspection":
        return "bg-yellow-100 text-yellow-800";
      case "rectification_needed":
        return "bg-red-100 text-red-800";
      case "ready_to_start":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const toggleTaskSelection = (taskId: number) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t: any) => t.id)));
    }
  };

  const handleBulkUpdateStatus = () => {
    if (!bulkStatus) {
      toast.error("กรุณาเลือกสถานะ");
      return;
    }
    bulkUpdateStatusMutation.mutate({
      taskIds: Array.from(selectedTasks),
      status: bulkStatus as any,
    });
  };

  const handleBulkAssign = () => {
    if (!bulkAssignee) {
      toast.error("กรุณาเลือกผู้รับผิดชอบ");
      return;
    }
    bulkAssignMutation.mutate({
      taskIds: Array.from(selectedTasks),
      assigneeId: parseInt(bulkAssignee),
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate({
      taskIds: Array.from(selectedTasks),
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedTasks(new Set()); // Clear selection when changing page
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedTasks(new Set()); // Clear selection
  };

  if (searchQuery.isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">งานของฉัน</h1>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        </div>
        <TaskCardSkeleton />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-gray-600 mt-1">View tasks from your projects</p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid card-spacing grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">งานทั้งหมด</p>
                <p className="metric-value text-[#00366D]">{stats.total}</p>
              </div>
              <div className="p-3 bg-[#00366D]/10 rounded-full">
                <ListTodo className="w-6 h-6 text-[#00366D]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">กำลังทำ</p>
                <p className="metric-value text-[#00CE81]">{stats.in_progress}</p>
              </div>
              <div className="p-3 bg-[#00CE81]/10 rounded-full">
                <Clock className="w-6 h-6 text-[#00CE81]" />
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
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-border card-shadow hover-lift">
          <CardContent className="card-padding">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-label">เสร็จสมบูรณ์</p>
                <p className="metric-value text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTasks.size > 0 && canEdit && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                เลือกแล้ว {selectedTasks.size} งาน
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkStatusDialog(true)}
              >
                อัปเดตสถานะ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkAssignDialog(true)}
              >
                มอบหมายงาน
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                ลบ
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 py-4 -mt-4 mb-2 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <SearchBar
            placeholder="ค้นหางาน..."
            onSearch={setSearchTerm}
            className="w-full md:max-w-md"
          />
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Project Filter */}
          <div className="flex-1">
            <Select
              value={projectFilter?.toString() || "all"}
              onValueChange={(value) => setProjectFilter(value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="ทุกโครงการ" />
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
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <Select
              value={displayStatusFilter}
              onValueChange={setDisplayStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="not_started">ยังไม่เริ่ม</SelectItem>
                <SelectItem value="in_progress">กำลังทำ</SelectItem>
                <SelectItem value="delayed">ล่าช้า</SelectItem>
                <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="flex-1">
            <Select
              value={assigneeFilter?.toString() || "all"}
              onValueChange={(value) => setAssigneeFilter(value === "all" ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="ผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคน</SelectItem>
                {members.map((member: any) => (
                  <SelectItem key={member.userId} value={member.userId.toString()}>
                    {member.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && filteredTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                onCheckedChange={selectAllTasks}
                className="border-2"
              />
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size === filteredTasks.length && filteredTasks.length > 0
                  ? "ยกเลิกทั้งหมด"
                  : "เลือกทั้งหมด"}
              </span>
            </div>
          )}
          {filteredTasks.length > 0 && projectFilter && (
            <ExportButton
              projectId={projectFilter}
              type="tasks"
            />
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="ไม่พบงาน"
          description="ยังไม่มีงานที่ตรงกับเงื่อนไขการค้นหา"
        />
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task: any) => (
            <SwipeableCard
              key={task.id}
              onEdit={canEdit ? () => handleEditTask(task.id) : undefined}
              onDelete={canEdit ? () => handleDeleteTask(task.id) : undefined}
              onComplete={() => handleCompleteTask(task.id)}
            >
              <Card className="card-border card-shadow hover-lift">
                <CardContent className="card-padding">
                  <div className="flex items-start gap-4">
                    {canEdit && (
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/tasks/${task.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer truncate">
                              {task.name}
                            </h3>
                          </Link>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={task.displayStatus}
                          label={task.displayStatusLabel}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {task.projectName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{task.projectName}</span>
                          </div>
                        )}
                        {task.assigneeName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{task.assigneeName}</span>
                          </div>
                        )}
                        {task.startDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{parseDate(task.startDate)}</span>
                          </div>
                        )}
                        {task.priority && (
                          <div className="flex items-center gap-2 text-sm">
                            <Flag className="w-4 h-4 flex-shrink-0" />
                            <span className={`font-medium ${
                              task.priority === 'high' ? 'text-red-600' :
                              task.priority === 'medium' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {task.priority === 'high' ? 'สูง' :
                               task.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                            </span>
                          </div>
                        )}
                      </div>

                      {task.progress !== undefined && task.progress !== null && (
                        <div className="mt-3">
                          <ProgressBar
                            value={task.progress}
                            showLabel={true}
                            size="md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SwipeableCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalTasks}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        showItemCount={true}
        showItemsPerPageSelector={true}
      />

      {/* Bulk Status Dialog */}
      <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะงาน</DialogTitle>
            <DialogDescription>
              เลือกสถานะใหม่สำหรับ {selectedTasks.size} งานที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">ยังไม่เริ่ม</SelectItem>
                <SelectItem value="in_progress">กำลังทำ</SelectItem>
                <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkStatusDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkUpdateStatus}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              อัปเดต
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>มอบหมายงาน</DialogTitle>
            <DialogDescription>
              เลือกผู้รับผิดชอบสำหรับ {selectedTasks.size} งานที่เลือก
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member: any) => (
                  <SelectItem key={member.userId} value={member.userId.toString()}>
                    {member.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkAssignDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              มอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบงาน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบ {selectedTasks.size} งานที่เลือก?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAB for creating new task */}
      {canCreate && (
        <>
          <FloatingActionButton
            onClick={() => setShowNewTaskDialog(true)}
            icon={Plus}
            label="สร้างงานใหม่"
          />
          <NewTaskDialog
            open={showNewTaskDialog}
            onOpenChange={setShowNewTaskDialog}
            projectId={projectFilter}
          />
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
