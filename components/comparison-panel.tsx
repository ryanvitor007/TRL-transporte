"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, GitCompare, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { mockVehicles, mockMonthlyCosts, filterByBranch } from "@/lib/mock-data"

export function ComparisonPanel() {
  const { comparison, setComparison, selectedBranch } = useApp()
  const [comparisonType, setComparisonType] = useState<"vehicles" | "periods">(comparison.type)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(comparison.selectedVehicles)
  const [referenceMonth, setReferenceMonth] = useState(comparison.referenceMonth)
  const [currentMonth, setCurrentMonth] = useState(comparison.currentMonth)

  const filteredVehicles = filterByBranch(mockVehicles, selectedBranch)
  const months = [...new Set(mockMonthlyCosts.map((c) => c.month))]

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId],
    )
  }

  const handleApply = () => {
    setComparison({
      isActive: true,
      type: comparisonType,
      selectedVehicles,
      referenceMonth,
      currentMonth,
    })
  }

  const handleClose = () => {
    setComparison({ ...comparison, isActive: false })
  }

  if (!comparison.isActive) return null

  return (
    <Card className="mb-6 border-primary/50 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompare className="h-5 w-5 text-primary" />
          Modo Comparação
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as typeof comparisonType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="vehicles">Comparar Veículos</TabsTrigger>
            <TabsTrigger value="periods">Comparar Períodos</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione 2 ou mais veículos para comparar lado a lado:</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehicle-${vehicle.id}`}
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                  />
                  <Label htmlFor={`vehicle-${vehicle.id}`} className="text-sm">
                    {vehicle.plate} - {vehicle.model}
                  </Label>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="periods" className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione os períodos para comparação:</p>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label>Mês de Referência</Label>
                <Select value={referenceMonth} onValueChange={setReferenceMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mês Atual</Label>
                <Select value={currentMonth} onValueChange={setCurrentMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleApply}>Aplicar Comparação</Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface DeltaBadgeProps {
  current: number
  reference: number
  inverted?: boolean // true if lower is better (e.g., costs)
  format?: "currency" | "percent" | "number"
}

export function DeltaBadge({ current, reference, inverted = false, format = "percent" }: DeltaBadgeProps) {
  if (reference === 0) return null

  const delta = ((current - reference) / reference) * 100
  const isPositive = delta > 0
  const isGood = inverted ? !isPositive : isPositive

  const formatValue = () => {
    const absValue = Math.abs(delta)
    return `${absValue.toFixed(1)}%`
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? "text-green-600" : "text-red-600"}`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {formatValue()}
    </span>
  )
}
