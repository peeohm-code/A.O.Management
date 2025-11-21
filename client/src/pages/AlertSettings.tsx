import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Bell, Cpu, MemoryStick, Trash2, Plus, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface AlertThreshold {
  id: number;
  userId: number;
  metricType: "cpu" | "memory";
  threshold: number;
  isEnabled: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function AlertSettings() {
  const utils = trpc.useUtils();
  const { data: thresholds, isLoading } = trpc.alertThresholds.list.useQuery();
  
  const [cpuThreshold, setCpuThreshold] = useState<number>(80);
  const [memoryThreshold, setMemoryThreshold] = useState<number>(80);
  const [cpuEnabled, setCpuEnabled] = useState<boolean>(true);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);

  // Load existing thresholds
  useEffect(() => {
    if (thresholds) {
      const cpu = thresholds?.items?.find((t: AlertThreshold) => t.metricType === "cpu");
      const memory = thresholds?.items?.find((t: AlertThreshold) => t.metricType === "memory");
      
      if (cpu) {
        setCpuThreshold(cpu.threshold);
        setCpuEnabled(Boolean(cpu.isEnabled));
      }
      if (memory) {
        setMemoryThreshold(memory.threshold);
        setMemoryEnabled(Boolean(memory.isEnabled));
      }
    }
  }, [thresholds]);

  const createMutation = trpc.alertThresholds.create.useMutation({
    onSuccess: () => {
      utils.alertThresholds.list.invalidate();
      toast.success("สร้าง Alert Threshold สำเร็จ");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const updateMutation = trpc.alertThresholds.update.useMutation({
    onSuccess: () => {
      utils.alertThresholds.list.invalidate();
      toast.success("อัปเดต Alert Threshold สำเร็จ");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const deleteMutation = trpc.alertThresholds.delete.useMutation({
    onSuccess: () => {
      utils.alertThresholds.list.invalidate();
      toast.success("ลบ Alert Threshold สำเร็จ");
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleSaveCpu = () => {
    const existing = thresholds?.find((t: AlertThreshold) => t.metricType === "cpu");
    
    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        threshold: cpuThreshold,
        isEnabled: cpuEnabled,
      });
    } else {
      createMutation.mutate({
        metricType: "cpu",
        threshold: cpuThreshold,
        isEnabled: cpuEnabled,
      });
    }
  };

  const handleSaveMemory = () => {
    const existing = thresholds?.find((t: AlertThreshold) => t.metricType === "memory");
    
    if (existing) {
      updateMutation.mutate({
        id: existing.id,
        threshold: memoryThreshold,
        isEnabled: memoryEnabled,
      });
    } else {
      createMutation.mutate({
        metricType: "memory",
        threshold: memoryThreshold,
        isEnabled: memoryEnabled,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Alert Threshold นี้?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const cpuThresholdData = thresholds?.find((t: AlertThreshold) => t.metricType === "cpu");
  const memoryThresholdData = thresholds?.find((t: AlertThreshold) => t.metricType === "memory");

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">ตั้งค่าการแจ้งเตือน</h1>
            <p className="text-muted-foreground">
              กำหนดค่า threshold สำหรับการแจ้งเตือนเมื่อ CPU หรือ Memory เกินค่าที่กำหนด
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* CPU Threshold Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                <CardTitle>CPU Usage Alert</CardTitle>
              </div>
              <CardDescription>
                แจ้งเตือนเมื่อการใช้งาน CPU เกินค่าที่กำหนด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpu-threshold">Threshold (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="cpu-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={cpuThreshold}
                    onChange={(e) => setCpuThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center justify-center px-3 border rounded-md bg-muted">
                    %
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  แจ้งเตือนเมื่อ CPU usage ≥ {cpuThreshold}%
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cpu-enabled">เปิดใช้งานการแจ้งเตือน</Label>
                <Switch
                  id="cpu-enabled"
                  checked={cpuEnabled}
                  onCheckedChange={setCpuEnabled}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveCpu}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {cpuThresholdData ? "อัปเดต" : "สร้าง"}
                </Button>
                {cpuThresholdData && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(cpuThresholdData.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {cpuThresholdData && (
                <div className="text-xs text-muted-foreground">
                  อัปเดตล่าสุด: {new Date(cpuThresholdData.updatedAt).toLocaleString("th-TH")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memory Threshold Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5 text-purple-500" />
                <CardTitle>Memory Usage Alert</CardTitle>
              </div>
              <CardDescription>
                แจ้งเตือนเมื่อการใช้งาน Memory เกินค่าที่กำหนด
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memory-threshold">Threshold (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="memory-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={memoryThreshold}
                    onChange={(e) => setMemoryThreshold(Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center justify-center px-3 border rounded-md bg-muted">
                    %
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  แจ้งเตือนเมื่อ Memory usage ≥ {memoryThreshold}%
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="memory-enabled">เปิดใช้งานการแจ้งเตือน</Label>
                <Switch
                  id="memory-enabled"
                  checked={memoryEnabled}
                  onCheckedChange={setMemoryEnabled}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveMemory}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {memoryThresholdData ? "อัปเดต" : "สร้าง"}
                </Button>
                {memoryThresholdData && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(memoryThresholdData.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {memoryThresholdData && (
                <div className="text-xs text-muted-foreground">
                  อัปเดตล่าสุด: {new Date(memoryThresholdData.updatedAt).toLocaleString("th-TH")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">วิธีการทำงาน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              • ระบบจะตรวจสอบการใช้งาน CPU และ Memory อย่างต่อเนื่อง
            </p>
            <p>
              • เมื่อค่าเกิน threshold ที่กำหนด ระบบจะส่งการแจ้งเตือนให้คุณทันที
            </p>
            <p>
              • คุณสามารถเปิด/ปิดการแจ้งเตือนแต่ละประเภทได้อิสระ
            </p>
            <p>
              • แนะนำให้ตั้งค่า threshold ที่ 70-85% สำหรับการแจ้งเตือนที่มีประสิทธิภาพ
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
