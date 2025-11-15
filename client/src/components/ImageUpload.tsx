import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CameraCapture } from '@/components/CameraCapture';

interface ImageUploadProps {
  value: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  cameraFirst?: boolean; // เปิดกล้องทันทีบนมือถือ
}

export function ImageUpload({ value = [], onChange, maxImages = 10, disabled = false, cameraFirst = true }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`);
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload to server
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleCameraCapture = async (blob: Blob, dataUrl: string) => {
    if (value.length >= maxImages) {
      toast.error(`สูงสุด ${maxImages} รูป`);
      return;
    }

    setUploading(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'camera-capture.jpg');

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      onChange([...value, data.url]);
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Buttons - Camera First on Mobile */}
      {value.length < maxImages && (
        <div className="space-y-2">
          {/* Camera Input (hidden) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="camera-input"
          />
          
          {/* File Input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="file-input"
          />
          
          {/* Button Group */}
          <div className="flex gap-2">
            {/* Camera Button - Primary on Mobile */}
            <Button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={disabled || uploading}
              className="flex-1 h-12 text-base md:flex-none md:h-11"
              variant="default"
            >
              <Camera className="w-5 h-5 mr-2" />
              {uploading ? 'กำลังอัปโหลด...' : 'ถ่ายรูป'}
            </Button>
            
            {/* Upload Button - Secondary */}
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              variant="outline"
              className="flex-1 h-12 text-base md:flex-none md:h-11"
            >
              <Upload className="w-5 h-5 mr-2" />
              เลือกไฟล์
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            สูงสุด {maxImages} รูป, ขนาดไม่เกิน 5MB ต่อรูป
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`รูปที่ ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity active:scale-95"
                  aria-label="ลบรูปภาพ"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Image Counter Badge */}
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {index + 1}/{value.length}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm font-medium">ยังไม่มีรูปภาพ</p>
          <p className="text-xs mt-1">กดปุ่ม "ถ่ายรูป" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        title="ถ่ายรูปภาพประกอบ"
      />
    </div>
  );
}
