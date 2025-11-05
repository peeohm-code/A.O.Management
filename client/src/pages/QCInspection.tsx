import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, MinusCircle, Upload, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function QCInspection() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [inspectionResults, setInspectionResults] = useState<
    Record<number, { result: "pass" | "fail" | "na"; comment: string; photoUrl?: string }>
  >({});
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<number, boolean>>({});

  const myTasksQuery = trpc.task.myTasks.useQuery();
  const taskChecklistsQuery = trpc.checklist.getTaskChecklists.useQuery(
    { taskId: selectedTaskId || 0 },
    { enabled: !!selectedTaskId }
  );
  const checklistTemplateQuery = trpc.checklist.templates.useQuery();
  const submitInspectionMutation = trpc.checklist.submitInspection.useMutation();
  const uploadMutation = trpc.attachment.upload.useMutation();

  const tasks = myTasksQuery.data || [];
  const checklists = taskChecklistsQuery.data || [];
  const selectedChecklist = checklists.find((c) => c.id === selectedChecklistId);

  // Get template items for selected checklist
  const getTemplateItems = () => {
    if (!selectedChecklist || !checklistTemplateQuery.data) return [];
    
    const allTemplates = [
      ...(checklistTemplateQuery.data.preExecution || []),
      ...(checklistTemplateQuery.data.inProgress || []),
      ...(checklistTemplateQuery.data.postExecution || []),
    ];
    
    const template = allTemplates.find(t => t.name === selectedChecklist.templateName);
    return template?.items || [];
  };

  const templateItems = getTemplateItems();

  const handlePhotoUpload = async (itemId: number, file: File) => {
    if (file.size > 16 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 16MB");
      return;
    }

    setUploadingPhotos(prev => ({ ...prev, [itemId]: true }));

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await uploadMutation.mutateAsync({
          taskId: selectedTaskId!,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64,
        });

        setInspectionResults(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            result: prev[itemId]?.result || "na",
            comment: prev[itemId]?.comment || "",
            photoUrl: result.url,
          },
        }));

        toast.success("อัพโหลดรูปภาพสำเร็จ");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการอัพโหลด");
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleSubmitInspection = async () => {
    if (!selectedChecklistId) {
      toast.error("กรุณาเลือก Checklist");
      return;
    }

    // Validate required items
    for (const item of templateItems) {
      const result = inspectionResults[item.id];
      if (!result || !result.result) {
        toast.error(`กรุณาตรวจสอบรายการ: ${item.description}`);
        return;
      }
      if (item.photoRequired && !result.photoUrl) {
        toast.error(`กรุณาแนบรูปภาพสำหรับ: ${item.description}`);
        return;
      }
    }

    const items = Object.entries(inspectionResults).map(([itemId, data]) => ({
      templateItemId: parseInt(itemId),
      result: data.result,
      comment: data.comment || "",
      photoUrl: data.photoUrl,
    }));

    try {
      await submitInspectionMutation.mutateAsync({
        taskChecklistId: selectedChecklistId,
        items,
      });

      toast.success("บันทึกผลการตรวจสอบสำเร็จ");
      setInspectionResults({});
      setSelectedChecklistId(null);
      taskChecklistsQuery.refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const pendingChecklists = checklists.filter((c) => c.status === "pending" || c.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">QC Inspection</h1>
        <p className="text-gray-600 mt-1">ตรวจสอบคุณภาพงาน</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>งาน (Tasks)</CardTitle>
              <CardDescription>เลือกงานที่ต้องการตรวจสอบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {myTasksQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">ไม่มีงาน</p>
                ) : (
                  tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setSelectedChecklistId(null);
                        setInspectionResults({});
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTaskId === task.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-sm">{task.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {task.projectName}
                      </div>
                      <Badge className="mt-2 text-xs" variant="outline">
                        {task.status}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checklists */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Checklists</CardTitle>
              <CardDescription>
                {selectedTaskId ? "เลือก Checklist ที่ต้องการตรวจ" : "เลือกงานก่อน"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {!selectedTaskId ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    กรุณาเลือกงานก่อน
                  </p>
                ) : taskChecklistsQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pendingChecklists.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    ไม่มี Checklist ที่ต้องตรวจ
                  </p>
                ) : (
                  pendingChecklists.map((checklist) => (
                    <button
                      key={checklist.id}
                      onClick={() => {
                        setSelectedChecklistId(checklist.id);
                        setInspectionResults({});
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedChecklistId === checklist.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-sm">{checklist.templateName}</div>
                      {checklist.templateCategory && (
                        <div className="text-xs text-gray-500 mt-1">
                          {checklist.templateCategory}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs" variant="outline">
                          {checklist.stage === "pre_execution" && "ก่อนเริ่ม"}
                          {checklist.stage === "in_progress" && "ระหว่างทำ"}
                          {checklist.stage === "post_execution" && "หลังเสร็จ"}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            checklist.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {checklist.status === "pending" ? "รอตรวจ" : "กำลังตรวจ"}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>การตรวจสอบ</CardTitle>
              <CardDescription>
                {selectedChecklistId ? "บันทึกผลการตรวจสอบ" : "เลือก Checklist ก่อน"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedChecklistId ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  กรุณาเลือก Checklist ก่อน
                </p>
              ) : checklistTemplateQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : templateItems.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  ไม่พบรายการตรวจสอบ
                </p>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {templateItems.map((item, index) => {
                    const result = inspectionResults[item.id];
                    return (
                      <div key={item.id} className="border-b pb-4 last:border-0">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-sm shrink-0">
                                {index + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{item.description}</p>
                                {item.acceptanceCriteria && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    เกณฑ์: {item.acceptanceCriteria}
                                  </p>
                                )}
                                {item.photoRequired && (
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    ต้องแนบรูปภาพ
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Result Selection */}
                          <div>
                            <Label className="text-xs text-gray-600">ผลการตรวจ</Label>
                            <RadioGroup
                              value={result?.result || ""}
                              onValueChange={(value: "pass" | "fail" | "na") => {
                                setInspectionResults(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    result: value,
                                    comment: prev[item.id]?.comment || "",
                                  },
                                }));
                              }}
                              className="flex gap-4 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                                <Label
                                  htmlFor={`pass-${item.id}`}
                                  className="text-sm cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ผ่าน
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                                <Label
                                  htmlFor={`fail-${item.id}`}
                                  className="text-sm cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                  ไม่ผ่าน
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="na" id={`na-${item.id}`} />
                                <Label
                                  htmlFor={`na-${item.id}`}
                                  className="text-sm cursor-pointer flex items-center gap-1"
                                >
                                  <MinusCircle className="w-4 h-4 text-gray-600" />
                                  N/A
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Comment */}
                          <div>
                            <Label className="text-xs text-gray-600">ความเห็น</Label>
                            <Textarea
                              placeholder="เพิ่มความเห็น (ถ้ามี)"
                              value={result?.comment || ""}
                              onChange={(e) => {
                                setInspectionResults(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    result: prev[item.id]?.result || "na",
                                    comment: e.target.value,
                                  },
                                }));
                              }}
                              rows={2}
                              className="mt-1 text-sm"
                            />
                          </div>

                          {/* Photo Upload */}
                          <div>
                            <Label className="text-xs text-gray-600">
                              รูปภาพ {item.photoRequired && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="mt-1">
                              {result?.photoUrl ? (
                                <div className="space-y-2">
                                  <img
                                    src={result.photoUrl}
                                    alt="Inspection"
                                    className="w-full h-32 object-cover rounded border"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setInspectionResults(prev => ({
                                        ...prev,
                                        [item.id]: {
                                          ...prev[item.id],
                                          photoUrl: undefined,
                                        },
                                      }));
                                    }}
                                    className="w-full"
                                  >
                                    เปลี่ยนรูปภาพ
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePhotoUpload(item.id, file);
                                      }
                                    }}
                                    disabled={uploadingPhotos[item.id]}
                                    className="text-sm"
                                  />
                                  {uploadingPhotos[item.id] && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      กำลังอัพโหลด...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Submit Button */}
                  <div className="pt-4 sticky bottom-0 bg-white">
                    <Button
                      onClick={handleSubmitInspection}
                      disabled={submitInspectionMutation.isPending}
                      className="w-full"
                    >
                      {submitInspectionMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึกผลการตรวจสอบ"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
