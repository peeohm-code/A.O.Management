import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Calendar, User, Plus } from "lucide-react";
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
    filteredTasks = filteredTasks.filter((t) => t.displayStatus === displayStatusFilter);
  }

  if (statusFilter !== "all") {
    filteredTasks = filteredTasks.filter((t) => t.status === statusFilter);
  }

  // Calculate statistics based on displayStatus
  const stats = {
    total: tasks.length,
    not_started: tasks.filter((t) => t.displayStatus === "not_started").length,
    in_progress: tasks.filter((t) => t.displayStatus === "in_progress").length,
    delayed: tasks.filter((t) => t.displayStatus === "delayed").length,
    completed: tasks.filter((t) => t.displayStatus === "completed").length,
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
          <p className="text-gray-600 mt-1">Manage and track your assigned tasks</p>
        </div>
        <Link href="/tasks/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </Link>
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
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="pending_pre_inspection">Pending Pre-Inspection</SelectItem>
            <SelectItem value="ready_to_start">Ready to Start</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_final_inspection">Pending Final Inspection</SelectItem>
            <SelectItem value="rectification_needed">Rectification Needed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Task Overview</span>
            {displayStatusFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisplayStatusFilter("all")}
              >
                Clear Filter
              </Button>
            )}
          </CardTitle>
          <CardDescription>สถิติงานทั้งหมดแบ่งตามสถานะ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setDisplayStatusFilter("all")}
            >
              <div className="text-sm text-gray-600 mb-1">งานทั้งหมด</div>
              <div className="text-3xl font-bold mb-2">{stats.total}</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Not Started */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setDisplayStatusFilter("not_started")}
            >
              <div className="text-sm text-gray-600 mb-1">ยังไม่เริ่ม</div>
              <div className="text-3xl font-bold text-gray-600 mb-2">{stats.not_started}</div>
              <div className="text-xs text-gray-500 mb-1">
                {stats.total > 0 ? Math.round((stats.not_started / stats.total) * 100) : 0}%
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{
                    width: stats.total > 0 ? `${(stats.not_started / stats.total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* In Progress */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setDisplayStatusFilter("in_progress")}
            >
              <div className="text-sm text-gray-600 mb-1">กำลังทำ</div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.in_progress}</div>
              <div className="text-xs text-gray-500 mb-1">
                {stats.total > 0 ? Math.round((stats.in_progress / stats.total) * 100) : 0}%
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: stats.total > 0 ? `${(stats.in_progress / stats.total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Delayed */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setDisplayStatusFilter("delayed")}
            >
              <div className="text-sm text-gray-600 mb-1">ล่าช้า</div>
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.delayed}</div>
              <div className="text-xs text-gray-500 mb-1">
                {stats.total > 0 ? Math.round((stats.delayed / stats.total) * 100) : 0}%
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: stats.total > 0 ? `${(stats.delayed / stats.total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Completed */}
            <div
              className="p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setDisplayStatusFilter("completed")}
            >
              <div className="text-sm text-gray-600 mb-1">เสร็จสมบูรณ์</div>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.completed}</div>
              <div className="text-xs text-gray-500 mb-1">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                {tasks.length === 0 ? "No tasks assigned yet" : "No tasks match your filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.name}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.projectId && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Building2 className="w-3 h-3" />
                          <span>Project ID: {task.projectId}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        {task.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(task.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.endDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(task.endDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge
                          style={{
                            backgroundColor: task.displayStatusColor,
                            color: "white",
                          }}
                        >
                          {task.displayStatusLabel}
                        </Badge>
                        <div className="mt-2 text-xs text-gray-600">
                          Progress: {task.progress}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
