import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, MinusCircle, Upload, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type InspectionResult = "pass" | "fail" | "na";

interface ItemResult {
  itemId: number;
  result: InspectionResult | null;
}

export default function QCInspection() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [itemResults, setItemResults] = useState<Record<number, ItemResult>>({});
  const [generalComments, setGeneralComments] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

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
        };
      });
      setItemResults(initialResults);
    }
    setGeneralComments("");
    setPhotoFiles([]);
    setStep(3);
  };

  const handleResultChange = (itemId: number, result: InspectionResult) => {
    setItemResults((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], result },
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const submitInspectionMutation = trpc.checklist.submitInspection.useMutation({
    onSuccess: (data) => {
      toast.success(
        `บันทึกผลการตรวจสอบเรียบร้อย\nผ่าน: ${data.passedCount} | ไม่ผ่าน: ${data.failedCount}${data.defectsCreated > 0 ? `\nสร้าง Defect: ${data.defectsCreated} รายการ` : ''}`
      );

      // Reset
      setStep(1);
      setSelectedTaskId(null);
      setSelectedChecklistId(null);
      setItemResults({});
      setGeneralComments("");
      setPhotoFiles([]);
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleSubmit = async () => {
    const allFilled = Object.values(itemResults).every((r) => r.result !== null);
    if (!allFilled) {
      toast.error("กรุณากรอกผลการตรวจสอบให้ครบทุกรายการ");
      return;
    }

    if (!selectedChecklistId || !selectedTaskId || !selectedChecklist) {
      toast.error("ไม่พบข้อมูล checklist");
      return;
    }

    // TODO: Upload photos to S3 if there are any
    const photoUrls: string[] = [];
    // For now, we'll skip photo upload and just send empty array

    // Prepare items with text from checklist
    const items = Object.values(itemResults).map((r) => {
      const item = selectedChecklist.items?.find((i: any) => i.id === r.itemId);
      return {
        templateItemId: r.itemId,
        itemText: item?.itemText || "",
        result: r.result!,
      };
    });

    submitInspectionMutation.mutate({
      taskChecklistId: selectedChecklistId,
      taskId: selectedTaskId,
      items,
      generalComments: generalComments || undefined,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
    });
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      pre_execution: "ก่อนเริ่มงาน",
      in_progress: "ระหว่างทำงาน",
      post_execution: "หลังเสร็จงาน",
    };
    return labels[stage] || stage;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      pre_execution: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      post_execution: "bg-green-100 text-green-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      passed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "รอการตรวจสอบ",
      in_progress: "กำลังตรวจสอบ",
      passed: "ผ่าน",
      failed: "ไม่ผ่าน",
    };
    return labels[status] || status;
  };

  if (tasksLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QC Inspection</h1>
        <p className="text-muted-foreground mt-1">
          ระบบตรวจสอบคุณภาพงานก่อสร้าง
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            1
          </div>
          <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>เลือกงาน</span>
        </div>
        <ArrowRight className="text-muted-foreground" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
          <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>เลือก Checklist</span>
        </div>
        <ArrowRight className="text-muted-foreground" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            3
          </div>
          <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>ทำการตรวจสอบ</span>
        </div>
      </div>

      {/* Step 1: Select Task */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-muted-foreground">
              เลือกงานที่ต้องการทำการตรวจสอบคุณภาพ
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks?.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectTask(task.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <CardDescription>
                    {task.projectName || "ไม่ระบุโครงการ"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {task.progress || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              ไม่พบงานในระบบ
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Checklist */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              ย้อนกลับ
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{selectedTask?.name}</h2>
              <p className="text-sm text-muted-foreground">เลือก Checklist ที่ต้องการตรวจสอบ</p>
            </div>
          </div>

          {checklists && checklists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklists.map((checklist: any) => (
                <Card
                  key={checklist.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectChecklist(checklist.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{checklist.templateName || "ไม่มีชื่อ"}</CardTitle>
                        <CardDescription className="mt-1">
                          {checklist.items?.length || 0} รายการตรวจสอบ
                        </CardDescription>
                      </div>
                      <Badge className={getStageColor(checklist.stage)}>
                        {getStageLabel(checklist.stage)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(checklist.status)}>
                      {getStatusLabel(checklist.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">งานนี้ยังไม่มี Checklist กำหนดไว้</p>
                <p className="text-sm text-muted-foreground mt-2">
                  กรุณาเพิ่ม Checklist ให้กับงานนี้ก่อนทำการตรวจสอบ
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Perform Inspection */}
      {step === 3 && selectedChecklist && (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              ย้อนกลับ
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{selectedChecklist.templateName}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedTask?.name} • {getStageLabel(selectedChecklist.stage)}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายการตรวจสอบ</CardTitle>
              <CardDescription>
                กรุณาเลือกผลการตรวจสอบสำหรับแต่ละรายการ (ผ่าน / ไม่ผ่าน / N/A)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedChecklist.items?.map((item: any, index: number) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-sm text-muted-foreground min-w-[2rem]">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item.itemText}</p>
                    </div>
                  </div>

                  <RadioGroup
                    value={itemResults[item.id]?.result || ""}
                    onValueChange={(value) => handleResultChange(item.id, value as InspectionResult)}
                  >
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                        <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ผ่าน
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                        <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                          <XCircle className="h-4 w-4 text-red-600" />
                          ไม่ผ่าน
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="na" id={`na-${item.id}`} />
                        <Label htmlFor={`na-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                          <MinusCircle className="h-4 w-4 text-gray-600" />
                          N/A
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              ))}

              {/* General Comments Section */}
              {selectedChecklist.allowGeneralComments && (
                <div className="pt-6 border-t space-y-3">
                  <Label htmlFor="generalComments" className="text-base font-semibold">
                    ความเห็นทั่วไป
                  </Label>
                  <Textarea
                    id="generalComments"
                    placeholder="เพิ่มความเห็นหรือข้อสังเกตเพิ่มเติม..."
                    value={generalComments}
                    onChange={(e) => setGeneralComments(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {/* Photo Upload Section */}
              {selectedChecklist.allowPhotos && (
                <div className="pt-6 border-t space-y-3">
                  <Label htmlFor="photos" className="text-base font-semibold">
                    แนบรูปภาพ
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="flex-1"
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {photoFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      เลือกไฟล์แล้ว {photoFiles.length} ไฟล์
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-6">
                <Button onClick={handleSubmit} size="lg">
                  ส่งผลการตรวจสอบ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
