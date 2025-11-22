import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useRoleLabel } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  PanelLeft,
  FolderKanban,
  ListTodo,
  ClipboardCheck,
  ClipboardList,
  AlertTriangle,
  FileText,
  BarChart3,
  UserCircle,
  LogOut,
  Users,
  LineChart,
  Moon,
  Sun,
  Bell,
  History,
  ChevronRight,
} from "lucide-react";

import NotificationBadge from "@/components/NotificationBadge";
import { UserDropdown } from "@/components/UserDropdown";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Breadcrumbs from "@/components/Breadcrumbs";
import KeyboardShortcutsModal from "@/components/KeyboardShortcutsModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import BottomNavigation from "@/components/BottomNavigation";

function RoleBadge() {
  const roleLabel = useRoleLabel();
  if (!roleLabel) return null;

  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
      {roleLabel}
    </Badge>
  );
}

function ThemeToggleButton() {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  adminOnly?: boolean;

  submenu?: MenuItem[];
};

const menuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: FolderKanban,
    label: "Projects",
    path: "/projects",
  },
  {
    icon: ListTodo,
    label: "Tasks",
    path: "/tasks",
  },
  {
    icon: ClipboardList,
    label: "QC Inspection",
    path: "/qc-inspection",
  },
  {
    icon: AlertTriangle,
    label: "Defects",
    path: "/defects",
  },
  {
    icon: FileText,
    label: "Templates",
    path: "/templates",
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "/reports",
  },
  {
    icon: Bell,
    label: "Escalation Settings",
    path: "/escalation-settings",
    adminOnly: true,
  },
  {
    icon: History,
    label: "Escalation Logs",
    path: "/escalation-logs",
    adminOnly: true,
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // eslint-disable-next-line no-undef
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line no-undef
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#00366D] via-[#006b7a] to-[#00CE81]">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00366D] to-[#00CE81] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white p-3 rounded-xl">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-24 w-24 object-contain"
                />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#00366D] to-[#00CE81] bg-clip-text text-transparent">
                {APP_TITLE.split("\n").map((line: string, i: number) => (
                  <div key={i}>{line}</div>
                ))}
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Construction Management & QC Platform
              </p>
              <p className="text-xs text-gray-500">
                กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              // eslint-disable-next-line no-undef
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-[#2d7a7a] to-[#00b894] hover:from-[#1e3a5f] hover:to-[#2d7a7a] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            เข้าสู่ระบบ
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Powered by A.O. Construction and Engineering
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0">
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />
    </div>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  // eslint-disable-next-line no-undef
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();



  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      // eslint-disable-next-line no-undef
      document.addEventListener("mousemove", handleMouseMove);
      // eslint-disable-next-line no-undef
      document.addEventListener("mouseup", handleMouseUp);
      // eslint-disable-next-line no-undef
      document.body.style.cursor = "col-resize";
      // eslint-disable-next-line no-undef
      document.body.style.userSelect = "none";
    }

    return () => {
      // eslint-disable-next-line no-undef
      document.removeEventListener("mousemove", handleMouseMove);
      // eslint-disable-next-line no-undef
      document.removeEventListener("mouseup", handleMouseUp);
      // eslint-disable-next-line no-undef
      document.body.style.cursor = "";
      // eslint-disable-next-line no-undef
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative hidden md:block" ref={sidebarRef}>
        <Sidebar
          collapsible="none"
          className="border-r-0 bg-[#1e3a8a] text-white"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 w-full">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={APP_LOGO}
                  className="h-8 w-8 rounded-md object-contain bg-white p-1 ring-1 ring-border shrink-0"
                  alt="Logo"
                />
                <span className="font-semibold tracking-tight truncate text-white">
                  {APP_TITLE}
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems
                .filter(item => !item.adminOnly || user?.role === "admin" || user?.role === "owner")
                .map(item => {
                  const isActive = location === item.path;
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const hasActiveSubmenu = item.submenu?.some(sub => sub.path === location);

                  return (
                    <SidebarMenuItem key={item.path || item.label}>
                      <SidebarMenuButton
                        isActive={isActive || hasActiveSubmenu}
                        onClick={() => {
                          if (item.path) {
                            setLocation(item.path);
                          }
                        }}
                        tooltip={item.label}
                        className={`h-10 transition-all font-normal ${isActive || hasActiveSubmenu ? "bg-white/10 text-white hover:bg-white/15" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                      >
                        <item.icon className={`h-4 w-4`} />
                        <span>{item.label}</span>
                        {hasSubmenu && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </SidebarMenuButton>
                      {hasSubmenu && (
                        <SidebarMenuSub>
                          {item.submenu
                            ?.filter(subItem => !subItem.adminOnly || user?.role === "admin" || user?.role === "owner")
                            .map(subItem => {
                              const isSubActive = location === subItem.path;
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    isActive={isSubActive}
                                    onClick={() => subItem.path && setLocation(subItem.path)}
                                    className="text-white/80 hover:text-white hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-white"
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate leading-none">
                        {user?.name || "-"}
                      </p>
                      <RoleBadge />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>โปรไฟล์ของฉัน</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
          onMouseDown={() => {
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top Bar - Desktop & Mobile */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && (
              <>
                <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
                <span className="tracking-tight text-foreground font-medium">
                  {activeMenuItem?.label ?? APP_TITLE}
                </span>
              </>
            )}
            {!isMobile && (
              <span className="text-lg font-semibold">{APP_TITLE}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <ThemeToggleButton />
            <NotificationBadge />
            <UserDropdown />
          </div>
        </div>
        <main className="flex-1 p-4 pb-20 md:pb-4">
          <Breadcrumbs />
          {children}
        </main>
        {isMobile && <BottomNavigation />}
      </SidebarInset>
      <KeyboardShortcutsModal />
    </>
  );
}
