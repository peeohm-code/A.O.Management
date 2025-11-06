import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ClipboardCheck, PieChart as PieChartIcon, Calendar, User } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

type InspectionResult = "pass" | "fail" | "na";

interface ItemResult {
  itemId: number;
  result: InspectionResult | null;
}

export default function QCInspection() {
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [itemResults, setItemResults] = useState<Record<number, ItemResult>>({});
  const [generalComments, setGeneralComments] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);

  // Queries - get all checklists across all tasks
  const { data: tasks } = trpc.task.list.useQuery({});
  
  // Get all task checklists for overview
  const allChecklistsQueries = tasks?.map(task => 
    trpc.checklist.getTaskChecklists.useQuery({ taskId: task.id })
  ) || [];
  
  const allChecklists = allChecklistsQueries
    .filter(q => q.data)
    .flatMap(q => q.data || [])
    .map(checklist => {
      const task = tasks?.find(t => t.id === checklist.taskId);
      return { ...checklist, taskName: task?.name || "Unknown Task" };
    });

  // Calculate real stats from all checklists
  const checklistStats = allChecklists.reduce((acc, checklist) => {
    const status = checklist.status || 'not_started';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = {
    not_started: checklistStats.not_started || 0,
    pending_inspection: checklistStats.pending_inspection || 0,
    completed: checklistStats.completed || 0,
    failed: checklistStats.failed || 0,
  };

  const selectedChecklist = allChecklists.find(c => c.id === selectedChecklistId);

  const updateChecklistMutation = trpc.checklist.updateChecklistStatus.useMutation({
    onSuccess: () => {
      toast.success("บันทึกผลการตรวจสอบสำเร็จ");
      setIsInspecting(false);
      setSelectedChecklistId(null);
      setItemResults({});
      setGeneralComments("");
      // Invalidate to refresh data
      allChecklistsQueries.forEach(q => q.refetch());
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleStartInspection = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setIsInspecting(true);
    setItemResults({});
    setGeneralComments("");
  };

  const handleItemResult = (itemId: number, result: InspectionResult) => {
    setItemResults(prev => ({
      ...prev,
      [itemId]: { itemId, result }
    }));
  };

  const handleSubmitInspection = () => {
    if (!selectedChecklist) return;

    const items = selectedChecklist.items as any[];
    const allItemsChecked = items.every(item => itemResults[item.id]?.result);

    if (!allItemsChecked) {
      toast.error("กรุณาตรวจสอบรายการให้ครบทุกข้อ");
      return;
    }

    const hasFailures = Object.values(itemResults).some(r => r.result === "fail");
    const finalStatus = hasFailures ? "failed" : "completed";

    updateChecklistMutation.mutate({
      id: selectedChecklist.id,
      status: finalStatus,
      generalComments: generalComments || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      not_started: { label: "ยังไม่เริ่ม", className: "bg-gray-100 text-gray-700" },
      pending_inspection: { label: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-700" },
      completed: { label: "ผ่าน", className: "bg-green-100 text-green-700" },
      failed: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = config[status] || config.not_started;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QC Inspection Overview</h1>
        <p className="text-muted-foreground mt-1">
          ระบบตรวจสอบคุณภาพงานก่อสร้าง
        </p>
      </div>

      {/* Checklist Overview Stats */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <CardTitle>สรุปสถานะ Checklists ทั้งหมด</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'รอตรวจสอบ', value: stats.pending_inspection, color: '#FBBF24' },
                      { name: 'ผ่าน', value: stats.completed, color: '#10B981' },
                      { name: 'ไม่ผ่าน', value: stats.failed, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'ยังไม่เริ่ม', value: stats.not_started, color: '#9CA3AF' },
                      { name: 'รอตรวจสอบ', value: stats.pending_inspection, color: '#FBBF24' },
                      { name: 'ผ่าน', value: stats.completed, color: '#10B981' },
                      { name: 'ไม่ผ่าน', value: stats.failed, color: '#EF4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-1/2">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{stats.not_started}</div>
                  <div className="text-sm text-muted-foreground">ยังไม่เริ่ม</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending_inspection}</div>
                  <div className="text-sm text-muted-foreground">รอตรวจสอบ</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">ผ่าน</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-muted-foreground">ไม่ผ่าน</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklists Grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Checklists ทั้งหมด</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allChecklists.map((checklist) => (
            <Card key={checklist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{checklist.name}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {checklist.taskName}
                    </CardDescription>
                  </div>
                  {getStatusBadge(checklist.status || 'not_started')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>{(checklist.items as any[])?.length || 0} รายการ</span>
                  </div>
                  {checklist.inspectedBy && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>ตรวจโดย: User #{checklist.inspectedBy}</span>
                    </div>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleStartInspection(checklist.id)}
                    disabled={checklist.status === 'completed'}
                  >
                    {checklist.status === 'completed' ? 'ตรวจสอบแล้ว' : 'เริ่มตรวจสอบ'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Inspection Dialog */}
      <Dialog open={isInspecting} onOpenChange={setIsInspecting}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChecklist?.name}</DialogTitle>
            <DialogDescription>
              งาน: {selectedChecklist?.taskName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Inspection Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">รายการตรวจสอบ</h3>
              {(selectedChecklist?.items as any[] || []).map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.acceptanceCriteria && (
                          <p className="text-sm text-muted-foreground mt-1">
                            เกณฑ์: {item.acceptanceCriteria}
                          </p>
                        )}
                      </div>
                      <RadioGroup
                        value={itemResults[item.id]?.result || ""}
                        onValueChange={(value) => handleItemResult(item.id, value as InspectionResult)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                            <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-1 cursor-pointer">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ผ่าน
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                            <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-1 cursor-pointer">
                              <XCircle className="h-4 w-4 text-red-600" />
                              ไม่ผ่าน
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* General Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments">ความเห็นเพิ่มเติม</Label>
              <Textarea
                id="comments"
                placeholder="ระบุความเห็นหรือข้อสังเกต (ถ้ามี)"
                value={generalComments}
                onChange={(e) => setGeneralComments(e.target.value)}
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsInspecting(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSubmitInspection} disabled={updateChecklistMutation.isPending}>
                {updateChecklistMutation.isPending ? "กำลังบันทึก..." : "บันทึกผลการตรวจสอบ"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
