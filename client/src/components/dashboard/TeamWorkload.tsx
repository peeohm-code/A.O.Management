import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamWorkloadProps {
  tasks: any[];
  users: any[];
  isLoading?: boolean;
}

/**
 * Team Workload Component
 * แสดงภาระงานของทีม และ Capacity Planning
 */
export function TeamWorkload({ tasks, users, isLoading }: TeamWorkloadProps) {
  const workloadData = useMemo(() => {
    // Group tasks by assignee
    const tasksByUser = tasks.reduce((acc, task) => {
      const userId = task.assigneeId;
      if (!userId) return acc;
      
      if (!acc[userId]) {
        acc[userId] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          tasks: [],
        };
      }
      
      acc[userId].total++;
      acc[userId].tasks.push(task);
      
      if (task.status === "completed") {
        acc[userId].completed++;
      } else if (task.status === "in_progress") {
        acc[userId].inProgress++;
      }
      
      // Check if overdue
      if (task.endDate && task.status !== "completed") {
        const endDate = new Date(task.endDate);
        if (endDate < new Date()) {
          acc[userId].overdue++;
        }
      }
      
      return acc;
    }, {} as Record<number, any>);

    // Combine with user data
    const workload = users.map(user => {
      const userTasks = tasksByUser[user.id] || {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
        tasks: [],
      };
      
      const completionRate = userTasks.total > 0 
        ? (userTasks.completed / userTasks.total) * 100 
        : 0;
      
      // Calculate workload level (0-100)
      // Based on: number of tasks, in-progress tasks, and overdue tasks
      const workloadLevel = Math.min(
        100,
        (userTasks.total * 10) + (userTasks.inProgress * 5) + (userTasks.overdue * 15)
      );
      
      return {
        user,
        ...userTasks,
        completionRate,
        workloadLevel,
      };
    });

    // Sort by workload level (highest first)
    workload.sort((a, b) => b.workloadLevel - a.workloadLevel);

    return workload;
  }, [tasks, users]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWorkloadColor = (level: number) => {
    if (level >= 75) return "bg-red-500";
    if (level >= 50) return "bg-orange-500";
    if (level >= 25) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getWorkloadLabel = (level: number) => {
    if (level >= 75) return "สูงมาก";
    if (level >= 50) return "ปานกลาง-สูง";
    if (level >= 25) return "ปานกลาง";
    return "ต่ำ";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Workload
        </CardTitle>
        <CardDescription>ภาระงานและประสิทธิภาพของทีม</CardDescription>
      </CardHeader>
      <CardContent>
        {workloadData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>ไม่มีข้อมูลสมาชิกทีม</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workloadData.map(({ user, total, completed, inProgress, overdue, completionRate, workloadLevel }) => (
              <div key={user.id} className="p-4 rounded-lg border hover:bg-accent transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#00366D] text-white">
                      {getInitials(user.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{user.name || "Unknown User"}</p>
                      <Badge variant="outline" className="text-xs">
                        {user.role === "project_manager" ? "PM" : 
                         user.role === "qc_inspector" ? "QC" : "Worker"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {total} งาน
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>งานทั้งหมด</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {completed} เสร็จ
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>งานที่เสร็จแล้ว</TooltipContent>
                      </Tooltip>
                      {overdue > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="w-3 h-3" />
                              {overdue} เกินกำหนด
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>งานเกินกำหนด</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Workload</p>
                    <p className={`text-lg font-bold ${
                      workloadLevel >= 75 ? "text-red-600" :
                      workloadLevel >= 50 ? "text-orange-600" :
                      workloadLevel >= 25 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {getWorkloadLabel(workloadLevel)}
                    </p>
                  </div>
                </div>

                {/* Workload Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{workloadLevel.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getWorkloadColor(workloadLevel)}`}
                      style={{ width: `${Math.min(100, workloadLevel)}%` }}
                    />
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Task Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-[#00366D]">{total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">In Progress</p>
                    <p className="text-lg font-bold text-[#00CE81]">{inProgress}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-lg font-bold text-green-600">{completed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Summary */}
        {workloadData.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Team Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xs text-muted-foreground">Team Members</p>
                <p className="text-xl font-bold text-blue-600">{workloadData.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p className="text-xs text-muted-foreground">Avg Completion</p>
                <p className="text-xl font-bold text-green-600">
                  {(workloadData.reduce((sum, w) => sum + w.completionRate, 0) / workloadData.length).toFixed(0)}%
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xs text-muted-foreground">Avg Workload</p>
                <p className="text-xl font-bold text-orange-600">
                  {(workloadData.reduce((sum, w) => sum + w.workloadLevel, 0) / workloadData.length).toFixed(0)}%
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <p className="text-xs text-muted-foreground">Total Overdue</p>
                <p className="text-xl font-bold text-red-600">
                  {workloadData.reduce((sum, w) => sum + w.overdue, 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
