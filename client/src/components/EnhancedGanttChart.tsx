import React, { useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";
import "@/styles/frappe-gantt.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Calendar, Milestone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GanttTask {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  displayStatus: string;
  displayStatusLabel: string;
  displayStatusColor: string;
  category?: string | null;
  isMilestone?: boolean;
}

interface EnhancedGanttChartProps {
  tasks: GanttTask[];
  projectId?: number;
  onTaskUpdate?: (taskId: number, startDate: Date, endDate: Date) => void;
}

type ViewMode = "Quarter Day" | "Half Day" | "Day" | "Week" | "Month";

export default function EnhancedGanttChart({
  tasks,
  projectId,
  onTaskUpdate,
}: EnhancedGanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("Day");
  const [showMilestones, setShowMilestones] = useState(true);

  // Fetch dependencies if projectId is provided
  const dependenciesQuery = trpc.task.getProjectDependencies.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const dependencies = dependenciesQuery.data || [];

  // Fetch critical path
  const criticalPathQuery = trpc.task.getCriticalPath.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );
  const criticalPath = criticalPathQuery.data?.criticalPath || [];

  // Transform tasks to Frappe Gantt format
  const transformTasks = () => {
    if (!tasks || tasks.length === 0) return [];

    return tasks
      .filter((task) => !task.isMilestone || showMilestones)
      .map((task) => {
        // Find dependencies for this task
        const taskDeps = dependencies
          .filter((dep) => dep.taskId === task.id)
          .map((dep) => String(dep.dependsOnTaskId));

        // Check if task is on critical path
        const isCritical = criticalPath.includes(task.id);

        return {
          id: String(task.id),
          name: task.name,
          start: new Date(task.startDate).toISOString().split("T")[0],
          end: new Date(task.endDate).toISOString().split("T")[0],
          progress: task.progress,
          dependencies: taskDeps.join(", "),
          custom_class: isCritical ? "critical-path" : task.category || "default",
        };
      });
  };

  // Initialize Gantt chart
  useEffect(() => {
    if (!ganttRef.current || !tasks || tasks.length === 0) return;

    try {
      const ganttTasks = transformTasks();

      if (ganttTasks.length === 0) {
        return;
      }

      // Clear previous instance
      if (ganttInstance.current) {
        ganttRef.current.innerHTML = "";
      }

      // Create new Gantt instance
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: viewMode,
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: "YYYY-MM-DD",
        language: "th",
        custom_popup_html: function (task: any) {
          const originalTask = tasks.find((t) => String(t.id) === task.id);
          if (!originalTask) return "";

          return `
            <div class="gantt-popup">
              <div class="gantt-popup-title">${task.name}</div>
              <div class="gantt-popup-content">
                <p><strong>สถานะ:</strong> ${originalTask.displayStatusLabel}</p>
                <p><strong>ความคืบหน้า:</strong> ${task.progress}%</p>
                <p><strong>เริ่มต้น:</strong> ${new Date(task._start).toLocaleDateString("th-TH")}</p>
                <p><strong>สิ้นสุด:</strong> ${new Date(task._end).toLocaleDateString("th-TH")}</p>
                ${originalTask.category ? `<p><strong>หมวดหมู่:</strong> ${getCategoryLabel(originalTask.category)}</p>` : ""}
                ${criticalPath.includes(originalTask.id) ? '<p class="text-red-600 font-bold">⚠️ Critical Path</p>' : ""}
              </div>
            </div>
          `;
        },
        on_click: function (task: any) {
          console.log("Task clicked:", task);
        },
        on_date_change: function (task: any, start: Date, end: Date) {
          if (onTaskUpdate) {
            onTaskUpdate(parseInt(task.id), start, end);
            toast.success("อัปเดตวันที่งานสำเร็จ");
          }
        },
        on_progress_change: function (task: any, progress: number) {
          console.log("Progress changed:", task, progress);
        },
        on_view_change: function (mode: any) {
          console.log("View mode changed:", mode);
        },
      } as any);
    } catch (error) {
      console.error("Error initializing Gantt chart:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลด Gantt Chart");
    }

    return () => {
      if (ganttRef.current) {
        ganttRef.current.innerHTML = "";
      }
    };
  }, [tasks, viewMode, dependencies, criticalPath, showMilestones, onTaskUpdate]);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(mode);
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    const modes: ViewMode[] = ["Month", "Week", "Day", "Half Day", "Quarter Day"];
    const currentIndex = modes.indexOf(viewMode);
    if (currentIndex < modes.length - 1) {
      handleViewModeChange(modes[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const modes: ViewMode[] = ["Month", "Week", "Day", "Half Day", "Quarter Day"];
    const currentIndex = modes.indexOf(viewMode);
    if (currentIndex > 0) {
      handleViewModeChange(modes[currentIndex - 1]);
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>ไม่มีข้อมูลงานสำหรับแสดงใน Gantt Chart</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">มุมมอง:</span>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              {(["Month", "Week", "Day"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleViewModeChange(mode)}
                  className={`px-4 py-2 text-sm font-medium border ${
                    viewMode === mode
                      ? "bg-blue-600 text-white border-blue-600 z-10"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } ${mode === "Month" ? "rounded-l-lg" : ""} ${
                    mode === "Day" ? "rounded-r-lg" : ""
                  }`}
                >
                  {mode === "Month" ? "เดือน" : mode === "Week" ? "สัปดาห์" : "วัน"}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={viewMode === "Month"}
            >
              <ZoomOut className="w-4 h-4 mr-1" />
              ซูมออก
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={viewMode === "Quarter Day"}
            >
              <ZoomIn className="w-4 h-4 mr-1" />
              ซูมเข้า
            </Button>
          </div>

          {/* Milestone Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showMilestones ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMilestones(!showMilestones)}
            >
              <Milestone className="w-4 h-4 mr-1" />
              {showMilestones ? "ซ่อน Milestones" : "แสดง Milestones"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Gantt Chart Container */}
      <Card className="p-4">
        <div
          ref={ganttRef}
          className="gantt-container overflow-x-auto"
          style={{ minHeight: "400px" }}
        />
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">คำอธิบาย</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categories */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">หมวดหมู่งาน</h5>
              <div className="flex flex-wrap gap-2">
                {[
                  { category: "preparation", label: "งานเตรียมงาน", color: "#10B981" },
                  { category: "structure", label: "งานโครงสร้าง", color: "#3B82F6" },
                  { category: "architecture", label: "งานสถาปัตย์", color: "#8B5CF6" },
                  { category: "mep", label: "งานระบบ", color: "#F59E0B" },
                  { category: "other", label: "งานอื่นๆ", color: "#6B7280" },
                ].map(({ category, label, color }) => (
                  <div key={category} className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Markers */}
            <div>
              <h5 className="text-xs font-medium text-gray-600 mb-2">เครื่องหมายพิเศษ</h5>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-600 ring-2 ring-red-500" />
                  <span className="text-xs font-semibold">Critical Path</span>
                </div>
                <div className="flex items-center gap-1">
                  <Milestone className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs">Milestone</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-xs">Dependencies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
            <p className="font-medium mb-1">💡 เคล็ดลับการใช้งาน:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ลากแถบงานเพื่อเปลี่ยนวันที่เริ่มต้นและสิ้นสุด</li>
              <li>ลากขอบแถบงานเพื่อปรับระยะเวลา</li>
              <li>คลิกที่งานเพื่อดูรายละเอียด</li>
              <li>เส้นลูกศรแสดงความสัมพันธ์ระหว่างงาน (Dependencies)</li>
              <li>งานสีแดงคือ Critical Path ที่ส่งผลต่อระยะเวลาโครงการโดยตรง</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Dependencies Summary */}
      {dependencies.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ความสัมพันธ์ระหว่างงาน ({dependencies.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {dependencies.map((dep) => {
              const fromTask = tasks.find((t) => t.id === dep.dependsOnTaskId);
              const toTask = tasks.find((t) => t.id === dep.taskId);
              const typeLabel =
                dep.type === "finish_to_start"
                  ? "เสร็จ → เริ่ม"
                  : dep.type === "start_to_start"
                  ? "เริ่ม → เริ่ม"
                  : "เสร็จ → เสร็จ";
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-2 text-sm p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <span className="font-medium text-blue-700 truncate flex-1">
                    {fromTask?.name}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {typeLabel}
                  </Badge>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-700 truncate flex-1">
                    {toTask?.name}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Critical Path Summary */}
      {criticalPath.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Critical Path ({criticalPath.length} งาน)
          </h4>
          <p className="text-xs text-red-700 mb-2">
            งานเหล่านี้มีผลต่อระยะเวลาโครงการโดยตรง หากงานใดงานหนึ่งล่าช้า โครงการทั้งหมดจะล่าช้าตาม
          </p>
          <div className="flex flex-wrap gap-2">
            {criticalPath.map((taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              return task ? (
                <Badge key={taskId} variant="destructive" className="text-xs">
                  {task.name}
                </Badge>
              ) : null;
            })}
          </div>
        </Card>
      )}

      {/* Custom Styles */}
      <style>{`
        .gantt-container {
          font-family: inherit;
        }
        
        .gantt-popup {
          background: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          min-width: 200px;
        }
        
        .gantt-popup-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .gantt-popup-content {
          font-size: 12px;
          color: #4b5563;
        }
        
        .gantt-popup-content p {
          margin: 4px 0;
        }
        
        /* Category colors */
        .bar-wrapper.preparation .bar {
          fill: #10B981 !important;
        }
        
        .bar-wrapper.structure .bar {
          fill: #3B82F6 !important;
        }
        
        .bar-wrapper.architecture .bar {
          fill: #8B5CF6 !important;
        }
        
        .bar-wrapper.mep .bar {
          fill: #F59E0B !important;
        }
        
        .bar-wrapper.other .bar {
          fill: #6B7280 !important;
        }
        
        /* Critical path styling */
        .bar-wrapper.critical-path .bar {
          fill: #dc2626 !important;
          stroke: #991b1b !important;
          stroke-width: 2 !important;
        }
        
        .bar-wrapper.critical-path .bar-progress {
          fill: #b91c1c !important;
        }
        
        /* Dependency arrow styling */
        .arrow {
          stroke: #6b7280 !important;
          stroke-width: 1.5 !important;
        }
        
        .bar-wrapper.critical-path ~ .arrow {
          stroke: #dc2626 !important;
          stroke-width: 2 !important;
        }
      `}</style>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    preparation: "งานเตรียมงาน",
    structure: "งานโครงสร้าง",
    architecture: "งานสถาปัตย์",
    mep: "งานระบบ",
    other: "งานอื่นๆ",
  };
  return categoryLabels[category] || category;
}
