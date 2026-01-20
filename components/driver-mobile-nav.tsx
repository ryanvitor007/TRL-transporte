"use client";

import { cn } from "@/lib/utils";
import { Route, Gauge, AlertOctagon, Wrench, User } from "lucide-react";

interface DriverMobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: "journey", label: "Jornada", icon: Route },
  { id: "tachograph", label: "Tacografo", icon: Gauge },
  { id: "incidents", label: "Incidentes", icon: AlertOctagon },
  { id: "maintenance", label: "Manutencao", icon: Wrench },
  { id: "profile", label: "Perfil", icon: User },
];

export function DriverMobileNav({
  activeView,
  onViewChange,
}: DriverMobileNavProps) {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="flex items-center justify-around rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg shadow-black/10 dark:shadow-black/30 border border-white/20 dark:border-zinc-800/50 px-2 py-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ease-out min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Active Background Indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-xl transition-all duration-300" />
              )}

              {/* Icon Container */}
              <div
                className={cn(
                  "relative flex items-center justify-center transition-all duration-300 ease-out",
                  isActive ? "scale-110" : "scale-100",
                )}
              >
                {/* Active Dot Indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}

                <Icon
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "w-6 h-6 stroke-[2.5px]"
                      : "w-5 h-5 stroke-[1.5px]",
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-300 truncate max-w-[48px]",
                  isActive ? "opacity-100" : "opacity-70",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
