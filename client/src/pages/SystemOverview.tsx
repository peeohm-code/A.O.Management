import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  HardDrive, 
  Server, 
  TrendingUp, 
  Users, 
  XCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * System Overview Page - สำหรับ Admin/Owner เท่านั้น
 * แสดงภาพรวมระบบ สถานะ ปัญหา และการใช้งาน
 */
export default function SystemOverview() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // ตรวจสอบสิทธิ์ - เฉพาะ admin/owner เท่านั้น
  useEffect(() => {
    if (!loading && user && user.role !== 'admin' && user.role !== 'owner') {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  // ดึงข้อมูล system metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.systemMonitor.getMetrics.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  });

  // ดึงข้อมูล database stats
  const { data: dbStats, isLoading: dbLoading, refetch: refetchDb } = trpc.systemMonitor.getDatabaseStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  // ดึงข้อมูล error patterns
  const { data: errorPatterns, isLoading: errorsLoading, refetch: refetchErrors } = trpc.monitoring.getErrorPatterns.useQuery();

  // ดึงข้อมูล recent errors
  const { data: recentErrors, isLoading: recentErrorsLoading } = trpc.monitoring.getRecentErrors.useQuery({ limit: 10 });

  const handleRefreshAll = () => {
    refetchMetrics();
    refetchDb();
    refetchErrors();
  };

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // ตรวจสอบสิทธิ์อีกครั้ง
  if (user.role !== 'admin' && user.role !== 'owner') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground mt-1">
              ภาพรวมระบบ สถานะ และการใช้งาน
            </p>
          </div>
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
        </div>

        {/* System Health Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">Online</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ระบบทำงานปกติ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics?.memory?.usagePercent?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics?.memory?.used || 'N/A'} / {metrics?.memory?.total || 'N/A'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {dbLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {(dbStats?.tables as any[])?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ตารางทั้งหมด
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                ผู้ใช้งานออนไลน์
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="errors">Errors & Issues</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>รายละเอียดการใช้งานทรัพยากรระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">CPU</h4>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-semibold">
                            {metrics?.cpu?.usage?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metrics?.cpu?.cores || 0} cores
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Memory</h4>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-semibold">
                            {metrics?.memory?.usagePercent?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {metrics?.memory?.used || 'N/A'} / {metrics?.memory?.total || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Uptime</h4>
                      <p className="text-lg font-semibold">{metrics?.uptime || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Errors & Issues Tab */}
          <TabsContent value="errors" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Error Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Error Patterns</CardTitle>
                  <CardDescription>รูปแบบ error ที่เกิดขึ้นบ่อย</CardDescription>
                </CardHeader>
                <CardContent>
                  {errorsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : errorPatterns && Object.keys(errorPatterns).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(errorPatterns).slice(0, 5).map(([_key, pattern]: [string, any], index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{pattern.pattern}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {pattern.count} ครั้ง
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {pattern.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mb-2" />
                      <p className="text-sm">ไม่พบ error patterns</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>Error ล่าสุดที่เกิดขึ้น</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentErrorsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentErrors && recentErrors.length > 0 ? (
                    <div className="space-y-3">
                      {recentErrors.map((error: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{error.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-xs">
                                {error.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(error.timestamp).toLocaleString('th-TH')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mb-2" />
                      <p className="text-sm">ไม่พบ errors ล่าสุด</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
                <CardDescription>สถิติและข้อมูลการใช้งาน Database</CardDescription>
              </CardHeader>
              <CardContent>
                {dbLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Total Tables</h4>
                        <p className="text-2xl font-bold">{(dbStats?.tables as any[])?.length || 0}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Total Rows</h4>
                        <p className="text-2xl font-bold">N/A</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Database Size</h4>
                        <p className="text-2xl font-bold">N/A</p>
                      </div>
                    </div>

                    {dbStats?.tables && dbStats.tables.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">Table Statistics</h4>
                        <div className="space-y-2">
                          {(dbStats.tables as any[]).slice(0, 10).map((table: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                              <span className="text-sm font-medium">{table.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground">
                                  {table.rows?.toLocaleString() || 0} rows
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {table.size || 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>ข้อมูลประสิทธิภาพของระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <p className="text-sm">Performance metrics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
