import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Activity, Database, HardDrive, Zap, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SystemMonitor() {
  const { data: healthStatus, refetch: refetchHealth } = trpc.health.getHealthStatus.useQuery();
  const { data: memoryStats, refetch: refetchMemory } = trpc.health.getMemoryStats.useQuery();
  const { data: systemInfo } = trpc.health.getSystemInfo.useQuery();
  const { data: cacheStats, refetch: refetchCache } = trpc.cache.getStats.useQuery();
  const { data: tableSizes } = trpc.optimization.analyzeTableSizes.useQuery();
  const { data: recommendations } = trpc.optimization.getRecommendations.useQuery();

  const applyIndexesMutation = trpc.optimization.applyIndexes.useMutation({
    onSuccess: (data) => {
      toast.success(`Applied ${data.applied} indexes successfully`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} errors occurred`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to apply indexes: ${error.message}`);
    },
  });

  const clearCacheMutation = trpc.cache.clearAll.useMutation({
    onSuccess: () => {
      toast.success("Cache cleared successfully");
      refetchCache();
    },
  });

  const cleanupCacheMutation = trpc.cache.cleanup.useMutation({
    onSuccess: (data) => {
      toast.success(`Removed ${data.removed} expired entries`);
      refetchCache();
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "critical":
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Monitor</h1>
        <p className="text-muted-foreground">
          Monitor system health, memory usage, and database performance
        </p>
      </div>

      {/* Overall Health Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Overall system status and alerts</CardDescription>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(healthStatus?.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchHealth();
                  refetchMemory();
                  refetchCache();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {healthStatus?.issues && healthStatus.issues.length > 0 ? (
            <div className="space-y-2">
              {healthStatus.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <p className="text-sm">{issue}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All systems operating normally</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="memory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="memory">
            <HardDrive className="h-4 w-4 mr-2" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="cache">
            <Zap className="h-4 w-4 mr-2" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {memoryStats?.formatted && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Used</span>
                        <span className="text-sm font-medium">{memoryStats.formatted.usedPercentage}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(memoryStats.formatted.usedPercentage) > 85
                              ? "bg-red-500"
                              : parseFloat(memoryStats.formatted.usedPercentage) > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: memoryStats.formatted.usedPercentage }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.totalMemory}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Free:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.freeMemory}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Used:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.usedMemory}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Swap Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {memoryStats?.formatted && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Used</span>
                        <span className="text-sm font-medium">{memoryStats.formatted.swapPercentage}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(memoryStats.formatted.swapPercentage) > 50
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: memoryStats.formatted.swapPercentage }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.swapTotal}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Free:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.swapFree}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Used:</span>
                        <span className="ml-2 font-medium">{memoryStats.formatted.swapUsed}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              {systemInfo && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="ml-2 font-medium">{systemInfo.platform}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Architecture:</span>
                    <span className="ml-2 font-medium">{systemInfo.arch}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPU Cores:</span>
                    <span className="ml-2 font-medium">{systemInfo.cpuCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Node Version:</span>
                    <span className="ml-2 font-medium">{systemInfo.nodeVersion}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">System Uptime:</span>
                    <span className="ml-2 font-medium">{Math.floor(systemInfo.uptime / 3600)}h</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Process Uptime:</span>
                    <span className="ml-2 font-medium">{Math.floor(systemInfo.processUptime / 3600)}h</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Database Optimization</CardTitle>
                  <CardDescription>Apply indexes to improve query performance</CardDescription>
                </div>
                <Button
                  onClick={() => applyIndexesMutation.mutate()}
                  disabled={applyIndexesMutation.isPending}
                >
                  {applyIndexesMutation.isPending ? "Applying..." : "Apply Indexes"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Applying recommended indexes can significantly improve query performance for large datasets.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Table Sizes</CardTitle>
              <CardDescription>Database storage usage by table</CardDescription>
            </CardHeader>
            <CardContent>
              {tableSizes?.tables && tableSizes.tables.length > 0 ? (
                <div className="space-y-2">
                  {tableSizes.tables.map((table) => (
                    <div key={table.table} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{table.table}</p>
                        <p className="text-sm text-muted-foreground">{table.rows.toLocaleString()} rows</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{table.totalSize}</p>
                        <p className="text-muted-foreground">Data: {table.dataSize} | Index: {table.indexSize}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cache Statistics</CardTitle>
                  <CardDescription>In-memory cache performance metrics</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cleanupCacheMutation.mutate()}
                    disabled={cleanupCacheMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cleanup
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cacheStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Hit Rate</p>
                    <p className="text-2xl font-bold">{cacheStats.hitRate}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Cache Size</p>
                    <p className="text-2xl font-bold">{cacheStats.size}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Hits</p>
                    <p className="text-2xl font-bold">{cacheStats.hits}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Misses</p>
                    <p className="text-2xl font-bold">{cacheStats.misses}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>Suggestions to improve system performance</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        rec.type === "critical"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : rec.type === "warning"
                          ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                          : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 ${
                            rec.type === "critical"
                              ? "text-red-600"
                              : rec.type === "warning"
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{rec.category}</Badge>
                            <Badge
                              className={
                                rec.type === "critical"
                                  ? "bg-red-500"
                                  : rec.type === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }
                            >
                              {rec.type}
                            </Badge>
                          </div>
                          <p className="font-medium mb-1">{rec.message}</p>
                          {rec.action && <p className="text-sm text-muted-foreground">{rec.action}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations at this time</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
