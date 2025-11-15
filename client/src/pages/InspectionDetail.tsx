import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";

/**
 * Inspection Detail Page
 * แสดงรายละเอียดการตรวจสอบแบบเต็ม พร้อมรายการที่ผ่าน/ไม่ผ่าน
 */
export default function InspectionDetail() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/inspections/:inspectionId");
  const [, navigate] = useLocation();
  const inspectionId = params?.inspectionId ? parseInt(params.inspectionId) : null;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch inspection detail
  const { data: inspection, isLoading } = trpc.checklist.getInspectionDetail.useQuery(
    { inspectionId: inspectionId! },
    { enabled: !!inspectionId }
  );

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!inspection) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">ไม่พบข้อมูลการตรวจสอบ</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "pass":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "na":
        return <MinusCircle className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getResultBadge = (result: string) => {
    const resultMap = {
      pass: { label: "ผ่าน", variant: "success" as const },
      fail: { label: "ไม่ผ่าน", variant: "destructive" as const },
      na: { label: "N/A", variant: "secondary" as const },
    };
    const config = resultMap[result as keyof typeof resultMap];
    return config ? <Badge variant={config.variant}>{config.label}</Badge> : null;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      not_started: { label: "ยังไม่เริ่ม", variant: "secondary" as const },
      pending_inspection: { label: "รอตรวจสอบ", variant: "default" as const },
      in_progress: { label: "กำลังตรวจสอบ", variant: "default" as const },
      completed: { label: "ผ่าน", variant: "success" as const },
      failed: { label: "ไม่ผ่าน", variant: "destructive" as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.not_started;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStageBadge = (stage: string) => {
    const stageMap = {
      pre_execution: { label: "ก่อนดำเนินการ", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "ระหว่างดำเนินการ", color: "bg-yellow-100 text-yellow-800" },
      post_execution: { label: "หลังดำเนินการ", color: "bg-green-100 text-green-800" },
    };
    const config = stageMap[stage as keyof typeof stageMap] || stageMap.pre_execution;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const parsePhotoUrls = (photoUrls: string | null): string[] => {
    if (!photoUrls) return [];
    try {
      return JSON.parse(photoUrls);
    } catch {
      return [];
    }
  };

  const pdfMutation = trpc.checklist.generateInspectionPDF.useQuery(
    { inspectionId: inspectionId! },
    { enabled: false }
  );

  const handleDownloadPDF = async () => {
    try {
      const result = await pdfMutation.refetch();
      if (result.data?.html) {
        // Open HTML in new window for printing
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(`/tasks/${inspection.taskId}/inspections`)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปที่ประวัติการตรวจสอบ
            </Button>
            <h1 className="text-3xl font-bold">รายละเอียดการตรวจสอบ</h1>
            <p className="text-muted-foreground mt-1">{inspection.templateName}</p>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด PDF
          </Button>
        </div>

        {/* Inspection Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการตรวจสอบ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">สถานะ</p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(inspection.status)}
                  {getStageBadge(inspection.stage)}
                </div>
              </div>

              {inspection.inspectorName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ผู้ตรวจสอบ</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{inspection.inspectorName}</span>
                    {inspection.inspectorEmail && (
                      <span className="text-sm text-muted-foreground">
                        ({inspection.inspectorEmail})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {inspection.inspectedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">วันที่ตรวจสอบ</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(inspection.inspectedAt), "d MMMM yyyy HH:mm น.", {
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {inspection.reinspectionCount > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">การตรวจสอบซ้ำ</p>
                  <Badge variant="outline">ครั้งที่ {inspection.reinspectionCount + 1}</Badge>
                </div>
              )}
            </div>

            {inspection.generalComments && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">ความเห็นทั่วไป</p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="whitespace-pre-wrap">{inspection.generalComments}</p>
                  </div>
                </div>
              </>
            )}

            {inspection.signature && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">ลายเซ็น</p>
                  <div className="border rounded-md p-4 bg-white max-w-md">
                    <img
                      src={inspection.signature}
                      alt="Signature"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปผลการตรวจสอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{inspection.statistics.totalItems}</div>
                <div className="text-sm text-muted-foreground">รายการทั้งหมด</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {inspection.statistics.passCount}
                </div>
                <div className="text-sm text-muted-foreground">ผ่าน</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {inspection.statistics.failCount}
                </div>
                <div className="text-sm text-muted-foreground">ไม่ผ่าน</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {inspection.statistics.passRate}%
                </div>
                <div className="text-sm text-muted-foreground">อัตราการผ่าน</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              รายการตรวจสอบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inspection.itemResults.map((item, index) => {
                const photos = parsePhotoUrls(item.photoUrls);
                return (
                  <Card
                    key={item.id}
                    className={`border-l-4 ${
                      item.result === "pass"
                        ? "border-l-green-500"
                        : item.result === "fail"
                        ? "border-l-red-500"
                        : "border-l-gray-300"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getResultIcon(item.result)}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="font-medium">
                                {index + 1}. {item.itemText}
                              </p>
                              {getResultBadge(item.result)}
                            </div>

                            {photos.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                  <ImageIcon className="h-4 w-4" />
                                  รูปภาพ ({photos.length})
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  {photos.map((url, idx) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`Photo ${idx + 1}`}
                                      className="h-20 w-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setSelectedImage(url)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Related Defects */}
        {inspection.defects && inspection.defects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                ข้อบกพร่องที่พบ ({inspection.defects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inspection.defects.map((defect) => (
                  <Card key={defect.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{defect.title}</h4>
                            <Badge variant="outline">{defect.type}</Badge>
                            <Badge
                              variant={
                                defect.severity === "critical"
                                  ? "destructive"
                                  : defect.severity === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {defect.severity}
                            </Badge>
                          </div>
                          {defect.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {defect.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            สร้างเมื่อ:{" "}
                            {format(new Date(defect.createdAt), "d MMM yyyy HH:mm", {
                              locale: th,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/defects/${defect.id}`)}
                        >
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedImage(null)}
            >
              ปิด
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
