"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Wrench,
  FileText,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  DollarSign,
  CircleDot,
  AlertOctagon,
  Gauge,
  ClipboardList,
  Radio,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

// IDs que pertencem ao grupo Frota
const FLEET_CHILDREN = ["tachograph", "incidents", "maintenance", "documents", "tires"];

const fleetSubItems = [
  { id: "tachograph",  label: "Tacógrafo",              icon: Gauge },
  { id: "incidents",   label: "Incidentes & Sinistros",  icon: AlertOctagon },
  { id: "maintenance", label: "Manutenção",              icon: Wrench },
  { id: "documents",   label: "Documentos & Multas",     icon: FileText },
  { id: "tires",       label: "Gestão de Pneus",         icon: CircleDot, comingSoon: true },
];

const topMenuItems = [
  { id: "dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { id: "monitoring", label: "Monitoramento",   icon: Radio },
  // "fleet" é tratado separadamente como Collapsible
];

const bottomMenuItems = [
  { id: "financials", label: "Financeiro & TCO", icon: DollarSign },
  { id: "reports",    label: "Relatórios",        icon: ClipboardList },
  { id: "settings",   label: "Configurações",     icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showComingSoonToast, setShowComingSoonToast] = useState(false);
  const [comingSoonLabel, setComingSoonLabel] = useState("este módulo");

  // Frota começa aberto se a view ativa for ela mesma ou um filho
  const [isFleetOpen, setIsFleetOpen] = useState(() =>
    activeView === "fleet" || FLEET_CHILDREN.includes(activeView)
  );

  const isMobile = useMobile();
  const isEffectivelyCollapsed = isCollapsed && !isHovered;

  // Frota ativa se a view atual for ela mesma ou um filho
  const isFleetActive = activeView === "fleet" || FLEET_CHILDREN.includes(activeView);

  const handleViewChange = (view: string) => {
    onViewChange(view);
    if (isMobile) setIsMobileOpen(false);
  };

  const handleComingSoonClick = (label: string) => {
    setComingSoonLabel(label);
    setShowComingSoonToast(true);
    setTimeout(() => setShowComingSoonToast(false), 3500);
  };

  // ── Botão de item simples ───────────────────────────────────────────────
  const NavItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
  }) => (
    <button
      onClick={() => handleViewChange(id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
        activeView === id
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span
        className={cn(
          "transition-opacity duration-200",
          isEffectivelyCollapsed ? "opacity-0" : "opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  );

  // ── Subitem do menu Frota ──────────────────────────────────────────────
  const FleetSubItem = ({
    id,
    label,
    icon: Icon,
    comingSoon,
  }: {
    id: string;
    label: string;
    icon: React.ElementType;
    comingSoon?: boolean;
  }) => {
    const isActive = activeView === id;

    if (comingSoon) {
      return (
        <button
          onClick={() => handleComingSoonClick(label)}
          className={cn(
            "relative flex w-full items-center gap-3 rounded-lg pl-8 pr-3 py-2 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
            "opacity-60 cursor-not-allowed",
            "text-sidebar-foreground hover:bg-sidebar-accent/40"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="relative">
            <span className="opacity-40">{label}</span>
            <span className="absolute inset-0 flex items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 border border-white/30 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide uppercase">
                <Lock className="h-2.5 w-2.5" />
                Em Breve
              </span>
            </span>
          </span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleViewChange(id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg pl-8 pr-3 py-2 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
          isActive
            ? "bg-sidebar-primary/80 text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  // ── Conteúdo do sidebar ────────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground relative">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isEffectivelyCollapsed && (
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
                isEffectivelyCollapsed && "rotate-180"
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
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {/* Top items: Dashboard, Monitoramento */}
        {topMenuItems.map((item) => (
          <NavItem key={item.id} {...item} />
        ))}

        {/* ── Frota (Collapsible) ── */}
        <div>
          {/* Botão master Frota */}
          <button
            onClick={() => {
              // Ação dupla: navega para Frota E alterna o accordion
              if (isEffectivelyCollapsed) {
                setIsCollapsed(false);
              }
              handleViewChange("fleet");
              setIsFleetOpen((prev) => !prev);
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
              isFleetActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Car className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "flex-1 text-left transition-opacity duration-200",
                isEffectivelyCollapsed ? "opacity-0" : "opacity-100"
              )}
            >
              Frota
            </span>
            {/* Chevron giratório — escondido quando collapsed */}
            {!isEffectivelyCollapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-300",
                  isFleetOpen ? "rotate-180" : "rotate-0"
                )}
              />
            )}
          </button>

          {/* Submenus com animação grid-rows */}
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isFleetOpen && !isEffectivelyCollapsed
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="mt-1 space-y-0.5">
                {fleetSubItems.map((sub) => (
                  <FleetSubItem key={sub.id} {...sub} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom items: Financeiro, Relatórios, Configurações */}
        {bottomMenuItems.map((item) => (
          <NavItem key={item.id} {...item} />
        ))}
      </nav>

      {/* Footer */}
      {!isEffectivelyCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/70">
            © 2026 TRL Transporte
          </p>
        </div>
      )}

      {/* Pop-up "Em Breve" */}
      {showComingSoonToast && (
        <div
          className={cn(
            "absolute bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-start gap-3 rounded-xl border border-amber-400/30 bg-gray-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm",
            "animate-in fade-in slide-in-from-bottom-3 duration-300",
            "w-[220px]"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Em Breve</p>
            <p className="mt-0.5 text-[11px] leading-snug text-gray-300">
              O módulo <strong className="text-white">{comingSoonLabel}</strong> ainda não está disponível.
            </p>
          </div>
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative sticky top-0 hidden h-screen border-r border-sidebar-border transition-all duration-300 lg:block overflow-hidden z-50 shrink-0",
        isEffectivelyCollapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
