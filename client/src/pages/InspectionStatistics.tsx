import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Award,
  AlertTriangle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { th } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "@/components/LazyChart";

const COLORS = {
  pass: "#10B981",
  fail: "#EF4444",
  critical: "#DC2626",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#6B7280",
};

export default function InspectionStatistics() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [defectGroupBy, setDefectGroupBy] = useState<"day" | "week" | "month">("week");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Queries
  const { data: projects } = trpc.project.list.useQuery();
  
  const { data: passFailRate, isLoading: loadingPassFail } = trpc.inspectionStats.getPassFailRate.useQuery({
    projectId: selectedProjectId || undefined,
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
  });

  const { data: defectTrends, isLoading: loadingDefects } = trpc.inspectionStats.getDefectTrends.useQuery({
    projectId: selectedProjectId || undefined,
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
    groupBy: defectGroupBy,
  });

  const { data: inspectorPerformance, isLoading: loadingInspectors } = trpc.inspectionStats.getInspectorPerformance.useQuery({
    projectId: selectedProjectId || undefined,
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
  });

  const { data: checklistStats, isLoading: loadingChecklist } = trpc.inspectionStats.getChecklistItemStats.useQuery({
    projectId: selectedProjectId || undefined,
    startDate: format(dateRange.from, "yyyy-MM-dd"),
    endDate: format(dateRange.to, "yyyy-MM-dd"),
  });

  const { data: qualityScore, isLoading: loadingQuality } = trpc.inspectionStats.getProjectQualityScore.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  // Prepare chart data
  const passFailChartData = useMemo(() => {
    if (!passFailRate) return [];
    return [
      { name: "ผ่าน", value: passFailRate.passedInspections, percentage: passFailRate.passRate },
      { name: "ไม่ผ่าน", value: passFailRate.failedInspections, percentage: passFailRate.failRate },
    ];
  }, [passFailRate]);

  const defectTrendChartData = useMemo(() => {
    if (!defectTrends) return [];
    return defectTrends.map((trend) => ({
      period: trend.period,
      วิกฤต: trend.criticalDefects,
      สูง: trend.highDefects,
      ปานกลาง: trend.mediumDefects,
      ต่ำ: trend.lowDefects,
      รวม: trend.totalDefects,
    }));
  }, [defectTrends]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-blue-500";
      case "C":
        return "bg-yellow-500";
      case "D":
        return "bg-orange-500";
      case "F":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGradeBadgeVariant = (grade: string): "default" | "secondary" | "destructive" | "outline" => {
    if (grade === "A" || grade === "B") return "default";
    if (grade === "C") return "secondary";
    return "destructive";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">สถิติการตรวจสอบคุณภาพ</h1>
          <p className="text-muted-foreground mt-1">
            วิเคราะห์ผลการตรวจสอบ ข้อบกพร่อง และประสิทธิภาพผู้ตรวจสอบ
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>โครงการ</Label>
              <Select
                value={selectedProjectId?.toString() || "all"}
                onValueChange={(value) => setSelectedProjectId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโครงการ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโครงการ</SelectItem>
                  {projects?.items?.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ช่วงเวลา</Label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "dd MMM yyyy", { locale: th })} -{" "}
                    {format(dateRange.to, "dd MMM yyyy", { locale: th })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                        setShowDatePicker(false);
                      }}
                    >
                      30 วันล่าสุด
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setDateRange({ from: subMonths(new Date(), 3), to: new Date() });
                        setShowDatePicker(false);
                      }}
                    >
                      3 เดือนล่าสุด
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setDateRange({ from: subMonths(new Date(), 6), to: new Date() });
                        setShowDatePicker(false);
                      }}
                    >
                      6 เดือนล่าสุด
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>กลุ่มข้อบกพร่องตาม</Label>
              <Select value={defectGroupBy} onValueChange={(value: any) => setDefectGroupBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">วัน</SelectItem>
                  <SelectItem value="week">สัปดาห์</SelectItem>
                  <SelectItem value="month">เดือน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Score (if project selected) */}
      {selectedProjectId && qualityScore && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              คะแนนคุณภาพโครงการ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{qualityScore.qualityScore}</div>
                <div className="text-sm text-muted-foreground mt-1">คะแนน</div>
                <Badge className={`mt-2 ${getGradeColor(qualityScore.grade)}`} variant={getGradeBadgeVariant(qualityScore.grade)}>
                  เกรด {qualityScore.grade}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{qualityScore.totalInspections}</div>
                <div className="text-sm text-muted-foreground mt-1">การตรวจสอบทั้งหมด</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{qualityScore.passedInspections}</div>
                <div className="text-sm text-muted-foreground mt-1">ผ่านการตรวจสอบ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600">{qualityScore.totalDefects}</div>
                <div className="text-sm text-muted-foreground mt-1">ข้อบกพร่องทั้งหมด</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">{qualityScore.criticalDefects}</div>
                <div className="text-sm text-muted-foreground mt-1">ข้อบกพร่องวิกฤต</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="defects">แนวโน้มข้อบกพร่อง</TabsTrigger>
          <TabsTrigger value="inspectors">ประสิทธิภาพผู้ตรวจสอบ</TabsTrigger>
          <TabsTrigger value="checklist">รายการตรวจสอบ</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Pass/Fail Rate Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  อัตราผ่าน/ไม่ผ่านการตรวจสอบ
                </CardTitle>
                <CardDescription>
                  จำนวนการตรวจสอบทั้งหมด: {passFailRate?.totalInspections || 0} ครั้ง
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPassFail ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">กำลังโหลด...</div>
                  </div>
                ) : passFailChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={passFailChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.pass} />
                        <Cell fill={COLORS.fail} />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">ไม่มีข้อมูล</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>สรุปสถิติ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">ผ่านการตรวจสอบ</div>
                      <div className="text-2xl font-bold text-green-600">
                        {passFailRate?.passedInspections || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {passFailRate?.passRate.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">ไม่ผ่านการตรวจสอบ</div>
                      <div className="text-2xl font-bold text-red-600">
                        {passFailRate?.failedInspections || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">
                      {passFailRate?.failRate.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">แนวโน้ม</div>
                  <div className="flex items-center gap-2">
                    {(passFailRate?.passRate || 0) >= 80 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-green-600 font-medium">ดีเยี่ยม - คุณภาพสูง</span>
                      </>
                    ) : (passFailRate?.passRate || 0) >= 60 ? (
                      <>
                        <TrendingUp className="h-5 w-5 text-yellow-600" />
                        <span className="text-yellow-600 font-medium">ปานกลาง - ควรปรับปรุง</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="text-red-600 font-medium">ต้องปรับปรุงเร่งด่วน</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Defect Trends Tab */}
        <TabsContent value="defects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                แนวโน้มข้อบกพร่องตามช่วงเวลา
              </CardTitle>
              <CardDescription>
                แสดงจำนวนข้อบกพร่องแยกตามระดับความรุนแรง
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDefects ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-muted-foreground">กำลังโหลด...</div>
                </div>
              ) : defectTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={defectTrendChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="วิกฤต" stackId="a" fill={COLORS.critical} />
                    <Bar dataKey="สูง" stackId="a" fill={COLORS.high} />
                    <Bar dataKey="ปานกลาง" stackId="a" fill={COLORS.medium} />
                    <Bar dataKey="ต่ำ" stackId="a" fill={COLORS.low} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-muted-foreground">ไม่มีข้อมูล</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspector Performance Tab */}
        <TabsContent value="inspectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ประสิทธิภาพผู้ตรวจสอบ</CardTitle>
              <CardDescription>
                แสดงผลการทำงานของผู้ตรวจสอบแต่ละคน
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInspectors ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">กำลังโหลด...</div>
                </div>
              ) : inspectorPerformance && inspectorPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">ผู้ตรวจสอบ</th>
                        <th className="text-center py-3 px-4">การตรวจสอบทั้งหมด</th>
                        <th className="text-center py-3 px-4">ผ่าน</th>
                        <th className="text-center py-3 px-4">ไม่ผ่าน</th>
                        <th className="text-center py-3 px-4">อัตราผ่าน</th>
                        <th className="text-center py-3 px-4">เวลาเฉลี่ย (นาที)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectorPerformance.map((inspector) => (
                        <tr key={inspector.inspectorId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{inspector.inspectorName}</td>
                          <td className="text-center py-3 px-4">{inspector.totalInspections}</td>
                          <td className="text-center py-3 px-4 text-green-600">{inspector.passedInspections}</td>
                          <td className="text-center py-3 px-4 text-red-600">{inspector.failedInspections}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={inspector.passRate >= 80 ? "default" : inspector.passRate >= 60 ? "secondary" : "destructive"}>
                              {inspector.passRate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            {inspector.avgInspectionTime ? inspector.avgInspectionTime.toFixed(0) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Items Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สถิติรายการตรวจสอบ</CardTitle>
              <CardDescription>
                รายการที่มีปัญหาบ่อยที่สุด (เรียงตามอัตราไม่ผ่าน)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingChecklist ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">กำลังโหลด...</div>
                </div>
              ) : checklistStats && checklistStats.length > 0 ? (
                <div className="space-y-3">
                  {checklistStats.slice(0, 10).map((item, index) => (
                    <div key={item.itemId} className="flex items-center gap-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.itemText}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ตรวจสอบ {item.totalChecks} ครั้ง • ผ่าน {item.passCount} • ไม่ผ่าน {item.failCount} • N/A {item.naCount}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-lg font-bold ${item.failRate >= 50 ? "text-red-600" : item.failRate >= 25 ? "text-yellow-600" : "text-green-600"}`}>
                          {item.failRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">อัตราไม่ผ่าน</div>
                      </div>
                      {item.failRate >= 50 && (
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
