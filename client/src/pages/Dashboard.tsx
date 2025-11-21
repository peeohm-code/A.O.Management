import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  FileCheck,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

/**
 * Enhanced Dashboard - Construction Management & QC Platform
 * 
 * New Widgets:
 * - Project Timeline Overview (on track, at risk, behind schedule)
 * - Team Performance Metrics (completion rate, on-time rate)
 * - QC Status Summary (inspections, defects)
 * - Recent Activities (enhanced with project/task names)
 */
export default function Dashboard() {
  const { user } = useAuth();

  // Fetch enhanced dashboard data
  const { data: timelineData, isLoading: timelineLoading, error: timelineError } = trpc.dashboard.getProjectTimelineOverview.useQuery();
  const { data: teamData, isLoading: teamLoading, error: teamError } = trpc.dashboard.getTeamPerformanceMetrics.useQuery();
  const { data: qcData, isLoading: qcLoading, error: qcError } = trpc.dashboard.getQCStatusSummary.useQuery();
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = trpc.dashboard.getRecentActivities.useQuery({ limit: 15 });
  const { data: statsData, isLoading: statsLoading, error: statsError } = trpc.dashboard.getStats.useQuery();

  // Debug logging
  console.log('[Dashboard] Timeline:', { data: timelineData, loading: timelineLoading, error: timelineError });
  console.log('[Dashboard] Team:', { data: teamData, loading: teamLoading, error: teamError });
  console.log('[Dashboard] QC:', { data: qcData, loading: qcLoading, error: qcError });
  console.log('[Dashboard] Activities:', { count: activities.length, loading: activitiesLoading, error: activitiesError });
  console.log('[Dashboard] Stats:', { data: statsData, loading: statsLoading, error: statsError });

  // Calculate overview stats
  const overviewStats = useMemo(() => {
    if (!statsData) return null;
    
    return {
      projects: {
        total: statsData.projectStats.total,
        active: statsData.projectStats.active,
        onTrack: statsData.projectStats.on_track,
        delayed: statsData.projectStats.delayed,
        overdue: statsData.projectStats.overdue,
      },
      tasks: {
        total: statsData.taskStats.total,
        completed: statsData.taskStats.completed,
        inProgress: statsData.taskStats.in_progress,
        delayed: statsData.taskStats.delayed,
      },
      inspections: {
        total: statsData.checklistStats.total,
        pending: statsData.checklistStats.pending_inspection,
        completed: statsData.checklistStats.completed,
        failed: statsData.checklistStats.failed,
      },
      defects: {
        total: statsData.defectStats?.total || 0,
        open: statsData.defectStats?.open || 0,
        critical: statsData.defectStats?.overdue || 0,
      },
    };
  }, [statsData]);

  // Get timeline status color
  const getTimelineStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600 bg-green-50';
      case 'at_risk': return 'text-amber-600 bg-amber-50';
      case 'behind_schedule': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  // Get timeline status label
  const getTimelineStatusLabel = (status: string) => {
    switch (status) {
      case 'on_track': return 'ตามแผน';
      case 'at_risk': return 'เสี่ยง';
      case 'behind_schedule': return 'ล่าช้า';
      default: return 'ไม่ทราบ';
    }
  };

  // Get activity icon
  const getActivityIcon = (action: string) => {
    if (action.includes('สร้าง') || action.includes('created')) return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes('อัปเดต') || action.includes('updated')) return <Activity className="w-4 h-4" />;
    if (action.includes('ลบ') || action.includes('deleted')) return <XCircle className="w-4 h-4" />;
    if (action.includes('ตรวจสอบ') || action.includes('inspected')) return <FileCheck className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">แดชบอร์ด</h1>
          <p className="text-slate-600 mt-1">ภาพรวมการบริหารโครงการก่อสร้างและควบคุมคุณภาพ</p>
        </div>

        {/* Overview Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : overviewStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projects Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">โครงการ</CardTitle>
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{overviewStats.projects.total}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {overviewStats.projects.onTrack} ตามแผน
                  </Badge>
                  {overviewStats.projects.delayed > 0 && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      {overviewStats.projects.delayed} ล่าช้า
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasks Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">งาน</CardTitle>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{overviewStats.tasks.total}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-green-600">{overviewStats.tasks.completed} เสร็จสิ้น</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-600">{overviewStats.tasks.inProgress} กำลังดำเนินการ</span>
                </div>
              </CardContent>
            </Card>

            {/* Inspections Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">การตรวจสอบ</CardTitle>
                  <FileCheck className="w-5 h-5 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{overviewStats.inspections.total}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-green-600">{overviewStats.inspections.completed} ผ่าน</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-600">{overviewStats.inspections.pending} รอตรวจ</span>
                </div>
              </CardContent>
            </Card>

            {/* Defects Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">ข้อบกพร่อง</CardTitle>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{overviewStats.defects.open}</div>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  {overviewStats.defects.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {overviewStats.defects.critical} วิกฤต
                    </Badge>
                  )}
                  <span className="text-slate-600">จากทั้งหมด {overviewStats.defects.total}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Timeline Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    ภาพรวมไทม์ไลน์โครงการ
                  </CardTitle>
                  <CardDescription>สถานะความคืบหน้าตามแผนงาน</CardDescription>
                </div>
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : timelineData && timelineData.summary.total > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{timelineData.summary.onTrack}</div>
                      <div className="text-xs text-green-700 mt-1">ตามแผน</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{timelineData.summary.atRisk}</div>
                      <div className="text-xs text-amber-700 mt-1">เสี่ยง</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{timelineData.summary.behindSchedule}</div>
                      <div className="text-xs text-red-700 mt-1">ล่าช้า</div>
                    </div>
                  </div>

                  {/* Project List */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {timelineData.projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <Link href={`/projects/${project.id}`}>
                              <h4 className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                {project.name}
                              </h4>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTimelineStatusColor(project.timelineStatus)}>
                                {getTimelineStatusLabel(project.timelineStatus)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                เหลือ {project.daysRemaining} วัน
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900">{Math.round(project.progress)}%</div>
                            <div className="text-xs text-slate-500">ความคืบหน้า</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Progress value={project.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>ความคืบหน้าจริง</span>
                            <span>คาดว่าควรอยู่ที่ {Math.round(project.expectedProgress)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีโครงการที่กำลังดำเนินการ</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Performance Metrics */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    ประสิทธิภาพทีม
                  </CardTitle>
                  <CardDescription>อัตราการทำงานสำเร็จและตรงเวลา</CardDescription>
                </div>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm">
                    จัดการทีม <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : teamData && teamData.summary.teamSize > 0 ? (
                <div className="space-y-4">
                  {/* Team Summary */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-600">อัตราความสำเร็จเฉลี่ย</div>
                      <div className="text-2xl font-bold text-slate-900">{teamData.summary.avgCompletionRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">อัตราตรงเวลาเฉลี่ย</div>
                      <div className="text-2xl font-bold text-slate-900">{teamData.summary.avgOnTimeRate}%</div>
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {teamData.members.slice(0, 5).map((member) => (
                      <div key={member.userId} className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                              {member.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{member.userName}</div>
                              <div className="text-xs text-slate-500">{member.role}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {member.completionRate >= 80 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-amber-600" />
                              )}
                              <span className="font-bold text-slate-900">{member.completionRate}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-600">{member.totalTasks}</div>
                            <div className="text-blue-700">งานทั้งหมด</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-600">{member.completedTasks}</div>
                            <div className="text-green-700">เสร็จสิ้น</div>
                          </div>
                          <div className="text-center p-2 bg-amber-50 rounded">
                            <div className="font-bold text-amber-600">{member.overdueTasks}</div>
                            <div className="text-amber-700">เกินกำหนด</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีข้อมูลสมาชิกทีม</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QC Status Summary */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-teal-600" />
                    สรุปสถานะ QC
                  </CardTitle>
                  <CardDescription>การตรวจสอบคุณภาพและข้อบกพร่อง</CardDescription>
                </div>
                <Link href="/inspections">
                  <Button variant="ghost" size="sm">
                    ดูรายละเอียด <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {qcLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : qcData ? (
                <div className="space-y-4">
                  {/* Inspections */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">การตรวจสอบ</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{qcData.inspections.passed}</div>
                        <div className="text-xs text-green-700 mt-1">ผ่าน</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{qcData.inspections.failed}</div>
                        <div className="text-xs text-red-700 mt-1">ไม่ผ่าน</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">อัตราผ่าน</span>
                      <span className="font-bold text-slate-900">{qcData.inspections.passRate}%</span>
                    </div>
                    <Progress value={qcData.inspections.passRate} className="h-2 mt-2" />
                    <div className="mt-2 text-xs text-slate-500">
                      รอตรวจสอบ: {qcData.inspections.pending} รายการ
                    </div>
                  </div>

                  {/* Defects */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-3">ข้อบกพร่อง</h4>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-xl font-bold text-red-600">{qcData.defects.critical}</div>
                        <div className="text-xs text-red-700 mt-1">วิกฤต</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded">
                        <div className="text-xl font-bold text-amber-600">{qcData.defects.major}</div>
                        <div className="text-xs text-amber-700 mt-1">สำคัญ</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-xl font-bold text-blue-600">{qcData.defects.minor}</div>
                        <div className="text-xs text-blue-700 mt-1">เล็กน้อย</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">แก้ไขแล้ว (30 วันล่าสุด)</span>
                        <span className="font-medium text-green-600">{qcData.defects.resolvedLast30Days}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">เวลาแก้ไขเฉลี่ย</span>
                        <span className="font-medium text-slate-900">{qcData.defects.avgResolutionTime} วัน</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีข้อมูล QC</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    กิจกรรมล่าสุด
                  </CardTitle>
                  <CardDescription>การเปลี่ยนแปลงและอัปเดตล่าสุด</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900">
                              <span className="font-medium">{activity.userName || 'ผู้ใช้'}</span>
                              {' '}
                              <span className="text-slate-600">{activity.action}</span>
                            </p>
                            {activity.projectName && (
                              <p className="text-xs text-slate-500 mt-1">
                                โครงการ: {activity.projectName}
                                {activity.taskName && ` • งาน: ${activity.taskName}`}
                              </p>
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: th })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(activity.createdAt), 'PPpp', { locale: th })}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีกิจกรรม</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
