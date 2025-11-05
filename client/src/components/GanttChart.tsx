import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface GanttTask {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  displayStatus: string;
  displayStatusLabel: string;
  displayStatusColor: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
}

export default function GanttChart({ tasks }: GanttChartProps) {
  const chartData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { tasks: [], minDate: new Date(), maxDate: new Date() };

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

    return {
      tasks: tasks.map((task) => {
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
      }),
      minDate,
      maxDate,
      dateRange,
    };
  }, [tasks]);

  const getStatusBgClass = (color: string) => {
    // Convert hex color to Tailwind-like class
    // This is a simple mapping, you might need to adjust based on actual colors
    return color;
  };

  if (!chartData.dateRange || chartData.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No tasks to display</p>
      </div>
    );
  }

  const weekCount = Math.ceil(chartData.dateRange.length / 7);
  const cellWidth = Math.max(20, 500 / chartData.dateRange.length);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Project Timeline (Gantt Chart)</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-2 bg-gray-50 sticky left-0 z-10 w-48 min-w-48">
                Task Name
              </th>
              <th className="text-left p-2 bg-gray-50 w-20">Progress</th>
              <th className="text-left p-2 bg-gray-50 w-24">Status</th>
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
                          {date.toLocaleDateString("en-US", {
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
            {chartData.tasks.map((task: any) => (
              <tr key={task.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-2 bg-white sticky left-0 z-10 w-48 min-w-48">
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
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
  );
}
