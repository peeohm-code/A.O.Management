import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";

interface MobileDocumentViewerProps {
  url: string;
  fileName: string;
  mimeType?: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile-optimized Document Viewer
 * รองรับการแสดงผล PDF, รูปภาพ, และเอกสารอื่นๆ บนมือถือ
 */
export function MobileDocumentViewer({
  url,
  fileName,
  mimeType,
  open,
  onClose,
}: MobileDocumentViewerProps) {
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isImage = mimeType?.startsWith("image/");
  const isPDF = mimeType === "application/pdf";

  useEffect(() => {
    // Reset zoom when opening new document
    if (open) {
      setZoom(100);
      setIsFullscreen(false);
    }
  }, [open, url]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "w-screen h-screen max-w-none m-0 p-0 rounded-none"
            : isMobile
            ? "w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0"
            : "w-[90vw] max-w-4xl h-[85vh] p-0"
        } flex flex-col`}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-sm md:text-base truncate flex-1">
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleZoomIn}
                    disabled={zoom >= 300}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 relative">
          {isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={url}
                alt={fileName}
                className="max-w-full h-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                }}
              />
            </div>
          ) : isPDF ? (
            <div className="w-full h-full">
              {isMobile ? (
                // Mobile: Use Google Docs Viewer for better mobile experience
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              ) : (
                // Desktop: Direct PDF embed
                <iframe
                  src={url}
                  className="w-full h-full border-0"
                  title={fileName}
                />
              )}
            </div>
          ) : (
            // Other file types: Show download prompt
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="max-w-md space-y-4">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-semibold">ไม่สามารถแสดงตัวอย่างได้</h3>
                <p className="text-sm text-muted-foreground">
                  ไฟล์ประเภทนี้ไม่สามารถแสดงตัวอย่างในเบราว์เซอร์ได้
                  <br />
                  กรุณาดาวน์โหลดไฟล์เพื่อเปิดดู
                </p>
                <Button onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดไฟล์
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Mobile only, show file info */}
        {isMobile && !isFullscreen && (
          <div className="px-4 py-2 border-t bg-background text-xs text-muted-foreground flex-shrink-0">
            <p className="truncate">
              {mimeType && <span className="font-medium">{mimeType}</span>}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ImageGalleryViewerProps {
  images: Array<{ url: string; fileName?: string }>;
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile-optimized Image Gallery Viewer
 * รองรับการเลื่อนดูรูปภาพหลายรูป พร้อม zoom และ swipe
 */
export function ImageGalleryViewer({
  images,
  initialIndex = 0,
  open,
  onClose,
}: ImageGalleryViewerProps) {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoom(100);
      setIsFullscreen(false);
    }
  }, [open, initialIndex]);

  const currentImage = images[currentIndex] || { url: '', fileName: '' };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(100);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(100);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    if (!currentImage?.url) return;
    const link = document.createElement("a");
    link.href = currentImage.url;
    link.download = currentImage.fileName || `image-${currentIndex + 1}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "w-screen h-screen max-w-none m-0 p-0 rounded-none"
            : isMobile
            ? "w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0"
            : "w-[90vw] max-w-4xl h-[85vh] p-0"
        } flex flex-col`}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-sm md:text-base truncate flex-1">
              {currentImage?.fileName || `รูปภาพ ${currentIndex + 1} / ${images.length}`}
            </DialogTitle>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 300}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={currentImage.url}
              alt={currentImage.fileName || `Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center",
              }}
            />
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Footer - Show thumbnails on desktop, counter on mobile */}
        {!isFullscreen && (
          <div className="px-4 py-3 border-t bg-background flex-shrink-0">
            {isMobile ? (
              <div className="text-center text-sm text-muted-foreground">
                {currentIndex + 1} / {images.length}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setZoom(100);
                    }}
                    className={`flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-all ${
                      idx === currentIndex
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.fileName || `Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
