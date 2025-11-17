import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Target,
  Clock,
  DollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdvancedAnalytics() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(30);

  // Fetch projects
  const { data: projectsData } = trpc.project.list.useQuery();
  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Fetch analytics data
  const { data: predictive, isLoading: predictiveLoading } = trpc.analytics.predictive.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const { data: riskAssessment, isLoading: riskLoading } = trpc.analytics.riskAssessment.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const { data: qualityTrend, isLoading: qualityLoading } = trpc.analytics.qualityTrend.useQuery(
    { projectId: selectedProjectId!, days: selectedDays },
    { enabled: !!selectedProjectId }
  );

  const { data: performanceKPIs, isLoading: kpiLoading } = trpc.analytics.performanceKPIs.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );

  const { data: resourceUtilization, isLoading: resourceLoading } = trpc.analytics.resourceUtilization.useQuery(
    { projectId: selectedProjectId || undefined },
    { enabled: !!selectedProjectId }
  );

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">การวิเคราะห์เชิงลึกและคาดการณ์โครงการ</p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกโครงการ</CardTitle>
          <CardDescription>เลือกโครงการที่ต้องการวิเคราะห์</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(value) => setSelectedProjectId(Number(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="เลือกโครงการ..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedDays.toString()}
              onValueChange={(value) => setSelectedDays(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 วันที่ผ่านมา</SelectItem>
                <SelectItem value="14">14 วันที่ผ่านมา</SelectItem>
                <SelectItem value="30">30 วันที่ผ่านมา</SelectItem>
                <SelectItem value="60">60 วันที่ผ่านมา</SelectItem>
                <SelectItem value="90">90 วันที่ผ่านมา</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedProjectId ? (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            กรุณาเลือกโครงการเพื่อดูการวิเคราะห์ขั้นสูง
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="predictive" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="predictive">
              <TrendingUp className="h-4 w-4 mr-2" />
              คาดการณ์
            </TabsTrigger>
            <TabsTrigger value="risk">
              <AlertTriangle className="h-4 w-4 mr-2" />
              ความเสี่ยง
            </TabsTrigger>
            <TabsTrigger value="kpi">
              <Target className="h-4 w-4 mr-2" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="quality">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              คุณภาพ
            </TabsTrigger>
            <TabsTrigger value="resource">
              <Users className="h-4 w-4 mr-2" />
              ทรัพยากร
            </TabsTrigger>
          </TabsList>

          {/* Predictive Analytics Tab */}
          <TabsContent value="predictive" className="space-y-4">
            {predictiveLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : predictive ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completion Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{predictive.completionRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {predictive.completedTasks} / {predictive.totalTasks} งาน
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        วันที่เหลือ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{predictive.daysRemaining} วัน</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        คาดว่าใช้เวลาอีก {predictive.predictedDaysToComplete} วัน
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        งานที่ล่าช้า
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{predictive.delayedTasks}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {predictive.delayRisk}% ของงานทั้งหมด
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        ระดับความเสี่ยง
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={getRiskBadgeVariant(predictive.riskLevel)}>
                        {predictive.riskLevel.toUpperCase()}
                      </Badge>
                      {predictive.delayDays > 0 && (
                        <p className="text-xs text-red-600 mt-2">
                          คาดว่าจะล่าช้า {predictive.delayDays} วัน
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>สรุปการคาดการณ์</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">วันที่กำหนดเสร็จ (แผน)</p>
                        <p className="text-lg font-semibold">
                          {predictive.plannedEndDate ? new Date(predictive.plannedEndDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">วันที่คาดว่าจะเสร็จ (จริง)</p>
                        <p className="text-lg font-semibold">
                          {new Date(predictive.predictedEndDate).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    {predictive.isOnTrack ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          โครงการดำเนินไปตามแผน
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          โครงการมีแนวโน้มล่าช้า {predictive.delayDays} วัน - ควรเร่งดำเนินการ
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Risk Assessment Tab */}
          <TabsContent value="risk" className="space-y-4">
            {riskLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : riskAssessment ? (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className={getRiskColor(riskAssessment.riskLevel)}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ความเสี่ยงรวม</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{riskAssessment.overallRisk}%</div>
                      <Badge variant={getRiskBadgeVariant(riskAssessment.riskLevel)} className="mt-2">
                        {riskAssessment.riskLevel.toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ความเสี่ยงด้านกำหนดเวลา</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{riskAssessment.scheduleRisk}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ความเสี่ยงด้านคุณภาพ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{riskAssessment.qualityRisk}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ความเสี่ยงด้านทรัพยากร</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{riskAssessment.resourceRisk}%</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>รายละเอียดความเสี่ยง</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riskAssessment.risks.map((risk: any, index: number) => (
                        <div key={index} className="border-l-4 pl-4 py-2" style={{
                          borderColor: risk.level === 'high' ? '#ef4444' : risk.level === 'medium' ? '#f59e0b' : '#10b981'
                        }}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold capitalize">{risk.category}</h4>
                            <Badge variant={getRiskBadgeVariant(risk.level)}>
                              {risk.level.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{risk.description}</p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Impact</span>
                              <span>{risk.impact.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full"
                                style={{
                                  width: `${risk.impact}%`,
                                  backgroundColor: risk.level === 'high' ? '#ef4444' : risk.level === 'medium' ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Performance KPIs Tab */}
          <TabsContent value="kpi" className="space-y-4">
            {kpiLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : performanceKPIs ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        SPI (Schedule Performance)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceKPIs.schedulePerformanceIndex}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {performanceKPIs.schedulePerformanceIndex >= 1 ? (
                          <span className="text-green-600">ดีกว่าแผน</span>
                        ) : (
                          <span className="text-red-600">ล่าช้ากว่าแผน</span>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        On-time Delivery Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceKPIs.onTimeDeliveryRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        อัตราการส่งมอบตรงเวลา
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Quality Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceKPIs.qualityScore}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        คะแนนคุณภาพ
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Defect Density
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceKPIs.defectDensity}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ข้อบกพร่องต่องานที่เสร็จ
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>ความคืบหน้า</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">ความคืบหน้าตามแผน</span>
                          <span className="text-sm font-semibold">{performanceKPIs.plannedProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${performanceKPIs.plannedProgress}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">ความคืบหน้าจริง</span>
                          <span className="text-sm font-semibold">{performanceKPIs.actualProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${performanceKPIs.actualProgress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>สถิติงานและข้อบกพร่อง</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">งานทั้งหมด</span>
                          <span className="font-semibold">{performanceKPIs.totalTasks}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">งานที่เสร็จแล้ว</span>
                          <span className="font-semibold text-green-600">{performanceKPIs.completedTasks}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ข้อบกพร่องทั้งหมด</span>
                          <span className="font-semibold text-red-600">{performanceKPIs.totalDefects}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">แก้ไขแล้ว</span>
                          <span className="font-semibold text-green-600">{performanceKPIs.resolvedDefects}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* Quality Trend Tab */}
          <TabsContent value="quality" className="space-y-4">
            {qualityLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : qualityTrend ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ข้อบกพร่องทั้งหมด</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{qualityTrend.totalDefects}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ใน {qualityTrend.days} วันที่ผ่านมา
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">แก้ไขแล้ว</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{qualityTrend.resolvedDefects}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {qualityTrend.resolutionRate}% ของทั้งหมด
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">อัตราการแก้ไข</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{qualityTrend.resolutionRate}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolution Rate
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>แนวโน้มข้อบกพร่องรายวัน</CardTitle>
                    <CardDescription>
                      แสดงจำนวนข้อบกพร่องที่พบและแก้ไขในแต่ละวัน
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {qualityTrend.trend.length > 0 ? (
                      <div className="space-y-2">
                        {qualityTrend.trend.slice(-10).map((day: any) => (
                          <div key={day.date} className="border-b pb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {new Date(day.date).toLocaleDateString('th-TH')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {day.total} ข้อบกพร่อง
                              </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-xs">
                              <div className="text-red-600">
                                Critical: {day.critical}
                              </div>
                              <div className="text-orange-600">
                                High: {day.high}
                              </div>
                              <div className="text-yellow-600">
                                Medium: {day.medium}
                              </div>
                              <div className="text-blue-600">
                                Low: {day.low}
                              </div>
                              <div className="text-green-600">
                                Resolved: {day.resolved}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        ไม่มีข้อมูลข้อบกพร่องในช่วงเวลานี้
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Resource Utilization Tab */}
          <TabsContent value="resource" className="space-y-4">
            {resourceLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : resourceUtilization && resourceUtilization.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>การใช้ทรัพยากรบุคคล</CardTitle>
                  <CardDescription>
                    แสดงภาระงานและการใช้งานของแต่ละคน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resourceUtilization.map((user: any) => (
                      <div key={user.userId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{user.userName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {user.projectCount} โครงการ
                            </p>
                          </div>
                          <Badge variant={
                            user.utilizationRate > 80 ? 'destructive' :
                            user.utilizationRate > 60 ? 'secondary' :
                            'outline'
                          }>
                            {user.utilizationRate}% Utilization
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">งานทั้งหมด</p>
                            <p className="font-semibold">{user.totalTasks}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">กำลังทำ</p>
                            <p className="font-semibold text-blue-600">{user.activeTasks}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">เสร็จแล้ว</p>
                            <p className="font-semibold text-green-600">{user.completedTasks}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                user.utilizationRate > 80 ? 'bg-red-500' :
                                user.utilizationRate > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${user.utilizationRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  ไม่มีข้อมูลการใช้ทรัพยากร
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
