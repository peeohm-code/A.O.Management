import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Calendar, User, Building2, CheckSquare, X, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link } from "wouter";
import FloatingActionButton from "@/components/FloatingActionButton";
import NewTaskDialog from "@/components/NewTaskDialog";
import { SwipeableCard } from "@/components/SwipeableCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { parseDate } from "@/lib/dateUtils";
import { useLocation } from "wouter";

export default function Tasks() {
  const { canCreate, canEdit } = usePermissions('tasks');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [displayStatusFilter, setDisplayStatusFilter] = useState<string>("all");
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkAssignee, setBulkAssignee] = useState<string>("");
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const myTasksQuery = trpc.task.myTasks.useQuery();
  const utils = trpc.useUtils();
  
  const handleRefresh = async () => {
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

  const tasks = myTasksQuery.data || [];
  
  // Extract unique assignees from tasks
  const members = Array.from(
    new Map(
      tasks
        .filter((t: any) => t.assigneeId && t.assigneeName)
        .map((t: any) => [t.assigneeId, { userId: t.assigneeId, userName: t.assigneeName }])
    ).values()
  );

  let filteredTasks = tasks.filter((t) => {
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || t.status === filters.status;
    const matchesDisplayStatus = displayStatusFilter === "all" || (t as any).displayStatus === displayStatusFilter;
    return matchesSearch && matchesStatus && matchesDisplayStatus;
  });

  const stats = {
    total: tasks.length,
    not_started: tasks.filter((t) => (t as any).displayStatus === "not_started").length,
    in_progress: tasks.filter((t) => (t as any).displayStatus === "in_progress").length,
    delayed: tasks.filter((t) => (t as any).displayStatus === "delayed").length,
    completed: tasks.filter((t) => (t as any).displayStatus === "completed").length,
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
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)));
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

  if (myTasksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
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

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <SearchBar
          placeholder="ค้นหางาน..."
          onSearch={setSearchTerm}
          className="w-full md:max-w-md"
        />
        <div className="flex-1">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            statusOptions={[
              { value: "ready_to_start", label: "พร้อมเริ่ม" },
              { value: "in_progress", label: "กำลังดำเนินการ" },
              { value: "pending_pre_inspection", label: "รอตรวจก่อน" },
              { value: "pending_final_inspection", label: "รอตรวจสุดท้าย" },
              { value: "rectification_needed", label: "ต้องแก้ไข" },
              { value: "completed", label: "เสร็จสิ้น" },
            ]}
            showAssignee={false}
            showCategory={false}
            showPriority={false}
          />
        </div>
        {canEdit && filteredTasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllTasks}
            className="whitespace-nowrap"
          >
            {selectedTasks.size === filteredTasks.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
          </Button>
        )}
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
                    label={(entry) => entry.value > 0 ? `${entry.name} ${((entry.value / stats.total) * 100).toFixed(0)}%` : ''}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'กำลังทำ', value: stats.in_progress, color: '#00366D' },
                      { name: 'ล่าช้า', value: stats.delayed, color: '#EF4444' },
                      { name: 'เสร็จสมบูรณ์', value: stats.completed, color: '#00CE81' },
                    ].map((entry, index) => (
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
                      <Badge className={`${(task as any).displayStatusColor || 'bg-gray-100 text-gray-800'}`}>
                        {(task as any).displayStatusLabel || getStatusLabel(task.status)}
                      </Badge>
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
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-sm font-bold">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-[#00366D] h-2.5 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

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
                  </CardContent>
                </Card>
              </Link>
            </SwipeableCard>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
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
