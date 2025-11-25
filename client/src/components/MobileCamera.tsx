import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, RotateCw, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

/**
 * Mobile Camera Component
 * ปรับปรุงการถ่ายรูปและ upload สำหรับ mobile devices
 */

export interface MobileCameraProps {
  onCapture: (file: File) => void;
  onMultipleCapture?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptMultiple?: boolean;
  compressionQuality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
}

export function MobileCamera({
  onCapture,
  onMultipleCapture,
  maxFiles = 5,
  maxFileSize = 10,
  acceptMultiple = false,
  compressionQuality = 0.8,
  maxWidth = 1920,
  maxHeight = 1920,
}: MobileCameraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file size
    const oversizedFiles = files.filter((file) => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`ไฟล์บางไฟล์มีขนาดเกิน ${maxFileSize}MB`);
      return;
    }

    // Validate file count
    if (acceptMultiple && capturedFiles.length + files.length > maxFiles) {
      toast.error(`สามารถเลือกได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    try {
      // Compress and process images
      const processedFiles = await Promise.all(
        files.map((file) => compressImage(file, compressionQuality, maxWidth, maxHeight))
      );

      if (acceptMultiple) {
        const newFiles = [...capturedFiles, ...processedFiles];
        const newUrls = [...previewUrls, ...processedFiles.map((f) => URL.createObjectURL(f))];
        setCapturedFiles(newFiles);
        setPreviewUrls(newUrls);
        setIsOpen(true);
      } else {
        // Single file mode
        onCapture(processedFiles[0]);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      }
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = capturedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setCapturedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handleConfirm = () => {
    if (capturedFiles.length === 0) {
      toast.error("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    if (onMultipleCapture) {
      onMultipleCapture(capturedFiles);
    } else if (capturedFiles.length > 0) {
      onCapture(capturedFiles[0]);
    }

    // Clean up
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setCapturedFiles([]);
    setPreviewUrls([]);
    setIsOpen(false);
    toast.success(`อัปโหลด ${capturedFiles.length} รูปภาพสำเร็จ`);
  };

  const handleCancel = () => {
    // Clean up URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setCapturedFiles([]);
    setPreviewUrls([]);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={acceptMultiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={acceptMultiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCameraCapture}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          ถ่ายรูป
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGallerySelect}
          className="flex-1"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          เลือกจากคลัง
        </Button>
      </div>

      {/* Preview Dialog (Multiple Images) */}
      {acceptMultiple && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                รูปภาพที่เลือก ({capturedFiles.length}/{maxFiles})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image Grid */}
              <div className="grid grid-cols-2 gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Add More Button */}
                {capturedFiles.length < maxFiles && (
                  <button
                    type="button"
                    onClick={handleGallerySelect}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Camera className="h-8 w-8" />
                    <span className="text-sm">เพิ่มรูป</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={capturedFiles.length === 0}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  ยืนยัน ({capturedFiles.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/**
 * Compress Image Helper
 * บีบอัดรูปภาพเพื่อลดขนาดไฟล์
 */
async function compressImage(
  file: File,
  quality: number,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}
