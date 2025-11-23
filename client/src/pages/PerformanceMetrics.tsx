import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Zap,
  Clock,
  Database
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

/**
 * Performance Metrics Dashboard
 * 
 * Admin-only dashboard แสดง query performance metrics แบบ real-time
 * พร้อม charts และ recommendations สำหรับ performance optimization
 */
export default function PerformanceMetrics() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch performance data
  // TODO: Implement getPerformanceReport procedure in performanceRouter
  const { data: report, isLoading, refetch }: { data: any, isLoading: boolean, refetch: () => void } = { data: undefined, isLoading: false, refetch: () => {} };
  // const { data: report, isLoading, refetch } = trpc.performance.getPerformanceReport.useQuery(
  //   undefined,
  //   {
  //     refetchInterval: autoRefresh ? 5000 : false,
  //   }
  // );

  // TODO: Implement clearQueryMetrics procedure in performanceRouter
  const clearMetricsMutation = { mutate: () => {}, isPending: false };
  // const clearMetricsMutation = trpc.performance.clearQueryMetrics.useMutation({
  //   onSuccess: () => {
  //     refetch();
  //   },
  // });

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Clear metrics
  const handleClearMetrics = () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูล metrics ทั้งหมด?")) {
      clearMetricsMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ไม่พบข้อมูล</AlertTitle>
          <AlertDescription>
            ไม่สามารถโหลดข้อมูล performance metrics ได้
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { summary, slowQueriesByPattern, recommendations } = report;

  // Prepare chart data
  const slowQueriesChartData = Object.entries(slowQueriesByPattern)
    .slice(0, 10)
    .map(([pattern, stats]: [string, any]) => ({
      name: pattern.substring(0, 40) + "...",
      count: stats.count,
      avgDuration: Math.round(stats.avgDuration),
      maxDuration: Math.round(stats.maxDuration),
    }));

  // Performance score calculation
  const slowQueryPercentage = summary.totalQueries > 0 
    ? (summary.slowQueries.length / summary.totalQueries) * 100 
    : 0;
  
  const performanceScore = Math.max(0, 100 - slowQueryPercentage * 2);
  const performanceGrade = 
    performanceScore >= 90 ? "excellent" :
    performanceScore >= 70 ? "good" :
    performanceScore >= 50 ? "fair" : "poor";

  const gradeColors = {
    excellent: "text-green-600",
    good: "text-blue-600",
    fair: "text-yellow-600",
    poor: "text-red-600",
  };

  const gradeIcons = {
    excellent: CheckCircle2,
    good: TrendingUp,
    fair: Activity,
    poor: TrendingDown,
  };

  const GradeIcon = gradeIcons[performanceGrade];

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
          <p className="text-muted-foreground">
            ติดตามและวิเคราะห์ database query performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRefresh}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearMetrics}
            disabled={clearMetricsMutation.isPending}
          >
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Performance Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GradeIcon className={`h-6 w-6 ${gradeColors[performanceGrade]}`} />
            Performance Score
          </CardTitle>
          <CardDescription>
            คะแนนประเมินประสิทธิภาพโดยรวมของระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${gradeColors[performanceGrade]}`}>
              {Math.round(performanceScore)}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-semibold capitalize mb-2">
                {performanceGrade}
              </div>
              <div className="text-sm text-muted-foreground">
                {slowQueryPercentage.toFixed(1)}% slow queries (threshold: 100ms)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Queries tracked in memory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgDuration.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground">
              Range: {summary.minDuration.toFixed(2)}ms - {summary.maxDuration.toFixed(2)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.slowQueries.length}</div>
            <p className="text-xs text-muted-foreground">
              {slowQueryPercentage.toFixed(1)}% of total queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Duration</CardTitle>
            <Zap className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.maxDuration.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground">
              Slowest query recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Performance Recommendations
            </CardTitle>
            <CardDescription>
              คำแนะนำสำหรับปรับปรุง performance จากการวิเคราะห์อัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
                  {recommendations.map((rec: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Slow Queries by Pattern Chart */}
      {slowQueriesChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slow Queries by Pattern</CardTitle>
            <CardDescription>
              Top 10 slow query patterns จัดกลุ่มตาม query structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={slowQueriesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Query Count" />
                <Bar dataKey="avgDuration" fill="#f59e0b" name="Avg Duration (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Slow Queries Table */}
      {summary.slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 20 Slowest Queries</CardTitle>
            <CardDescription>
              รายการ queries ที่ใช้เวลานานที่สุด (เรียงตามเวลา)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Duration</th>
                    <th className="text-left p-2">Query</th>
                    <th className="text-left p-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.slowQueries.slice(0, 20).map((query: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">
                        <Badge 
                          variant={query.duration > 500 ? "destructive" : query.duration > 200 ? "default" : "secondary"}
                        >
                          {query.duration.toFixed(2)}ms
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs max-w-md truncate">
                        {query.query}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(query.timestamp).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {summary.totalQueries === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">ยังไม่มีข้อมูล</h3>
            <p className="text-muted-foreground">
              ยังไม่มี query metrics ในระบบ กรุณาใช้งานระบบเพื่อเริ่มเก็บข้อมูล
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
