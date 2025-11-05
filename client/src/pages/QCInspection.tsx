import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

export default function QCInspection() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  const { data: tasks, isLoading: tasksLoading } = trpc.task.list.useQuery({});
  const { data: checklists, isLoading: checklistsLoading } = trpc.checklist.getTaskChecklists.useQuery(
    { taskId: selectedTaskId! },
    { enabled: !!selectedTaskId }
  );

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QC Inspection</h1>
        <p className="text-muted-foreground">ตรวจสอบคุณภาพงาน</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks Column */}
        <Card>
          <CardHeader>
            <CardTitle>งาน (Tasks)</CardTitle>
            <CardDescription>เลือกงานที่ต้องการตรวจสอบ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks?.map((task) => (
              <Button
                key={task.id}
                variant={selectedTaskId === task.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTaskId(task.id);
                  setSelectedChecklistId(null);
                }}
              >
                <div className="text-left">
                  <div className="font-medium">{task.name}</div>
                  <div className="text-xs text-muted-foreground">{task.status}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Checklists Column */}
        <Card>
          <CardHeader>
            <CardTitle>Checklists</CardTitle>
            <CardDescription>
              {selectedTaskId ? "เลือก checklist ที่ต้องการตรวจ" : "กรุณาเลือกงานก่อน"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklistsLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
            {checklists?.map((checklist) => (
              <Button
                key={checklist.id}
                variant={selectedChecklistId === checklist.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedChecklistId(checklist.id)}
              >
                <div className="text-left w-full">
                  <div className="font-medium">Checklist #{checklist.id}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{checklist.stage}</span>
                    <Badge variant={
                      checklist.status === "passed" ? "default" :
                      checklist.status === "failed" ? "destructive" :
                      checklist.status === "in_progress" ? "secondary" : "outline"
                    }>
                      {checklist.status}
                    </Badge>
                  </div>
                </div>
              </Button>
            ))}
            {!selectedTaskId && (
              <p className="text-sm text-muted-foreground text-center py-4">
                เลือกงานเพื่อดู checklists
              </p>
            )}
            {selectedTaskId && checklists?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                ไม่มี checklist สำหรับงานนี้
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inspection Column */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection</CardTitle>
            <CardDescription>
              {selectedChecklistId ? "ทำการตรวจสอบ" : "กรุณาเลือก checklist"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChecklistId ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  ฟีเจอร์การตรวจสอบจะเพิ่มในขั้นตอนถัดไป
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Pass
                  </Button>
                  <Button variant="outline" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Fail
                  </Button>
                  <Button variant="outline" size="sm">
                    <MinusCircle className="h-4 w-4 mr-2" />
                    N/A
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                เลือก checklist เพื่อเริ่มตรวจสอบ
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
