import { useState, useRef, useEffect } from "react";
import { Camera, X, RotateCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, dataUrl: string) => void;
  title?: string;
}

/**
 * CameraCapture Component
 * 
 * ใช้สำหรับเปิดกล้องถ่ายรูปโดยตรงจากเบราว์เซอร์
 * เหมาะสำหรับการใช้งานบนมือถือในหน้า inspection
 * 
 * Features:
 * - เปิดกล้องหน้า/หลัง (สลับได้)
 * - ถ่ายรูปและดูตัวอย่าง
 * - ยืนยันหรือถ่ายใหม่
 * - รองรับทั้ง mobile และ desktop
 */
export function CameraCapture({ open, onClose, onCapture, title = "ถ่ายรูป" }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ตรวจสอบว่ามีกล้องหลายตัวหรือไม่
  useEffect(() => {
    if (open) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      });
    }
  }, [open]);

  // เปิดกล้อง
  useEffect(() => {
    if (!open) {
      // ปิดกล้องเมื่อ dialog ปิด
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setError(null);
      return;
    }

    const startCamera = async () => {
      try {
        setError(null);
        
        // ขอสิทธิ์เข้าถึงกล้อง
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้อง");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, facingMode]);

  // สลับกล้องหน้า/หลัง
  const switchCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // ถ่ายรูป
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // ตั้งค่าขนาด canvas ตามขนาดวิดีโอ
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // วาดภาพจากวิดีโอลงบน canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // แปลงเป็น data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
    }
  };

  // ถ่ายใหม่
  const retake = () => {
    setCapturedImage(null);
  };

  // ยืนยันการถ่ายรูป
  const confirmCapture = () => {
    if (!capturedImage || !canvasRef.current) return;

    // แปลง data URL เป็น Blob
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onCapture(blob, capturedImage);
        handleClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {error ? (
            <div className="flex items-center justify-center h-[60vh] text-white p-4 text-center">
              <div>
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            </div>
          ) : capturedImage ? (
            // แสดงภาพที่ถ่าย
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>
          ) : (
            // แสดงวิดีโอจากกล้อง
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              
              {/* Canvas สำหรับจับภาพ (ซ่อนไว้) */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* ปุ่มควบคุม */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-4">
              {capturedImage ? (
                // ปุ่มเมื่อถ่ายรูปแล้ว
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={retake}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    <RotateCw className="h-5 w-5 mr-2" />
                    ถ่ายใหม่
                  </Button>
                  <Button
                    size="lg"
                    onClick={confirmCapture}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    ใช้รูปนี้
                  </Button>
                </>
              ) : (
                // ปุ่มเมื่อยังไม่ได้ถ่าย
                <>
                  {hasMultipleCameras && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={switchCamera}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                    >
                      <RotateCw className="h-5 w-5" />
                    </Button>
                  )}
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    disabled={!stream}
                    className="bg-white hover:bg-white/90 text-black rounded-full h-16 w-16 p-0"
                  >
                    <Camera className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
