import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Camera, X } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  errorStack?: string;
  pageName?: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  errorMessage,
  errorStack,
  pageName,
}: FeedbackDialogProps) {
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const submitFeedbackMutation = trpc.system.submitErrorFeedback.useMutation({
    onSuccess: () => {
      toast.success("ส่งรายงานข้อผิดพลาดสำเร็จ ขอบคุณสำหรับข้อมูลที่ให้มา");
      onOpenChange(false);
      // Reset form
      setDescription("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setScreenshot(null);
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาดในการส่งรายงาน: " + error.message);
    },
  });

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    try {
      // Use html2canvas to capture screenshot
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        logging: false,
      });
      const screenshotDataUrl = canvas.toDataURL("image/png");
      setScreenshot(screenshotDataUrl);
      toast.success("จับภาพหน้าจอสำเร็จ");
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast.error("ไม่สามารถจับภาพหน้าจอได้");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("กรุณาระบุรายละเอียดปัญหา");
      return;
    }

    submitFeedbackMutation.mutate({
      description,
      stepsToReproduce,
      expectedBehavior,
      errorMessage,
      errorStack,
      pageName,
      screenshotDataUrl: screenshot || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>รายงานข้อผิดพลาด</DialogTitle>
          <DialogDescription>
            กรุณาให้รายละเอียดเกี่ยวกับปัญหาที่คุณพบ เพื่อช่วยให้เราแก้ไขได้รวดเร็วยิ่งขึ้น
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              รายละเอียดปัญหา <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="อธิบายปัญหาที่เกิดขึ้น..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="steps">ขั้นตอนการทำให้เกิดปัญหา (ถ้ามี)</Label>
            <Textarea
              id="steps"
              placeholder="1. ไปที่หน้า...&#10;2. คลิกที่...&#10;3. เห็นข้อผิดพลาด..."
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              rows={4}
            />
          </div>

          {/* Expected Behavior */}
          <div className="space-y-2">
            <Label htmlFor="expected">สิ่งที่คาดหวังให้เกิดขึ้น (ถ้ามี)</Label>
            <Textarea
              id="expected"
              placeholder="ควรจะเกิดอะไรขึ้นแทน..."
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              rows={3}
            />
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label>ภาพหน้าจอ (ถ้ามี)</Label>
            {screenshot ? (
              <div className="relative border rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={handleRemoveScreenshot}
                >
                  <X className="w-4 h-4" />
                </Button>
                <img
                  src={screenshot}
                  alt="Screenshot"
                  className="w-full rounded"
                />
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCaptureScreenshot}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังจับภาพ...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    จับภาพหน้าจอ
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Error Info (read-only) */}
          {errorMessage && (
            <div className="space-y-2">
              <Label>ข้อความ Error (อัตโนมัติ)</Label>
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitFeedbackMutation.isPending}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitFeedbackMutation.isPending || !description.trim()}
          >
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              "ส่งรายงาน"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
