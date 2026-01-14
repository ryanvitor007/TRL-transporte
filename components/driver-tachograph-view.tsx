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

// --- MOCK DE VEÍCULOS ---
const mockVehicles = [
  { id: "v1", plate: "ABC-1234", model: "Volvo FH 460" },
  { id: "v2", plate: "DEF-5678", model: "Scania R450" },
  { id: "v3", plate: "GHI-9012", model: "Mercedes Actros" },
];

// --- MOCK DATA (simulando dados do motorista logado) ---
const generateDriverMockRecords = (
  driverId: string,
  driverName: string
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
        Math.random() * 6
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
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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

export function DriverTachographView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";
  const driverId = user?.id || "d1";

  // Estados
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: "", end: "" },
    status: { emDia: true, pendente: true, comInfracao: true },
  });
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);

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

  // Mock records do motorista
  const mockRecords = useMemo(
    () => generateDriverMockRecords(driverId, driverName),
    [driverId, driverName]
  );

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
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
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

  const clearFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      status: { emDia: true, pendente: true, comInfracao: true },
    });
  };

  const handleSubmitRecord = () => {
    // TODO: Integrar com backend
    // await api.post('/tacografo/leitura', { ...newRecord, driverId })
    console.log("Novo registro:", newRecord);
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
  };

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
          <h1 className="text-2xl font-bold text-foreground">Meu Tacógrafo</h1>
          <p className="text-muted-foreground">
            Registros e histórico de leituras
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
            <PopoverContent className="w-[300px] p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-semibold text-sm">Filtros</h4>
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
              </div>
            </PopoverContent>
          </Popover>

          {/* Botão Nova Leitura */}
          <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Nova Leitura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Leitura</DialogTitle>
                <DialogDescription>
                  Preencha os dados do tacógrafo de hoje
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Veículo</Label>
                  <Select
                    value={newRecord.vehicleId}
                    onValueChange={(v) =>
                      setNewRecord((prev) => ({ ...prev, vehicleId: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
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
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) =>
                      setNewRecord((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Início</Label>
                    <Input
                      type="time"
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
                    <Label>Hora Fim</Label>
                    <Input
                      type="time"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>KM Inicial</Label>
                    <Input
                      type="number"
                      placeholder="0"
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
                    <Label>KM Final</Label>
                    <Input
                      type="number"
                      placeholder="0"
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
                  <Label>Foto do Disco</Label>
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
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        uploadedPhoto
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Camera
                        className={`h-8 w-8 mx-auto mb-2 ${
                          uploadedPhoto
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm text-muted-foreground">
                        {uploadedPhoto || "Toque para tirar foto"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewRecordOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmitRecord}
                    disabled={
                      !newRecord.vehicleId ||
                      !newRecord.startTime ||
                      !newRecord.endTime
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Envio Hoje
            </CardTitle>
            {kpis.envioHoje ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                kpis.envioHoje ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {kpis.envioHoje ? "Enviado" : "Pendente"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Horas/Dia
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.mediaHoras}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total KM (Período)
            </CardTitle>
            <Gauge className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalKm.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Infrações
            </CardTitle>
            <AlertOctagon className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                kpis.infracoes > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {kpis.infracoes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Tendência */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Minha Tendência (14 dias)</CardTitle>
            <CardDescription>Horas trabalhadas por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="horas"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/0.2)"
                    name="Horas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de KM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KM Rodados (14 dias)</CardTitle>
            <CardDescription>Quilometragem diária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
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

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Registros</CardTitle>
          <CardDescription>Histórico de leituras do tacógrafo</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Vel. Máx</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Infração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={
                      record.hasInfraction ? "bg-red-50 dark:bg-red-950/20" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {format(new Date(record.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{record.vehiclePlate}</TableCell>
                    <TableCell>{record.startTime}</TableCell>
                    <TableCell>{record.endTime}</TableCell>
                    <TableCell>{record.totalHours}h</TableCell>
                    <TableCell>{record.kmDriven} km</TableCell>
                    <TableCell>{record.maxSpeed} km/h</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell
                      className={
                        record.hasInfraction ? "text-red-600 font-medium" : ""
                      }
                    >
                      {getInfractionLabel(record.infractionType)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
