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
import { useState, useMemo, useEffect } from "react";
import { ImageGalleryViewer } from "@/components/MobileDocumentViewer";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Filter } from "lucide-react";

// Helper functions
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
    pass: { label: "ผ่าน", variant: "default" as const },
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
    completed: { label: "เสร็จสิ้น", variant: "default" as const },
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{ url: string; fileName?: string }>>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const isMobile = useIsMobile();

  // Edit checklist item state - track editing state for each item
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemStates, setItemStates] = useState<Record<number, { result: "pass" | "fail" | "na"; comments: string }>>({});

  // Filter state
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch inspection detail (MUST be declared before using inspection variable)
  const { data: inspection, isLoading, refetch } = trpc.checklist.getInspectionDetail.useQuery(
    { inspectionId: inspectionId! },
    { enabled: !!inspectionId }
  );

  const pdfMutation = trpc.checklist.generateInspectionPDF.useMutation();

  // Update checklist item mutation
  const updateItemMutation = trpc.checklist.updateChecklistItem.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตรายการตรวจสอบสำเร็จ");
      // Clear editing state
      setEditingItemId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  // Initialize item states from inspection data
  useEffect(() => {
    if (inspection?.items) {
      const initialStates: Record<number, { result: "pass" | "fail" | "na"; comments: string }> = {};
      inspection.items.forEach((item: any) => {
        initialStates[item.id] = {
          result: item.result,
          comments: item.comments || "",
        };
      });
      setItemStates(initialStates);
    }
  }, [inspection?.items]);

  // Filter items by stage and status
  const filteredItems = useMemo(() => {
    if (!inspection?.items) return [];
    return inspection.items.filter((item: any) => {
      const stageMatch = stageFilter === "all" || inspection.stage === stageFilter;
      const statusMatch = statusFilter === "all" || item.result === statusFilter;
      return stageMatch && statusMatch;
    });
  }, [inspection?.items, inspection?.stage, stageFilter, statusFilter]);

  // Handle update item state
  const handleUpdateItemState = (itemId: number, field: "result" | "comments", value: any) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // Handle save item
  const handleSaveItem = (item: any) => {
    const state = itemStates[item.id];
    if (!state) return;
    
    updateItemMutation.mutate({
      itemResultId: item.id,
      result: state.result,
      comments: state.comments,
    });
  };

  // Check if item has changes
  const hasChanges = (item: any) => {
    const state = itemStates[item.id];
    if (!state) return false;
    return state.result !== item.result || state.comments !== (item.comments || "");
  };

  const handleDownloadPDF = async () => {
    if (!inspectionId) return;
    
    const toastId = toast.loading("กำลังสร้าง PDF...");
    
    try {
      const result = await pdfMutation.mutateAsync({ inspectionId });
      
      if (result?.html) {
        toast.success("สร้าง PDF สำเร็จ", { id: toastId });
        
        // Open HTML in new window for printing
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          toast.error("ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup", { id: toastId });
        }
      } else {
        toast.error("ไม่มีข้อมูล PDF", { id: toastId });
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      const errorMessage = error?.message || "เกิดข้อผิดพลาดในการสร้าง PDF";
      toast.error(errorMessage, { id: toastId });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">ไม่พบข้อมูลการตรวจสอบ</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/inspections`)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปรายการตรวจสอบ
          </Button>
          <h1 className="text-3xl font-bold">รายละเอียดการตรวจสอบ #{inspection.id}</h1>
        </div>
        <Button onClick={handleDownloadPDF} disabled={pdfMutation.isPending}>
          {pdfMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          ดาวน์โหลด PDF
        </Button>
      </div>

      {/* Inspection Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการตรวจสอบ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">โครงการ:</span>
              <span>{inspection.projectName || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">งาน:</span>
              <span>{inspection.taskName || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Checklist:</span>
              <span>{inspection.templateName || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">ขั้นตอน:</span>
              {getStageBadge(inspection.stage)}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">สถานะ:</span>
              {getStatusBadge(inspection.status)}
            </div>
            {inspection.status === "failed" && inspection.notificationSent && (
              <div className="flex items-center gap-2 col-span-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">การแจ้งเตือน:</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  ส่งการแจ้งเตือนแล้ว
                </Badge>
                {inspection.notifiedAt && (
                  <span className="text-sm text-muted-foreground">
                    ({format(new Date(inspection.notifiedAt), "dd MMM yyyy HH:mm", { locale: th })})
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">ผู้ตรวจ:</span>
              <span>{inspection.inspectorName || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">วันที่ตรวจ:</span>
              <span>
                {inspection.inspectedAt
                  ? format(new Date(inspection.inspectedAt), "dd MMM yyyy HH:mm", { locale: th })
                  : "-"}
              </span>
            </div>
          </div>

          {inspection.generalComments && (
            <>
              <Separator />
              <div>
                <span className="font-medium">หมายเหตุ:</span>
                <p className="mt-2 text-muted-foreground">{inspection.generalComments}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>รายการตรวจสอบ</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="กรองสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="pass">ผ่าน</SelectItem>
                  <SelectItem value="fail">ไม่ผ่าน</SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems && filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item: any, index: number) => {
                const photos = parsePhotoUrls(item.photoUrls);
                const isEditing = editingItemId === item.id;
                const currentState = itemStates[item.id] || { result: item.result, comments: item.comments || "" };
                const canEdit = user && (user.role === "admin" || user.role === "qc_inspector");
                
                return (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                          <h3 className="font-medium">{item.itemName}</h3>
                        </div>
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-2">
                          {getResultIcon(item.result)}
                          {getResultBadge(item.result)}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingItemId(item.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Editing mode */}
                    {isEditing && canEdit && (
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">ผลการตรวจสอบ</Label>
                          <RadioGroup 
                            value={currentState.result} 
                            onValueChange={(value: any) => handleUpdateItemState(item.id, "result", value)}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="pass" id={`pass-${item.id}`} />
                              <Label htmlFor={`pass-${item.id}`} className="flex items-center gap-2 cursor-pointer font-normal">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ผ่าน
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fail" id={`fail-${item.id}`} />
                              <Label htmlFor={`fail-${item.id}`} className="flex items-center gap-2 cursor-pointer font-normal">
                                <XCircle className="h-4 w-4 text-red-600" />
                                ไม่ผ่าน
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="na" id={`na-${item.id}`} />
                              <Label htmlFor={`na-${item.id}`} className="flex items-center gap-2 cursor-pointer font-normal">
                                <MinusCircle className="h-4 w-4 text-gray-400" />
                                N/A
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`comments-${item.id}`} className="text-sm font-medium">รายละเอียด/หมายเหตุ</Label>
                          <Textarea
                            id={`comments-${item.id}`}
                            value={currentState.comments}
                            onChange={(e) => handleUpdateItemState(item.id, "comments", e.target.value)}
                            placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItemId(null);
                              // Reset to original values
                              setItemStates(prev => ({
                                ...prev,
                                [item.id]: {
                                  result: item.result,
                                  comments: item.comments || "",
                                },
                              }));
                            }}
                          >
                            ยกเลิก
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              handleSaveItem(item);
                              setEditingItemId(null);
                            }}
                            disabled={updateItemMutation.isPending || !hasChanges(item)}
                          >
                            {updateItemMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            บันทึก
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* View mode - show comments if exists */}
                    {!isEditing && item.comments && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                        <span className="font-medium">หมายเหตุ: </span>
                        {item.comments}
                      </div>
                    )}



                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {photos.map((photoUrl: string, photoIndex: number) => (
                          <div
                            key={photoIndex}
                            className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setGalleryImages(photos.map(url => ({ url })));
                              setGalleryInitialIndex(photoIndex);
                              setGalleryOpen(true);
                            }}
                          >
                            <img
                              src={photoUrl}
                              alt={`Photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                              <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {inspection.items && inspection.items.length > 0 
                ? "ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง" 
                : "ไม่มีรายการตรวจสอบ"}
            </p>
          )}
        </CardContent>
      </Card>



      {/* Image Gallery */}
      {galleryOpen && (
        <ImageGalleryViewer
          images={galleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
