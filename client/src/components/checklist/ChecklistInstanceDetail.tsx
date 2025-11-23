import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ChecklistInstanceDetailProps {
  instanceId: number;
}

export function ChecklistInstanceDetail({ instanceId }: ChecklistInstanceDetailProps) {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [result, setResult] = useState<"passed" | "failed" | "na">("passed");
  const [notes, setNotes] = useState("");

  const { data: instance, isLoading, refetch } = trpc.checklist.getInstance.useQuery(
    { instanceId },
    { refetchOnWindowFocus: false }
  );

  const completeItemMutation = trpc.checklist.completeItem.useMutation({
    onSuccess: () => {
      toast.success("บันทึกผลการตรวจสอบสำเร็จ");
      setSelectedItem(null);
      setNotes("");
      setResult("passed");
      refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const handleCompleteItem = () => {
    if (selectedItem === null) return;
    
    completeItemMutation.mutate({
      itemId: selectedItem,
      result,
      notes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!instance) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">ไม่พบข้อมูล checklist instance</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      in_progress: "secondary",
      not_started: "outline",
    };

    const labels: Record<string, string> = {
      completed: "เสร็จสมบูรณ์",
      failed: "ล้มเหลว",
      in_progress: "กำลังดำเนินการ",
      not_started: "ยังไม่เริ่ม",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "pass":
      case "passed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "fail":
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "na":
        return <MinusCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <MinusCircle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      pass: "ผ่าน",
      passed: "ผ่าน",
      fail: "ไม่ผ่าน",
      failed: "ไม่ผ่าน",
      na: "ไม่ระบุ",
    };
    return labels[result] || "รอตรวจสอบ";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checklist Instance #{instanceId}</CardTitle>
            {getStatusBadge(instance.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">ความคืบหน้า</span>
              <span className="text-lg font-bold">{instance.completionPercentage}%</span>
            </div>
            <Progress value={instance.completionPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              เสร็จแล้ว {instance.items.filter((i) => i.result !== "na").length} จาก {instance.items.length} รายการ
            </p>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              รายการตรวจสอบ
            </h3>
            {instance.items
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <Card
                  key={item.id}
                  className={`border-l-4 ${
                    item.result === "pass" || item.result === "passed"
                      ? "border-l-green-500"
                      : item.result === "fail" || item.result === "failed"
                      ? "border-l-red-500"
                      : "border-l-gray-300"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            ขั้นที่ {index + 1}
                          </Badge>
                          {getResultIcon(item.result)}
                          <span className="text-xs font-medium text-muted-foreground">
                            {getResultLabel(item.result)}
                          </span>
                        </div>
                        <p className="font-medium mb-1">{item.itemText}</p>
                        {item.comments && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">หมายเหตุ:</span> {item.comments}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={item.result === "na" ? "default" : "outline"}
                        onClick={() => {
                          setSelectedItem(item.id);
                          setResult(
                            item.result === "pass" || item.result === "passed"
                              ? "passed"
                              : item.result === "fail" || item.result === "failed"
                              ? "failed"
                              : "passed"
                          );
                          setNotes(item.comments || "");
                        }}
                        disabled={completeItemMutation.isPending}
                      >
                        {item.result === "na" ? "ตรวจสอบ" : "แก้ไข"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Complete Item Dialog */}
      <Dialog open={selectedItem !== null} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกผลการตรวจสอบ</DialogTitle>
            <DialogDescription>
              เลือกผลการตรวจสอบและเพิ่มหมายเหตุ (ถ้ามี)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ผลการตรวจสอบ</Label>
              <div className="flex gap-2">
                <Button
                  variant={result === "passed" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setResult("passed")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  ผ่าน
                </Button>
                <Button
                  variant={result === "failed" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => setResult("failed")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  ไม่ผ่าน
                </Button>
                <Button
                  variant={result === "na" ? "secondary" : "outline"}
                  className="flex-1"
                  onClick={() => setResult("na")}
                >
                  <MinusCircle className="h-4 w-4 mr-2" />
                  N/A
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                id="notes"
                placeholder="เพิ่มหมายเหตุเกี่ยวกับการตรวจสอบ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCompleteItem} disabled={completeItemMutation.isPending}>
              {completeItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
