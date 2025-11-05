import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  projectId?: number;
}

interface TaskGroup {
  category: string;
  categoryLabel: string;
  tasks: any[];
  minStartIndex: number;
  maxEndIndex: number;
  avgProgress: number;
}

// Sortable Group Row Component
function SortableGroupRow({
  group,
  groupColor,
  isCollapsed,
  onToggle,
  dateRange,
  minDate,
  children,
}: {
  group: TaskGroup;
  groupColor: string;
  isCollapsed: boolean;
  onToggle: () => void;
  dateRange: Date[];
  minDate: Date;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.category });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={`border-b border-gray-300 cursor-pointer hover:bg-gray-50 ${
          isDragging ? "shadow-lg z-50" : ""
        }`}
      >
        <td className="p-2 bg-gray-100 hover:bg-gray-200">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={onToggle} className="flex items-center gap-2">
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="font-bold">{group.categoryLabel}</span>
              <span className="text-xs text-gray-500">({group.tasks.length})</span>
            </button>
          </div>
        </td>
        <td className="p-2 bg-gray-100 hover:bg-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${group.avgProgress}%`,
                  backgroundColor: groupColor,
                }}
              ></div>
            </div>
            <span className="font-semibold text-sm whitespace-nowrap" style={{ color: groupColor }}>
              {group.avgProgress}%
            </span>
          </div>
        </td>
        <td className="p-2 bg-gray-100 hover:bg-gray-200">
          {/* Empty for group header */}
        </td>
        <td className="p-2 bg-gray-100 hover:bg-gray-200">
          {/* Empty for group header */}
        </td>
        <td className="p-2 bg-gray-100 hover:bg-gray-200" colSpan={dateRange.length}>
          {/* Group summary timeline bar */}
          <div className="relative h-6">
            <div
              className="absolute h-full rounded opacity-30"
              style={{
                left: `${(group.minStartIndex / dateRange.length) * 100}%`,
                width: `${((group.maxEndIndex - group.minStartIndex + 1) / dateRange.length) * 100}%`,
                backgroundColor: groupColor,
              }}
            ></div>
          </div>
        </td>
      </tr>
      {!isCollapsed && children}
    </>
  );
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function GanttChart({ tasks, projectId }: GanttChartProps) {
  // Fetch category colors from database
  const { data: categoryColors = [] } = trpc.categoryColor.getByProject.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );

  // Create color map from fetched data
  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryColors.forEach((cc) => {
      map[cc.category] = cc.color;
    });
    return map;
  }, [categoryColors]);

  // Get category color with fallback
  const getCategoryColorDynamic = (category: string): string => {
    return categoryColorMap[category] || getCategoryColor(category);
  };
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
  const taskMetrics = criticalPathQuery.data?.taskMetrics || new Map();
  
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { groups: [], minDate: new Date(), maxDate: new Date(), dateRange: [] };

    const startDates = tasks.map((t) => new Date(t.startDate).getTime());
    const endDates = tasks.map((t) => new Date(t.endDate).getTime());

    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));

    // Generate array of dates for header based on view mode
    const dateRange = [];
    const currentDate = new Date(minDate);
    
    if (viewMode === 'daily') {
      while (currentDate <= maxDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (viewMode === 'weekly') {
      // Start from beginning of week
      currentDate.setDate(currentDate.getDate() - currentDate.getDay());
      while (currentDate <= maxDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (viewMode === 'monthly') {
      // Start from beginning of month
      currentDate.setDate(1);
      while (currentDate <= maxDate) {
        dateRange.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
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

    return {
      groups,
      minDate,
      maxDate,
      dateRange,
    };
  }, [tasks, viewMode]);

  // Initialize group order from localStorage or default order
  useEffect(() => {
    const savedOrder = localStorage.getItem("gantt-group-order");
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setGroupOrder(parsed);
      } catch (e) {
        // If parsing fails, use default order
        const defaultOrder = chartData.groups.map(g => g.category);
        setGroupOrder(defaultOrder);
      }
    } else {
      const defaultOrder = chartData.groups.map(g => g.category);
      setGroupOrder(defaultOrder);
    }
  }, [chartData.groups]);

  // Sort groups by custom order
  const sortedGroups = useMemo(() => {
    if (groupOrder.length === 0) return chartData.groups;
    
    const orderedGroups = [...chartData.groups].sort((a, b) => {
      const aIndex = groupOrder.indexOf(a.category);
      const bIndex = groupOrder.indexOf(b.category);
      
      // If category not in order, put at end
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return orderedGroups;
  }, [chartData.groups, groupOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groupOrder.indexOf(active.id as string);
      const newIndex = groupOrder.indexOf(over.id as string);

      const newOrder = arrayMove(groupOrder, oldIndex, newIndex);
      setGroupOrder(newOrder);
      
      // Save to localStorage
      localStorage.setItem("gantt-group-order", JSON.stringify(newOrder));
    }
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

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        ไม่มีข้อมูลงานสำหรับแสดงใน Gantt Chart
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">มุมมอง:</span>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 text-sm font-medium border ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } rounded-l-lg`}
          >
            รายวัน
          </button>
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 text-sm font-medium border-t border-b ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            รายสัปดาห์
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 text-sm font-medium border ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } rounded-r-lg`}
          >
            รายเดือน
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 border-b-2 border-gray-400">
              <th className="p-2 text-left sticky left-0 bg-gray-200 z-10 min-w-[200px]">งาน</th>
              <th className="p-2 text-left min-w-[120px]">ความคืบหน้า</th>
              <th className="p-2 text-left min-w-[100px]">วันเริ่ม</th>
              <th className="p-2 text-left min-w-[100px]">วันสิ้นสุด</th>
              {chartData.dateRange.map((date, i) => (
                <th key={i} className="p-1 text-center text-xs min-w-[30px]">
                  {date.getDate()}
                  <br />
                  <span className="text-[10px] text-gray-500">
                    {date.toLocaleDateString("th-TH", { month: "short" })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={groupOrder}
              strategy={verticalListSortingStrategy}
            >
              {sortedGroups.map((group) => {
                const groupColor = getCategoryColorDynamic(group.category);
                const isCollapsed = collapsedGroups.has(group.category);

                return (
                  <SortableGroupRow
                    key={group.category}
                    group={group}
                    groupColor={groupColor}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleGroup(group.category)}
                    dateRange={chartData.dateRange}
                    minDate={chartData.minDate}
                  >
                    {group.tasks.map((task: any) => (
                      <tr key={task.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 sticky left-0 bg-white">
                          <div className="pl-8">
                            <div className="font-medium">{task.name}</div>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: task.displayStatusColor,
                                color: task.displayStatusColor,
                              }}
                            >
                              {task.displayStatusLabel}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">{task.progress}%</td>
                        <td className="p-2">
                          {new Date(task.startDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="p-2">
                          {new Date(task.endDate).toLocaleDateString("th-TH")}
                        </td>
                        <td className="p-0" colSpan={chartData.dateRange.length}>
                          <div className="relative h-8">
                            <div
                              className={`absolute top-1 h-6 rounded overflow-hidden ${
                                criticalPath.includes(task.id) ? 'ring-2 ring-red-500 ring-offset-1' : ''
                              }`}
                              style={{
                                left: `${(task.startIndex / chartData.dateRange.length) * 100}%`,
                                width: `${(task.duration / chartData.dateRange.length) * 100}%`,
                                backgroundColor: criticalPath.includes(task.id) ? '#dc2626' : task.displayStatusColor,
                              }}
                            >
                              {/* Progress bar overlay */}
                              <div
                                className="absolute inset-0 bg-white/30"
                                style={{
                                  width: `${100 - task.progress}%`,
                                  right: 0,
                                  left: 'auto',
                                }}
                              ></div>
                              {/* Progress text */}
                              <div className="relative flex items-center justify-center h-full text-xs text-white font-semibold">
                                {task.progress}%
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </SortableGroupRow>
                );
              })}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
      </div>

      {/* Dependencies Summary */}
      {dependencies.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ความสัมพันธ์ระหว่างงาน (Dependencies)
          </h4>
          <div className="space-y-2">
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
                  className="flex items-center gap-2 text-sm p-2 bg-white rounded border"
                >
                  <span className="font-medium text-blue-700">{fromTask?.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {typeLabel}
                  </Badge>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-700">{toTask?.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">หมวดหมู่งาน</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { category: "preparation", label: "งานเตรียมงาน" },
                { category: "structure", label: "งานโครงสร้าง" },
                { category: "architecture", label: "งานสถาปัตย์" },
                { category: "mep", label: "งานระบบ" },
                { category: "other", label: "งานอื่นๆ" },
              ].map(({ category, label }) => (
                <div key={category} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: getCategoryColorDynamic(category) }}
                  ></div>
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2 text-sm">สถานะงาน</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { status: "completed", label: "เสร็จสมบูรณ์", color: "#10b981" },
                { status: "in_progress", label: "กำลังทำ", color: "#3b82f6" },
                { status: "delayed", label: "ล่าช้า", color: "#ef4444" },
                { status: "not_started", label: "ยังไม่เริ่ม", color: "#6b7280" },
              ].map(({ status, label, color }) => (
                <div key={status} className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-xs">{label}</span>
                </div>
              ))}
              {/* Critical Path indicator */}
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-600 ring-2 ring-red-500 ring-offset-1"></div>
                <span className="text-xs font-semibold">Critical Path</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <GripVertical className="w-3 h-3 inline mr-1" />
          ลากและวางเพื่อจัดเรียงหมวดหมู่ใหม่
        </div>
      </div>
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

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    preparation: "#10B981", // green
    structure: "#3B82F6", // blue
    architecture: "#8B5CF6", // purple
    mep: "#F59E0B", // amber
    other: "#6B7280", // gray
  };
  return colors[category] || "#6b7280";
}
