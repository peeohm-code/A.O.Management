import { useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LocationPickerProps {
  location?: string;
  latitude?: string;
  longitude?: string;
  onLocationChange?: (location: string) => void;
  onCoordinatesChange?: (lat: string, lng: string) => void;
}

export function LocationPicker({
  location = "",
  latitude,
  longitude,
  onLocationChange,
  onCoordinatesChange,
}: LocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [marker, setMarker] = useState<any>(null);
  const [map, setMap] = useState<any>(null);

  // Initialize marker when map is ready and coordinates exist
  useEffect(() => {
    if (map && latitude && longitude && !marker) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        const position = { lat, lng };
        
        // Create marker
        const newMarker = new (window as any).google.maps.Marker({
          position,
          map,
          draggable: true,
        });

        // Update coordinates when marker is dragged
        newMarker.addListener("dragend", () => {
          const pos = newMarker.getPosition();
          if (pos) {
            onCoordinatesChange?.(pos.lat().toString(), pos.lng().toString());
          }
        });

        setMarker(newMarker);
        map.setCenter(position);
        map.setZoom(15);
      }
    }
  }, [map, latitude, longitude, marker, onCoordinatesChange]);

  const handleMapReady = useCallback(
    (mapInstance: any) => {
      setMap(mapInstance);
      setMapLoaded(true);

      // Add click listener to place marker
      mapInstance.addListener("click", (e: any) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          // Remove existing marker
          if (marker) {
            marker.setMap(null);
          }

          // Create new marker
          const newMarker = new (window as any).google.maps.Marker({
            position: e.latLng,
            map: mapInstance,
            draggable: true,
          });

          // Update coordinates when marker is dragged
          newMarker.addListener("dragend", () => {
            const pos = newMarker.getPosition();
            if (pos) {
              onCoordinatesChange?.(pos.lat().toString(), pos.lng().toString());
            }
          });

          setMarker(newMarker);
          onCoordinatesChange?.(lat.toString(), lng.toString());

          // Reverse geocode to get address
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: e.latLng }, (results: any, status: any) => {
            if (status === "OK" && results && results[0]) {
              onLocationChange?.(results[0].formatted_address);
            }
          });
        }
      });
    },
    [marker, onCoordinatesChange, onLocationChange]
  );

  const handleClearLocation = () => {
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    onLocationChange?.("");
    onCoordinatesChange?.("", "");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location">ที่อยู่โครงการ</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="location"
            value={location}
            onChange={(e) => onLocationChange?.(e.target.value)}
            placeholder="พิมพ์ที่อยู่หรือเลือกจากแผนที่"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowMap(!showMap)}
            title={showMap ? "ซ่อนแผนที่" : "เลือกจากแผนที่"}
          >
            <MapPin className="h-4 w-4" />
          </Button>
          {(latitude || longitude || location) && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClearLocation}
              title="ล้างตำแหน่ง"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showMap && (
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              คลิกบนแผนที่เพื่อเลือกตำแหน่ง หรือลากหมุดเพื่อปรับตำแหน่ง
            </p>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapView onMapReady={handleMapReady} />
            </div>
            {latitude && longitude && (
              <p className="text-xs text-muted-foreground">
                พิกัด: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
