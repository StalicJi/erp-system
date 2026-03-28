"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useErp } from "@/context/ErpContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Permission } from "@/types";
import {
  Users,
  Briefcase,
  LogOut,
  Menu,
  X,
  FileText,
  BarChart2,
  ClipboardList,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredPermissions?: Permission[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/employees",
    label: "員工管理",
    icon: Users,
    requiredPermissions: ["hr.write", "admin.write"],
  },
  {
    href: "/departments",
    label: "部門管理",
    icon: Briefcase,
    requiredPermissions: ["admin.read", "admin.write", "hr.write"],
  },
  {
    href: "/reports",
    label: "工作日報",
    icon: FileText,
    requiredPermissions: ["reports.read", "reports.write"],
  },
  {
    href: "/projects",
    label: "專案管理",
    icon: BarChart2,
    requiredPermissions: ["projects.read", "projects.write"],
  },
  {
    href: "/audit",
    label: "事件紀錄",
    icon: ClipboardList,
    requiredPermissions: ["audit.read"],
  },
  {
    href: "/settings",
    label: "系統設定",
    icon: Settings,
    requiredPermissions: ["settings.read", "settings.write"],
  },
  {
    href: "/preferences",
    label: "個人設定",
    icon: SlidersHorizontal,
  },
];

function hasAnyPermission(
  userPermissions: Permission[],
  required?: Permission[],
): boolean {
  if (!required || required.length === 0) return true;
  return required.some((p) => userPermissions.includes(p));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, appSettings } = useErp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) =>
    currentUser
      ? hasAnyPermission(currentUser.permissions, item.requiredPermissions)
      : false,
  );

  const handleLogout = () => {
    logout();
    toast.success("已登出");
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {appSettings.logoText}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground text-sm leading-tight truncate">
            {appSettings.siteName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {appSettings.siteDescription}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border px-3 py-4">
        {currentUser && (
          <div className="px-3 mb-3">
            <p className="text-sm font-medium text-foreground truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser.position}
              {currentUser.isManager && (
                <span className="ml-1 text-primary">· 主管</span>
              )}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          登出
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:sticky lg:top-0 lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {appSettings.logoText}
            </span>
          </div>
          <span className="font-bold text-sm text-foreground">
            {appSettings.siteName}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-card border-r border-border flex flex-col">
            {sidebarContent}
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
