"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, Calendar, Gauge, AlertCircle, Clock, CheckCircle, GitCompare } from "lucide-react"
import { mockMaintenances, filterByBranch, type Maintenance } from "@/lib/mock-data"
import { useApp } from "@/contexts/app-context"
import { ComparisonPanel } from "@/components/comparison-panel"

const statusConfig: Record<Maintenance["status"], { color: string; icon: typeof AlertCircle }> = {
  Urgente: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
  Agendada: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
  },
  Concluída: {
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
}

export function MaintenanceView() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { selectedBranch, comparison, toggleComparison } = useApp()

  const branchFiltered = filterByBranch(mockMaintenances, selectedBranch)
  const filteredMaintenances = branchFiltered.filter((m) => statusFilter === "all" || m.status === statusFilter)

  const urgentCount = branchFiltered.filter((m) => m.status === "Urgente").length
  const scheduledCount = branchFiltered.filter((m) => m.status === "Agendada").length
  const completedCount = branchFiltered.filter((m) => m.status === "Concluída").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
          <p className="text-muted-foreground">Acompanhe as manutenções programadas e histórico</p>
        </div>
        <Button variant={comparison.isActive ? "default" : "outline"} onClick={toggleComparison} className="gap-2">
          <GitCompare className="h-4 w-4" />
          Comparação
        </Button>
      </div>

      <ComparisonPanel />

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{urgentCount}</p>
              <p className="text-sm text-muted-foreground">Urgentes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-sm text-muted-foreground">Agendadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-900/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lista de Manutenções</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Urgente">Urgente</SelectItem>
            <SelectItem value="Agendada">Agendada</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de manutenções */}
      <div className="space-y-4">
        {filteredMaintenances.map((maintenance) => {
          const config = statusConfig[maintenance.status]
          const StatusIcon = config.icon

          return (
            <Card key={maintenance.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Wrench className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{maintenance.type}</h3>
                        <Badge className={config.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {maintenance.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {maintenance.branch}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {maintenance.vehicleModel} - {maintenance.vehiclePlate}
                      </p>
                      <p className="mt-1 text-sm">{maintenance.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm sm:items-end">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(maintenance.scheduledDate).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gauge className="h-4 w-4" />
                      {maintenance.scheduledMileage.toLocaleString("pt-BR")} km
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
