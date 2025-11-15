import { Link, useLocation } from "wouter";
import { Home, ClipboardList, ClipboardCheck, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, label: "หน้าหลัก" },
  { path: "/tasks", icon: ClipboardList, label: "งาน" },
  { path: "/qc", icon: ClipboardCheck, label: "QC" },
  { path: "/defects", icon: AlertTriangle, label: "ข้อบกพร่อง" },
  { path: "/profile", icon: User, label: "โปรไฟล์" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                "active:bg-accent/50",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
