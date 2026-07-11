"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Avatar via plain div (component not installed)
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Search,
  Calendar,
  AlertCircle,
  ImageIcon,
  Bot,
  FileText,
  Gauge,
  Timer,
  ShieldCheck,
  ShieldAlert,
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
} from "recharts";

// ── Mock Data ──────────────────────────────────────────────────────────────
const weeklyComplianceData = [
  { day: "Seg", conformidade: 45 },
  { day: "Ter", conformidade: 52 },
  { day: "Qua", conformidade: 48 },
  { day: "Qui", conformidade: 70 },
  { day: "Sex", conformidade: 65 },
  { day: "Sáb", conformidade: 78 },
  { day: "Dom", conformidade: 82 },
];

const alertDistributionData = [
  { categoria: "Velocidade", alertas: 18 },
  { categoria: "Tempo Condução", alertas: 11 },
  { categoria: "Descanso", alertas: 5 },
];

const recentAlerts = [
  {
    id: 1,
    motorista: "Carlos Silva",
    initials: "CS",
    placa: "FJZ9003",
    alerta: "Velocidade",
    detalhes: "Tempo Cond., Tempo Condu...",
    data: "26/03/2023",
    status: "Alerta",
  },
  {
    id: 2,
    motorista: "João Pereira",
    initials: "JP",
    placa: "FJZ9004",
    alerta: "Velocidade",
    detalhes: "Condução excessiva",
    data: "25/03/2023",
    status: "Alerta",
  },
  {
    id: 3,
    motorista: "Ana Souza",
    initials: "AS",
    placa: "ABC1D23",
    alerta: "Descanso",
    detalhes: "Intervalo insuficiente",
    data: "25/03/2023",
    status: "Pendente",
  },
  {
    id: 4,
    motorista: "Marcos Lima",
    initials: "ML",
    placa: "XYZ5678",
    alerta: "Tempo Condução",
    detalhes: "8h sem parada registrada",
    data: "24/03/2023",
    status: "Alerta",
  },
  {
    id: 5,
    motorista: "Ricardo Neves",
    initials: "RN",
    placa: "MNP3421",
    alerta: "Velocidade",
    detalhes: "102 km/h em via de 80",
    data: "24/03/2023",
    status: "Alerta",
  },
];

const sideAlerts = [
  {
    id: 1,
    motorista: "Carlos Silva",
    initials: "CS",
    problema: "Velocidade Excedida (98 km/h)",
    local: "Rodovia BR-101",
    placa: "FJZ9003",
  },
  {
    id: 2,
    motorista: "Ana Souza",
    initials: "AS",
    problema: "Condução Excedida (8h30m sem parada)",
    local: "–",
    placa: "ABC1D23",
  },
  {
    id: 3,
    motorista: "Marcos Lima",
    initials: "ML",
    problema: "Descanso Insuficiente",
    local: "Trecho SP-MG",
    placa: "XYZ5678",
  },
];

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  badge,
  badgeVariant,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  badge?: string;
  badgeVariant?: "green" | "red";
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold leading-none">{value}</span>
              {badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    badgeVariant === "red"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function TachographView() {
  const [activeTab, setActiveTab] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [driverFilter, setDriverFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // ── Audit Modal State ──
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const openAudit = (record: any) => {
    setSelectedRecord(record);
    setIsAuditModalOpen(true);
  };

  const filteredAlerts = recentAlerts.filter((a) => {
    if (activeTab === "pendentes") return a.status === "Pendente";
    if (activeTab === "alerta") return a.status === "Alerta";
    return true;
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Visão Geral dos Tacógrafos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitore o desempenho e conformidade dos motoristas
        </p>
      </div>

      {/* ── Filters Bar ── */}
      <Card>
        <CardContent className="p-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date picker simulado */}
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 h-9 text-sm text-muted-foreground min-w-[180px]">
              <Calendar className="h-4 w-4 shrink-0" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-auto border-0 p-0 text-sm bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Selecione o período"
              />
            </div>

            {/* Motorista select */}
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="h-9 min-w-[160px] text-sm">
                <SelectValue placeholder="Motorista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos-motoristas">Todos</SelectItem>
                <SelectItem value="carlos-silva">Carlos Silva</SelectItem>
                <SelectItem value="joao-pereira">João Pereira</SelectItem>
                <SelectItem value="ana-souza">Ana Souza</SelectItem>
                <SelectItem value="marcos-lima">Marcos Lima</SelectItem>
              </SelectContent>
            </Select>

            {/* Status tabs-style */}
            <div className="flex items-center gap-1 rounded-md border bg-muted/40 px-1 py-1 text-sm">
              <span className="px-2 text-xs text-muted-foreground">Status:</span>
              {["Todos", "Pendente", "Alerta"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s.toLowerCase())}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s.toLowerCase()
                      ? "bg-white shadow-sm text-foreground dark:bg-card"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Filtrar button */}
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-9 ml-auto">
              <Search className="h-4 w-4" />
              Filtrar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Tacógrafos Pendentes"
          value="15"
          badge="+3 hoje"
          badgeVariant="green"
          icon={Clock}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Tacógrafos com Alerta"
          value="8"
          badge="+1"
          badgeVariant="red"
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <KpiCard
          title="Conformidade Geral"
          value="92%"
          badge="+0.5%"
          badgeVariant="green"
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <KpiCard
          title="Motoristas Ativos"
          value="112"
          icon={Truck}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Area Chart — Conformidade Semanal (60%) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 pt-3 px-3 text-left">
            <CardTitle className="text-base font-semibold">Conformidade Semanal</CardTitle>
            <CardDescription className="text-xs font-normal text-muted-foreground">
              Evolução percentual de viagens sem infrações ao longo dos dias.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-0">
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyComplianceData}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorConformidade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={true}
                    horizontal={true}
                    stroke="#e2e8f0"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Conformidade"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conformidade"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConformidade)"
                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#3b82f6" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart — Distribuição de Alertas (40%) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-3 px-3 text-left">
            <CardTitle className="text-base font-semibold">Distribuição de Alertas</CardTitle>
            <CardDescription className="text-xs font-normal text-muted-foreground">
              Principais infrações cometidas pela frota separadas por categoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-0">
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={alertDistributionData}
                  margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={true}
                    horizontal={true}
                    stroke="#e2e8f0"
                    strokeOpacity={0.8}
                  />
                  <XAxis
                    dataKey="categoria"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "Alertas"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar
                    dataKey="alertas"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    activeBar={{ fill: "#3b82f6", stroke: "#1e3a8a", strokeWidth: 2, strokeDasharray: "4 4" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Análise Detalhada (full width) ── */}
      <div>
        {/* Tabela Análise Detalhada — largura total */}
        <Card>
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-sm font-semibold">
              Análise Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-3 pb-2">
                <TabsList className="h-7 rounded-lg bg-muted/50">
                  <TabsTrigger value="todos" className="text-xs">
                    Todos os Motoristas
                  </TabsTrigger>
                  <TabsTrigger value="pendentes" className="text-xs">
                    Pendentes (15)
                  </TabsTrigger>
                  <TabsTrigger value="alerta" className="text-xs">
                    Com Alerta (8)
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <div className="px-3 pb-1">
                  <p className="text-xs font-medium text-muted-foreground">Alertas Recentes</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold">Motorista</TableHead>
                        <TableHead className="text-xs font-semibold">Placa</TableHead>
                        <TableHead className="text-xs font-semibold">Alerta</TableHead>
                        <TableHead className="text-xs font-semibold">Detalhes</TableHead>
                        <TableHead className="text-xs font-semibold">Data</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((alert) => (
                        <TableRow
                          key={alert.id}
                          className="text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openAudit(alert)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-blue-700">
                                  {alert.initials}
                                </span>
                              </div>
                              <span className="font-medium text-xs leading-tight">
                                {alert.motorista.split(" ")[0]}
                                <br />
                                <span className="text-muted-foreground font-normal">
                                  {alert.motorista.split(" ")[1]}
                                </span>
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {alert.placa}
                          </TableCell>
                          <TableCell className="text-xs">{alert.alerta}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[130px] truncate">
                            {alert.detalhes}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {alert.data}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] px-2 py-0.5 ${
                                alert.status === "Alerta"
                                  ? "bg-red-500 hover:bg-red-500 text-white"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              }`}
                            >
                              {alert.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ── Alertas Row (horizontal grid below) ── */}
      <div>
        <p className="text-base font-semibold px-1 mb-2">Alertas</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sideAlerts.map((alert) => (
            <Card key={alert.id} className="border shadow-sm">
              <CardContent className="p-2 space-y-1">
                {/* Header: icon + nome */}
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {alert.motorista}
                  </span>
                </div>

                {/* Problema */}
                <p className="text-sm font-semibold leading-snug">
                  {alert.problema}
                </p>

                {/* Placa + Botão */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                      Placa
                    </p>
                    <p className="text-xs font-mono font-semibold">{alert.placa}</p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => openAudit({
                      id: alert.id,
                      motorista: alert.motorista,
                      initials: alert.initials,
                      placa: alert.placa,
                      alerta: alert.problema,
                      detalhes: alert.local,
                      data: "26/03/2023",
                      status: "Alerta",
                    })}
                  >
                    Analisar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── AUDIT MODAL ──────────────────────────────────────────── */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-modal">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-bold">
              Auditoria de Leitura —{" "}
              <span className="text-blue-600">{selectedRecord?.motorista}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Placa: <span className="font-mono font-semibold">{selectedRecord?.placa}</span>
              {" · "}
              Data: {selectedRecord?.data}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord?.status === "Alerta" && (
            <Alert variant="destructive" className="mt-1">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">Divergência Detectada pela IA</AlertTitle>
              <AlertDescription className="text-xs">
                A leitura do tacógrafo apresenta inconsistências em relação aos dados declarados pelo motorista.
                Revise os campos abaixo antes de aprovar.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* ── Coluna Esquerda: Foto do Disco ── */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Foto do Disco Enviada</p>
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30 min-h-[220px] gap-3 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Imagem do disco tacográfico</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Enviada pelo motorista no momento do registro</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs gap-2">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Visualizar imagem completa
                </Button>
              </div>
            </div>

            {/* ── Coluna Direita: Comparação ── */}
            <div className="flex flex-col gap-3">

              {/* Bloco 1 — Dados Declarados */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Dados Declarados</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Motorista</p>
                    <p className="text-sm font-semibold">{selectedRecord?.motorista}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Placa</p>
                    <p className="text-sm font-mono font-semibold">{selectedRecord?.placa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hora Inicial</p>
                    <p className="text-sm font-semibold">06:30</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hora Final</p>
                    <p className="text-sm font-semibold">14:45</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Km Rodado</p>
                    <p className="text-sm font-semibold">312 km</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tipo de Alerta</p>
                    <p className="text-sm font-semibold">{selectedRecord?.alerta}</p>
                  </div>
                </div>
              </div>

              {/* Bloco 2 — Leitura da IA */}
              <div className="rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-400">Leitura da Inteligência Artificial</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-card border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">Velocidade Máxima Detectada</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      selectedRecord?.status === "Alerta" ? "text-red-600" : "text-foreground"
                    }`}>98 km/h</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-card border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-muted-foreground">Tempo de Direção Contínua</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      selectedRecord?.status === "Alerta" ? "text-red-600" : "text-foreground"
                    }`}>8h 30min</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white dark:bg-card border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {selectedRecord?.status === "Alerta" ? (
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs text-muted-foreground">Status de Conformidade</span>
                    </div>
                    <Badge className={`text-[10px] ${
                      selectedRecord?.status === "Alerta"
                        ? "bg-red-500 hover:bg-red-500 text-white"
                        : "bg-green-500 hover:bg-green-500 text-white"
                    }`}>
                      {selectedRecord?.status === "Alerta" ? "Não Conforme" : "Conforme"}
                    </Badge>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="sm:mr-auto"
              onClick={() => setIsAuditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setIsAuditModalOpen(false)}
            >
              <ShieldAlert className="h-4 w-4" />
              Registrar Incidente
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => setIsAuditModalOpen(false)}
            >
              <ShieldCheck className="h-4 w-4" />
              Aprovar Leitura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
