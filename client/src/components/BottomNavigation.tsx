import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, ListTodo, ClipboardCheck, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/projects", icon: FolderKanban, label: "Projects" },
  { path: "/tasks", icon: ListTodo, label: "Tasks" },
  { path: "/qc-inspection", icon: ClipboardCheck, label: "QC" },
  { path: "/notifications", icon: Bell, label: "แจ้งเตือน" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  const handleNavClick = () => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16 safe-area-inset-bottom">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === "/qc-inspection" && (
              location.startsWith("/qc-inspection") ||
              location.startsWith("/defects") ||
              location.startsWith("/templates") ||
              location.startsWith("/reports") ||
              location.startsWith("/escalation")
            ));

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-200",
                "active:scale-95 active:bg-accent/50",
                "touch-manipulation",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-all",
                isActive && "stroke-[2.5] scale-110"
              )} />
              <span className={cn(
                "text-[10px] transition-all",
                isActive ? "font-semibold" : "font-medium"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
