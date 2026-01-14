"use client";

import { useState, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  GitCompare,
  TrendingUp,
  Users,
  Gauge,
  CheckCircle,
  XCircle,
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/app-context";

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

interface DriverStats {
  driverId: string;
  driverName: string;
  totalHours: number;
  totalKm: number;
  infractions: number;
  avgHoursPerDay: number;
}

interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  selectedDrivers: string[];
  status: {
    emDia: boolean;
    pendente: boolean;
    comInfracao: boolean;
  };
}

// --- MOCK DATA REALISTA ---
const mockDriversList = [
  { id: "d1", name: "João Pereira" },
  { id: "d2", name: "Carlos Silva" },
  { id: "d3", name: "Roberto Mendes" },
  { id: "d4", name: "Antonio Costa" },
  { id: "d5", name: "Marcos Oliveira" },
  { id: "d6", name: "Paulo Santos" },
];

const generateMockRecords = (): TachographRecord[] => {
  const records: TachographRecord[] = [];
  const today = new Date();

  // Registros dos últimos 14 dias
  for (let i = 0; i < 14; i++) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    mockDriversList.forEach((driver, index) => {
      // Simula alguns motoristas sem envio hoje (pendentes)
      if (i === 0 && (index === 2 || index === 4)) return;

      const hasInfraction = Math.random() < 0.15;
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
        id: `tr-${dateStr}-${driver.id}`,
        date: dateStr,
        driverId: driver.id,
        driverName: driver.name,
        vehicleId: `v${index + 1}`,
        vehiclePlate: [
          "ABC-1234",
          "DEF-5678",
          "GHI-9012",
          "JKL-3456",
          "MNO-7891",
          "PQR-2345",
        ][index],
        startTime: `0${6 + Math.floor(Math.random() * 2)}:00`,
        endTime: `${14 + Math.floor(Math.random() * 4)}:${Math.floor(
          Math.random() * 6
        )}0`,
        totalHours: Number(totalHours.toFixed(1)),
        kmDriven: Math.floor(200 + Math.random() * 400),
        maxSpeed: Math.floor(70 + Math.random() * 30),
        hasInfraction,
        infractionType,
        status: hasInfraction ? "com_infracao" : "em_dia",
      });
    });
  }

  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const mockTachographRecords = generateMockRecords();

// Gerar dados de tendência para o gráfico
const generateTrendData = () => {
  const data = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "dd/MM"),
      mediaHoras: Number((7 + Math.random() * 3).toFixed(1)),
      infraçoes: Math.floor(Math.random() * 3),
    });
  }

  return data;
};

export function TachographView() {
  const { comparison, toggleComparison } = useApp();

  // Estados
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: "", end: "" },
    selectedDrivers: [],
    status: { emDia: true, pendente: true, comInfracao: true },
  });
  const [driverSearch, setDriverSearch] = useState("");
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>(
    []
  );
  const [chartMetric, setChartMetric] = useState<"horas" | "km" | "infracoes">(
    "horas"
  );

  // --- LÓGICA DE FILTRAGEM ---
  const filteredRecords = useMemo(() => {
    let records = [...mockTachographRecords];

    // Filtro de Status
    records = records.filter((r) => {
      if (r.status === "em_dia" && !filters.status.emDia) return false;
      if (r.status === "pendente" && !filters.status.pendente) return false;
      if (r.status === "com_infracao" && !filters.status.comInfracao)
        return false;
      return true;
    });

    // Filtro de Motoristas
    if (filters.selectedDrivers.length > 0) {
      records = records.filter((r) =>
        filters.selectedDrivers.includes(r.driverId)
      );
    }

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
  }, [filters]);

  // --- CÁLCULO DE KPIs ---
  const kpis = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecords = mockTachographRecords.filter((r) => r.date === today);
    const totalDrivers = mockDriversList.length;
    const receivedToday = todayRecords.length;
    const pendingDrivers = totalDrivers - receivedToday;

    const allHours = filteredRecords.map((r) => r.totalHours);
    const avgHours =
      allHours.length > 0
        ? allHours.reduce((a, b) => a + b, 0) / allHours.length
        : 0;

    const infractions = filteredRecords.filter((r) => r.hasInfraction).length;

    return {
      leiturasHoje: { received: receivedToday, expected: totalDrivers },
      pendencias: pendingDrivers,
      mediaHoras: avgHours.toFixed(1),
      infracoes: infractions,
    };
  }, [filteredRecords]);

  // --- DADOS DOS GRÁFICOS ---
  const trendData = useMemo(() => generateTrendData(), []);

  const top5DriversData = useMemo(() => {
    const stats: Record<string, DriverStats> = {};

    filteredRecords.forEach((r) => {
      if (!stats[r.driverId]) {
        stats[r.driverId] = {
          driverId: r.driverId,
          driverName: r.driverName,
          totalHours: 0,
          totalKm: 0,
          infractions: 0,
          avgHoursPerDay: 0,
        };
      }
      stats[r.driverId].totalHours += r.totalHours;
      stats[r.driverId].totalKm += r.kmDriven;
      if (r.hasInfraction) stats[r.driverId].infractions++;
    });

    const arr = Object.values(stats);
    arr.forEach((s) => {
      const days = filteredRecords.filter(
        (r) => r.driverId === s.driverId
      ).length;
      s.avgHoursPerDay = days > 0 ? s.totalHours / days : 0;
    });

    // Ordenar baseado na métrica selecionada
    if (chartMetric === "horas") {
      arr.sort((a, b) => b.totalHours - a.totalHours);
    } else if (chartMetric === "km") {
      arr.sort((a, b) => b.totalKm - a.totalKm);
    } else {
      arr.sort((a, b) => b.infractions - a.infractions);
    }

    return arr.slice(0, 5).map((s) => ({
      name: s.driverName.split(" ")[0],
      valor:
        chartMetric === "horas"
          ? Number(s.totalHours.toFixed(1))
          : chartMetric === "km"
          ? s.totalKm
          : s.infractions,
    }));
  }, [filteredRecords, chartMetric]);

  // --- DADOS DE COMPARAÇÃO ---
  const comparisonData = useMemo(() => {
    if (selectedForComparison.length < 2) return null;

    const stats: DriverStats[] = [];

    selectedForComparison.forEach((driverId) => {
      const driverRecords = filteredRecords.filter(
        (r) => r.driverId === driverId
      );
      const driver = mockDriversList.find((d) => d.id === driverId);

      if (driver && driverRecords.length > 0) {
        const totalHours = driverRecords.reduce(
          (acc, r) => acc + r.totalHours,
          0
        );
        const totalKm = driverRecords.reduce((acc, r) => acc + r.kmDriven, 0);
        const infractions = driverRecords.filter((r) => r.hasInfraction).length;

        stats.push({
          driverId,
          driverName: driver.name,
          totalHours,
          totalKm,
          infractions,
          avgHoursPerDay: totalHours / driverRecords.length,
        });
      }
    });

    return stats;
  }, [selectedForComparison, filteredRecords]);

  // --- CONTAGEM DE FILTROS ATIVOS ---
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.selectedDrivers.length > 0) count++;
    if (
      !filters.status.emDia ||
      !filters.status.pendente ||
      !filters.status.comInfracao
    )
      count++;
    return count;
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

  const toggleDriver = (driverId: string) => {
    setFilters((prev) => {
      const current = prev.selectedDrivers;
      if (current.includes(driverId)) {
        return {
          ...prev,
          selectedDrivers: current.filter((d) => d !== driverId),
        };
      }
      return { ...prev, selectedDrivers: [...current, driverId] };
    });
  };

  const toggleComparisonDriver = (driverId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(driverId)) {
        return prev.filter((d) => d !== driverId);
      }
      return [...prev, driverId];
    });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      selectedDrivers: [],
      status: { emDia: true, pendente: true, comInfracao: true },
    });
  };

  // --- IDENTIFICAR MOTORISTAS PENDENTES HOJE ---
  const pendingDriversToday = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const driversWithRecordToday = mockTachographRecords
      .filter((r) => r.date === today)
      .map((r) => r.driverId);

    return mockDriversList.filter(
      (d) => !driversWithRecordToday.includes(d.id)
    );
  }, []);

  const getStatusBadge = (status: TachographRecord["status"]) => {
    switch (status) {
      case "em_dia":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            Em Dia
          </Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case "com_infracao":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertOctagon className="mr-1 h-3 w-3" />
            Infração
          </Badge>
        );
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cronotacógrafo</h1>
          <p className="text-muted-foreground">
            Monitoramento e gestão de leituras de tacógrafo
          </p>
        </div>

        <div className="flex gap-2">
          {/* Botão de Filtros */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 relative bg-transparent"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-0 text-xs text-red-500 hover:text-red-600 hover:bg-transparent"
                  >
                    Limpar
                  </Button>
                </div>

                {/* Período */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Período
                  </Label>
                  <div className="flex gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 bg-transparent"
                      onClick={() => applyPreset("today")}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 bg-transparent"
                      onClick={() => applyPreset("7days")}
                    >
                      7 dias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 bg-transparent"
                      onClick={() => applyPreset("month")}
                    >
                      Mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 bg-transparent"
                      onClick={() => applyPreset("all")}
                    >
                      Tudo
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      className="h-8 text-xs"
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
                      className="h-8 text-xs"
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

                <Separator />

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Status
                  </Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-emdia"
                        checked={filters.status.emDia}
                        onCheckedChange={(c) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: { ...prev.status, emDia: !!c },
                          }))
                        }
                      />
                      <label htmlFor="status-emdia" className="text-sm">
                        Em Dia
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-pendente"
                        checked={filters.status.pendente}
                        onCheckedChange={(c) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: { ...prev.status, pendente: !!c },
                          }))
                        }
                      />
                      <label htmlFor="status-pendente" className="text-sm">
                        Pendente
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-infracao"
                        checked={filters.status.comInfracao}
                        onCheckedChange={(c) =>
                          setFilters((prev) => ({
                            ...prev,
                            status: { ...prev.status, comInfracao: !!c },
                          }))
                        }
                      />
                      <label htmlFor="status-infracao" className="text-sm">
                        Com Infração
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Motoristas */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Motoristas ({filters.selectedDrivers.length})
                    </Label>
                    {filters.selectedDrivers.length > 0 && (
                      <span
                        className="text-xs text-blue-500 cursor-pointer hover:underline"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedDrivers: [],
                          }))
                        }
                      >
                        Limpar seleção
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="Buscar motorista..."
                    className="h-8 text-xs mb-2"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                  />
                  <ScrollArea className="h-[120px] border rounded-md p-2">
                    {mockDriversList
                      .filter((d) =>
                        d.name
                          .toLowerCase()
                          .includes(driverSearch.toLowerCase())
                      )
                      .map((driver) => (
                        <div
                          key={driver.id}
                          className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
                          onClick={() => toggleDriver(driver.id)}
                        >
                          <Checkbox
                            checked={filters.selectedDrivers.includes(
                              driver.id
                            )}
                          />
                          <span className="text-sm">{driver.name}</span>
                        </div>
                      ))}
                  </ScrollArea>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão de Comparação */}
          <Dialog
            open={isCompareDialogOpen}
            onOpenChange={setIsCompareDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant={
                  selectedForComparison.length >= 2 ? "default" : "outline"
                }
                className="gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Comparação
                {selectedForComparison.length >= 2 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedForComparison.length}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Comparar Motoristas</DialogTitle>
                <DialogDescription>
                  Selecione 2 ou mais motoristas para comparar métricas
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  {mockDriversList.map((driver) => (
                    <div
                      key={driver.id}
                      className="flex items-center space-x-2 py-2 hover:bg-muted/50 rounded px-2 cursor-pointer"
                      onClick={() => toggleComparisonDriver(driver.id)}
                    >
                      <Checkbox
                        checked={selectedForComparison.includes(driver.id)}
                      />
                      <span className="text-sm">{driver.name}</span>
                    </div>
                  ))}
                </ScrollArea>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedForComparison.length} selecionado(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForComparison([])}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leituras Hoje</p>
                <p className="text-2xl font-bold text-foreground">
                  {kpis.leiturasHoje.received}/{kpis.leiturasHoje.expected}
                </p>
                <p className="text-xs text-muted-foreground">
                  recebido vs esperado
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={kpis.pendencias > 0 ? "border-red-200 bg-red-50/50" : ""}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p
                  className={`text-2xl font-bold ${
                    kpis.pendencias > 0 ? "text-red-600" : "text-foreground"
                  }`}
                >
                  {kpis.pendencias}
                </p>
                <p className="text-xs text-muted-foreground">
                  motoristas sem envio
                </p>
              </div>
              <AlertTriangle
                className={`h-8 w-8 ${
                  kpis.pendencias > 0 ? "text-red-500" : "text-muted-foreground"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Horas/Dia</p>
                <p className="text-2xl font-bold text-foreground">
                  {kpis.mediaHoras}h
                </p>
                <p className="text-xs text-muted-foreground">geral da frota</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            kpis.infracoes > 0 ? "border-orange-200 bg-orange-50/50" : ""
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Infrações Detectadas
                </p>
                <p
                  className={`text-2xl font-bold ${
                    kpis.infracoes > 0 ? "text-orange-600" : "text-foreground"
                  }`}
                >
                  {kpis.infracoes}
                </p>
                <p className="text-xs text-muted-foreground">
                  no período filtrado
                </p>
              </div>
              <Gauge
                className={`h-8 w-8 ${
                  kpis.infracoes > 0
                    ? "text-orange-500"
                    : "text-muted-foreground"
                }`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Comparação (quando ativo) */}
      {selectedForComparison.length >= 2 && comparisonData && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-600" />
              Comparação de Motoristas
            </CardTitle>
            <CardDescription>
              Métricas comparativas dos motoristas selecionados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="driverName" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="totalHours"
                  name="Total Horas"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalKm"
                  name="Total Km"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="infractions"
                  name="Infrações"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Tendência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência Geral (Últimos 14 dias)
            </CardTitle>
            <CardDescription>Média de horas dirigidas da frota</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="mediaHoras"
                  name="Média Horas"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top 5 Motoristas
                </CardTitle>
                <CardDescription>
                  Ranking por métrica selecionada
                </CardDescription>
              </div>
              <Select
                value={chartMetric}
                onValueChange={(v) => setChartMetric(v as typeof chartMetric)}
              >
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horas">Horas</SelectItem>
                  <SelectItem value="km">Km Rodado</SelectItem>
                  <SelectItem value="infracoes">Infrações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={top5DriversData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip />
                <Bar
                  dataKey="valor"
                  name={
                    chartMetric === "horas"
                      ? "Horas"
                      : chartMetric === "km"
                      ? "Km"
                      : "Infrações"
                  }
                  fill={chartMetric === "infracoes" ? "#ef4444" : "#3b82f6"}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Pendências */}
      {pendingDriversToday.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertOctagon className="h-5 w-5" />
              Alerta: Motoristas sem Leitura Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingDriversToday.map((driver) => (
                <Badge
                  key={driver.id}
                  variant="destructive"
                  className="px-3 py-1"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  {driver.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros de Leitura
          </CardTitle>
          <CardDescription>
            {filteredRecords.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Total Horas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.slice(0, 20).map((record) => {
                  const isAlertRow = record.hasInfraction;
                  return (
                    <TableRow
                      key={record.id}
                      className={isAlertRow ? "bg-red-50 hover:bg-red-100" : ""}
                    >
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{record.driverName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.vehiclePlate}</Badge>
                      </TableCell>
                      <TableCell>{record.startTime}</TableCell>
                      <TableCell>{record.endTime}</TableCell>
                      <TableCell>
                        <span
                          className={
                            record.totalHours > 10
                              ? "text-red-600 font-bold"
                              : ""
                          }
                        >
                          {record.totalHours}h
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {getInfractionLabel(record.infractionType)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
