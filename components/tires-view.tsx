"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CircleDot, AlertTriangle, History, Package, Truck } from "lucide-react"
import {
  mockVehicleTires,
  mockTireRotations,
  mockSpareTires,
  getTireHealthColor,
  getTireHealthLabel,
} from "@/lib/mock-data"

export function TiresView() {
  const [selectedVehicle, setSelectedVehicle] = useState(mockVehicleTires[0].vehicleId)

  const currentVehicle = mockVehicleTires.find((v) => v.vehicleId === selectedVehicle)
  const vehicleRotations = mockTireRotations.filter((r) => r.vehicleId === selectedVehicle)

  const criticalTires = mockVehicleTires.flatMap((v) =>
    v.tires.filter((t) => getTireHealthColor(t.treadDepth) === "red"),
  ).length

  const warningTires = mockVehicleTires.flatMap((v) =>
    v.tires.filter((t) => getTireHealthColor(t.treadDepth) === "yellow"),
  ).length

  const getProgressColor = (depth: number) => {
    const color = getTireHealthColor(depth)
    if (color === "green") return "bg-green-500"
    if (color === "yellow") return "bg-amber-500"
    return "bg-red-500"
  }

  const getProgressValue = (depth: number) => {
    // Máximo de 10mm para pneu novo
    return Math.min((depth / 10) * 100, 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Pneus</h1>
        <p className="text-muted-foreground">Monitoramento de desgaste, rodízios e estoque</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pneus Críticos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{criticalTires}</div>
            <p className="mt-1 text-sm text-muted-foreground">{"< 1.6mm - troca urgente"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pneus em Atenção</CardTitle>
            <CircleDot className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{warningTires}</div>
            <p className="mt-1 text-sm text-muted-foreground">{"< 3mm - monitorar"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Reserva</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockSpareTires.reduce((acc, t) => acc + t.quantity, 0)}</div>
            <p className="mt-1 text-sm text-muted-foreground">pneus disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Seletor de Veículo e Visualização */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Desgaste dos Pneus
            </CardTitle>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {mockVehicleTires.map((vehicle) => (
                  <SelectItem key={vehicle.vehicleId} value={vehicle.vehicleId}>
                    {vehicle.vehicleModel} - {vehicle.vehiclePlate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {currentVehicle && (
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-around">
              {/* Representação Visual do Veículo */}
              <div className="relative flex flex-col items-center">
                <div className="mb-4 text-lg font-semibold">{currentVehicle.vehicleModel}</div>

                {/* Grid 2x2 para os pneus */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Pneus Dianteiros */}
                  {currentVehicle.tires
                    .filter((t) => t.position.startsWith("F"))
                    .map((tire) => (
                      <div key={tire.id} className="flex flex-col items-center gap-2">
                        <div
                          className={`h-16 w-8 rounded-lg border-4 ${
                            getTireHealthColor(tire.treadDepth) === "green"
                              ? "border-green-500 bg-green-500/20"
                              : getTireHealthColor(tire.treadDepth) === "yellow"
                                ? "border-amber-500 bg-amber-500/20"
                                : "border-red-500 bg-red-500/20"
                          }`}
                        />
                        <div className="text-center">
                          <p className="text-xs font-medium">
                            {tire.position === "FL" ? "Dianteiro E" : "Dianteiro D"}
                          </p>
                          <p className="text-lg font-bold">{tire.treadDepth}mm</p>
                          <Badge
                            variant={
                              getTireHealthColor(tire.treadDepth) === "green"
                                ? "default"
                                : getTireHealthColor(tire.treadDepth) === "yellow"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {getTireHealthLabel(tire.treadDepth)}
                          </Badge>
                        </div>
                      </div>
                    ))}

                  {/* Pneus Traseiros */}
                  {currentVehicle.tires
                    .filter((t) => t.position.startsWith("R"))
                    .map((tire) => (
                      <div key={tire.id} className="flex flex-col items-center gap-2">
                        <div
                          className={`h-16 w-8 rounded-lg border-4 ${
                            getTireHealthColor(tire.treadDepth) === "green"
                              ? "border-green-500 bg-green-500/20"
                              : getTireHealthColor(tire.treadDepth) === "yellow"
                                ? "border-amber-500 bg-amber-500/20"
                                : "border-red-500 bg-red-500/20"
                          }`}
                        />
                        <div className="text-center">
                          <p className="text-xs font-medium">{tire.position === "RL" ? "Traseiro E" : "Traseiro D"}</p>
                          <p className="text-lg font-bold">{tire.treadDepth}mm</p>
                          <Badge
                            variant={
                              getTireHealthColor(tire.treadDepth) === "green"
                                ? "default"
                                : getTireHealthColor(tire.treadDepth) === "yellow"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {getTireHealthLabel(tire.treadDepth)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Detalhes dos Pneus */}
              <div className="w-full max-w-md space-y-4">
                <h4 className="font-semibold">Profundidade do Sulco</h4>
                {currentVehicle.tires.map((tire) => (
                  <div key={tire.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {tire.position === "FL"
                          ? "Dianteiro Esquerdo"
                          : tire.position === "FR"
                            ? "Dianteiro Direito"
                            : tire.position === "RL"
                              ? "Traseiro Esquerdo"
                              : "Traseiro Direito"}
                      </span>
                      <span className="font-medium">{tire.treadDepth}mm</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${getProgressColor(tire.treadDepth)}`}
                        style={{ width: `${getProgressValue(tire.treadDepth)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tire.brand} {tire.model} • Instalado em {new Date(tire.installDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}

                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Legenda:</strong> Verde {"> 5mm"} | Amarelo {"< 3mm"} | Vermelho {"< 1.6mm (limite legal)"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Histórico de Rodízios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Rodízios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleRotations.length > 0 ? (
              <div className="space-y-3">
                {vehicleRotations.map((rotation) => (
                  <div key={rotation.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <History className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{rotation.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(rotation.date).toLocaleDateString("pt-BR")} •{" "}
                        {rotation.mileage.toLocaleString("pt-BR")} km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum rodízio registrado para este veículo.</p>
            )}
          </CardContent>
        </Card>

        {/* Estoque de Pneus Reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estoque de Pneus Reserva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Condição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSpareTires.map((tire) => (
                  <TableRow key={tire.id}>
                    <TableCell className="font-medium">
                      {tire.brand} {tire.model}
                    </TableCell>
                    <TableCell>{tire.size}</TableCell>
                    <TableCell>{tire.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tire.condition === "Novo"
                            ? "default"
                            : tire.condition === "Usado - Bom"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {tire.condition}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
