"use client";

import type React from "react";
import { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Filter,
  Eye,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// --- INTERFACES ---
interface IncidentRecord {
  id: number;
  date: string;
  time: string;
  vehicle_plate: string;
  vehicle_model: string;
  type: string;
  description: string;
  location: string;
  status: string;
  estimatedCost: number;
  hasVictims: boolean;
  insuranceClaim: boolean;
  driverName: string;
}

// --- CONFIGURAÇÃO DE STATUS ---
const statusConfig: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  Aberto: {
    color: "bg-red-100 text-red-800",
    icon: AlertOctagon,
    label: "Aberto",
  },
  "Em Reparo": {
    color: "bg-yellow-100 text-yellow-800",
    icon: Wrench,
    label: "Em Reparo",
  },
  "Aguardando Seguro": {
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
    label: "Aguardando Seguro",
  },
  Fechado: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
    label: "Fechado",
  },
};

// --- TIPOS DE INCIDENTE ---
const incidentTypes = [
  { value: "Acidente", label: "Acidente" },
  { value: "Colisão Leve", label: "Colisão Leve" },
  { value: "Avaria", label: "Avaria" },
  { value: "Roubo/Furto", label: "Roubo/Furto" },
  { value: "Tombamento", label: "Tombamento" },
  { value: "Pane Mecânica", label: "Pane Mecânica" },
  { value: "Outro", label: "Outro" },
];

// --- MOCK DATA ---
const mockVehicles = [
  { id: 1, placa: "ABC-1234", modelo: "Volvo FH 460" },
  { id: 2, placa: "DEF-5678", modelo: "Scania R450" },
  { id: 3, placa: "GHI-9012", modelo: "Mercedes Actros" },
];

const generateDriverIncidents = (driverName: string): IncidentRecord[] => {
  const records: IncidentRecord[] = [];
  const statuses = ["Aberto", "Em Reparo", "Aguardando Seguro", "Fechado"];
  const types = ["Acidente", "Colisão Leve", "Avaria", "Pane Mecânica"];
  const locations = [
    "BR-116, km 340 - Jundiaí/SP",
    "Rod. Anhanguera, km 45 - Campinas/SP",
    "Av. Brasil, 1500 - São Paulo/SP",
    "BR-381, km 120 - Betim/MG",
  ];

  for (let i = 0; i < 10; i++) {
    const vehicle = mockVehicles[i % 3];
    records.push({
      id: i + 1,
      date: format(subDays(new Date(), i * 5), "yyyy-MM-dd"),
      time: `${8 + (i % 12)}:${(i * 15) % 60}`.padStart(5, "0"),
      vehicle_plate: vehicle.placa,
      vehicle_model: vehicle.modelo,
      type: types[i % 4],
      description: `Ocorrência ${i + 1} - ${
        types[i % 4]
      } registrada pelo motorista`,
      location: locations[i % 4],
      status: statuses[i % 4],
      estimatedCost: Math.floor(1000 + Math.random() * 10000),
      hasVictims: i % 5 === 0,
      insuranceClaim: i % 3 === 0,
      driverName,
    });
  }
  return records;
};

export function DriverIncidentsView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";

  // --- ESTADOS DE DADOS ---
  const [incidents] = useState<IncidentRecord[]>(() =>
    generateDriverIncidents(driverName)
  );

  // --- ESTADOS DOS MODAIS ---
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);

  // --- ESTADOS DO FORMULÁRIO ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [newIncident, setNewIncident] = useState({
    type: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"),
    location: "",
    description: "",
    hasVictims: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTADO DOS FILTROS ---
  const [filters, setFilters] = useState({
    vehicleId: "all",
    status: "all",
    type: "all",
  });

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehicleId !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all"
    );
  }, [filters]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      if (
        filters.vehicleId !== "all" &&
        item.vehicle_plate !== filters.vehicleId
      )
        return false;
      if (filters.status !== "all" && item.status !== filters.status)
        return false;
      if (filters.type !== "all" && item.type !== filters.type) return false;
      return true;
    });
  }, [incidents, filters]);

  const clearFilters = () => {
    setFilters({ vehicleId: "all", status: "all", type: "all" });
  };

  // --- KPIs ---
  const stats = useMemo(() => {
    const open = filteredIncidents.filter((i) => i.status === "Aberto").length;
    const inRepair = filteredIncidents.filter(
      (i) => i.status === "Em Reparo"
    ).length;
    const waitingInsurance = filteredIncidents.filter(
      (i) => i.status === "Aguardando Seguro"
    ).length;
    const closed = filteredIncidents.filter(
      (i) => i.status === "Fechado"
    ).length;
    const totalCost = filteredIncidents.reduce(
      (acc, i) => acc + i.estimatedCost,
      0
    );
    return { open, inRepair, waitingInsurance, closed, totalCost };
  }, [filteredIncidents]);

  // Helper para veículo selecionado
  const selectedVehicle = useMemo(
    () => mockVehicles.find((v) => String(v.id) === String(selectedVehicleId)),
    [selectedVehicleId]
  );

  // --- HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const names = Array.from(files)
        .map((f) => f.name)
        .slice(0, 5 - uploadedPhotos.length);
      setUploadedPhotos((prev) => [...prev, ...names].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitIncident = async () => {
    if (
      !selectedVehicleId ||
      !newIncident.type ||
      !newIncident.location ||
      !newIncident.hasVictims
    ) {
      return;
    }

    setIsSubmitting(true);

    // TODO: Integrar com backend
    // await api.post('/incidentes/registro', {
    //   vehicle_id: selectedVehicleId,
    //   type: newIncident.type,
    //   date: newIncident.date,
    //   time: newIncident.time,
    //   location: newIncident.location,
    //   description: newIncident.description,
    //   has_victims: newIncident.hasVictims === 'sim',
    //   driver_name: driverName,
    //   photos: uploadedPhotos
    // })

    setTimeout(() => {
      setIsSubmitting(false);
      setIsNewIncidentOpen(false);
      setNewIncident({
        type: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        location: "",
        description: "",
        hasVictims: "",
      });
      setSelectedVehicleId("");
      setUploadedPhotos([]);
    }, 1500);
  };

  const openDetails = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setIsDetailsOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Acidente":
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case "Colisão Leve":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "Avaria":
        return <Wrench className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertOctagon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Incidentes & Sinistros
          </h1>
          <p className="text-muted-foreground">
            Registro e acompanhamento de ocorrências
          </p>
        </div>
        <div className="flex gap-2">
          {/* Contato de Emergência */}
          <Button
            variant="outline"
            className="gap-2 border-red-500 text-red-500 hover:bg-red-50 bg-transparent"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Emergência:</span> (11)
            99999-9999
          </Button>

          {/* FILTROS */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2",
                  isAnyFilterActive &&
                    "border-primary text-primary bg-primary/5"
                )}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {isAnyFilterActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold leading-none">Filtros</h4>
                  {isAnyFilterActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-xs text-red-500 hover:text-red-600 hover:bg-transparent"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Veículo</Label>
                    <Select
                      value={filters.vehicleId}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, vehicleId: v }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {mockVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.placa}>
                            {v.placa} - {v.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(v) =>
                          setFilters((prev) => ({ ...prev, status: v }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Em Reparo">Em Reparo</SelectItem>
                          <SelectItem value="Aguardando Seguro">
                            Aguardando Seguro
                          </SelectItem>
                          <SelectItem value="Fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(v) =>
                          setFilters((prev) => ({ ...prev, type: v }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {incidentTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => setIsNewIncidentOpen(true)}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Registrar Incidente
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertos
            </CardTitle>
            <AlertOctagon className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Reparo
            </CardTitle>
            <Wrench className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.inRepair}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aguardando Seguro
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.waitingInsurance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fechados
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.closed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA / LISTA DE INCIDENTES */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Incidentes</CardTitle>
          <CardDescription>
            Histórico de ocorrências registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {filteredIncidents.map((incident) => {
                const config =
                  statusConfig[incident.status] || statusConfig["Aberto"];
                return (
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
                          <Badge variant="outline">
                            {incident.vehicle_plate}
                          </Badge>
                          <Badge className={cn("gap-1", config.color)}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {incident.vehicle_model}
                        </p>
                        <p className="text-sm">{incident.description}</p>
                        <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                          <span>
                            <Clock className="mr-1 inline h-3 w-3" />
                            {format(
                              new Date(incident.date),
                              "dd/MM/yyyy"
                            )} às {incident.time}
                          </span>
                          <span>
                            <MapPin className="mr-1 inline h-3 w-3" />
                            {incident.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold">
                        {incident.estimatedCost.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                      {incident.insuranceClaim && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="mr-1 h-3 w-3" />
                          Acionado Seguro
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(incident)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* DIALOG: NOVO INCIDENTE */}
      <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Incidente</DialogTitle>
            <DialogDescription>
              Preencha todos os detalhes da ocorrência
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Veículo *</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.placa} - {v.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Incidente *</Label>
                <Select
                  value={newIncident.type}
                  onValueChange={(v) =>
                    setNewIncident((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={newIncident.date}
                  onChange={(e) =>
                    setNewIncident((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Horário *</Label>
                <Input
                  type="time"
                  value={newIncident.time}
                  onChange={(e) =>
                    setNewIncident((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Local da Ocorrência *</Label>
              <Input
                placeholder="Ex: BR-116, km 340 ou Rua..."
                value={newIncident.location}
                onChange={(e) =>
                  setNewIncident((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Houve vítimas? *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10",
                    newIncident.hasVictims === "sim" &&
                      "border-red-500 bg-red-50 text-red-700"
                  )}
                  onClick={() =>
                    setNewIncident((prev) => ({ ...prev, hasVictims: "sim" }))
                  }
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10",
                    newIncident.hasVictims === "nao" &&
                      "border-green-500 bg-green-50 text-green-700"
                  )}
                  onClick={() =>
                    setNewIncident((prev) => ({ ...prev, hasVictims: "nao" }))
                  }
                >
                  Não
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição Detalhada</Label>
              <Textarea
                placeholder="Descreva como aconteceu o incidente..."
                value={newIncident.description}
                onChange={(e) =>
                  setNewIncident((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos do Incidente (até 5)</Label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  uploadedPhotos.length > 0
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Camera
                  className={cn(
                    "h-8 w-8 mx-auto mb-2",
                    uploadedPhotos.length > 0
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                {uploadedPhotos.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary">
                      {uploadedPhotos.length} foto(s) selecionada(s)
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {uploadedPhotos.map((photo, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {photo}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(i);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar fotos
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewIncidentOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitIncident}
              disabled={
                !selectedVehicleId ||
                !newIncident.type ||
                !newIncident.location ||
                !newIncident.hasVictims ||
                isSubmitting
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Registrando..." : "Registrar Incidente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETALHES */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Incidente</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Veículo</p>
                  <p className="font-medium">
                    {selectedIncident.vehicle_plate} -{" "}
                    {selectedIncident.vehicle_model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={cn(
                      "gap-1",
                      statusConfig[selectedIncident.status]?.color
                    )}
                  >
                    {selectedIncident.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedIncident.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedIncident.date), "dd/MM/yyyy")} às{" "}
                    {selectedIncident.time}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="font-medium">{selectedIncident.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Houve Vítimas</p>
                  <p
                    className={cn(
                      "font-medium",
                      selectedIncident.hasVictims
                        ? "text-red-600"
                        : "text-green-600"
                    )}
                  >
                    {selectedIncident.hasVictims ? "Sim" : "Não"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Custo Estimado
                  </p>
                  <p className="font-medium">
                    {selectedIncident.estimatedCost.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedIncident.description}</p>
              </div>
              {selectedIncident.insuranceClaim && (
                <Badge variant="secondary">
                  <FileText className="mr-1 h-3 w-3" />
                  Seguro Acionado
                </Badge>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
