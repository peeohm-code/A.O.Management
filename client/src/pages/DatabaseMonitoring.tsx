import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Database, Activity, AlertTriangle, BarChart3, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function DatabaseMonitoring() {
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);

  // Queries
  const { data: dbStats, isLoading: statsLoading, refetch: refetchStats } = 
    trpc.monitoring.getDbStatistics.useQuery();
  
  const { data: slowQueries, isLoading: slowQueriesLoading, refetch: refetchSlowQueries } = 
    trpc.monitoring.getSlowQueries.useQuery({ thresholdMs: 1000, limit: 50 });
  
  const { data: queryStats, isLoading: queryStatsLoading, refetch: refetchQueryStats } = 
    trpc.monitoring.getQueryStats.useQuery({ hours: 24 });
  
  const { data: queryErrors, isLoading: errorsLoading, refetch: refetchErrors } = 
    trpc.monitoring.getQueryErrors.useQuery({ limit: 30 });

  // Mutations
  const collectStats = trpc.monitoring.collectStatistics.useMutation({
    onSuccess: (data) => {
      toast.success(`เก็บข้อมูลสถิติสำเร็จ (${data.count} ตาราง)`);
      refetchStats();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchSlowQueries();
    refetchQueryStats();
    refetchErrors();
    toast.success("รีเฟรชข้อมูลทั้งหมดแล้ว");
  };

  const handleCollectStats = () => {
    collectStats.mutate();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // Only admin can access
  if (user?.role !== "admin" && user?.role !== "owner") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription>
              เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            ติดตามและวิเคราะห์ประสิทธิภาพของฐานข้อมูล
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshAll}
            disabled={statsLoading || slowQueriesLoading || queryStatsLoading || errorsLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button 
            onClick={handleCollectStats}
            disabled={collectStats.isPending}
          >
            <Activity className="h-4 w-4 mr-2" />
            เก็บสถิติ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="slow-queries">Query ช้า</TabsTrigger>
          <TabsTrigger value="statistics">สถิติ Query</TabsTrigger>
          <TabsTrigger value="errors">ข้อผิดพลาด</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">จำนวนตาราง</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dbStats?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query ช้า (24 ชม.)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slowQueries?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ข้อผิดพลาด</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queryErrors?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ขนาดรวม</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(dbStats?.reduce((sum, s) => sum + s.dataSize + s.indexSize, 0) || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Tables Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>สถิติตาราง</CardTitle>
              <CardDescription>ข้อมูลล่าสุดของแต่ละตารางในฐานข้อมูล</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
              ) : !dbStats || dbStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีข้อมูล กรุณากดปุ่ม "เก็บสถิติ" เพื่อเริ่มต้น
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ตาราง</TableHead>
                      <TableHead className="text-right">จำนวนแถว</TableHead>
                      <TableHead className="text-right">ขนาดข้อมูล</TableHead>
                      <TableHead className="text-right">ขนาด Index</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                      <TableHead>อัพเดทล่าสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbStats.map((stat) => (
                      <TableRow key={stat.tableName}>
                        <TableCell className="font-medium">{stat.tableName}</TableCell>
                        <TableCell className="text-right">{stat.rowCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatBytes(stat.dataSize)}</TableCell>
                        <TableCell className="text-right">{formatBytes(stat.indexSize)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatBytes(stat.dataSize + stat.indexSize)}
                        </TableCell>
                        <TableCell>
                          {new Date(stat.createdAt).toLocaleString("th-TH")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slow Queries Tab */}
        <TabsContent value="slow-queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query ที่ทำงานช้า</CardTitle>
              <CardDescription>Query ที่ใช้เวลามากกว่า 1 วินาที</CardDescription>
            </CardHeader>
            <CardContent>
              {slowQueriesLoading ? (
                <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
              ) : !slowQueries || slowQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่พบ query ที่ช้า
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>ตาราง</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">ระยะเวลา</TableHead>
                      <TableHead>Query</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowQueries.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell className="text-sm">
                          {new Date(query.createdAt).toLocaleString("th-TH")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{query.tableName || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{query.operationType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDuration(query.executionTime)}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-xs font-mono">
                          {query.queryText}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สถิติ Query (24 ชั่วโมงล่าสุด)</CardTitle>
              <CardDescription>สรุปการใช้งาน query แยกตามตารางและประเภท</CardDescription>
            </CardHeader>
            <CardContent>
              {queryStatsLoading ? (
                <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
              ) : !queryStats || queryStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่มีข้อมูลสถิติ
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ตาราง</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-right">จำนวนครั้ง</TableHead>
                      <TableHead className="text-right">เวลาเฉลี่ย</TableHead>
                      <TableHead className="text-right">เวลาสูงสุด</TableHead>
                      <TableHead className="text-right">เวลาต่ำสุด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryStats.map((stat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant="outline">{stat.tableName || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{stat.operationType}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(stat.count).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(Number(stat.avgTime))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(Number(stat.maxTime))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(Number(stat.minTime))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ข้อผิดพลาด Query</CardTitle>
              <CardDescription>Query ที่เกิดข้อผิดพลาดล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              {errorsLoading ? (
                <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
              ) : !queryErrors || queryErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  ไม่พบข้อผิดพลาด
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>ตาราง</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>ข้อความผิดพลาด</TableHead>
                      <TableHead>Query</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryErrors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell className="text-sm">
                          {new Date(error.createdAt).toLocaleString("th-TH")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{error.tableName || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{error.operationType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-destructive truncate">
                            {error.errorMessage}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-xs font-mono">
                          {error.queryText}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
