import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileImage, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  multiple = true,
  className = "",
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ (รองรับเฉพาะ: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')})`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (${fileSizeMB.toFixed(2)}MB > ${maxSizeMB}MB)`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      toast.error(`สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      validFiles.push(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === validFiles.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
      toast.success(`เลือกไฟล์สำเร็จ (${validFiles.length} ไฟล์)`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onFilesSelected(updatedFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      <Card
        className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Upload className="w-10 h-10 text-gray-400" />
          <div>
            <p className="font-medium">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
            <p className="text-sm text-gray-500 mt-1">
              รองรับ: {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} 
              {' '}(สูงสุด {maxSizeMB}MB ต่อไฟล์)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              เลือกได้สูงสุด {maxFiles} ไฟล์
            </p>
          </div>
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">ไฟล์ที่เลือก ({selectedFiles.length}/{maxFiles})</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedFiles.map((file, index: any) => (
              <Card key={index} className="relative group overflow-hidden">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                    <FileImage className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          ไฟล์จะถูกตรวจสอบก่อนอัปโหลด หากไฟล์ไม่ผ่านการตรวจสอบจะไม่สามารถอัปโหลดได้
        </p>
      </div>
    </div>
  );
}
