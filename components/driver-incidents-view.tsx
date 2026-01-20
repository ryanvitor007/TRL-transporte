"use client";

import type React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  RefreshCw,
  WifiOff,
  ChevronRight,
} from "lucide-react";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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

// --- CONFIGURACAO DE STATUS ---
const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  Aberto: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: AlertOctagon,
    label: "Aberto",
  },
  "Em Reparo": {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: Wrench,
    label: "Em Reparo",
  },
  "Aguardando Seguro": {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Clock,
    label: "Ag. Seguro",
  },
  Fechado: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
    label: "Fechado",
  },
};

// --- TIPOS DE INCIDENTE ---
const incidentTypes = [
  { value: "Acidente", label: "Acidente" },
  { value: "Colisao Leve", label: "Colisao Leve" },
  { value: "Avaria", label: "Avaria" },
  { value: "Roubo/Furto", label: "Roubo/Furto" },
  { value: "Tombamento", label: "Tombamento" },
  { value: "Pane Mecanica", label: "Pane Mecanica" },
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
  const types = ["Acidente", "Colisao Leve", "Avaria", "Pane Mecanica"];
  const locations = [
    "BR-116, km 340 - Jundiai/SP",
    "Rod. Anhanguera, km 45 - Campinas/SP",
    "Av. Brasil, 1500 - Sao Paulo/SP",
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
      description: `Ocorrencia ${i + 1} - ${types[i % 4]} registrada pelo motorista durante viagem. Danos materiais no veiculo.`,
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

// --- SKELETON COMPONENTS ---
function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function IncidentCardSkeleton() {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      </div>
    </div>
  );
}

// --- ERROR STATE ---
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Sem conexao</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Nao foi possivel carregar os incidentes. Verifique sua conexao e tente
        novamente.
      </p>
      <Button
        onClick={onRetry}
        size="lg"
        className="gap-2 min-w-[200px] h-12 active:scale-95 transition-transform"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  );
}

// --- EMPTY STATE ---
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Nenhum incidente</h3>
      <p className="text-sm text-muted-foreground">
        Voce nao possui incidentes registrados
      </p>
    </div>
  );
}

export function DriverIncidentsView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";

  // --- ESTADOS DE LOADING/ERROR ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // --- ESTADOS DE DADOS ---
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);

  // --- ESTADOS DOS MODAIS ---
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);

  // --- ESTADOS DO FORMULARIO ---
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

  // --- SIMULAR CARREGAMENTO ---
  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      // Simula delay de rede
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // Simula erro aleatoriamente (descomentar para testar)
      // if (Math.random() > 0.7) throw new Error("Network error");
      setIncidents(generateDriverIncidents(driverName));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [driverName]);

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehicleId !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all"
    );
  }, [filters]);

  // --- LOGICA DE FILTRAGEM ---
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
      (i) => i.status === "Em Reparo",
    ).length;
    const waitingInsurance = filteredIncidents.filter(
      (i) => i.status === "Aguardando Seguro",
    ).length;
    const closed = filteredIncidents.filter(
      (i) => i.status === "Fechado",
    ).length;
    return { open, inRepair, waitingInsurance, closed };
  }, [filteredIncidents]);

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
      loadData();
    }, 1500);
  };

  const openDetails = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setIsDetailsOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Acidente":
        return "bg-red-100 text-red-700";
      case "Colisao Leve":
        return "bg-yellow-100 text-yellow-700";
      case "Avaria":
        return "bg-blue-100 text-blue-700";
      case "Pane Mecanica":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER COMPACTO MOBILE */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate md:text-2xl">
            Incidentes
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Registro de ocorrencias
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Emergencia - Icone apenas em mobile */}
          <Button
            variant="outline"
            size="icon"
            className="border-red-500 text-red-500 hover:bg-red-50 bg-transparent h-9 w-9 md:hidden active:scale-95 transition-transform"
          >
            <Phone className="h-4 w-4" />
          </Button>

          {/* Emergencia Desktop */}
          <Button
            variant="outline"
            className="hidden md:flex gap-2 border-red-500 text-red-500 hover:bg-red-50 bg-transparent"
          >
            <Phone className="h-4 w-4" />
            (11) 99999-9999
          </Button>

          {/* Filtros */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 md:h-10 md:w-auto md:px-3 active:scale-95 transition-transform",
                  isAnyFilterActive &&
                    "border-primary text-primary bg-primary/5",
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Filtros</span>
                {isAnyFilterActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary ml-1" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold text-sm">Filtros</h4>
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

                <div className="space-y-2">
                  <Label className="text-xs">Veiculo</Label>
                  <Select
                    value={filters.vehicleId}
                    onValueChange={(v) =>
                      setFilters((prev) => ({ ...prev, vehicleId: v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {mockVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.placa}>
                          {v.placa}
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
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Aberto">Aberto</SelectItem>
                        <SelectItem value="Em Reparo">Em Reparo</SelectItem>
                        <SelectItem value="Aguardando Seguro">
                          Ag. Seguro
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
                      <SelectTrigger className="h-9">
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
            </PopoverContent>
          </Popover>

          {/* Botao Novo Incidente */}
          <Button
            onClick={() => setIsNewIncidentOpen(true)}
            size="icon"
            className="h-9 w-9 md:h-10 md:w-auto md:px-4 bg-red-600 hover:bg-red-700 active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Registrar</span>
          </Button>
        </div>
      </div>

      {/* KPI CARDS - GRID 2x2 COMPACTO */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          {/* Abertos */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <AlertOctagon className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              <p className="text-xs text-muted-foreground truncate">Abertos</p>
            </div>
          </div>

          {/* Em Reparo */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
              <Wrench className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.inRepair}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Em Reparo
              </p>
            </div>
          </div>

          {/* Aguardando Seguro */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{stats.waitingInsurance}</p>
              <p className="text-xs text-muted-foreground truncate">
                Ag. Seguro
              </p>
            </div>
          </div>

          {/* Fechados */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-green-600">
                {stats.closed}
              </p>
              <p className="text-xs text-muted-foreground truncate">Fechados</p>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE INCIDENTES - FEED STYLE */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 md:p-6">
          <CardTitle className="text-base md:text-lg">
            Meus Incidentes
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {filteredIncidents.length} ocorrencia(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <IncidentCardSkeleton />
              <IncidentCardSkeleton />
              <IncidentCardSkeleton />
              <IncidentCardSkeleton />
            </div>
          ) : hasError ? (
            <ErrorState onRetry={loadData} />
          ) : filteredIncidents.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-[400px] md:h-[450px]">
              <div className="px-4 pb-4 md:px-6 md:pb-6">
                {filteredIncidents.map((incident) => {
                  const config =
                    statusConfig[incident.status] || statusConfig["Aberto"];
                  const StatusIcon = config.icon;
                  const relativeDate = formatDistanceToNow(
                    new Date(incident.date),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    },
                  );

                  return (
                    <button
                      key={incident.id}
                      onClick={() => openDetails(incident)}
                      className="w-full text-left border-b border-border py-3 last:border-0 hover:bg-muted/30 active:bg-muted/50 transition-colors -mx-4 px-4 md:-mx-6 md:px-6"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            config.bgColor,
                          )}
                        >
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Header: Type Badge + Date */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                "text-xs px-2 py-0.5 font-medium",
                                getTypeColor(incident.type),
                              )}
                            >
                              {incident.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {relativeDate}
                            </span>
                          </div>

                          {/* Description - 2 lines max */}
                          <p className="text-sm text-foreground line-clamp-2">
                            {incident.description}
                          </p>

                          {/* Footer: Plate + Insurance */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">
                              {incident.vehicle_plate}
                            </span>
                            {incident.insuranceClaim && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  Seguro
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* DIALOG: NOVO INCIDENTE - MOBILE OPTIMIZED */}
      <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Registrar Incidente</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da ocorrencia
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            <div className="space-y-4 pb-4">
              {/* Veiculo e Tipo */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm">Veiculo *</Label>
                  <Select
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger className="h-11">
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
                  <Label className="text-sm">Tipo *</Label>
                  <Select
                    value={newIncident.type}
                    onValueChange={(v) =>
                      setNewIncident((prev) => ({ ...prev, type: v }))
                    }
                  >
                    <SelectTrigger className="h-11">
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

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Data *</Label>
                  <Input
                    type="date"
                    className="h-11"
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
                  <Label className="text-sm">Hora *</Label>
                  <Input
                    type="time"
                    className="h-11"
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

              {/* Local */}
              <div className="space-y-2">
                <Label className="text-sm">Local da Ocorrencia *</Label>
                <Input
                  placeholder="Ex: BR-116, km 340"
                  className="h-11"
                  value={newIncident.location}
                  onChange={(e) =>
                    setNewIncident((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Vitimas */}
              <div className="space-y-2">
                <Label className="text-sm">Houve vitimas? *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 active:scale-95 transition-transform",
                      newIncident.hasVictims === "sim" &&
                        "border-red-500 bg-red-50 text-red-700",
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
                      "h-11 active:scale-95 transition-transform",
                      newIncident.hasVictims === "nao" &&
                        "border-green-500 bg-green-50 text-green-700",
                    )}
                    onClick={() =>
                      setNewIncident((prev) => ({ ...prev, hasVictims: "nao" }))
                    }
                  >
                    Nao
                  </Button>
                </div>
              </div>

              {/* Descricao */}
              <div className="space-y-2">
                <Label className="text-sm">Descricao</Label>
                <Textarea
                  placeholder="Descreva como aconteceu..."
                  className="min-h-[80px] resize-none"
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Fotos */}
              <div className="space-y-2">
                <Label className="text-sm">Fotos (ate 5)</Label>
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors active:bg-muted/50",
                    uploadedPhotos.length > 0
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
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
                      "h-6 w-6 mx-auto mb-2",
                      uploadedPhotos.length > 0
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  {uploadedPhotos.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-primary">
                        {uploadedPhotos.length} foto(s)
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {uploadedPhotos.map((photo, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {photo.substring(0, 10)}...
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
                    <p className="text-xs text-muted-foreground">
                      Toque para adicionar
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsNewIncidentOpen(false)}
              className="flex-1 sm:flex-none"
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
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 active:scale-95 transition-transform"
            >
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETALHES - MOBILE OPTIMIZED */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Detalhes do Incidente</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="flex-1 overflow-y-auto overscroll-contain px-6">
              <div className="space-y-4 pb-4">
                {/* Status Badge Grande */}
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      statusConfig[selectedIncident.status]?.bgColor,
                      statusConfig[selectedIncident.status]?.color,
                    )}
                  >
                    {selectedIncident.status}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      getTypeColor(selectedIncident.type),
                    )}
                  >
                    {selectedIncident.type}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Veiculo</p>
                    <p className="text-sm font-medium">
                      {selectedIncident.vehicle_plate}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedIncident.vehicle_model}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Data/Hora</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedIncident.date), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      as {selectedIncident.time}
                    </p>
                  </div>
                </div>

                {/* Local */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Local
                  </p>
                  <p className="text-sm font-medium">
                    {selectedIncident.location}
                  </p>
                </div>

                {/* Descricao */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Descricao</p>
                  <p className="text-sm">{selectedIncident.description}</p>
                </div>

                {/* Info adicional */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Vitimas</p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        selectedIncident.hasVictims
                          ? "text-red-600"
                          : "text-green-600",
                      )}
                    >
                      {selectedIncident.hasVictims ? "Sim" : "Nao"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Custo Est.</p>
                    <p className="text-sm font-medium">
                      {selectedIncident.estimatedCost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>

                {selectedIncident.insuranceClaim && (
                  <Badge
                    variant="secondary"
                    className="w-full justify-center py-2"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Seguro Acionado
                  </Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
