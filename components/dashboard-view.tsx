"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, AlertTriangle, Wrench, FileWarning, Ban, TrendingUp, Clock, DollarSign, CircleDot } from "lucide-react"
import {
  mockVehicles,
  mockDocuments,
  mockMaintenances,
  mockMonthlyCosts,
  mockVehicleTires,
  getTireHealthColor,
  getPlateRestriction,
  getVehiclesInRotation,
  filterByBranch,
} from "@/lib/mock-data"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useApp } from "@/contexts/app-context"

export function DashboardView() {
  const { selectedBranch } = useApp()

  const filteredVehicles = filterByBranch(mockVehicles, selectedBranch)
  const filteredDocuments = filterByBranch(mockDocuments, selectedBranch)
  const filteredMaintenances = filterByBranch(mockMaintenances, selectedBranch)
  const filteredTires = filterByBranch(mockVehicleTires, selectedBranch)

  // Aggregate monthly costs by branch
  const aggregateMonthlyCosts = () => {
    const filtered = filterByBranch(mockMonthlyCosts, selectedBranch)
    const grouped = filtered.reduce(
      (acc, cost) => {
        if (!acc[cost.month]) {
          acc[cost.month] = { month: cost.month, fuel: 0, maintenance: 0, tires: 0, insurance: 0, total: 0 }
        }
        acc[cost.month].fuel += cost.fuel
        acc[cost.month].maintenance += cost.maintenance
        acc[cost.month].tires += cost.tires
        acc[cost.month].insurance += cost.insurance
        acc[cost.month].total += cost.total
        return acc
      },
      {} as Record<
        string,
        { month: string; fuel: number; maintenance: number; tires: number; insurance: number; total: number }
      >,
    )
    return Object.values(grouped)
  }

  const monthlyCosts = aggregateMonthlyCosts()

  const activeVehicles = filteredVehicles.filter((v) => v.status === "Ativo").length
  const inShopVehicles = filteredVehicles.filter((v) => v.status === "Em Oficina").length
  const documentIssues = filteredVehicles.filter((v) => v.status === "Problema Documental").length

  const expiringDocuments = filteredDocuments.filter((d) => d.status === "Vencendo" || d.status === "Vencido")
  const urgentMaintenances = filteredMaintenances.filter((m) => m.status === "Urgente")

  const criticalTires = filteredTires.flatMap((v) =>
    v.tires
      .filter((t) => getTireHealthColor(t.treadDepth) === "red")
      .map((t) => ({
        vehiclePlate: v.vehiclePlate,
        vehicleModel: v.vehicleModel,
        position: t.position,
        treadDepth: t.treadDepth,
      })),
  )

  const currentMonthCost = monthlyCosts[monthlyCosts.length - 1]?.total || 0
  const fleetAvailability =
    filteredVehicles.length > 0 ? Math.round((activeVehicles / filteredVehicles.length) * 100) : 0

  const { blockedEndings, dayName } = getPlateRestriction()
  // Only show rotation for São Paulo branch
  const vehiclesInRotation =
    selectedBranch === "São Paulo" || selectedBranch === "Todas"
      ? getVehiclesInRotation(filterByBranch(mockVehicles, "São Paulo"))
      : []

  const alerts = [
    ...expiringDocuments.map((doc) => ({
      id: doc.id,
      type: "document" as const,
      message: `${doc.type} - Placa ${doc.vehiclePlate}`,
      status: doc.status,
      date: doc.expirationDate,
    })),
    ...urgentMaintenances.map((m) => ({
      id: m.id,
      type: "maintenance" as const,
      message: `${m.type} - ${m.vehicleModel} (${m.vehiclePlate})`,
      status: "Urgente",
      date: m.scheduledDate,
    })),
    ...criticalTires.map((tire, index) => ({
      id: `tire-${index}`,
      type: "tire" as const,
      message: `Pneu crítico - ${tire.vehicleModel} (${tire.vehiclePlate})`,
      status: "Crítico",
      date: new Date().toISOString(),
    })),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua frota - {dayName}
          {selectedBranch !== "Todas" && ` - ${selectedBranch}`}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Veículos</CardTitle>
            <Car className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredVehicles.length}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="flex items-center text-green-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                {activeVehicles} ativos
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Mensal</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(currentMonthCost / 1000).toFixed(0)}k</div>
            <p className="mt-1 text-sm text-muted-foreground">manutenção + combustível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponibilidade</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{fleetAvailability}%</div>
            <p className="mt-1 text-sm text-muted-foreground">{inShopVehicles} em oficina</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rodízio Hoje (SP)</CardTitle>
            <Ban className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehiclesInRotation.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {blockedEndings.length > 0 ? `Finais ${blockedEndings.join(" e ")}` : "Sem restrição"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alertas Críticos */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={`${alert.type}-${alert.id}`}
                    className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {alert.type === "document" ? (
                        <FileWarning className="h-5 w-5 text-destructive" />
                      ) : alert.type === "tire" ? (
                        <CircleDot className="h-5 w-5 text-destructive" />
                      ) : (
                        <Wrench className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {new Date(alert.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={alert.status === "Vencido" || alert.status === "Crítico" ? "destructive" : "secondary"}
                    >
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Custo por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyCosts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(value) => `${value / 1000}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Custo Total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rodízio - Only show for SP branch or All */}
      {(selectedBranch === "São Paulo" || selectedBranch === "Todas") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-500" />
              Rodízio Municipal - São Paulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {blockedEndings.length > 0 ? (
                  <>
                    Hoje ({dayName}), veículos com placa final <strong>{blockedEndings.join(" e ")}</strong> não podem
                    circular no horário de pico.
                  </>
                ) : (
                  <>Hoje ({dayName}) não há restrição de rodízio.</>
                )}
              </p>
            </div>

            {vehiclesInRotation.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {vehiclesInRotation.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{vehicle.model}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Bloqueado
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum veículo da frota está no rodízio hoje.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
