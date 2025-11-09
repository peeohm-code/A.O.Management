import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, Building2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar, FilterOptions } from "@/components/FilterBar";
import { Link } from "wouter";

export default function Tasks() {
  const { canCreate } = usePermissions('tasks');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [displayStatusFilter, setDisplayStatusFilter] = useState<string>("all");

  const myTasksQuery = trpc.task.myTasks.useQuery();

  const tasks = myTasksQuery.data || [];

  let filteredTasks = tasks.filter((t) => {
    // Search filter
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter from FilterBar
    const matchesStatus = !filters.status || t.status === filters.status;
    
    // Display status filter from stats cards
    const matchesDisplayStatus = displayStatusFilter === "all" || (t as any).displayStatus === displayStatusFilter;
    
    return matchesSearch && matchesStatus && matchesDisplayStatus;
  });

  // Calculate statistics based on displayStatus
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

  if (myTasksQuery.isLoading) {
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
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-gray-600 mt-1">View tasks from your projects</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <SearchBar
          placeholder="ค้นหางาน..."
          onSearch={setSearchTerm}
          className="max-w-md"
        />
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

      {/* Task Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setDisplayStatusFilter("all");
          }}
        >
          <CardHeader className="pb-3">
            <CardDescription>งานทั้งหมด</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setDisplayStatusFilter("not_started");
          }}
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
          onClick={() => {
            setDisplayStatusFilter("in_progress");
          }}
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
          onClick={() => {
            setDisplayStatusFilter("delayed");
          }}
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
          onClick={() => {
            setDisplayStatusFilter("completed");
          }}
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
          <Link key={task.id} href={`/tasks/${task.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <Badge className={`${(task as any).displayStatusColor || 'bg-gray-100 text-gray-800'}`}>
                    {(task as any).displayStatusLabel || getStatusLabel(task.status)}
                  </Badge>
                </div>
                {task.description && (
                  <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Project Name */}
                {task.projectName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{task.projectName}</span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#00366D] h-2 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates */}
                {task.startDate && task.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Assignee */}
                {task.assigneeName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{task.assigneeName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}
