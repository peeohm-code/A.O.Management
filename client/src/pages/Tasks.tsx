import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Tasks() {
  const { canCreate } = usePermissions('tasks');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [displayStatusFilter, setDisplayStatusFilter] = useState<string>("all");

  const myTasksQuery = trpc.task.myTasks.useQuery();

  const tasks = myTasksQuery.data || [];

  let filteredTasks = tasks.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter by displayStatus if set
  if (displayStatusFilter !== "all") {
    filteredTasks = filteredTasks.filter((t) => (t as any).displayStatus === displayStatusFilter);
  }

  if (statusFilter !== "all") {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }

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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready_to_start">Ready to Start</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_pre_inspection">Pending Pre Inspection</SelectItem>
            <SelectItem value="pending_final_inspection">Pending Final Inspection</SelectItem>
            <SelectItem value="rectification_needed">Rectification Needed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
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
              <span className="text-blue-600">📈</span> กำลังทำ
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
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
              <span className="text-green-600">✅</span> เสร็จสมบูรณ์
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
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
                      className="bg-blue-500 h-2 rounded-full transition-all"
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
