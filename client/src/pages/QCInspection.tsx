import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, MinusCircle, Upload, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type InspectionResult = "pass" | "fail" | "na";

interface ItemResult {
  itemId: number;
  result: InspectionResult | null;
  comment: string;
  photoUrl?: string;
}

export default function QCInspection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [itemResults, setItemResults] = useState<Record<number, ItemResult>>({});

  // Queries
  const { data: tasks, isLoading: tasksLoading } = trpc.task.list.useQuery({});
  const { data: checklists } = trpc.checklist.getTaskChecklists.useQuery(
    { taskId: selectedTaskId! },
    { enabled: !!selectedTaskId }
  );

  const selectedTask = tasks?.find((t) => t.id === selectedTaskId);
  const selectedChecklist = checklists?.find((c) => c.id === selectedChecklistId);

  const handleSelectTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setStep(2);
  };

  const handleSelectChecklist = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    const checklist = checklists?.find((c) => c.id === checklistId);
    if (checklist?.items) {
      const initialResults: Record<number, ItemResult> = {};
      checklist.items.forEach((item: any) => {
        initialResults[item.id] = {
          itemId: item.id,
          result: null,
          comment: "",
        };
      });
      setItemResults(initialResults);
    }
    setStep(3);
  };

  const handleResultChange = (itemId: number, result: InspectionResult) => {
    setItemResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], result },
    }));
  };

  const handleCommentChange = (itemId: number, comment: string) => {
    setItemResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment },
    }));
  };

  const handleSubmit = () => {
    const allFilled = Object.values(itemResults).every((r) => r.result !== null);
    if (!allFilled) {
      toast.error("กรุณากรอกผลการตรวจสอบให้ครบทุกรายการ");
      return;
    }

    const passCount = Object.values(itemResults).filter((r) => r.result === "pass").length;
    const failCount = Object.values(itemResults).filter((r) => r.result === "fail").length;
    const naCount = Object.values(itemResults).filter((r) => r.result === "na").length;

    toast.success(
      `บันทึกผลการตรวจสอบเรียบร้อย\nผ่าน: ${passCount} | ไม่ผ่าน: ${failCount} | N/A: ${naCount}`
    );

    // Reset
    setStep(1);
    setSelectedTaskId(null);
    setSelectedChecklistId(null);
    setItemResults({});
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      pre_execution: "ก่อนเริ่มงาน",
      in_progress: "ระหว่างทำงาน",
      post_execution: "หลังเสร็จงาน",
    };
    return labels[stage] || stage;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { label: "รอตรวจ", className: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "กำลังตรวจ", className: "bg-blue-100 text-blue-800" },
      passed: { label: "ผ่าน", className: "bg-green-100 text-green-800" },
      failed: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">QC Inspection</h1>
        <p className="text-muted-foreground mt-2">ตรวจสอบคุณภาพงานตาม Checklist</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-4">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-muted"}`}>
            1
          </div>
          <span className="font-medium">เลือกงาน</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-muted"}`}>
            2
          </div>
          <span className="font-medium">เลือก Checklist</span>
        </div>
        <div className="w-12 h-0.5 bg-border" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-white" : "bg-muted"}`}>
            3
          </div>
          <span className="font-medium">ทำการตรวจสอบ</span>
        </div>
      </div>

      {/* Step 1: Select Task */}
      {step === 1 && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>ขั้นตอนที่ 1: เลือกงานที่ต้องการตรวจสอบ</CardTitle>
              <CardDescription>
                คลิกที่การ์ดงานเพื่อดู Checklist ที่กำหนดไว้
              </CardDescription>
            </CardHeader>
          </Card>

          {tasksLoading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : tasks && tasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectTask(task.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <CardDescription>
                      ความคืบหน้า: {task.progress || 0}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge>{task.status}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบงานในระบบ</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Select Checklist */}
      {step === 2 && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>ขั้นตอนที่ 2: เลือก Checklist</CardTitle>
              <CardDescription>
                งาน: <strong>{selectedTask?.name}</strong>
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="mb-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปเลือกงาน
            </Button>
          </div>

          {checklists && checklists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {checklists.map((checklist: any) => (
                <Card
                  key={checklist.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleSelectChecklist(checklist.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{checklist.templateName || "Checklist"}</CardTitle>
                        <CardDescription className="mt-1">
                          ระยะ: {getStageLabel(checklist.stage)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(checklist.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{checklist.items?.length || 0} รายการ</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>งานนี้ยังไม่มี Checklist กำหนดไว้</p>
                <p className="text-sm mt-2">กรุณาไปที่หน้า Task Detail เพื่อเพิ่ม Checklist</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Perform Inspection */}
      {step === 3 && selectedChecklist && (
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>ขั้นตอนที่ 3: ทำการตรวจสอบ</CardTitle>
              <CardDescription>
                งาน: <strong>{selectedTask?.name}</strong> | Checklist: <strong>{selectedChecklist.templateName}</strong>
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="mb-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปเลือก Checklist
            </Button>
          </div>

          <div className="space-y-4">
            {selectedChecklist.items?.map((item: any, index: number) => {
              const result = itemResults[item.id];
              const isIncomplete = result?.result === null;

              return (
                <Card key={item.id} className={isIncomplete ? "border-yellow-300 bg-yellow-50/30" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-start gap-2">
                      <span className="text-muted-foreground">#{index + 1}</span>
                      <span className="flex-1">{item.itemText}</span>
                      {item.requirePhoto && (
                        <Badge variant="outline" className="text-xs">
                          ต้องมีรูปภาพ
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-3 block font-medium">ผลการตรวจสอบ *</Label>
                      <RadioGroup
                        value={result?.result || ""}
                        onValueChange={(value) => handleResultChange(item.id, value as InspectionResult)}
                      >
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                            <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span>ผ่าน</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                            <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span>ไม่ผ่าน</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="na" id={`na-${item.id}`} />
                            <Label htmlFor={`na-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                              <MinusCircle className="w-4 h-4 text-gray-600" />
                              <span>N/A</span>
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor={`comment-${item.id}`} className="mb-2 block">
                        ความเห็น
                      </Label>
                      <Textarea
                        id={`comment-${item.id}`}
                        placeholder="กรอกความเห็นเพิ่มเติม (ถ้ามี)"
                        value={result?.comment || ""}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        rows={2}
                      />
                    </div>

                    {item.requirePhoto && (
                      <div>
                        <Label className="mb-2 block">อัพโหลดรูปภาพ *</Label>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          เลือกไฟล์
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSubmit} size="lg">
              ส่งผลการตรวจสอบ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
