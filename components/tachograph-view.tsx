"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Activity,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  GitCompare,
  Loader2,
  Search,
  Calendar as CalendarIcon,
  UserX,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { buscarTacografosAPI, buscarFrotaAPI } from "@/lib/api-service";

export function TachographView() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [driversList, setDriversList] = useState<string[]>([]); // Lista única de nomes

  // Filtros
  const [driverFilter, setDriverFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState({
    ok: true,
    pending: true,
    alert: true,
  });

  // Comparação
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareDrivers, setCompareDrivers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await buscarTacografosAPI();
      setRecords(data || []);

      // Extrair nomes únicos de motoristas para os filtros
      const names = Array.from(
        new Set(data.map((r: any) => r.motorista_nome))
      ).filter(Boolean) as string[];
      setDriversList(names);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ALERTAS E KPIs ---
  const today = new Date().toISOString().split("T")[0];

  // Registros de Hoje
  const todayRecords = records.filter((r) => r.data_leitura === today);

  // Motoristas Pendentes (Simulação: Vamos supor que temos 5 motoristas no total)
  // Num cenário real, você buscaria a lista de todos os motoristas ativos e compararia quem não enviou
  const pendingCount = Math.max(0, 5 - todayRecords.length);

  const totalHoursToday = todayRecords.reduce(
    (acc, r) => acc + (r.horas_trabalhadas || 0),
    0
  );
  const avgHours =
    todayRecords.length > 0
      ? (totalHoursToday / todayRecords.length).toFixed(1)
      : "0.0";

  // --- DADOS FILTRADOS PARA TABELA ---
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Filtro Motorista
        if (driverFilter.length > 0 && !driverFilter.includes(r.motorista_nome))
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.data_leitura).getTime() -
          new Date(a.data_leitura).getTime()
      );
  }, [records, driverFilter]);

  // --- DADOS PARA GRÁFICOS ---
  const chartData = useMemo(() => {
    // Agrupar horas por dia (últimos 7 dias)
    // Mock simples para visualização se não tiver dados suficientes
    return [
      { name: "Seg", horas: 34 },
      { name: "Ter", horas: 42 },
      { name: "Qua", horas: 38 },
      { name: "Qui", horas: 45 },
      { name: "Sex", horas: totalHoursToday || 40 }, // Usa dado real de hoje
    ];
  }, [totalHoursToday]);

  // Dados Comparativos
  const comparisonData = useMemo(() => {
    return compareDrivers.map((driver) => {
      const driverRecs = records.filter((r) => r.motorista_nome === driver);
      const totalH = driverRecs.reduce(
        (acc, r) => acc + (r.horas_trabalhadas || 0),
        0
      );
      const totalKm = driverRecs.reduce(
        (acc, r) => acc + (r.km_final - r.km_inicial || 0),
        0
      );
      return {
        name: driver,
        Horas: totalH,
        KM: totalKm / 100, // Escala para caber no gráfico
      };
    });
  }, [compareDrivers, records]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestão de Tacógrafo
          </h1>
          <p className="text-muted-foreground">
            Monitoramento de jornada e leituras diárias.
          </p>
        </div>
        <div className="flex gap-2">
          {/* FILTROS */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filtros
                {driverFilter.length > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                    {driverFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Filtrar Motoristas</h4>
                <ScrollArea className="h-40 border rounded p-2">
                  {driversList.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Nenhum motorista registrado ainda.
                    </p>
                  )}
                  {driversList.map((name) => (
                    <div
                      key={name}
                      className="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        checked={driverFilter.includes(name)}
                        onCheckedChange={(checked) => {
                          setDriverFilter((prev) =>
                            checked
                              ? [...prev, name]
                              : prev.filter((n) => n !== name)
                          );
                        }}
                      />
                      <span className="text-sm">{name}</span>
                    </div>
                  ))}
                </ScrollArea>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setDriverFilter([])}
                >
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* COMPARAÇÃO */}
          <Button
            variant={isCompareOpen ? "default" : "outline"}
            className="gap-2"
            onClick={() => setIsCompareOpen(true)}
          >
            <GitCompare className="h-4 w-4" /> Comparar
          </Button>
        </div>
      </div>

      {/* DASHBOARD KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leituras Hoje
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRecords.length} / 5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Esperado: 5 motoristas
            </p>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${
                pendingCount > 0 ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              Pendências
            </CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${
                pendingCount > 0 ? "text-red-500" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                pendingCount > 0 ? "text-red-700" : ""
              }`}
            >
              {pendingCount}
            </div>
            <p
              className={`text-xs ${
                pendingCount > 0 ? "text-red-600" : "text-muted-foreground"
              } mt-1`}
            >
              Motoristas não enviaram
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média Horas/Dia
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtividade da frota
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status Geral
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conformidade legal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ÁREA DE GRÁFICOS (Condicional se Comparação Ativa) */}
      {isCompareOpen && compareDrivers.length > 0 && (
        <Card className="bg-muted/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex justify-between">
              Comparativo de Motoristas
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setIsCompareOpen(false);
                  setCompareDrivers([]);
                }}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Horas" fill="#3b82f6" />
                  <Bar dataKey="KM" fill="#10b981" name="KM (x100)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCompareOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tendência de Horas Trabalhadas (Última Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="horas"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTA DE REGISTROS */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Leituras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>KM Rodado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.data_leitura).toLocaleDateString(
                        "pt-BR"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {record.motorista_nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ID: {record.motorista_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{record.veiculo_placa}</TableCell>
                    <TableCell>
                      {(record.km_final - record.km_inicial).toLocaleString()}{" "}
                      km
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE COMPARAÇÃO */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comparar Motoristas</DialogTitle>
            <DialogDescription>
              Selecione até 3 motoristas para comparar desempenho.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {driversList.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem dados para comparar.
              </p>
            )}
            {driversList.map((driver) => (
              <div key={driver} className="flex items-center space-x-2">
                <Checkbox
                  id={`comp-${driver}`}
                  checked={compareDrivers.includes(driver)}
                  onCheckedChange={(checked) => {
                    setCompareDrivers((prev) => {
                      if (checked) {
                        return prev.length < 3 ? [...prev, driver] : prev;
                      } else {
                        return prev.filter((d) => d !== driver);
                      }
                    });
                  }}
                />
                <Label htmlFor={`comp-${driver}`}>{driver}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCompareOpen(false)}>
              Aplicar Comparação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
