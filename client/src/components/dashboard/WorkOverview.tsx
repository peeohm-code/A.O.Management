import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ListTodo, ClipboardCheck, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface WorkOverviewProps {
  stats: {
    taskStats?: {
      total?: number;
      not_started?: number;
      in_progress?: number;
      delayed?: number;
      completed?: number;
    };
    checklistStats?: {
      total?: number;
      not_started?: number;
      in_progress?: number;
      passed?: number;
      failed?: number;
    };
    defectStats?: {
      total?: number;
      open?: number;
      in_progress?: number;
      closed?: number;
    };
  };
}

export function WorkOverview({ stats }: WorkOverviewProps) {
  const taskStats = stats?.taskStats || {};
  const checklistStats = stats?.checklistStats || {};
  const defectStats = stats?.defectStats || {};

  // Calculate percentages for charts
  const taskTotal = taskStats.total || 1;
  const taskInProgressPct = ((taskStats.in_progress || 0) / taskTotal) * 100;
  const taskDelayedPct = ((taskStats.delayed || 0) / taskTotal) * 100;
  const taskCompletedPct = ((taskStats.completed || 0) / taskTotal) * 100;

  const checklistTotal = checklistStats.total || 1;
  const checklistInProgressPct = ((checklistStats.in_progress || 0) / checklistTotal) * 100;
  const checklistPassedPct = ((checklistStats.passed || 0) / checklistTotal) * 100;
  const checklistFailedPct = ((checklistStats.failed || 0) / checklistTotal) * 100;

  const defectTotal = defectStats.total || 1;
  const defectOpenPct = ((defectStats.open || 0) / defectTotal) * 100;
  const defectInProgressPct = ((defectStats.in_progress || 0) / defectTotal) * 100;
  const defectClosedPct = ((defectStats.closed || 0) / defectTotal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Overview</CardTitle>
        <CardDescription>สรุปสถานะงานทั้งหมดในระบบ</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Tasks</h3>
            </div>

            {/* Donut Chart (CSS-based) */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-gray-200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Completed (green) */}
                  <path
                    className="text-green-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${taskCompletedPct}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* In Progress (blue) */}
                  <path
                    className="text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${taskInProgressPct}, 100`}
                    strokeDashoffset={-taskCompletedPct}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Delayed (red) */}
                  <path
                    className="text-red-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${taskDelayedPct}, 100`}
                    strokeDashoffset={-(taskCompletedPct + taskInProgressPct)}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{taskStats.total || 0}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-gray-600">กำลังทำ</span>
                </div>
                <span className="font-semibold text-blue-600">{taskStats.in_progress || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-gray-600">ล่าช้า</span>
                </div>
                <span className="font-semibold text-red-600">{taskStats.delayed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-gray-600">เสร็จสมบูรณ์</span>
                </div>
                <span className="font-semibold text-green-600">{taskStats.completed || 0}</span>
              </div>
            </div>
            <Link href="/tasks">
              <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
            </Link>
          </div>

          {/* Checklists */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Checklists</h3>
            </div>

            {/* Bar Chart (CSS-based) */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">กำลังตรวจ</span>
                  <span className="font-semibold">{checklistStats.in_progress || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${checklistInProgressPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">ผ่าน</span>
                  <span className="font-semibold">{checklistStats.passed || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${checklistPassedPct}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">ไม่ผ่าน</span>
                  <span className="font-semibold">{checklistStats.failed || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${checklistFailedPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-center">
                <div className="text-3xl font-bold">{checklistStats.total || 0}</div>
                <div className="text-xs text-gray-500">ทั้งหมด</div>
              </div>
            </div>

            <Link href="/qc">
              <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
            </Link>
          </div>

          {/* Defects */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold">Defects</h3>
            </div>

            {/* Stacked Bar Chart */}
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden">
                {defectStats.total && defectStats.total > 0 ? (
                  <>
                    <div
                      className="bg-red-600 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${defectOpenPct}%` }}
                      title={`Open: ${defectStats.open || 0}`}
                    >
                      {defectStats.open || 0}
                    </div>
                    <div
                      className="bg-blue-600 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${defectInProgressPct}%` }}
                      title={`In Progress: ${defectStats.in_progress || 0}`}
                    >
                      {defectStats.in_progress || 0}
                    </div>
                    <div
                      className="bg-green-600 flex items-center justify-center text-white text-xs font-semibold"
                      style={{ width: `${defectClosedPct}%` }}
                      title={`Closed: ${defectStats.closed || 0}`}
                    >
                      {defectStats.closed || 0}
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center text-gray-500 text-xs">
                    ไม่มีข้อมูล
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span className="text-gray-600">เปิด</span>
                  </div>
                  <span className="font-semibold">{defectStats.open || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span className="text-gray-600">กำลังดำเนินการ</span>
                  </div>
                  <span className="font-semibold text-blue-600">{defectStats.in_progress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span className="text-gray-600">ปิดแล้ว</span>
                  </div>
                  <span className="font-semibold text-green-600">{defectStats.closed || 0}</span>
                </div>
              </div>
            </div>

            <Link href="/defects">
              <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
            </Link>
          </div>
        </div>

        {/* Mobile: Accordion */}
        <Accordion type="single" collapsible className="md:hidden">
          <AccordionItem value="tasks">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-600" />
                <span>Tasks ({taskStats.total || 0})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">กำลังทำ</span>
                  <span className="font-semibold text-blue-600">{taskStats.in_progress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ล่าช้า</span>
                  <span className="font-semibold text-red-600">{taskStats.delayed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">เสร็จสมบูรณ์</span>
                  <span className="font-semibold text-green-600">{taskStats.completed || 0}</span>
                </div>
                <Link href="/tasks">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="checklists">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
                <span>Checklists ({checklistStats.total || 0})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">กำลังตรวจ</span>
                  <span className="font-semibold text-blue-600">{checklistStats.in_progress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ผ่าน</span>
                  <span className="font-semibold text-green-600">{checklistStats.passed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ไม่ผ่าน</span>
                  <span className="font-semibold text-red-600">{checklistStats.failed || 0}</span>
                </div>
                <Link href="/qc">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="defects">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span>Defects ({defectStats.total || 0})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ทั้งหมด</span>
                  <span className="font-semibold">{defectStats.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">กำลังดำเนินการ</span>
                  <span className="font-semibold text-blue-600">{defectStats.in_progress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ปิดแล้ว</span>
                  <span className="font-semibold text-green-600">{defectStats.closed || 0}</span>
                </div>
                <Link href="/defects">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer">ดูทั้งหมด →</span>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
