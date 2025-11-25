import React from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  inspections: "QC Inspection",
  defects: "Defects",
  templates: "Templates",
  reports: "Reports",
  "escalation-settings": "Escalation Settings",
  "escalation-logs": "Escalation Logs",
  notifications: "Notifications",
  "user-management": "User Management",
};

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const [location] = useLocation();

  // Auto-generate breadcrumbs from URL if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const paths = location.split("/").filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];

    // Add home
    crumbs.push({ label: "Home", path: "/dashboard" });

    // Build path incrementally
    let currentPath = "";
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip if it's an ID (numeric or starts with #)
      if (/^\d+$/.test(segment) || segment.startsWith("#")) {
        return;
      }

      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Last item should not be clickable
      if (index === paths.length - 1) {
        crumbs.push({ label });
      } else {
        crumbs.push({ label, path: currentPath });
      }
    });

    return crumbs;
  })();

  // Don't show breadcrumbs on dashboard
  if (location === "/dashboard" || location === "/") {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground mb-4", className)}
    >
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            {item.path && !isLast ? (
              <Link
                href={item.path}
                className="hover:text-foreground transition-colors font-medium"
              >
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "font-medium",
                isLast && "text-foreground"
              )}>
                {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
