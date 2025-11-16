import { Download, X } from 'lucide-react';
import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from './ui/button';

export function PWAInstallBanner() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-card border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">ติดตั้งแอปพลิเคชัน</h3>
          <p className="text-xs text-muted-foreground mb-3">
            ติดตั้ง ConQC บนหน้าจอหลักเพื่อเข้าถึงได้ง่ายและรวดเร็วยิ่งขึ้น
          </p>
          
          <Button 
            onClick={handleInstall}
            size="sm"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            ติดตั้งเลย
          </Button>
        </div>
      </div>
    </div>
  );
}
