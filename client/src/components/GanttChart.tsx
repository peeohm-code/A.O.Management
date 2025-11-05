import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";

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
}

interface GanttChartProps {
  tasks: GanttTask[];
}

interface TaskGroup {
  category: string;
  categoryLabel: string;
  tasks: any[];
  minStartIndex: number;
  maxEndIndex: number;
  avgProgress: number;
}

export default function GanttChart({ tasks }: GanttChartProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { groups: [], minDate: new Date(), maxDate: new Date(), dateRange: [] };

    const startDates = tasks.map((t) => new Date(t.startDate).getTime());
    const endDates = tasks.map((t) => new Date(t.endDate).getTime());

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    // Generate array of dates for header
    const dateRange = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group tasks by category
    const groupMap = new Map<string, GanttTask[]>();
    tasks.forEach((task) => {
      const category = task.category || "other";
      if (!groupMap.has(category)) {
        groupMap.set(category, []);
      }
      groupMap.get(category)!.push(task);
    });

    // Create groups with calculated data
    const groups: TaskGroup[] = Array.from(groupMap.entries()).map(([category, groupTasks]) => {
      const tasksWithIndices = groupTasks.map((task) => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const startIndex = Math.floor((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const endIndex = Math.floor((end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...task,
          startIndex: Math.max(0, startIndex),
          endIndex: Math.min(dateRange.length - 1, endIndex),
          duration: Math.max(1, endIndex - startIndex + 1),
        };
      });

      const minStartIndex = Math.min(...tasksWithIndices.map(t => t.startIndex));
      const maxEndIndex = Math.max(...tasksWithIndices.map(t => t.endIndex));
      const avgProgress = Math.round(tasksWithIndices.reduce((sum, t) => sum + t.progress, 0) / tasksWithIndices.length);

      return {
        category,
        categoryLabel: getCategoryLabel(category),
        tasks: tasksWithIndices,
        minStartIndex,
        maxEndIndex,
        avgProgress,
      };
    });

    // Sort groups by category order
    const categoryOrder = ["structure", "architecture", "mep", "finishing", "other"];
    groups.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return {
      groups,
      minDate,
      maxDate,
      dateRange,
    };
  }, [tasks]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      structure: "งานโครงสร้าง",
      architecture: "งานสถาปัตย์",
      mep: "งานระบบ",
      finishing: "งานตกแต่ง",
      other: "อื่นๆ",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      structure: "#8b5cf6", // purple
      architecture: "#f59e0b", // amber
      mep: "#10b981", // emerald
      finishing: "#3b82f6", // blue
      other: "#6b7280", // gray
    };
    return colors[category] || "#6b7280";
  };

  const toggleGroup = (category: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (!chartData.dateRange || chartData.groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">ไม่มีงานที่จะแสดง</p>
      </div>
    );
  }

  const cellWidth = Math.max(20, 500 / chartData.dateRange.length);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Project Timeline (Gantt Chart)</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-2 bg-gray-50 sticky left-0 z-10 w-64 min-w-64">
                ชื่องาน
              </th>
              <th className="text-left p-2 bg-gray-50 w-20">ความคืบหน้า</th>
              <th className="text-left p-2 bg-gray-50 w-24">สถานะ</th>
              <th className="p-2">
                <div className="flex gap-0">
                  {chartData.dateRange && chartData.dateRange.map((date, idx) => (
                    <div
                      key={idx}
                      className="text-center text-xs border-r border-gray-200"
                      style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                    >
                      {idx % 7 === 0 ? (
                        <div className="font-semibold">
                          {date.toLocaleDateString("th-TH", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-400">{date.getDate()}</div>
                      )}
                    </div>
                  ))}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {chartData.groups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.category);
              const groupColor = getCategoryColor(group.category);

              return (
                <>
                  {/* Group Header Row */}
                  <tr
                    key={`group-${group.category}`}
                    className="border-b border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    onClick={() => toggleGroup(group.category)}
                  >
                    <td className="p-2 sticky left-0 z-10 bg-gray-100 hover:bg-gray-200 w-64 min-w-64">
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: groupColor }}
                        ></div>
                        <span className="font-bold">{group.categoryLabel}</span>
                        <span className="text-xs text-gray-500">({group.tasks.length})</span>
                      </div>
                    </td>
                    <td className="p-2 bg-gray-100 hover:bg-gray-200">
                      <span className="font-semibold text-blue-600">{group.avgProgress}%</span>
                    </td>
                    <td className="p-2 bg-gray-100 hover:bg-gray-200">
                      {/* Empty for group header */}
                    </td>
                    <td className="p-2 bg-gray-100 hover:bg-gray-200">
                      <div className="flex gap-0 relative h-8">
                        {chartData.dateRange && chartData.dateRange.map((date, idx) => {
                          const isInRange = idx >= group.minStartIndex && idx <= group.maxEndIndex;
                          const isStart = idx === group.minStartIndex;
                          const isEnd = idx === group.maxEndIndex;

                          return (
                            <div
                              key={idx}
                              className="border-r border-gray-200 relative"
                              style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                            >
                              {isInRange && (
                                <div
                                  className={`absolute top-1 bottom-1 opacity-40 rounded ${
                                    isStart ? "rounded-l" : ""
                                  } ${isEnd ? "rounded-r" : ""}`}
                                  style={{
                                    left: isStart ? "2px" : "0",
                                    right: isEnd ? "2px" : "0",
                                    backgroundColor: groupColor,
                                  }}
                                ></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>

                  {/* Task Rows (only if not collapsed) */}
                  {!isCollapsed &&
                    group.tasks.map((task: any) => (
                      <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 pl-10 bg-white sticky left-0 z-10 w-64 min-w-64">
                          <p className="font-medium truncate">{task.name}</p>
                        </td>
                        <td className="p-2 bg-white">
                          <span className="font-semibold text-blue-600">{task.progress}%</span>
                        </td>
                        <td className="p-2 bg-white">
                          <Badge
                            className="text-white text-xs"
                            style={{ backgroundColor: task.displayStatusColor }}
                          >
                            {task.displayStatusLabel}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-0 relative h-8">
                            {chartData.dateRange && chartData.dateRange.map((date, idx) => {
                              const isInRange = idx >= task.startIndex && idx <= task.endIndex;
                              const isStart = idx === task.startIndex;
                              const isEnd = idx === task.endIndex;

                              return (
                                <div
                                  key={idx}
                                  className="border-r border-gray-200 relative"
                                  style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                                >
                                  {isInRange && (
                                    <div
                                      className={`absolute top-1 bottom-1 opacity-80 rounded flex items-center justify-center text-white text-xs font-bold ${
                                        isStart ? "rounded-l" : ""
                                      } ${isEnd ? "rounded-r" : ""}`}
                                      style={{
                                        left: isStart ? "2px" : "0",
                                        right: isEnd ? "2px" : "0",
                                        backgroundColor: task.displayStatusColor,
                                      }}
                                    >
                                      {isStart && task.duration <= 3 && task.progress}%
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">หมวดหมู่งาน</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
              <span className="text-sm text-gray-600">งานโครงสร้าง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }}></div>
              <span className="text-sm text-gray-600">งานสถาปัตย์</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
              <span className="text-sm text-gray-600">งานระบบ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
              <span className="text-sm text-gray-600">งานตกแต่ง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#6b7280" }}></div>
              <span className="text-sm text-gray-600">อื่นๆ</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">สถานะงาน</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#22c55e" }}></div>
              <span className="text-sm text-gray-600">เสร็จสมบูรณ์</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
              <span className="text-sm text-gray-600">กำลังทำ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
              <span className="text-sm text-gray-600">ล่าช้า</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#6b7280" }}></div>
              <span className="text-sm text-gray-600">ยังไม่เริ่ม</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
