import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({ value = [], onChange, maxImages = 10, disabled = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {value.length < maxImages && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="image-upload-input"
          />
          <label htmlFor="image-upload-input">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Images'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Max {maxImages} images, 5MB each
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">No images uploaded</p>
        </div>
      )}
    </div>
  );
}
