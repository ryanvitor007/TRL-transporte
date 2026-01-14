"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, User, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DriverTopBar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Painel do Motorista
        </span>
        <Badge variant="secondary" className="text-xs">
          Motorista
        </Badge>
      </div>

      <div className="flex items-center gap-3 border-l border-border pl-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {user?.name || "Motorista"}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </div>
  );
}
