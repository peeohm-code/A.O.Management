import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Camera, MapPin, Menu, X } from "lucide-react";
import { toast } from "sonner";

interface MobileOptimizedProps {
  children: React.ReactNode;
  showQuickActions?: boolean;
  showConnectionStatus?: boolean;
}

/**
 * Mobile-optimized wrapper component
 * Provides mobile-friendly features like:
 * - Connection status indicator
 * - Quick action buttons
 * - Touch-optimized interactions
 * - Offline mode support
 */
export default function MobileOptimized({
  children,
  showQuickActions = true,
  showConnectionStatus = true,
}: MobileOptimizedProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("กลับมาออนไลน์แล้ว");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("ไม่มีการเชื่อมต่ออินเทอร์เน็ต", {
        description: "ข้อมูลจะถูกบันทึกเมื่อกลับมาออนไลน์",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Quick actions for mobile
  const quickActions = [
    {
      icon: Camera,
      label: "ถ่ายรูป",
      action: () => {
        // Trigger camera
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            toast.success("ถ่ายรูปสำเร็จ");
            // Handle file upload
          }
        };
        input.click();
      },
    },
    {
      icon: MapPin,
      label: "ตำแหน่ง",
      action: () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              toast.success("ได้ตำแหน่งแล้ว", {
                description: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
              });
            },
            (error) => {
              toast.error("ไม่สามารถรับตำแหน่งได้", {
                description: error.message,
              });
            }
          );
        } else {
          toast.error("อุปกรณ์นี้ไม่รองรับ GPS");
        }
      },
    },
  ];

  if (!isMobile) {
    // Desktop view - no mobile optimizations needed
    return <>{children}</>;
  }

  return (
    <div className="mobile-optimized relative">
      {/* Connection Status Bar */}
      {showConnectionStatus && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>โหมดออฟไลน์</span>
        </div>
      )}

      {/* Main Content */}
      <div className={showConnectionStatus && !isOnline ? "pt-10" : ""}>
        {children}
      </div>

      {/* Quick Action Menu */}
      {showQuickActions && (
        <>
          {/* Floating Action Button */}
          <Button
            size="icon"
            className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
          >
            {showQuickMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Quick Actions */}
          {showQuickMenu && (
            <div className="fixed bottom-36 right-4 z-40 flex flex-col gap-3">
              {quickActions.map((action, index: any) => (
                <Button
                  key={index}
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full shadow-lg"
                  onClick={() => {
                    action.action();
                    setShowQuickMenu(false);
                  }}
                  title={action.label}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mobile-specific styles */}
      <style>{`
        .mobile-optimized {
          /* Prevent text selection on long press */
          -webkit-user-select: none;
          user-select: none;
        }

        /* Larger touch targets for mobile */
        .mobile-optimized button,
        .mobile-optimized a,
        .mobile-optimized input[type="checkbox"],
        .mobile-optimized input[type="radio"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Improve tap highlight */
        .mobile-optimized button,
        .mobile-optimized a {
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
        }

        /* Smooth scrolling */
        .mobile-optimized {
          -webkit-overflow-scrolling: touch;
        }

        /* Prevent zoom on input focus */
        @media screen and (max-width: 768px) {
          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="tel"],
          input[type="date"],
          textarea,
          select {
            font-size: 16px !important;
          }
        }

        /* Better form inputs for mobile */
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized select {
          padding: 12px;
          border-radius: 8px;
        }

        /* Floating action button animation */
        .mobile-optimized .fixed {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to detect if user is on mobile device
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to get device location
 */
export function useGeolocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  return { location, error, loading, getLocation };
}

/**
 * Hook to handle camera capture
 */
export function useCamera() {
  const [image, setImage] = useState<string | null>(null);

  const captureImage = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          // Create preview
          const reader = new FileReader();
          reader.onload = (event) => {
            setImage(event.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          resolve(file);
        } else {
          reject(new Error("No file selected"));
        }
      };
      
      input.click();
    });
  };

  return { image, captureImage };
}
