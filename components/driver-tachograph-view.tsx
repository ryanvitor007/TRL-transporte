"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  formatDistanceToNow,
} from "date-fns";
import { ptBR } from "date-fns/locale";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Filter,
  Gauge,
  CheckCircle,
  Plus,
  Camera,
  Send,
  ChevronRight,
  RefreshCw,
  WifiOff,
  MapPin,
  Zap,
  Route,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

// --- INTERFACES TypeScript ---
interface TachographRecord {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  kmDriven: number;
  maxSpeed: number;
  hasInfraction: boolean;
  infractionType?:
    | "excesso_horas"
    | "excesso_velocidade"
    | "descanso_insuficiente";
  status: "em_dia" | "pendente" | "com_infracao";
}

interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  status: {
    emDia: boolean;
    pendente: boolean;
    comInfracao: boolean;
  };
}

// --- CONFIGURACAO DE STATUS ---
const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  em_dia: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle,
    label: "Em Dia",
  },
  pendente: {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: AlertTriangle,
    label: "Pendente",
  },
  com_infracao: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: AlertOctagon,
    label: "Infracao",
  },
};

// --- MOCK DE VEÍCULOS ---
const mockVehicles = [
  { id: "v1", plate: "ABC-1234", model: "Volvo FH 460" },
  { id: "v2", plate: "DEF-5678", model: "Scania R450" },
  { id: "v3", plate: "GHI-9012", model: "Mercedes Actros" },
];

// --- MOCK DATA (simulando dados do motorista logado) ---
const generateDriverMockRecords = (
  driverId: string,
  driverName: string,
): TachographRecord[] => {
  const records: TachographRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    // Simula alguns dias sem envio (pendentes)
    if (i === 0 || i === 5) continue;

    const hasInfraction = Math.random() < 0.1;
    const totalHours = 6 + Math.random() * 6;
    const infractionType = hasInfraction
      ? (
          [
            "excesso_horas",
            "excesso_velocidade",
            "descanso_insuficiente",
          ] as const
        )[Math.floor(Math.random() * 3)]
      : undefined;

    records.push({
      id: `tr-${dateStr}-${driverId}`,
      date: dateStr,
      driverId,
      driverName,
      vehicleId: mockVehicles[i % 3].id,
      vehiclePlate: mockVehicles[i % 3].plate,
      startTime: `0${6 + Math.floor(Math.random() * 2)}:00`,
      endTime: `${14 + Math.floor(Math.random() * 4)}:${Math.floor(
        Math.random() * 6,
      )}0`,
      totalHours: Number(totalHours.toFixed(1)),
      kmDriven: Math.floor(200 + Math.random() * 400),
      maxSpeed: Math.floor(70 + Math.random() * 30),
      hasInfraction,
      infractionType,
      status: hasInfraction ? "com_infracao" : "em_dia",
    });
  }

  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

// Gerar dados de tendência para o gráfico
const generateTrendData = () => {
  const data = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "dd/MM"),
      horas: Number((7 + Math.random() * 3).toFixed(1)),
      km: Math.floor(250 + Math.random() * 200),
    });
  }

  return data;
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

function RecordCardSkeleton() {
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
        Nao foi possivel carregar os registros. Verifique sua conexao e tente
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
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Gauge className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Nenhum registro</h3>
      <p className="text-sm text-muted-foreground">
        Voce nao possui leituras registradas
      </p>
    </div>
  );
}

export function DriverTachographView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";
  const driverId = user?.id || "d1";

  // --- ESTADOS DE LOADING/ERROR ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Estados
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: "", end: "" },
    status: { emDia: true, pendente: true, comInfracao: true },
  });
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TachographRecord | null>(
    null,
  );

  // Formulário de novo registro
  const [newRecord, setNewRecord] = useState({
    vehicleId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "",
    endTime: "",
    kmStart: "",
    kmEnd: "",
  });
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock records do motorista
  const [mockRecords, setMockRecords] = useState<TachographRecord[]>([]);

  // --- SIMULAR CARREGAMENTO ---
  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setMockRecords(generateDriverMockRecords(driverId, driverName));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [driverId, driverName]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredRecords = useMemo(() => {
    let records = [...mockRecords];

    // Filtro de Status
    records = records.filter((r) => {
      if (r.status === "em_dia" && !filters.status.emDia) return false;
      if (r.status === "pendente" && !filters.status.pendente) return false;
      if (r.status === "com_infracao" && !filters.status.comInfracao)
        return false;
      return true;
    });

    // Filtro de Data
    if (filters.dateRange.start) {
      const startDate = startOfDay(new Date(filters.dateRange.start));
      records = records.filter((r) => new Date(r.date) >= startDate);
    }
    if (filters.dateRange.end) {
      const endDate = endOfDay(new Date(filters.dateRange.end));
      records = records.filter((r) => new Date(r.date) <= endDate);
    }

    return records;
  }, [filters, mockRecords]);

  // --- CÁLCULO DE KPIs ---
  const kpis = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecord = mockRecords.find((r) => r.date === today);
    const hasSubmittedToday = !!todayRecord;

    const allHours = filteredRecords.map((r) => r.totalHours);
    const avgHours =
      allHours.length > 0
        ? allHours.reduce((a, b) => a + b, 0) / allHours.length
        : 0;

    const totalKm = filteredRecords.reduce((acc, r) => acc + r.kmDriven, 0);
    const infractions = filteredRecords.filter((r) => r.hasInfraction).length;

    return {
      envioHoje: hasSubmittedToday,
      mediaHoras: avgHours.toFixed(1),
      totalKm,
      infracoes: infractions,
    };
  }, [filteredRecords, mockRecords]);

  // --- DADOS DOS GRÁFICOS ---
  const trendData = useMemo(() => generateTrendData(), []);

  // --- CONTAGEM DE FILTROS ATIVOS ---
  const isAnyFilterActive = useMemo(() => {
    return (
      filters.dateRange.start !== "" ||
      filters.dateRange.end !== "" ||
      !filters.status.emDia ||
      !filters.status.pendente ||
      !filters.status.comInfracao
    );
  }, [filters]);

  // --- FUNÇÕES DE CONTROLE ---
  const applyPreset = (preset: "today" | "7days" | "month" | "all") => {
    const today = new Date();
    let start = "";
    let end = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "today":
        start = format(today, "yyyy-MM-dd");
        break;
      case "7days":
        start = format(subDays(today, 7), "yyyy-MM-dd");
        break;
      case "month":
        start = format(subDays(today, 30), "yyyy-MM-dd");
        break;
      case "all":
        start = "";
        end = "";
        break;
    }
    setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      status: { emDia: true, pendente: true, comInfracao: true },
    });
  };

  const handleSubmitRecord = async () => {
    if (!newRecord.vehicleId || !newRecord.startTime || !newRecord.endTime) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsNewRecordOpen(false);
      setNewRecord({
        vehicleId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: "",
        endTime: "",
        kmStart: "",
        kmEnd: "",
      });
      setUploadedPhoto(null);
      loadData();
    }, 1500);
  };

  const openDetails = (record: TachographRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const getInfractionLabel = (type?: TachographRecord["infractionType"]) => {
    switch (type) {
      case "excesso_horas":
        return "Excesso de horas";
      case "excesso_velocidade":
        return "Excesso de velocidade";
      case "descanso_insuficiente":
        return "Descanso insuficiente";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER COMPACTO MOBILE */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate md:text-2xl">
            Tacografo
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Registros e historico
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

                {/* Período */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Periodo
                  </Label>
                  <div className="flex gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1 bg-transparent active:scale-95 transition-transform"
                      onClick={() => applyPreset("today")}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1 bg-transparent active:scale-95 transition-transform"
                      onClick={() => applyPreset("7days")}
                    >
                      7 dias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1 bg-transparent active:scale-95 transition-transform"
                      onClick={() => applyPreset("month")}
                    >
                      Mes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs flex-1 bg-transparent active:scale-95 transition-transform"
                      onClick={() => applyPreset("all")}
                    >
                      Tudo
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={filters.dateRange.start}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            start: e.target.value,
                          },
                        }))
                      }
                    />
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={filters.dateRange.end}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão Nova Leitura */}
          <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="h-9 w-9 md:h-10 md:w-auto md:px-4 bg-primary hover:bg-primary/90 active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Nova Leitura</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader className="shrink-0">
                <DialogTitle>Registrar Leitura</DialogTitle>
                <DialogDescription>
                  Preencha os dados do tacografo de hoje
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Veiculo *</Label>
                    <Select
                      value={newRecord.vehicleId}
                      onValueChange={(v) =>
                        setNewRecord((prev) => ({ ...prev, vehicleId: v }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o veiculo" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate} - {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Data *</Label>
                    <Input
                      type="date"
                      className="h-11"
                      value={newRecord.date}
                      onChange={(e) =>
                        setNewRecord((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Hora Inicio *</Label>
                      <Input
                        type="time"
                        className="h-11"
                        value={newRecord.startTime}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Hora Fim *</Label>
                      <Input
                        type="time"
                        className="h-11"
                        value={newRecord.endTime}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">KM Inicial</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11"
                        value={newRecord.kmStart}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            kmStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">KM Final</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-11"
                        value={newRecord.kmEnd}
                        onChange={(e) =>
                          setNewRecord((prev) => ({
                            ...prev,
                            kmEnd: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Foto do Disco</Label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) =>
                          setUploadedPhoto(e.target.files?.[0]?.name || null)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-xl p-4 text-center transition-colors active:bg-muted/50",
                          uploadedPhoto
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <Camera
                          className={cn(
                            "h-6 w-6 mx-auto mb-2",
                            uploadedPhoto
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          {uploadedPhoto || "Toque para tirar foto"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="shrink-0 gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsNewRecordOpen(false)}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitRecord}
                  disabled={
                    !newRecord.vehicleId ||
                    !newRecord.startTime ||
                    !newRecord.endTime ||
                    isSubmitting
                  }
                  className="flex-1 sm:flex-none active:scale-95 transition-transform"
                >
                  {isSubmitting ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
          {/* Envio Hoje */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                kpis.envioHoje ? "bg-green-100" : "bg-yellow-100",
              )}
            >
              {kpis.envioHoje ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-lg font-bold md:text-2xl",
                  kpis.envioHoje ? "text-green-600" : "text-yellow-600",
                )}
              >
                {kpis.envioHoje ? "OK" : "Pend."}
              </p>
              <p className="text-xs text-muted-foreground truncate">Hoje</p>
            </div>
          </div>

          {/* Media Horas */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold md:text-2xl">
                {kpis.mediaHoras}h
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Media/Dia
              </p>
            </div>
          </div>

          {/* Total KM */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Route className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold md:text-2xl">
                {kpis.totalKm >= 1000
                  ? `${(kpis.totalKm / 1000).toFixed(1)}k`
                  : kpis.totalKm}
              </p>
              <p className="text-xs text-muted-foreground truncate">KM Total</p>
            </div>
          </div>

          {/* Infracoes */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                kpis.infracoes > 0 ? "bg-red-100" : "bg-green-100",
              )}
            >
              <AlertOctagon
                className={cn(
                  "h-4 w-4",
                  kpis.infracoes > 0 ? "text-red-600" : "text-green-600",
                )}
              />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-lg font-bold md:text-2xl",
                  kpis.infracoes > 0 ? "text-red-600" : "text-green-600",
                )}
              >
                {kpis.infracoes}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Infracoes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GRAFICOS - ALTURA MAIOR E ESCALA MELHOR */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gráfico de Tendência */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 md:p-6">
            <CardTitle className="text-base md:text-lg">
              Horas Rodadas
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ultimos 14 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-4 md:px-4 md:pb-6">
            <div className="h-[280px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value}h`, "Horas"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="horas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="hsl(var(--primary)/0.15)"
                    name="Horas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de KM */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4 md:p-6">
            <CardTitle className="text-base md:text-lg">KM Rodados</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Ultimos 14 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 px-2 pb-4 md:px-4 md:pb-6">
            <div className="h-[280px] md:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value} km`, "Distancia"]}
                  />
                  <Bar
                    dataKey="km"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="KM"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE REGISTROS - FEED STYLE */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Meus Registros</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {filteredRecords.length} leitura(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <RecordCardSkeleton />
              <RecordCardSkeleton />
              <RecordCardSkeleton />
              <RecordCardSkeleton />
            </div>
          ) : hasError ? (
            <ErrorState onRetry={loadData} />
          ) : filteredRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-[400px] md:h-[450px]">
              <div className="px-4 pb-4 md:px-6 md:pb-6">
                {filteredRecords.map((record) => {
                  const config =
                    statusConfig[record.status] || statusConfig["em_dia"];
                  const StatusIcon = config.icon;
                  const relativeDate = formatDistanceToNow(
                    new Date(record.date),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    },
                  );

                  return (
                    <button
                      key={record.id}
                      onClick={() => openDetails(record)}
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
                          {/* Header: Date + Plate Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {format(new Date(record.date), "dd/MM")} -{" "}
                              {record.startTime}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5 font-mono"
                            >
                              {record.vehiclePlate}
                            </Badge>
                          </div>

                          {/* Metrics Summary */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {record.totalHours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <Route className="h-3 w-3" />
                              {record.kmDriven} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {record.maxSpeed} km/h
                            </span>
                          </div>

                          {/* Footer: Relative date + Infraction if any */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{relativeDate}</span>
                            {record.hasInfraction && (
                              <>
                                <span>-</span>
                                <span className="text-red-600 font-medium">
                                  {getInfractionLabel(record.infractionType)}
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

      {/* DIALOG: DETALHES DO REGISTRO */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                {/* Status Badge + Plate */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      statusConfig[selectedRecord.status]?.bgColor,
                      statusConfig[selectedRecord.status]?.color,
                    )}
                  >
                    {statusConfig[selectedRecord.status]?.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1 font-mono"
                  >
                    {selectedRecord.vehiclePlate}
                  </Badge>
                </div>

                {/* Info Grid - Data/Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRecord.date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Horario</p>
                    <p className="text-sm font-medium">
                      {selectedRecord.startTime} - {selectedRecord.endTime}
                    </p>
                  </div>
                </div>

                {/* Metricas Detalhadas */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-lg font-bold">
                      {selectedRecord.totalHours}h
                    </p>
                    <p className="text-xs text-muted-foreground">Horas</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Route className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">
                      {selectedRecord.kmDriven}
                    </p>
                    <p className="text-xs text-muted-foreground">KM</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">
                      {selectedRecord.maxSpeed}
                    </p>
                    <p className="text-xs text-muted-foreground">km/h Max</p>
                  </div>
                </div>

                {/* Infracao se houver */}
                {selectedRecord.hasInfraction && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertOctagon className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Infracao Registrada
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      {getInfractionLabel(selectedRecord.infractionType)}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="shrink-0 pt-4 border-t">
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
