import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt Component
 * 
 * แสดง prompt ให้ผู้ใช้ติดตั้ง PWA บนอุปกรณ์
 * รองรับทั้ง Android และ iOS
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเป็น iOS หรือไม่
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // ตรวจสอบว่าติดตั้งแล้วหรือไม่
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    setIsInstalled(isStandalone || isIOSStandalone);

    // ตรวจสอบว่าเคยปิด prompt ไปแล้วหรือไม่
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = Math.floor((Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // แสดง prompt อีกครั้งหลังจาก 7 วัน
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // สำหรับ Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // สำหรับ iOS แสดง prompt หลังจาก 3 วินาที
    if (isIOSDevice && !isStandalone && !isIOSStandalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // แสดง install prompt
    await deferredPrompt.prompt();

    // รอผลลัพธ์
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // ล้าง prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // ไม่แสดงถ้าติดตั้งแล้ว
  if (isInstalled || !showPrompt) {
    return null;
  }

  // สำหรับ iOS
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
        <Card className="shadow-lg border-2 border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">ติดตั้งแอป</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              ติดตั้งแอปบนหน้าจอหลักเพื่อเข้าถึงได้ง่ายและใช้งานแบบออฟไลน์
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p className="font-medium">วิธีติดตั้งบน iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>แตะปุ่ม Share (ไอคอนสี่เหลี่ยมมีลูกศรชี้ขึ้น)</li>
                <li>เลื่อนลงและเลือก "Add to Home Screen"</li>
                <li>แตะ "Add" เพื่อยืนยัน</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // สำหรับ Android/Chrome
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">ติดตั้งแอป</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            ติดตั้งแอปบนอุปกรณ์เพื่อเข้าถึงได้ง่ายและใช้งานแบบออฟไลน์
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleInstallClick} 
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            ติดตั้งเลย
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
