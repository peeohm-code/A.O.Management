import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { shortcuts, navigationShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShowModal = () => setOpen(true);
    window.addEventListener("show-shortcuts-modal", handleShowModal);
    return () => window.removeEventListener("show-shortcuts-modal", handleShowModal);
  }, []);

  const renderKey = (key: string) => (
    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
      {key}
    </kbd>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            ใช้ keyboard shortcuts เพื่อนำทางและทำงานได้เร็วขึ้น
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">General</h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.ctrl && renderKey("Ctrl")}
                    {shortcut.shift && renderKey("Shift")}
                    {shortcut.alt && renderKey("Alt")}
                    {renderKey(shortcut.key.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Navigation (กด G แล้วตามด้วย)
            </h3>
            <div className="space-y-2">
              {Object.entries(navigationShortcuts).map(([key, config]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">
                    {config.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {renderKey("G")}
                    <span className="text-muted-foreground">then</span>
                    {renderKey(key.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>กด {renderKey("?")} หรือ {renderKey("Ctrl")} + {renderKey("/")} เพื่อเปิดหน้านี้</li>
              <li>Navigation shortcuts ต้องกด G ก่อน แล้วตามด้วยตัวอักษร</li>
              <li>Shortcuts จะไม่ทำงานเมื่อคุณกำลังพิมพ์ในช่อง input</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
