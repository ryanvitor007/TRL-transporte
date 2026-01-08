"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingDown, AlertTriangle, Fuel, BarChart3, GitCompare } from "lucide-react"
import { mockFuelEntries, mockMonthlyCosts, mockVehicleTCO, mockVehicles, filterByBranch } from "@/lib/mock-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useApp } from "@/contexts/app-context"
import { ComparisonPanel, DeltaBadge } from "@/components/comparison-panel"

export function FinancialsView() {
  const { selectedBranch, comparison, toggleComparison } = useApp()

  // Filter data by branch
  const filteredFuelEntries = filterByBranch(mockFuelEntries, selectedBranch)
  const filteredTCO = filterByBranch(mockVehicleTCO, selectedBranch)
  const filteredVehicles = filterByBranch(mockVehicles, selectedBranch)

  // Aggregate monthly costs by branch filter
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
  const currentMonth = monthlyCosts[monthlyCosts.length - 1]
  const previousMonth = monthlyCosts[monthlyCosts.length - 2]

  const totalMonthlyFuel = currentMonth?.fuel || 0
  const totalMonthlyMaintenance = currentMonth?.maintenance || 0
  const totalMonthlyCost = currentMonth?.total || 0
  const anomalyCount = filteredFuelEntries.filter((e) => e.hasAnomaly).length

  // Comparison chart data
  const getComparisonChartData = () => {
    if (!comparison.isActive || comparison.type !== "vehicles") return null

    const selectedVehicleData = comparison.selectedVehicles.map((vehicleId) => {
      const vehicle = mockVehicles.find((v) => v.id === vehicleId)
      const tco = mockVehicleTCO.find((t) => t.vehicleId === vehicleId)
      return {
        id: vehicleId,
        plate: vehicle?.plate || "",
        model: vehicle?.model || "",
        fuelCost: tco?.cumulativeFuelCost || 0,
        maintenanceCost: tco?.cumulativeMaintenanceCost || 0,
        fipeValue: tco?.currentFipeValue || 0,
        depreciation: tco?.depreciationPercent || 0,
      }
    })

    return selectedVehicleData
  }

  const getPeriodComparisonData = () => {
    if (!comparison.isActive || comparison.type !== "periods") return null

    const refData = monthlyCosts.find((m) => m.month === comparison.referenceMonth)
    const curData = monthlyCosts.find((m) => m.month === comparison.currentMonth)

    if (!refData || !curData) return null

    return [
      { category: "Combustível", [comparison.referenceMonth]: refData.fuel, [comparison.currentMonth]: curData.fuel },
      {
        category: "Manutenção",
        [comparison.referenceMonth]: refData.maintenance,
        [comparison.currentMonth]: curData.maintenance,
      },
      { category: "Pneus", [comparison.referenceMonth]: refData.tires, [comparison.currentMonth]: curData.tires },
      {
        category: "Seguro",
        [comparison.referenceMonth]: refData.insurance,
        [comparison.currentMonth]: curData.insurance,
      },
    ]
  }

  const vehicleComparisonData = getComparisonChartData()
  const periodComparisonData = getPeriodComparisonData()

  const tcoChartData = filteredTCO.map((v) => ({
    name: v.vehiclePlate,
    "Valor FIPE": v.currentFipeValue / 1000,
    "Custo Manutenção": v.cumulativeMaintenanceCost / 1000,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro & TCO</h1>
          <p className="text-muted-foreground">Custo Total de Propriedade e gestão de combustível</p>
        </div>
        <Button variant={comparison.isActive ? "default" : "outline"} onClick={toggleComparison} className="gap-2">
          <GitCompare className="h-4 w-4" />
          Comparação
        </Button>
      </div>

      <ComparisonPanel />

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Mensal Total</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {totalMonthlyCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              {previousMonth && <DeltaBadge current={totalMonthlyCost} reference={previousMonth.total} inverted />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Janeiro/2026</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Combustível</CardTitle>
            <Fuel className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {totalMonthlyFuel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              {previousMonth && <DeltaBadge current={totalMonthlyFuel} reference={previousMonth.fuel} inverted />}
            </div>
            <div className="mt-1 flex items-center text-sm text-green-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manutenção</CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {totalMonthlyMaintenance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              {previousMonth && (
                <DeltaBadge current={totalMonthlyMaintenance} reference={previousMonth.maintenance} inverted />
              )}
            </div>
            <div className="mt-1 flex items-center text-sm text-green-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Anomalias de Consumo</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{anomalyCount}</div>
            <p className="mt-1 text-sm text-muted-foreground">veículos com consumo atípico</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      {comparison.isActive &&
        comparison.type === "vehicles" &&
        vehicleComparisonData &&
        vehicleComparisonData.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Veículos - TCO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="plate" className="text-xs" />
                    <YAxis tickFormatter={(value) => `R$${value / 1000}k`} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) =>
                        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      }
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Bar dataKey="fuelCost" name="Combustível Acum." fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="maintenanceCost"
                      name="Manutenção Acum."
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

      {comparison.isActive && comparison.type === "periods" && periodComparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>
              Comparação de Períodos: {comparison.referenceMonth} vs {comparison.currentMonth}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis tickFormatter={(value) => `R$${value / 1000}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar
                    dataKey={comparison.referenceMonth}
                    name={comparison.referenceMonth}
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={comparison.currentMonth}
                    name={comparison.currentMonth}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Custos Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Custos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(value) => `R$${value / 1000}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                />
                <Legend />
                <Bar dataKey="fuel" name="Combustível" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maintenance" name="Manutenção" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tires" name="Pneus" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela de Abastecimentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Últimos Abastecimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Km/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuelEntries.slice(0, 6).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{entry.vehiclePlate}</TableCell>
                    <TableCell>{entry.liters}L</TableCell>
                    <TableCell>{entry.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.efficiency.toFixed(1)}
                        {entry.hasAnomaly && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Anomalia
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Gráfico TCO - FIPE vs Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle>TCO: Valor FIPE vs Custo de Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tcoChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => `R$${value}k`} className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip
                    formatter={(value: number) => `R$ ${(value * 1000).toLocaleString("pt-BR")}`}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="Valor FIPE" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Custo Manutenção" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              * Quando o custo de manutenção acumulado se aproxima do valor FIPE, considere a renovação do veículo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
