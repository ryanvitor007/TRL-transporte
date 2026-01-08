"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, TrendingDown, AlertTriangle, Fuel, BarChart3 } from "lucide-react"
import { mockFuelEntries, mockMonthlyCosts, mockVehicleTCO } from "@/lib/mock-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function FinancialsView() {
  const totalMonthlyFuel = mockMonthlyCosts[mockMonthlyCosts.length - 1]?.fuel || 0
  const totalMonthlyMaintenance = mockMonthlyCosts[mockMonthlyCosts.length - 1]?.maintenance || 0
  const totalMonthlyCost = mockMonthlyCosts[mockMonthlyCosts.length - 1]?.total || 0
  const anomalyCount = mockFuelEntries.filter((e) => e.hasAnomaly).length

  const tcoChartData = mockVehicleTCO.map((v) => ({
    name: v.vehiclePlate,
    "Valor FIPE": v.currentFipeValue / 1000,
    "Custo Manutenção": v.cumulativeMaintenanceCost / 1000,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro & TCO</h1>
        <p className="text-muted-foreground">Custo Total de Propriedade e gestão de combustível</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Mensal Total</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalMonthlyCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
            <div className="text-3xl font-bold">
              {totalMonthlyFuel.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div className="mt-1 flex items-center text-sm text-green-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              -8% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manutenção</CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalMonthlyMaintenance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div className="mt-1 flex items-center text-sm text-green-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              -58% vs mês anterior
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

      {/* Gráfico de Custos Mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Custos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthlyCosts}>
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
                {mockFuelEntries.slice(0, 6).map((entry) => (
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
