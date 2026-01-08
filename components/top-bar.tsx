"use client"

import { useApp } from "@/contexts/app-context"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, LogOut, User } from "lucide-react"
import { branches } from "@/lib/mock-data"

export function TopBar() {
  const { selectedBranch, setSelectedBranch } = useApp()
  const { user, logout } = useAuth()

  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">Localização:</span>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedBranch} onValueChange={(value) => setSelectedBranch(value as typeof selectedBranch)}>
          <SelectTrigger className="w-[180px]">
            <MapPin className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Selecione a filial" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch === "Todas" ? "Todas as Filiais" : branch}
                {branch === "São Paulo" && " (Matriz)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{user?.name || "Usuário"}</span>
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
    </div>
  )
}
