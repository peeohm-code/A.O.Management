import { useEffect } from "react";
import { useLocation } from "wouter";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export const shortcuts: ShortcutConfig[] = [
  {
    key: "k",
    ctrl: true,
    description: "Open search",
    action: () => {
      // Focus search input if exists
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="ค้นหา"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
  },
  {
    key: "/",
    ctrl: true,
    description: "Show keyboard shortcuts",
    action: () => {
      // Trigger help modal
      const event = new CustomEvent("show-shortcuts-modal");
      window.dispatchEvent(event);
    },
  },
  {
    key: "?",
    description: "Show keyboard shortcuts",
    action: () => {
      const event = new CustomEvent("show-shortcuts-modal");
      window.dispatchEvent(event);
    },
  },
];

// Navigation shortcuts (G + key)
export const navigationShortcuts: Record<string, { path: string; description: string }> = {
  d: { path: "/dashboard", description: "Go to Dashboard" },
  p: { path: "/projects", description: "Go to Projects" },
  t: { path: "/tasks", description: "Go to Tasks" },
  i: { path: "/inspections", description: "Go to QC Inspection" },
  f: { path: "/defects", description: "Go to Defects" },
  m: { path: "/templates", description: "Go to Templates" },
  r: { path: "/reports", description: "Go to Reports" },
};

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    let gPressed = false;
    let gPressTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Exception: Ctrl+K should work even in inputs
        if (!(e.ctrlKey && e.key === "k")) {
          return;
        }
      }

      // Handle G key for navigation shortcuts
      if (e.key === "g" || e.key === "G") {
        gPressed = true;
        clearTimeout(gPressTimeout);
        gPressTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000);
        return;
      }

      // Handle navigation shortcuts (G + key)
      if (gPressed && navigationShortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        const shortcut = navigationShortcuts[e.key.toLowerCase()];
        setLocation(shortcut.path);
        gPressed = false;
        return;
      }

      // Handle regular shortcuts
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gPressTimeout);
    };
  }, [setLocation]);
}
