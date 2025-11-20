import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PhotoGalleryLightbox } from "@/components/PhotoGalleryLightbox";

interface BeforeAfterComparisonProps {
  beforePhotos: string[];
  afterPhotos: string[];
  title?: string;
}

/**
 * Side-by-side Before/After photo comparison component
 * Auto-pairs photos by index
 */
export function BeforeAfterComparison({ 
  beforePhotos, 
  afterPhotos,
  title = "ภาพเปรียบเทียบ Before - After"
}: BeforeAfterComparisonProps) {
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const openLightbox = (photos: string[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };
  // Auto-pair photos by index
  const pairs = beforePhotos.map((before, index: any) => ({
    before: before,
    after: afterPhotos[index] || null
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      
      <div className="grid grid-cols-1 gap-6">
        {pairs.map((pair, index: any) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-md inline-block">
                  ก่อนแก้ไข
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={pair.before}
                    alt={`Before ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openLightbox(beforePhotos, index)}
                  />
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-md inline-block">
                  หลังแก้ไข
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {pair.after ? (
                    <img
                      src={pair.after}
                      alt={`After ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openLightbox(afterPhotos, index)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Show unpaired after photos if any */}
      {afterPhotos.length > beforePhotos.length && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">รูปภาพหลังแก้ไขเพิ่มเติม</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {afterPhotos.slice(beforePhotos.length).map((photo, index: any) => (
              <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo}
                  alt={`Additional after ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => openLightbox(afterPhotos.slice(beforePhotos.length), index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <PhotoGalleryLightbox
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
