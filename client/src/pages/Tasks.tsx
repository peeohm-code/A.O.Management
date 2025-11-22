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
import { Loader2, Calendar, User, Building2, CheckSquare, X, PieChart as PieChartIcon, Flag, Tag, ListTodo } from "lucide-react";
import { TaskCardSkeleton } from "@/components/skeletons";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "@/components/LazyChart";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link, useLocation } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import FloatingActionButton from "@/components/FloatingActionButton";
import NewTaskDialog from "@/components/NewTaskDialog";
import { SwipeableCard } from "@/components/SwipeableCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Plus, Edit, Trash2, CheckCircle, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { parseDate } from "@/lib/dateUtils";
import { exportTasksToExcel } from "@/lib/excelExport";
import { ExportButton } from "@/components/ExportButton";

export default function Tasks() {
  const [, setLocation] = useLocation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Use search query with filters
  const searchQuery = trpc.task.search.useQuery({
    query: searchTerm,
    projectId: projectFilter,
    status: displayStatusFilter !== 'all' ? displayStatusFilter : undefined,
    assigneeId: assigneeFilter,
  });
  
  const myTasksQuery = trpc.task.myTasks.useQuery();
  const allTasksQuery = trpc.task.list.useQuery({ page: currentPage, pageSize });
  const projectsQuery = trpc.project.list.useQuery({});
  const utils = trpc.useUtils();
  
  const handleRefresh = async () => {
    await searchQuery.refetch();
    await utils.task.myTasks.invalidate();
  };

  const bulkUpdateStatusMutation = trpc.task.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`อัปเดตสถานะสำเร็จ ${data.updated}/${data.total} งาน`);
      setSelectedTasks(new Set());
      setShowBulkStatusDialog(false);
      utils.task.myTasks.invalidate();
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
      utils.task.myTasks.invalidate();
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
      utils.task.myTasks.invalidate();
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
      utils.task.myTasks.invalidate();
    },
    onError: (error: any) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deleteTaskMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      toast.success('ลบงานสำเร็จ');
      utils.task.myTasks.invalidate();
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

  // Use search results if any filter is active, otherwise use paginated tasks
  const hasActiveFilter = searchTerm || projectFilter || displayStatusFilter !== 'all' || assigneeFilter;
  const tasks = hasActiveFilter ? (searchQuery.data || []) : (allTasksQuery.data?.items || []);
  const pagination = !hasActiveFilter ? allTasksQuery.data?.pagination : undefined;
  const projects = projectsQuery.data?.items || [];
  
  // Extract unique assignees from tasks
  const members = Array.from(
    new Map(
      tasks
        .filter((t: any) => t.assigneeId && t.assigneeName)
        .map((t: any) => [t.assigneeId, { userId: t.assigneeId, userName: t.assigneeName }])
    ).values()
  );

  // Tasks are already filtered by the search query
  const filteredTasks = tasks;

  const stats = {
    total: tasks.length,
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

  if (myTasksQuery.isLoading) {
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
            placeholder="ค้ษหางาน..."
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
            <>
              <ExportButton projectId={projectFilter} />
            </>
          )}
        </div>
      </div>

      {/* Task Overview Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>Task Overview</CardTitle>
          </div>
          <CardDescription>สถิติงานทั้งหมดแบ่งตามสถานะ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'กำลังทำ', value: stats.in_progress, color: '#00366D' },
                      { name: 'ล่าช้า', value: stats.delayed, color: '#EF4444' },
                      { name: 'เสร็จสมบูรณ์', value: stats.completed, color: '#00CE81' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => entry.value > 0 ? `${entry.name} ${((entry.value / stats.total) * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'กำลังทำ', value: stats.in_progress, color: '#00366D' },
                      { name: 'ล่าช้า', value: stats.delayed, color: '#EF4444' },
                      { name: 'เสร็จสมบูรณ์', value: stats.completed, color: '#00CE81' },
                    ].map((entry, index: any) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDisplayStatusFilter(displayStatusFilter === 'not_started' ? 'all' : 'not_started')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{stats.not_started}</div>
                  <div className="text-sm text-muted-foreground">ยังไม่เริ่ม</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDisplayStatusFilter(displayStatusFilter === 'in_progress' ? 'all' : 'in_progress')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold" style={{ color: '#00366D' }}>{stats.in_progress}</div>
                  <div className="text-sm text-muted-foreground">กำลังทำ</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDisplayStatusFilter(displayStatusFilter === 'delayed' ? 'all' : 'delayed')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
                  <div className="text-sm text-muted-foreground">ล่าช้า</div>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDisplayStatusFilter(displayStatusFilter === 'completed' ? 'all' : 'completed')}
              >
                <CardContent className="p-4">
                  <div className="text-2xl font-bold" style={{ color: '#00CE81' }}>{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">เสร็จสมบูรณ์</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Old Task Overview Cards - Keep for backward compatibility but hide */}
      <div className="hidden grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDisplayStatusFilter("all")}
        >
          <CardHeader className="pb-3">
            <CardDescription>งานทั้งหมด</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-500 h-2 rounded-full transition-all" style={{ width: "100%" }} />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDisplayStatusFilter("not_started")}
        >
          <CardHeader className="pb-3">
            <CardDescription>ยังไม่เริ่ม</CardDescription>
            <CardTitle className="text-3xl">{stats.not_started}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.not_started / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDisplayStatusFilter("in_progress")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <span className="text-[#00366D]">📈</span> กำลังทำ
            </CardDescription>
            <CardTitle className="text-3xl text-[#00366D]">{stats.in_progress}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#00366D] h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.in_progress / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDisplayStatusFilter("delayed")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <span className="text-red-600">⚠️</span> ล่าช้า
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.delayed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDisplayStatusFilter("completed")}
        >
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <span className="text-[#00CE81]">✅</span> เสร็จสมบูรณ์
            </CardDescription>
            <CardTitle className="text-3xl text-[#00CE81]">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#00CE81] h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Filter Button */}
      {displayStatusFilter !== "all" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setDisplayStatusFilter("all")}>
            แสดงทั้งหมด
          </Button>
        </div>
      )}

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task: any) => (
          <div key={task.id} className="relative">
            {canEdit && (
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white border-2"
                />
              </div>
            )}
            <SwipeableCard
              leftActions={[
                {
                  icon: <CheckCircle className="w-5 h-5" />,
                  label: 'เสร็จสิ้น',
                  color: 'bg-green-500',
                  onAction: () => handleCompleteTask(task.id),
                },
              ]}
              rightActions={[
                {
                  icon: <Edit className="w-5 h-5" />,
                  label: 'แก้ไข',
                  color: 'bg-blue-500',
                  onAction: () => handleEditTask(task.id),
                },
                {
                  icon: <Trash2 className="w-5 h-5" />,
                  label: 'ลบ',
                  color: 'bg-red-500',
                  onAction: () => handleDeleteTask(task.id),
                },
              ]}
            >
              <Link href={`/tasks/${task.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className={`text-lg ${canEdit ? 'ml-8' : ''}`}>{task.name}</CardTitle>
                      <StatusBadge 
                        status={task.status}
                        label={(task as any).displayStatusLabel || getStatusLabel(task.status)}
                      />
                    </div>
                    {task.description && (
                      <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {/* Project Name - Compact */}
                    {task.projectName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{task.projectName}</span>
                      </div>
                    )}

                    {/* Progress Bar - Larger for visibility */}
                    <ProgressBar 
                      value={task.progress}
                      showLabel={true}
                      size="sm"
                    />

                    {/* Due Date - Show only end date for simplicity */}
                    {task.endDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>ครบกำหนด: {parseDate(task.endDate).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}

                    {/* Assignee - Compact */}
                    {task.assigneeName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{task.assigneeName}</span>
                      </div>
                    )}

                    {/* Priority and Category Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.priority && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          <Flag className="w-3 h-3" />
                          <span>
                            {task.priority === 'urgent' ? 'เร่งด่วน' :
                             task.priority === 'high' ? 'สูง' :
                             task.priority === 'medium' ? 'ปานกลาง' :
                             'ต่ำ'}
                          </span>
                        </div>
                      )}
                      {task.category && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          <Tag className="w-3 h-3" />
                          <span>{task.category}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </SwipeableCard>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <EmptyState
          icon={ListTodo}
          title={tasks.length === 0 ? "ยังไม่มีงาน" : "ไม่พบงานที่ตรงกับเงื่อนไข"}
          description={
            tasks.length === 0
              ? "เริ่มต้นด้วยการสร้างงานใหม่ในโครงการ หรือไปที่หน้าโครงการเพื่อเพิ่มงาน"
              : "ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรอง หรือล้างค่าการค้นหา"
          }
          action={
            tasks.length === 0
              ? {
                  label: "สร้างงานแรก",
                  onClick: () => setLocation("/tasks/new"),
                }
              : undefined
          }
        />
      )}

      {/* Pagination */}
      {!hasActiveFilter && pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-600">
            แสดง {tasks.length} จาก {pagination.totalItems} งาน
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

      {/* Bulk Update Status Dialog */}
      <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>อัปเดตสถานะงาน</DialogTitle>
            <DialogDescription>
              เลือกสถานะใหม่สำหรับงานที่เลือก ({selectedTasks.size} งาน)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">ยังไม่เริ่ม</SelectItem>
                <SelectItem value="ready_to_start">พร้อมเริ่ม</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="pending_pre_inspection">รอตรวจก่อน</SelectItem>
                <SelectItem value="pending_final_inspection">รอตรวจสุดท้าย</SelectItem>
                <SelectItem value="rectification_needed">ต้องแก้ไข</SelectItem>
                <SelectItem value="completed">เสร็จสิ้น</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkStatusDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkUpdateStatus}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
              เลือกผู้รับผิดชอบสำหรับงานที่เลือก ({selectedTasks.size} งาน)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <Button variant="outline" onClick={() => setShowBulkAssignDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              มอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">ลบงาน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบงานที่เลือก ({selectedTasks.size} งาน)?
              <br />
              <span className="text-red-600 font-semibold">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              ลบงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button - Mobile */}
      {canCreate && (
        <FloatingActionButton
          onClick={() => setShowNewTaskDialog(true)}
          icon={Plus}
          label="เพิ่มงาน"
        />
      )}

      {/* New Task Dialog */}
      {showNewTaskDialog && (
        <NewTaskDialog projectId={undefined} />
      )}
      </div>
    </PullToRefresh>
  );
}
