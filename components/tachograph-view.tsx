"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Upload,
  Gauge,
  FileCheck,
  AlertOctagon,
  Calendar,
  Car,
  User,
} from "lucide-react"
import {
  mockTachographCalibrations,
  mockTachographReadings,
  mockVehicles,
  getTachographStats,
  type TachographReading,
} from "@/lib/mock-data"

export function TachographView() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [readings, setReadings] = useState(mockTachographReadings)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newReading, setNewReading] = useState({
    vehicleId: "",
    driverName: "",
    date: "",
    startKm: "",
    endKm: "",
    maxSpeed: "",
    drivingTime: "",
    notes: "",
  })

  const stats = getTachographStats()

  const getCalibrationStatusBadge = (status: string) => {
    switch (status) {
      case "Válido":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      case "Vencendo":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      case "Vencido":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertOctagon className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDaysUntilExpiration = (date: string) => {
    const today = new Date()
    const expiration = new Date(date)
    const diffTime = expiration.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateDistance = () => {
    const start = Number.parseFloat(newReading.startKm)
    const end = Number.parseFloat(newReading.endKm)
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return end - start
    }
    return 0
  }

  const handleAddReading = () => {
    if (
      !newReading.vehicleId ||
      !newReading.driverName ||
      !newReading.date ||
      !newReading.startKm ||
      !newReading.endKm ||
      !newReading.maxSpeed ||
      !newReading.drivingTime
    ) {
      return
    }

    const vehicle = mockVehicles.find((v) => v.id === newReading.vehicleId)
    const maxSpeed = Number.parseFloat(newReading.maxSpeed)
    const newReadingData: TachographReading = {
      id: `tr${readings.length + 1}`,
      vehicleId: newReading.vehicleId,
      vehiclePlate: vehicle?.plate || "",
      driverName: newReading.driverName,
      date: newReading.date,
      startKm: Number.parseFloat(newReading.startKm),
      endKm: Number.parseFloat(newReading.endKm),
      distance: calculateDistance(),
      maxSpeed: maxSpeed,
      drivingTime: Number.parseFloat(newReading.drivingTime),
      hasViolation: maxSpeed > 90,
      notes: newReading.notes,
      diskPhotoUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
    }

    setReadings([newReadingData, ...readings])
    setNewReading({
      vehicleId: "",
      driverName: "",
      date: "",
      startKm: "",
      endKm: "",
      maxSpeed: "",
      drivingTime: "",
      notes: "",
    })
    setSelectedFile(null)
    setIsAddDialogOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cronotacógrafo</h1>
          <p className="text-muted-foreground">Gestão de calibração INMETRO e leituras diárias</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lançamento de Leitura do Cronotacógrafo</DialogTitle>
              <DialogDescription>Registre os dados da leitura do disco/fita do cronotacógrafo</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo *</Label>
                  <Select
                    value={newReading.vehicleId}
                    onValueChange={(value) => setNewReading({ ...newReading, vehicleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Motorista *</Label>
                  <Input
                    id="driver"
                    placeholder="Nome do motorista"
                    value={newReading.driverName}
                    onChange={(e) => setNewReading({ ...newReading, driverName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data da Leitura *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReading.date}
                  onChange={(e) => setNewReading({ ...newReading, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startKm">Km Inicial *</Label>
                  <Input
                    id="startKm"
                    type="number"
                    placeholder="Ex: 125000"
                    value={newReading.startKm}
                    onChange={(e) => setNewReading({ ...newReading, startKm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endKm">Km Final *</Label>
                  <Input
                    id="endKm"
                    type="number"
                    placeholder="Ex: 125500"
                    value={newReading.endKm}
                    onChange={(e) => setNewReading({ ...newReading, endKm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distância</Label>
                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                    {calculateDistance()} km
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxSpeed">Velocidade Máxima (km/h) *</Label>
                  <Input
                    id="maxSpeed"
                    type="number"
                    placeholder="Ex: 85"
                    value={newReading.maxSpeed}
                    onChange={(e) => setNewReading({ ...newReading, maxSpeed: e.target.value })}
                    className={
                      Number.parseFloat(newReading.maxSpeed) > 90 ? "border-red-500 text-red-600 font-bold" : ""
                    }
                  />
                  {Number.parseFloat(newReading.maxSpeed) > 90 && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      VIOLAÇÃO: Velocidade acima de 90km/h
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drivingTime">Tempo de Condução (horas) *</Label>
                  <Input
                    id="drivingTime"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 6.5"
                    value={newReading.drivingTime}
                    onChange={(e) => setNewReading({ ...newReading, drivingTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diskPhoto">Foto do Disco/Fita (para auditoria)</Label>
                <div className="flex items-center gap-2">
                  <Input id="diskPhoto" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => document.getElementById("diskPhoto")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedFile ? selectedFile.name : "Anexar imagem do disco"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais..."
                  value={newReading.notes}
                  onChange={(e) => setNewReading({ ...newReading, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddReading} className="bg-primary hover:bg-primary/90">
                Salvar Lançamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calibrações Vencendo</p>
                <p
                  className={`text-2xl font-bold ${stats.calibrationsExpiring > 0 ? "text-yellow-600" : "text-foreground"}`}
                >
                  {stats.calibrationsExpiring}
                </p>
                <p className="text-xs text-muted-foreground">próximos 30 dias</p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${stats.calibrationsExpiring > 0 ? "text-yellow-500" : "text-muted-foreground"}`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calibrações Vencidas</p>
                <p
                  className={`text-2xl font-bold ${stats.calibrationsExpired > 0 ? "text-red-600" : "text-foreground"}`}
                >
                  {stats.calibrationsExpired}
                </p>
                <p className="text-xs text-muted-foreground">regularizar urgente</p>
              </div>
              <AlertOctagon
                className={`h-8 w-8 ${stats.calibrationsExpired > 0 ? "text-red-500" : "text-muted-foreground"}`}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Violações de Velocidade</p>
                <p className={`text-2xl font-bold ${stats.totalViolations > 0 ? "text-red-600" : "text-foreground"}`}>
                  {stats.totalViolations}
                </p>
                <p className="text-xs text-muted-foreground">{stats.violationRate}% das leituras</p>
              </div>
              <Gauge className={`h-8 w-8 ${stats.totalViolations > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leituras</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalReadings}</p>
                <p className="text-xs text-muted-foreground">registradas no sistema</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calibration" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="calibration">
            <FileCheck className="mr-2 h-4 w-4" />
            Calibração INMETRO
          </TabsTrigger>
          <TabsTrigger value="readings">
            <Clock className="mr-2 h-4 w-4" />
            Leituras Diárias
          </TabsTrigger>
        </TabsList>

        {/* Calibration Tab */}
        <TabsContent value="calibration" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Status de Calibração por Veículo
              </CardTitle>
              <CardDescription>Acompanhamento da validade da aferição INMETRO do cronotacógrafo</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Nº INMETRO</TableHead>
                    <TableHead>Última Calibração</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Oficina</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTachographCalibrations.map((calibration) => {
                    const daysUntil = getDaysUntilExpiration(calibration.nextCalibrationDate)
                    return (
                      <TableRow key={calibration.vehicleId}>
                        <TableCell className="font-medium">{calibration.vehicleModel}</TableCell>
                        <TableCell>{calibration.vehiclePlate}</TableCell>
                        <TableCell className="font-mono text-xs">{calibration.inmetroNumber}</TableCell>
                        <TableCell>{new Date(calibration.lastCalibrationDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{new Date(calibration.nextCalibrationDate).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              daysUntil < 0 ? "text-red-600" : daysUntil <= 30 ? "text-yellow-600" : "text-green-600"
                            }`}
                          >
                            {daysUntil < 0 ? `${Math.abs(daysUntil)} dias vencido` : `${daysUntil} dias`}
                          </span>
                        </TableCell>
                        <TableCell>{getCalibrationStatusBadge(calibration.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{calibration.workshopName}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Readings Tab */}
        <TabsContent value="readings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Leituras
              </CardTitle>
              <CardDescription>Registro das leituras dos discos/fitas com identificação de violações</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Km Inicial</TableHead>
                    <TableHead>Km Final</TableHead>
                    <TableHead>Distância</TableHead>
                    <TableHead>Vel. Máxima</TableHead>
                    <TableHead>Tempo Condução</TableHead>
                    <TableHead>Violação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(reading.date).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {reading.vehiclePlate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {reading.driverName}
                        </div>
                      </TableCell>
                      <TableCell>{reading.startKm.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>{reading.endKm.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell className="font-medium">{reading.distance.toLocaleString("pt-BR")} km</TableCell>
                      <TableCell>
                        <span className={`font-bold ${reading.maxSpeed > 90 ? "text-red-600" : "text-foreground"}`}>
                          {reading.maxSpeed} km/h
                        </span>
                      </TableCell>
                      <TableCell>{reading.drivingTime}h</TableCell>
                      <TableCell>
                        {reading.hasViolation ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Excesso Vel.
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
