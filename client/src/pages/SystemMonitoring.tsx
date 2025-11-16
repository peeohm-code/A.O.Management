import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Activity, Database, MemoryStick, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";


/**
 * SystemMonitoring - รวม DB Monitor, System Monitor และ Memory Monitoring ในหน้าเดียว
 * แยกเป็น 3 tabs: Database, System Resources, Memory Usage
 */
export default function SystemMonitoring() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Get tab from URL query parameter, default to "database"
  const params = new URLSearchParams(window.location.search);
  const activeTab = params.get("tab") || "database";
  
  const handleTabChange = (value: string) => {
    setLocation(`/system-monitoring?tab=${value}`);
  };

  // Check admin permission
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ เฉพาะ Admin เท่านั้น
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            ตรวจสอบสถานะระบบ ฐานข้อมูล และการใช้งานทรัพยากร
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Admin Only
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">System Resources</span>
          </TabsTrigger>
          <TabsTrigger value="memory" className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4" />
            <span className="hidden sm:inline">Memory Usage</span>
          </TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <DatabaseMonitoringContent />
        </TabsContent>

        {/* System Resources Tab */}
        <TabsContent value="system" className="space-y-4">
          <SystemMonitorContent />
        </TabsContent>

        {/* Memory Usage Tab */}
        <TabsContent value="memory" className="space-y-4">
          <MemoryMonitoringContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Database Monitoring Content
 */
function DatabaseMonitoringContent() {
  const { data: dbStats, isLoading, refetch } = trpc.monitoring.getDatabaseStats.useQuery(undefined, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Database Statistics</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dbStats?.tables.map((table: any) => (
          <Card key={table.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{table.name}</CardTitle>
              <CardDescription>Table Statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rows:</span>
                  <span className="font-medium">{table.rowCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{formatBytes(table.dataSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Index Size:</span>
                  <span className="font-medium">{formatBytes(table.indexSize)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dbStats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-2xl font-bold">{dbStats.tables.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">
                  {dbStats.tables.reduce((sum: number, t: any) => sum + t.rowCount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-2xl font-bold">
                  {formatBytes(dbStats.tables.reduce((sum: number, t: any) => sum + t.dataSize + t.indexSize, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * System Monitor Content
 */
function SystemMonitorContent() {
  const { data: systemStats, isLoading, refetch } = trpc.monitoring.getSystemStats.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!systemStats) {
    return (
      <Alert>
        <AlertDescription>ไม่สามารถโหลดข้อมูลระบบได้</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">System Resources</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <CardTitle>CPU Usage</CardTitle>
            <CardDescription>Current CPU utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{systemStats.cpu.usage.toFixed(1)}%</span>
                <Badge variant={systemStats.cpu.usage > 80 ? "destructive" : "default"}>
                  {systemStats.cpu.usage > 80 ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(systemStats.cpu.usage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {systemStats.cpu.cores} cores available
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>RAM utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{systemStats.memory.usagePercent.toFixed(1)}%</span>
                <Badge variant={systemStats.memory.usagePercent > 80 ? "destructive" : "default"}>
                  {systemStats.memory.usagePercent > 80 ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(systemStats.memory.usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatBytes(systemStats.memory.used)} / {formatBytes(systemStats.memory.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Disk Usage</CardTitle>
            <CardDescription>Storage utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{systemStats.disk.usagePercent.toFixed(1)}%</span>
                <Badge variant={systemStats.disk.usagePercent > 80 ? "destructive" : "default"}>
                  {systemStats.disk.usagePercent > 80 ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(systemStats.disk.usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatBytes(systemStats.disk.used)} / {formatBytes(systemStats.disk.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader>
            <CardTitle>System Uptime</CardTitle>
            <CardDescription>Time since last restart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{formatUptime(systemStats.uptime)}</p>
              <p className="text-sm text-muted-foreground">
                Platform: {systemStats.platform}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Memory Monitoring Content
 */
function MemoryMonitoringContent() {
  const { data: memoryStats, isLoading, refetch } = trpc.monitoring.getMemoryStats.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!memoryStats) {
    return (
      <Alert>
        <AlertDescription>ไม่สามารถโหลดข้อมูล Memory ได้</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Memory Usage Details</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Heap Memory */}
        <Card>
          <CardHeader>
            <CardTitle>Heap Memory</CardTitle>
            <CardDescription>Node.js heap usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Used</span>
                  <span className="text-sm font-medium">{formatBytes(memoryStats.heapUsed)}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(memoryStats.heapUsed / memoryStats.heapTotal) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">{formatBytes(memoryStats.heapTotal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Limit</p>
                  <p className="font-medium">{formatBytes(memoryStats.heapLimit)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* External Memory */}
        <Card>
          <CardHeader>
            <CardTitle>External Memory</CardTitle>
            <CardDescription>C++ objects bound to JS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{formatBytes(memoryStats.external)}</div>
              <p className="text-sm text-muted-foreground">
                Memory used by C++ objects bound to JavaScript
              </p>
            </div>
          </CardContent>
        </Card>

        {/* RSS Memory */}
        <Card>
          <CardHeader>
            <CardTitle>RSS Memory</CardTitle>
            <CardDescription>Resident Set Size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{formatBytes(memoryStats.rss)}</div>
              <p className="text-sm text-muted-foreground">
                Total memory allocated for the process
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Array Buffers */}
        <Card>
          <CardHeader>
            <CardTitle>Array Buffers</CardTitle>
            <CardDescription>ArrayBuffer and SharedArrayBuffer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{formatBytes(memoryStats.arrayBuffers)}</div>
              <p className="text-sm text-muted-foreground">
                Memory allocated for ArrayBuffers and SharedArrayBuffers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Health Alert */}
      {memoryStats.heapUsed / memoryStats.heapLimit > 0.8 && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠️ Heap memory usage is above 80%. Consider optimizing memory usage or increasing heap limit.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Helper Functions
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "< 1m";
}
