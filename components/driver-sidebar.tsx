"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Gauge,
  AlertOctagon,
  Wrench,
  Menu,
  X,
  ChevronLeft,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

interface DriverSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const driverMenuItems = [
  { id: "journey", label: "Jornada", icon: Route },
  { id: "tachograph", label: "Tacógrafo", icon: Gauge },
  { id: "incidents", label: "Incidentes e Sinistros", icon: AlertOctagon },
  { id: "maintenance", label: "Manutenção", icon: Wrench },
];

export function DriverSidebar({
  activeView,
  onViewChange,
}: DriverSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useMobile();

  const handleViewChange = (view: string) => {
    onViewChange(view);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Image
              src="/images/image.png"
              alt="TRL Transporte"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-lg font-bold">TRL Transporte</span>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        )}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {driverMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleViewChange(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              activeView === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/70">
            © 2026 TRL Transporte
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-40 lg:hidden bg-transparent"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-64">
              {sidebarContent}
            </aside>
          </>
        )}
      </>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen border-r border-sidebar-border transition-all lg:block",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
