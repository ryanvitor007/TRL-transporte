"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertOctagon,
  Plus,
  FileText,
  Camera,
  DollarSign,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { mockIncidents, getIncidentStats, mockVehicles } from "@/lib/mock-data"

export function IncidentsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const stats = getIncidentStats()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aberto":
        return <Badge variant="destructive">{status}</Badge>
      case "Em Reparo":
        return <Badge className="bg-amber-500 hover:bg-amber-600">{status}</Badge>
      case "Aguardando Seguro":
        return <Badge variant="secondary">{status}</Badge>
      case "Fechado":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            {status}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Acidente":
        return <AlertOctagon className="h-5 w-5 text-destructive" />
      case "Colisão Leve":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "Avaria":
        return <Wrench className="h-5 w-5 text-blue-500" />
      default:
        return <AlertOctagon className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incidentes & Sinistros</h1>
          <p className="text-muted-foreground">Registro e acompanhamento de ocorrências</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Registrar Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Incidente</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Veículo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.model} - {v.plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Incidente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Acidente</SelectItem>
                      <SelectItem value="collision">Colisão Leve</SelectItem>
                      <SelectItem value="damage">Avaria</SelectItem>
                      <SelectItem value="theft">Roubo/Furto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input id="time" type="time" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">Nome do Motorista</Label>
                <Input id="driver" placeholder="Digite o nome do motorista" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local da Ocorrência</Label>
                <Input id="location" placeholder="Ex: Rod. Anhanguera, km 45 - Jundiaí/SP" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que aconteceu, circunstâncias, danos observados..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Anexar Fotos</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Foto do Veículo</span>
                  </div>
                  <div className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Boletim de Ocorrência</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                  Registrar Incidente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertos</CardTitle>
            <AlertOctagon className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Reparo</CardTitle>
            <Wrench className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats.inRepair}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Seguro</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.waitingInsurance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fechados</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total Estimado</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Incidentes */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockIncidents.map((incident) => (
              <div
                key={incident.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {getTypeIcon(incident.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{incident.type}</span>
                      <Badge variant="outline">{incident.vehiclePlate}</Badge>
                      {getStatusBadge(incident.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.vehicleModel}</p>
                    <p className="text-sm">{incident.description}</p>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                      <span>
                        <Clock className="mr-1 inline h-3 w-3" />
                        {new Date(incident.date).toLocaleDateString("pt-BR")} às {incident.time}
                      </span>
                      <span>Motorista: {incident.driverName}</span>
                      <span>{incident.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-lg font-bold">
                    {incident.estimatedCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  {incident.insuranceClaim && (
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="mr-1 h-3 w-3" />
                      Acionado Seguro
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
