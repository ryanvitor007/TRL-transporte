"use client";

import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Legend
} from "recharts";
import {
  DollarSign, Calculator, ShieldAlert, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Bell, Download, Search, Filter,
  Plus, ChevronLeft, ChevronRight, MoreVertical, Wrench, Fuel,
  TriangleAlert, CircleDot, Shield, Boxes, Info, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const evolutionData = [
  { month: "Jan", manutencao: 28000, combustivel: 22000, multas: 4200 },
  { month: "Fev", manutencao: 32000, combustivel: 19500, multas: 5100 },
  { month: "Mar", manutencao: 25000, combustivel: 21000, multas: 3800 },
  { month: "Abr", manutencao: 38000, combustivel: 20000, multas: 6200 },
  { month: "Mai", manutencao: 24850, combustivel: 18420, multas: 7160 },
  { month: "Jun", manutencao: 31000, combustivel: 23000, multas: 4500 },
  { month: "Jul", manutencao: 29500, combustivel: 20500, multas: 5800 },
  { month: "Ago", manutencao: 35000, combustivel: 22500, multas: 6100 },
  { month: "Set", manutencao: 27000, combustivel: 19000, multas: 4800 },
  { month: "Out", manutencao: 33000, combustivel: 21500, multas: 5500 },
  { month: "Nov", manutencao: 30000, combustivel: 20000, multas: 6000 },
  { month: "Dez", manutencao: 36000, combustivel: 24000, multas: 7200 },
];

const distributionData = [
  { name: "Manutenção", value: 38, color: "#3B82F6" },
  { name: "Combustível", value: 29, color: "#10B981" },
  { name: "Multas", value: 14, color: "#F59E0B" },
  { name: "Pneus", value: 11, color: "#8B5CF6" },
  { name: "Outros", value: 8, color: "#6B7280" },
];

const tcoData = [
  { vehicle: "ABC-1234", value: 5650 },
  { vehicle: "DEF-5678", value: 4890 },
  { vehicle: "GHI-9101", value: 4230 },
  { vehicle: "JKL-1122", value: 3980 },
  { vehicle: "MNO-3344", value: 3450 },
  { vehicle: "PQR-5566", value: 2890 },
];

const projectionData = [
  { month: "Mai 2024", realizado: 48350, projecao: null },
  { month: "Jun 2024", realizado: 52160, projecao: null },
  { month: "Jul 2024", realizado: null, projecao: 55890 },
  { month: "Ago 2024", realizado: null, projecao: 58420 },
];

const transactions = [
  { date: "24/05/2024", type: "Manutenção", vehicle: "ABC-1234", supplier: "Auto Peças Brasil", value: 2450, category: "Manutenção", status: "Pago" },
  { date: "23/05/2024", type: "Combustível", vehicle: "DEF-5678", supplier: "Posto Shell", value: 1280, category: "Combustível", status: "Pago" },
  { date: "22/05/2024", type: "Multa", vehicle: "GHI-9101", supplier: "DNIT", value: 880.41, category: "Multas", status: "Vencido" },
  { date: "21/05/2024", type: "Pneus", vehicle: "JKL-1122", supplier: "Pneus Store", value: 1950, category: "Pneus", status: "Pendente" },
  { date: "20/05/2024", type: "Seguro", vehicle: "MNO-3344", supplier: "Porto Seguro", value: 3200, category: "Seguro", status: "Pago" },
  { date: "19/05/2024", type: "Outros", vehicle: "PQR-5566", supplier: "Praxis Serviços", value: 650, category: "Outros", status: "Pendente" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtK = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
};

const typeIcon: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Manutenção: { icon: Wrench, color: "#3B82F6", bg: "bg-blue-100 dark:bg-blue-950" },
  Combustível: { icon: Fuel, color: "#10B981", bg: "bg-emerald-100 dark:bg-emerald-950" },
  Multa: { icon: TriangleAlert, color: "#F59E0B", bg: "bg-amber-100 dark:bg-amber-950" },
  Pneus: { icon: CircleDot, color: "#8B5CF6", bg: "bg-violet-100 dark:bg-violet-950" },
  Seguro: { icon: Shield, color: "#6366F1", bg: "bg-indigo-100 dark:bg-indigo-950" },
  Outros: { icon: Boxes, color: "#6B7280", bg: "bg-gray-100 dark:bg-gray-800" },
};

const statusCfg: Record<string, { label: string; className: string }> = {
  Pago: { label: "Pago", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0" },
  Pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0" },
  Vencido: { label: "Vencido", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-0" },
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const EvolutionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-xl p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{label} 2024</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-6 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-medium text-foreground">{fmt(entry.value)}</span>
        </div>
      ))}
      <div className="border-t border-border mt-2 pt-2 flex justify-between">
        <span className="text-muted-foreground">Total</span>
        <span className="font-bold text-foreground">
          {fmt(payload.reduce((s: number, e: any) => s + (e.value || 0), 0))}
        </span>
      </div>
    </div>
  );
};

const ProjectionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload.find((p: any) => p.value)?.value;
  const isProjection = payload[0]?.dataKey === "projecao";
  return (
    <div className="rounded-xl border border-border bg-card shadow-xl p-3 text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">{isProjection ? "Projeção" : "Realizado"}: <span className="font-bold text-foreground">{val ? fmt(val) : "—"}</span></p>
    </div>
  );
};

const CustomBarCursor = ({ x, y, width, height, isDark }: any) => {
  if (x === undefined || y === undefined || width === undefined || height === undefined) return null;
  return (
    <line
      x1={x + width / 2}
      y1={y}
      x2={x + width / 2}
      y2={y + height}
      stroke={isDark ? "#60A5FA" : "#3B82F6"}
      strokeWidth={1.5}
      strokeDasharray="3 3"
    />
  );
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  accent: string;
  sparkData: number[];
  sparkColor: string;
}

function KpiCard({ title, value, trend, icon: Icon, accent, sparkData, sparkColor }: KpiCardProps) {
  const isUp = trend > 0;
  const sparkPoints = sparkData.map((v, i) => ({ v }));
  return (
    <div className={cn(
      "relative rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 overflow-hidden",
      "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    )}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between pl-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tracking-tight">{value}</p>
          <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", isUp ? "text-red-500" : "text-emerald-500")}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend)}%</span>
            <span className="text-muted-foreground font-normal">vs mês anterior</span>
          </div>
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: `${accent}18` }}>
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
      <div className="h-10 pl-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkPoints} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`sg-${title.slice(0,3)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
              fill={`url(#sg-${title.slice(0,3)})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── CUSTOM DONUT LABEL ───────────────────────────────────────────────────────

const DonutCenter = ({ cx, cy }: any) => (
  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} dy="-8" className="text-xs" fill="#6B7280" fontSize={11}>Total</tspan>
    <tspan x={cx} dy="22" className="font-bold" fill="currentColor" fontSize={13} fontWeight={700}>R$ 284.750</tspan>
  </text>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FinancialsView() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [period, setPeriod] = useState<"Mensal" | "Trimestral" | "Anual">("Mensal");
  const [tcoTab, setTcoTab] = useState<"Semanal" | "Mensal" | "Anual">("Mensal");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = transactions.filter(t =>
    t.vehicle.toLowerCase().includes(search.toLowerCase()) ||
    t.supplier.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  const maxTco = Math.max(...tcoData.map(d => d.value));

  return (
    <div className="flex flex-col gap-6 w-full p-0">

      {/* ── TOP BAR ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-foreground font-semibold text-base lg:text-lg">Financeiro & TCO</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["Mensal", "Trimestral", "Anual"] as const).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Calendar className="h-3.5 w-3.5" />
            Mai 2024
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
        </div>
      </div>

      {/* ── SEÇÃO 1: CARTÕES DE KPI (TOPO) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Custo Total Operacional" value="R$ 284.750" trend={8.4}
          icon={DollarSign} accent="#EF4444"
          sparkData={[28, 35, 22, 42, 38, 30, 45, 28, 38, 32, 40, 35]}
          sparkColor="#EF4444"
        />
        <KpiCard
          title="TCO por Veículo/Mês" value="R$ 4.230" trend={-5.7}
          icon={Calculator} accent="#3B82F6"
          sparkData={[20, 25, 18, 30, 22, 26, 24, 28, 20, 24, 22, 26]}
          sparkColor="#3B82F6"
        />
        <KpiCard
          title="Multas & Sinistros" value="R$ 18.420" trend={24.6}
          icon={ShieldAlert} accent="#F59E0B"
          sparkData={[5, 8, 6, 12, 9, 14, 10, 16, 12, 18, 14, 20]}
          sparkColor="#F59E0B"
        />
        <KpiCard
          title="Economia Gerada" value="R$ 9.800" trend={-12.1}
          icon={TrendingUp} accent="#10B981"
          sparkData={[6, 8, 10, 7, 12, 9, 14, 11, 13, 10, 12, 14]}
          sparkColor="#10B981"
        />
      </div>

      {/* ── SEÇÃO 2: GRÁFICOS PRINCIPAIS (EVOLUÇÃO E DISTRIBUIÇÃO) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico de Linhas (Evolução de Custos) */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2 min-h-[420px] flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Evolução de Custos — 12 meses</h3>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "Manutenção", color: "#3B82F6" },
                  { label: "Combustível", color: "#10B981" },
                  { label: "Multas", color: "#F59E0B" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2 w-5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
          </div>
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272A" : "#F4F4F5"} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip content={<EvolutionTooltip />} cursor={{ stroke: isDark ? "#3F3F46" : "#E4E4E7", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="manutencao" name="Manutenção" stroke="#3B82F6" strokeWidth={2}
                  fill="url(#gradM)" dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="combustivel" name="Combustível" stroke="#10B981" strokeWidth={2}
                  fill="url(#gradC)" dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="multas" name="Multas" stroke="#F59E0B" strokeWidth={2}
                  fill="url(#gradMu)" dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Distribuição + Alertas */}
        <div className="flex flex-col gap-6 lg:col-span-1 min-h-[420px] justify-between">
          {/* Donut */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col flex-1 justify-between min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Distribuição de Custos</h3>
              <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
            </div>
            <div className="h-[130px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                    paddingAngle={2} dataKey="value" labelLine={false}>
                    {distributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <DonutCenter cx="50%" cy="50%" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
              {distributionData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] text-muted-foreground">{d.name}</span>
                  <span className="text-[10px] font-semibold text-foreground ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between min-h-[176px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Alertas Financeiros</h3>
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-tight">3 boletos vencidos</p>
                  <p className="text-[10px] text-muted-foreground">Total em aberto: R$ 4.250,00</p>
                </div>
                <Badge className="text-[9px] bg-red-500 text-white border-0 shrink-0 px-1.5 py-0.5">Crítico</Badge>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-tight">Revisão de 2 veículos próxima</p>
                  <p className="text-[10px] text-muted-foreground">Vencimento em até 7 dias</p>
                </div>
                <Badge className="text-[9px] bg-amber-500 text-white border-0 shrink-0 px-1.5 py-0.5">Atenção</Badge>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-tight">Economia acima da meta</p>
                  <p className="text-[10px] text-muted-foreground">Você economizou R$ 9.800,00</p>
                </div>
                <Badge className="text-[9px] bg-emerald-500 text-white border-0 shrink-0 px-1.5 py-0.5">Bom</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO 3: TCO E PROJEÇÕES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* TCO por Veículo */}
        <div className="rounded-2xl border border-border bg-card p-5 min-h-[380px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">TCO por Veículo</h3>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["Semanal", "Mensal", "Anual"] as const).map(t => (
                  <button key={t}
                    onClick={() => setTcoTab(t)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-medium transition-colors",
                      tcoTab === t
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}>
                    {t}
                  </button>
                ))}
              </div>
              <button className="text-muted-foreground hover:text-foreground ml-1"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex flex-col gap-3 justify-center flex-1">
            {tcoData.map(d => (
              <div key={d.vehicle} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{d.vehicle}</span>
                <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(d.value / maxTco) * 100}%`,
                      background: "linear-gradient(90deg, #3B82F6, #60A5FA)"
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-16 text-right shrink-0">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border shrink-0">
            <span className="text-[10px] text-muted-foreground">R$ 0</span>
            <span className="text-[10px] text-muted-foreground">R$ 2k</span>
            <span className="text-[10px] text-muted-foreground">R$ 4k</span>
            <span className="text-[10px] text-muted-foreground">R$ 6k</span>
          </div>
        </div>

        {/* Projeção de Gastos */}
        <div className="rounded-2xl border border-border bg-card p-5 min-h-[380px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Projeção de Gastos — Próximos 3 meses</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-4 rounded-sm bg-blue-500" />Realizado
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-2 w-4 rounded-sm border-2 border-dashed border-blue-400 bg-blue-200/50" />Projeção
              </span>
              <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="h-[240px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionData} margin={{ top: 16, right: 10, bottom: 0, left: -20 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272A" : "#F4F4F5"} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 9, fill: "#71717A" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ProjectionTooltip />} cursor={<CustomBarCursor isDark={isDark} />} />
                <Bar dataKey="realizado" name="Realizado" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {projectionData.map((entry, i) => (
                    <Cell key={i} fill={entry.realizado ? "#3B82F6" : "transparent"} />
                  ))}
                </Bar>
                <Bar dataKey="projecao" name="Projeção" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {projectionData.map((entry, i) => (
                    <Cell key={i}
                      fill={entry.projecao ? (isDark ? "rgba(96,165,250,0.25)" : "rgba(59,130,246,0.15)") : "transparent"}
                      stroke={entry.projecao ? "#60A5FA" : "transparent"}
                      strokeWidth={entry.projecao ? 2 : 0}
                      strokeDasharray={entry.projecao ? "4 2" : "0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── TRANSACTIONS TABLE ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Lançamentos Financeiros</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar lançamento..."
                className="pl-8 h-8 text-xs w-44 lg:w-56"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filtrar</span>
            </Button>
            <Button size="sm" className="h-8 px-3 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        {/* Table desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Data", "Tipo", "Veículo", "Fornecedor", "Valor", "Categoria", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const cfg = typeIcon[tx.type] ?? typeIcon.Outros;
                const TxIcon = cfg.icon;
                return (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                          <TxIcon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                        </div>
                        <span className="font-medium text-foreground">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">{tx.vehicle}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.supplier}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{fmt(tx.value)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: distributionData.find(d => d.name === tx.category)?.color ?? "#6B7280" }} />
                        <span className="text-muted-foreground">{tx.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] font-medium", statusCfg[tx.status]?.className)}>
                        {statusCfg[tx.status]?.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table mobile (card list) */}
        <div className="sm:hidden divide-y divide-border">
          {filtered.map((tx, i) => {
            const cfg = typeIcon[tx.type] ?? typeIcon.Outros;
            const TxIcon = cfg.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                  <TxIcon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.vehicle} · {tx.date}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">{fmt(tx.value)}</span>
                  <Badge className={cn("text-[10px]", statusCfg[tx.status]?.className)}>{statusCfg[tx.status]?.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Mostrando 1 a {filtered.length} de 48 resultados
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {[1, 2, 3].map(n => (
              <button key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                  page === n
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-muted"
                )}>
                {n}
              </button>
            ))}
            <span className="text-muted-foreground text-xs px-1">...</span>
            <button
              onClick={() => setPage(8)}
              className={cn(
                "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                page === 8
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              )}>
              8
            </button>
            <button
              onClick={() => setPage(p => Math.min(8, p + 1))}
              disabled={page === 8}
              className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── FLOATING ACTION BUTTON ── */}
      <button
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        title="Novo Lançamento"
      >
        <Plus className="h-6 w-6" />
      </button>
      <div className="fixed bottom-6 right-20 z-50 hidden group-hover:flex items-center">
        <span className="bg-foreground text-background text-xs font-medium rounded-lg px-2 py-1 shadow">Novo Lançamento</span>
      </div>
    </div>
  );
}
