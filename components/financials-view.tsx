"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format,
  subDays,
  startOfYear,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Fuel,
  BarChart3,
  GitCompare,
  FileText,
  Wrench,
  Loader2,
  CalendarRange,
  Filter,
  X,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
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
import { ComparisonPanel, DeltaBadge } from "@/components/comparison-panel";
import {
  buscarFrotaAPI,
  buscarManutencoesAPI,
  buscarMultasAPI,
} from "@/lib/api-service";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface ExpenseItem {
  id: string | number;
  date: string;
  vehicle_plate: string;
  type: "Manutenção" | "Multa";
  category: string;
  cost: number;
  status: string;
}

interface FilterState {
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  selectedVehicles: string[]; // Placas
  types: {
    maintenance: boolean;
    fines: boolean;
  };
}

export function FinancialsView() {
  const { comparison, toggleComparison } = useApp();
  const [loading, setLoading] = useState(true);

  // Estados de Dados Reais
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);

  // Estado do Filtro
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: "", end: "" },
    selectedVehicles: [],
    types: { maintenance: true, fines: true },
  });

  // Estado local para busca de veículos no filtro
  const [vehicleSearch, setVehicleSearch] = useState("");

  // --- 1. CARREGAR DADOS ---
  useEffect(() => {
    async function loadFinancialData() {
      try {
        setLoading(true);
        const [frotaRes, manutsRes, multasRes] = await Promise.all([
          buscarFrotaAPI(),
          buscarManutencoesAPI(),
          buscarMultasAPI(),
        ]);

        setVehicles(Array.isArray(frotaRes) ? frotaRes : []);
        setMaintenances(Array.isArray(manutsRes) ? manutsRes : []);
        setFines(Array.isArray(multasRes) ? multasRes : []);
      } catch (error) {
        console.error("Erro ao carregar financeiro:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFinancialData();
  }, []);

  // --- HELPERS ---
  const parseCurrency = (value: any): number => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const stringValue = String(value).replace("R$", "").trim();
    if (stringValue.includes(",") && stringValue.includes(".")) {
      return parseFloat(stringValue.replace(/\./g, "").replace(",", "."));
    }
    if (stringValue.includes(",")) {
      return parseFloat(stringValue.replace(",", "."));
    }
    return parseFloat(stringValue) || 0;
  };

  const getDate = (item: any): Date => {
    const dateStr =
      item.date ||
      item.due_date ||
      item.vencimento ||
      item.data ||
      item.scheduled_date ||
      item.created_at;
    return dateStr ? new Date(dateStr) : new Date();
  };

  // --- LÓGICA DE FILTRAGEM CENTRALIZADA ---
  const filteredData = useMemo(() => {
    let filteredMaintenances = [...maintenances];
    let filteredFines = [...fines];

    // 1. Filtro de Tipo
    if (!filters.types.maintenance) filteredMaintenances = [];
    if (!filters.types.fines) filteredFines = [];

    // 2. Filtro de Veículo
    if (filters.selectedVehicles.length > 0) {
      filteredMaintenances = filteredMaintenances.filter((m) =>
        filters.selectedVehicles.includes(m.vehicle_plate)
      );
      filteredFines = filteredFines.filter((f) =>
        filters.selectedVehicles.includes(f.vehicle_plate)
      );
    }

    // 3. Filtro de Data
    if (filters.dateRange.start) {
      const startDate = startOfDay(new Date(filters.dateRange.start));
      filteredMaintenances = filteredMaintenances.filter(
        (m) => getDate(m) >= startDate
      );
      filteredFines = filteredFines.filter((f) => getDate(f) >= startDate);
    }

    if (filters.dateRange.end) {
      const endDate = endOfDay(new Date(filters.dateRange.end));
      filteredMaintenances = filteredMaintenances.filter(
        (m) => getDate(m) <= endDate
      );
      filteredFines = filteredFines.filter((f) => getDate(f) <= endDate);
    }

    return { maintenances: filteredMaintenances, fines: filteredFines };
  }, [maintenances, fines, filters]);

  // Contagem de filtros ativos para o Badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.selectedVehicles.length > 0) count++;
    if (!filters.types.maintenance || !filters.types.fines) count++;
    return count;
  }, [filters]);

  // --- FUNÇÕES DE CONTROLE DE FILTRO ---
  const applyPreset = (preset: "30days" | "90days" | "year" | "all") => {
    const today = new Date();
    let start = "";
    let end = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "30days":
        start = format(subDays(today, 30), "yyyy-MM-dd");
        break;
      case "90days":
        start = format(subDays(today, 90), "yyyy-MM-dd");
        break;
      case "year":
        start = format(startOfYear(today), "yyyy-MM-dd");
        break;
      case "all":
        start = "";
        end = "";
        break;
    }
    setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
  };

  const toggleVehicle = (plate: string) => {
    setFilters((prev) => {
      const current = prev.selectedVehicles;
      if (current.includes(plate)) {
        return {
          ...prev,
          selectedVehicles: current.filter((p) => p !== plate),
        };
      } else {
        return { ...prev, selectedVehicles: [...current, plate] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: "", end: "" },
      selectedVehicles: [],
      types: { maintenance: true, fines: true },
    });
  };

  // --- CÁLCULOS COM DADOS FILTRADOS ---

  // KPIs (Total Geral Filtrado)
  const kpiData = useMemo(() => {
    let totalMaintenance = 0;
    let totalFines = 0;

    filteredData.maintenances.forEach(
      (m) => (totalMaintenance += parseCurrency(m.cost || m.valor))
    );
    filteredData.fines.forEach(
      (f) =>
        (totalFines += parseCurrency(
          f.amount || f.valor || f.custo || f.value || f.cost
        ))
    );

    return {
      maintenance: totalMaintenance,
      fines: totalFines,
      total: totalMaintenance + totalFines,
    };
  }, [filteredData]);

  // Gráfico Anual (2026) - Filtrado
  const annualCosts = useMemo(() => {
    const data: Record<
      string,
      {
        month: string;
        maintenance: number;
        fines: number;
        total: number;
        index: number;
      }
    > = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const currentYear = new Date().getFullYear();

    months.forEach((m, i) => {
      data[m] = { month: m, maintenance: 0, fines: 0, total: 0, index: i };
    });

    filteredData.maintenances.forEach((m) => {
      const d = getDate(m);
      if (d.getFullYear() === currentYear) {
        const key = months[d.getMonth()];
        if (data[key]) {
          const val = parseCurrency(m.cost || m.valor);
          data[key].maintenance += val;
          data[key].total += val;
        }
      }
    });

    filteredData.fines.forEach((f) => {
      const d = getDate(f);
      if (d.getFullYear() === currentYear) {
        const key = months[d.getMonth()];
        if (data[key]) {
          const val = parseCurrency(
            f.amount || f.valor || f.custo || f.value || f.cost
          );
          data[key].fines += val;
          data[key].total += val;
        }
      }
    });

    return Object.values(data).sort((a, b) => a.index - b.index);
  }, [filteredData]);

  // TCO por Veículo - Filtrado
  const vehicleTCOData = useMemo(() => {
    const tcoMap: Record<
      string,
      { plate: string; maintenance: number; fines: number; total: number }
    > = {};

    // Inicializa apenas veículos visíveis (se filtro estiver ativo)
    const visibleVehicles =
      filters.selectedVehicles.length > 0
        ? vehicles.filter((v) => filters.selectedVehicles.includes(v.placa))
        : vehicles;

    visibleVehicles.forEach((v) => {
      tcoMap[v.id] = { plate: v.placa, maintenance: 0, fines: 0, total: 0 };
    });

    filteredData.maintenances.forEach((m) => {
      if (tcoMap[m.vehicle_id]) {
        const val = parseCurrency(m.cost || m.valor);
        tcoMap[m.vehicle_id].maintenance += val;
        tcoMap[m.vehicle_id].total += val;
      }
    });

    filteredData.fines.forEach((f) => {
      const vehicle = vehicles.find(
        (v) => v.placa === f.vehicle_plate || v.id === f.vehicle_id
      );
      if (vehicle && tcoMap[vehicle.id]) {
        const val = parseCurrency(
          f.amount || f.valor || f.custo || f.value || f.cost
        );
        tcoMap[vehicle.id].fines += val;
        tcoMap[vehicle.id].total += val;
      }
    });

    return Object.values(tcoMap).sort((a, b) => b.total - a.total);
  }, [vehicles, filteredData, filters.selectedVehicles]);

  // Tabela de Despesas - Filtrada
  const recentExpenses: ExpenseItem[] = useMemo(() => {
    const items: ExpenseItem[] = [];

    filteredData.maintenances.forEach((m) => {
      items.push({
        id: `m-${m.id}`,
        date: getDate(m).toISOString(),
        vehicle_plate: m.vehicle_plate,
        type: "Manutenção",
        category: m.type || "Geral",
        cost: parseCurrency(m.cost || m.valor),
        status: m.status,
      });
    });

    filteredData.fines.forEach((f) => {
      items.push({
        id: `f-${f.id}`,
        date: getDate(f).toISOString(),
        vehicle_plate: f.vehicle_plate,
        type: "Multa",
        category: "Infração",
        cost: parseCurrency(
          f.amount || f.valor || f.custo || f.value || f.cost
        ),
        status: f.status,
      });
    });

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [filteredData]);

  // Dados Comparativos (Baseados no TCO filtrado)
  const vehicleComparisonData = useMemo(() => {
    if (!comparison.isActive || comparison.type !== "vehicles") return null;
    return comparison.selectedVehicles.map((vehicleId) => {
      const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId));
      const data = vehicleTCOData.find((t) => t.plate === vehicle?.placa);
      return {
        plate: vehicle?.placa || "N/A",
        maintenanceCost: data?.maintenance || 0,
        finesCost: data?.fines || 0,
      };
    });
  }, [comparison, vehicles, vehicleTCOData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Financeiro & TCO
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Visão consolidada de custos acumulados
          </p>
        </div>

        <div className="flex gap-2">
          {/* BOTÃO DE FILTRO AVANÇADO */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 relative">
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

                {/* Seção de Datas */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Período
                  </Label>
                  <div className="flex gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => applyPreset("30days")}
                    >
                      30d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => applyPreset("90days")}
                    >
                      90d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => applyPreset("year")}
                    >
                      Ano
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => applyPreset("all")}
                    >
                      Tudo
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
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
                    </div>
                    <div className="relative">
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={filters.dateRange.end}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            dateRange: {
                              ...prev.dateRange,
                              end: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção de Tipos */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Tipo de Despesa
                  </Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-maint"
                        checked={filters.types.maintenance}
                        onCheckedChange={(c) =>
                          setFilters((prev) => ({
                            ...prev,
                            types: { ...prev.types, maintenance: !!c },
                          }))
                        }
                      />
                      <label
                        htmlFor="type-maint"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Manutenção
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="type-fine"
                        checked={filters.types.fines}
                        onCheckedChange={(c) =>
                          setFilters((prev) => ({
                            ...prev,
                            types: { ...prev.types, fines: !!c },
                          }))
                        }
                      />
                      <label
                        htmlFor="type-fine"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Multas
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção de Veículos (Combobox simplificado) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Veículos ({filters.selectedVehicles.length})
                    </Label>
                    {filters.selectedVehicles.length > 0 && (
                      <span
                        className="text-xs text-blue-500 cursor-pointer hover:underline"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedVehicles: [],
                          }))
                        }
                      >
                        Limpar seleção
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="Buscar placa..."
                    className="h-8 text-xs mb-2"
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                  <ScrollArea className="h-[120px] border rounded-md p-2">
                    {vehicles
                      .filter((v) =>
                        v.placa
                          .toLowerCase()
                          .includes(vehicleSearch.toLowerCase())
                      )
                      .map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="flex items-center space-x-2 py-1.5 hover:bg-muted/50 rounded px-1 cursor-pointer"
                          onClick={() => toggleVehicle(vehicle.placa)}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 border rounded flex items-center justify-center transition-colors",
                              filters.selectedVehicles.includes(vehicle.placa)
                                ? "bg-primary border-primary text-white"
                                : "border-muted-foreground"
                            )}
                          >
                            {filters.selectedVehicles.includes(
                              vehicle.placa
                            ) && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-sm">
                            {vehicle.placa}{" "}
                            <span className="text-xs text-muted-foreground">
                              - {vehicle.modelo}
                            </span>
                          </span>
                        </div>
                      ))}
                    {vehicles.length === 0 && (
                      <div className="text-xs text-center py-4 text-muted-foreground">
                        Nenhum veículo encontrado
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant={comparison.isActive ? "default" : "outline"}
            onClick={toggleComparison}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Comparação
          </Button>
        </div>
      </div>

      <ComparisonPanel />

      {/* Métricas (KPIs ACUMULADOS FILTRADOS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total (Filtrado)
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {kpiData.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Soma conforme filtros ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manutenção
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {kpiData.maintenance.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Multas
            </CardTitle>
            <FileText className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {kpiData.fines.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Combustível
            </CardTitle>
            <Fuel className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">---</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Módulo não ativado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Charts */}
      {comparison.isActive &&
        comparison.type === "vehicles" &&
        vehicleComparisonData &&
        vehicleComparisonData.length >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Custo Acumulado (TCO)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleComparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="plate" className="text-xs" />
                    <YAxis
                      tickFormatter={(value) => `R$${value / 1000}k`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      }
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="maintenanceCost"
                      name="Manutenção"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="finesCost"
                      name="Multas"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Gráfico de Custos ANUAL 2026 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Evolução de Custos (Ano Atual - Filtrado)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualCosts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis
                  tickFormatter={(value) => `R$${value / 1000}k`}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(value: number) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="maintenance"
                  name="Manutenção"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="fines"
                  name="Multas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela de Últimas Despesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Últimas Despesas (Filtrado)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-4 text-muted-foreground"
                    >
                      Nenhuma despesa para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentExpenses.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{entry.vehicle_plate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.type === "Manutenção" ? (
                            <Wrench className="h-3 w-3 text-blue-500" />
                          ) : (
                            <FileText className="h-3 w-3 text-red-500" />
                          )}
                          {entry.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.cost.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status === "Pendente" ||
                            entry.status === "Urgente"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Gráfico TCO - Top Veículos */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Custos (Filtrado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleTCOData.slice(0, 5)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    className="text-xs"
                  />
                  <YAxis
                    type="category"
                    dataKey="plate"
                    className="text-xs"
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString("pt-BR")}`
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="maintenance"
                    name="Manutenção"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="fines"
                    name="Multas"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
