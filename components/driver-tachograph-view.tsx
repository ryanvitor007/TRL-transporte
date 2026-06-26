"use client";

import type React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  formatDistanceToNow,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Gauge,
  CheckCircle,
  Plus,
  Camera,
  Send,
  ChevronRight,
  RefreshCw,
  WifiOff,
  Route,
  Zap,
  Filter,
  Eye,
  Pencil,
  Download,
  Bell,
  FileText,
  Fuel,
  AlertCircle,
  Headphones,
  Gauge as GaugeIcon,
  Truck,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { buscarFrotaAPI } from "@/lib/api-service";

// ─── INTERFACES ────────────────────────────────────────────────
interface TachographRecord {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  kmStart: number;
  kmEnd: number;
  kmDriven: number;
  maxSpeed: number;
  readingType: "Diário" | "Semanal" | "Mensal";
  hasInfraction: boolean;
  infractionType?: "excesso_horas" | "excesso_velocidade" | "descanso_insuficiente";
  status: "Sincronizado" | "Pendente" | "Atenção";
}

// ─── STATUS CONFIG ──────────────────────────────────────────────
const statusConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  Sincronizado: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", label: "Sincronizado" },
  Pendente:     { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",   dot: "bg-amber-500",   label: "Pendente" },
  Atenção:      { color: "text-red-700",     bg: "bg-red-50 border-red-200",       dot: "bg-red-500",     label: "Atenção" },
};

// ─── MOCK VEHICLES ──────────────────────────────────────────────
const mockVehicles = [
  { id: "v1", plate: "ABC-1234", model: "Volvo FH 540", km_atual: 125430 },
  { id: "v2", plate: "DEF-5678", model: "Scania R450",  km_atual: 124968 },
  { id: "v3", plate: "GHI-9012", model: "Mercedes Actros", km_atual: 98210 },
];

// ─── MOCK RECORDS ───────────────────────────────────────────────
const generateMockRecords = (driverId: string, driverName: string): TachographRecord[] => {
  const today = new Date();
  const vehicles = [
    { id: "v1", plate: "ABC-1234", model: "Volvo FH 540" },
    { id: "v2", plate: "DEF-5678", model: "Scania R450" },
  ];
  const records: TachographRecord[] = [];

  for (let i = 1; i <= 15; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    if (i === 4 || i === 9) continue;
    const infraction = Math.random() < 0.12;
    const kmStart = 124000 + i * 300 + Math.floor(Math.random() * 50);
    const kmEnd = kmStart + Math.floor(350 + Math.random() * 200);
    const hours = Number((5.5 + Math.random() * 4).toFixed(1));
    const veh = vehicles[i % 2];
    const infractionType = infraction
      ? (["excesso_horas","excesso_velocidade","descanso_insuficiente"] as const)[Math.floor(Math.random()*3)]
      : undefined;
    records.push({
      id: `tr-${dateStr}-${i}`,
      date: dateStr,
      driverId,
      driverName,
      vehicleId: veh.id,
      vehiclePlate: veh.plate,
      vehicleModel: veh.model,
      startTime: `0${6 + (i % 2)}:00`,
      endTime: `${13 + (i % 4)}:${i % 6 === 0 ? "00" : "30"}`,
      totalHours: hours,
      kmStart,
      kmEnd,
      kmDriven: kmEnd - kmStart,
      maxSpeed: Math.floor(75 + Math.random() * 20),
      readingType: i % 7 === 0 ? "Semanal" : "Diário",
      hasInfraction: infraction,
      infractionType,
      status: infraction ? "Atenção" : i % 5 === 0 ? "Pendente" : "Sincronizado",
    });
  }
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ─── TREND DATA ─────────────────────────────────────────────────
const generateTrend = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return {
      day: format(d, "EEE", { locale: ptBR }),
      horas: Number((4 + Math.random() * 5).toFixed(1)),
      km: Math.floor(200 + Math.random() * 300),
    };
  });
};

// ─── DONUT DATA ─────────────────────────────────────────────────
const pieData = [
  { name: "Conformes", value: 17, color: "#10b981" },
  { name: "Pendentes", value: 2,  color: "#f59e0b" },
  { name: "Não conformes", value: 1, color: "#ef4444" },
];

// ─── SKELETONS ──────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─── ERROR / EMPTY ───────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <WifiOff className="h-8 w-8 text-red-400" />
      </div>
      <p className="font-semibold text-gray-800">Sem conexão</p>
      <p className="mt-1 text-sm text-gray-500">Não foi possível carregar os dados.</p>
      <Button onClick={onRetry} className="mt-6 gap-2 bg-[#1E4ED8] hover:bg-[#1a43c0]">
        <RefreshCw className="h-4 w-4" /> Tentar novamente
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <GaugeIcon className="h-8 w-8 text-[#1E4ED8]" />
      </div>
      <p className="font-semibold text-gray-800">Nenhum registro encontrado</p>
      <p className="mt-1 text-sm text-gray-500">Registre sua primeira leitura de tacógrafo.</p>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export function DriverTachographView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";
  const driverId   = user?.id   || "d1";

  const [isLoading, setIsLoading]             = useState(true);
  const [hasError, setHasError]               = useState(false);
  const [records, setRecords]                 = useState<TachographRecord[]>([]);
  const [vehicles, setVehicles]               = useState<any[]>([]);
  const [trendData]                           = useState(generateTrend);
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen]     = useState(false);
  const [selectedRecord, setSelectedRecord]   = useState<TachographRecord | null>(null);
  const [dateFilter, setDateFilter]           = useState({ start: "", end: "" });
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [uploadedPhoto, setUploadedPhoto]     = useState<string | null>(null);
  const [newRecord, setNewRecord]             = useState({
    vehicleId: "", date: format(new Date(), "yyyy-MM-dd"),
    startTime: "", endTime: "", kmStart: "", kmEnd: "",
    readingType: "Diário", notes: "",
  });

  // Veículos unificados (API + fallback mock)
  const displayVehicles = useMemo(() => {
    if (vehicles.length > 0) {
      return vehicles.map(v => ({
        id: String(v.id), plate: v.placa || v.plate,
        model: v.modelo || v.model, km_atual: v.km_atual ?? 0,
      }));
    }
    return mockVehicles;
  }, [vehicles]);

  // Auto-fill KM Inicial
  useEffect(() => {
    if (!newRecord.vehicleId) return;
    const v = displayVehicles.find(v => String(v.id) === String(newRecord.vehicleId));
    if (v) setNewRecord(p => ({ ...p, kmStart: String(v.km_atual) }));
  }, [newRecord.vehicleId, displayVehicles]);

  const kmStartNum   = Number(newRecord.kmStart) || 0;
  const kmEndNum     = Number(newRecord.kmEnd)   || 0;
  const kmPercorrido = kmEndNum > kmStartNum ? kmEndNum - kmStartNum : 0;
  const isKmInvalid  = kmEndNum > 0 && kmEndNum < kmStartNum;

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [frota] = await Promise.all([
        buscarFrotaAPI(),
        new Promise(r => setTimeout(r, 900)),
      ]);
      setVehicles(Array.isArray(frota) ? frota : []);
      setRecords(generateMockRecords(driverId, driverName));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [driverId, driverName]);

  useEffect(() => { loadData(); }, [loadData]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let list = [...records];
    if (dateFilter.start) list = list.filter(r => new Date(r.date) >= startOfDay(new Date(dateFilter.start)));
    if (dateFilter.end)   list = list.filter(r => new Date(r.date) <= endOfDay(new Date(dateFilter.end)));
    return list;
  }, [records, dateFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayRecs = records.filter(r => r.date === today);
    const totalH = filteredRecords.reduce((a, r) => a + r.totalHours, 0);
    const pending = records.filter(r => r.status === "Pendente" || r.status === "Atenção").length;
    const activeVehicles = new Set(filteredRecords.map(r => r.vehicleId)).size;
    return {
      todayCount: todayRecs.length,
      totalHours: totalH > 0 ? `${Math.floor(totalH / filteredRecords.length)}:${String(Math.round((totalH / filteredRecords.length % 1) * 60)).padStart(2,"0")}` : "0:00",
      pending,
      activeVehicles,
    };
  }, [records, filteredRecords]);

  // Submit
  const handleSubmit = async () => {
    if (!newRecord.vehicleId || !newRecord.startTime || !newRecord.endTime || !newRecord.kmEnd || isKmInvalid) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setIsNewRecordOpen(false);
    setNewRecord({ vehicleId:"", date: format(new Date(),"yyyy-MM-dd"), startTime:"", endTime:"", kmStart:"", kmEnd:"", readingType:"Diário", notes:"" });
    setUploadedPhoto(null);
    loadData();
  };

  const getInfractionLabel = (type?: TachographRecord["infractionType"]) => {
    const map = { excesso_horas:"Excesso de horas", excesso_velocidade:"Excesso de velocidade", descanso_insuficiente:"Descanso insuficiente" };
    return type ? map[type] : "-";
  };

  const nowFmt = format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR });
  const dayFmt = format(new Date(), "EEEE", { locale: ptBR });

  // ─── BAR DATA (records por veículo) ───────────────────────────
  const vehicleBarData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach(r => { map[r.vehiclePlate] = (map[r.vehiclePlate] || 0) + 1; });
    return Object.entries(map).map(([plate, count]) => ({ plate, count }));
  }, [filteredRecords]);

  return (
    <div className="min-h-screen space-y-6 bg-[#F4F6FB] p-4 md:p-6">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F4D] md:text-3xl">
            Olá, {driverName.split(" ")[0]}! 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Bem-vindo ao painel do motorista
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Notificações"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF7A00] text-[9px] font-bold text-white">3</span>
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="text-right">
              <p className="text-xs font-semibold capitalize text-[#0B1F4D]">{nowFmt}</p>
              <p className="text-[10px] capitalize text-gray-400">{dayFmt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: FileText,   label: "Documentos",    sub: "CNH, CRLV, Seguro",      color: "bg-[#1E4ED8]", hover: "hover:bg-[#1a43c0]" },
          { icon: Fuel,       label: "Abastecimentos", sub: "Últimos registros",      color: "bg-[#FF7A00]", hover: "hover:bg-orange-600" },
          { icon: AlertCircle,label: "Pendências",     sub: `${kpis.pending} itens`,  color: "bg-[#7C3AED]", hover: "hover:bg-purple-700", badge: kpis.pending > 0 ? kpis.pending : undefined },
          { icon: Headphones, label: "Suporte",        sub: "Fale com a equipe",      color: "bg-[#059669]", hover: "hover:bg-emerald-700" },
        ].map(({ icon: Icon, label, sub, color, hover, badge }) => (
          <button
            key={label}
            aria-label={label}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl p-4 text-left shadow-sm transition-all active:scale-95",
              color, hover
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="truncate text-[11px] text-white/70">{sub}</p>
            </div>
            {badge !== undefined && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">{badge}</span>
            )}
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-white/60 transition group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* ── KPIs + NOVO REGISTRO ────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">
        {/* KPIs – 4 colunas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:col-span-4">
          {isLoading ? (
            <>
              <KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton />
            </>
          ) : (
            <>
              {/* Registros Hoje */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E3A6E]">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">Registros hoje</p>
                  <p className="text-2xl font-extrabold text-[#0B1F4D] leading-none">{kpis.todayCount}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">registros realizados</p>
                </div>
              </div>
              {/* Horas Dirigidas */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF7A00]">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">Horas dirigidas hoje</p>
                  <p className="text-2xl font-extrabold text-[#0B1F4D] leading-none">{kpis.totalHours}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">h:min</p>
                </div>
              </div>
              {/* Inspeções Pendentes */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#059669]">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">Inspeções pendentes</p>
                  <p className="text-2xl font-extrabold text-[#0B1F4D] leading-none">{kpis.pending}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">inspeções</p>
                </div>
              </div>
              {/* Veículos em Operação */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">Veículos em operação</p>
                  <p className="text-2xl font-extrabold text-[#0B1F4D] leading-none">{kpis.activeVehicles}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">veículos</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão Novo Registro */}
        <div className="xl:col-span-1">
          <button
            onClick={() => setIsNewRecordOpen(true)}
            className="group flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#0B1F4D] px-4 py-4 text-center shadow-lg transition-all hover:bg-[#0d2460] active:scale-95"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1E4ED8] shadow-lg transition group-hover:scale-105">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold text-white leading-snug text-sm">Novo Registro de Tacógrafo</p>
          </button>
        </div>
      </div>

      {/* ── GRÁFICOS ────────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#1E4ED8]" />
          <h2 className="text-base font-bold text-[#0B1F4D] md:text-lg">Desempenho e indicadores</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Evolução horas */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[#0B1F4D]">Evolução das horas dirigidas</p>
            <p className="mb-3 text-xs text-gray-400">Últimos 7 dias</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1E4ED8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1E4ED8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e5e7eb" }}
                    formatter={(v: number) => [`${v}h`, "Horas"]}
                  />
                  <Area type="monotone" dataKey="horas" stroke="#1E4ED8" strokeWidth={2.5} fill="url(#gradH)" dot={{ fill: "#1E4ED8", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Registros por veículo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[#0B1F4D]">Registros por veículo</p>
            <p className="mb-3 text-xs text-gray-400">Período filtrado</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleBarData.length ? vehicleBarData : [{plate:"ABC-1234",count:7},{plate:"DEF-5678",count:5}]} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="plate" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="count" name="Registros" fill="#1E4ED8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conformidade */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-1 text-sm font-semibold text-[#0B1F4D]">Conformidade das inspeções</p>
            <p className="mb-3 text-xs text-gray-400">Total: 20 registros</p>
            <div className="flex items-center gap-4">
              <div className="relative h-[120px] w-[120px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-[#0B1F4D]">85%</span>
                  <span className="text-[9px] text-gray-400">Conformidade</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {pieData.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-gray-600">{p.name}</span>
                    <span className="ml-auto font-semibold text-[#0B1F4D]">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABELA DE REGISTROS ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header tabela */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#1E4ED8]" />
            <div>
              <p className="font-bold text-[#0B1F4D]">Inserções anteriores</p>
              <p className="text-xs text-gray-400">{filteredRecords.length} leitura(s) encontrada(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date" value={dateFilter.start} aria-label="Data inicial"
              onChange={e => setDateFilter(p => ({ ...p, start: e.target.value }))}
              className="h-9 w-36 rounded-xl border-gray-200 text-xs"
            />
            <span className="text-gray-400 text-xs">até</span>
            <Input
              type="date" value={dateFilter.end} aria-label="Data final"
              onChange={e => setDateFilter(p => ({ ...p, end: e.target.value }))}
              className="h-9 w-36 rounded-xl border-gray-200 text-xs"
            />
            {(dateFilter.start || dateFilter.end) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => setDateFilter({ start: "", end: "" })}
                className="h-9 text-xs text-red-500 hover:text-red-600"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {["Data/Hora","Veículo","KM Inicial","KM Final","Tempo Total","Tipo de Leitura","Status","Ações"].map(h => (
                  <th key={h} className="px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({length:4}).map((_,i) => (
                  <tr key={i}>
                    {Array.from({length:8}).map((_,j) => (
                      <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : hasError ? (
                <tr><td colSpan={8}><ErrorState onRetry={loadData} /></td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={8}><EmptyState /></td></tr>
              ) : (
                filteredRecords.map(record => {
                  const sc = statusConfig[record.status] || statusConfig.Sincronizado;
                  return (
                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-[#0B1F4D]">{format(new Date(record.date),"dd/MM/yyyy")}</p>
                          <p className="text-xs text-gray-400">{record.startTime}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <Truck className="h-3.5 w-3.5 text-[#1E4ED8]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#0B1F4D]">{record.vehiclePlate}</p>
                            <p className="text-xs text-gray-400">{record.vehicleModel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-gray-700">{record.kmStart.toLocaleString("pt-BR")} km</td>
                      <td className="px-5 py-4 font-mono text-sm text-gray-700">{record.kmEnd.toLocaleString("pt-BR")} km</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-[#FF7A00]" />
                          {record.totalHours.toFixed(1)}h
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{record.readingType}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", sc.bg, sc.color)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            aria-label="Visualizar"
                            onClick={() => { setSelectedRecord(record); setIsDetailsOpen(true); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-[#1E4ED8]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Editar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            aria-label="Exportar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile – feed cards */}
        <div className="divide-y divide-gray-100 md:hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({length:3}).map((_,i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-full" /></div>
                </div>
              ))}
            </div>
          ) : hasError ? <ErrorState onRetry={loadData} />
          : filteredRecords.length === 0 ? <EmptyState />
          : filteredRecords.map(record => {
            const sc = statusConfig[record.status] || statusConfig.Sincronizado;
            return (
              <button
                key={record.id}
                onClick={() => { setSelectedRecord(record); setIsDetailsOpen(true); }}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-blue-50/30 active:bg-blue-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <Truck className="h-5 w-5 text-[#1E4ED8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#0B1F4D] text-sm">{record.vehiclePlate}</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", sc.bg, sc.color)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full",sc.dot)} />{sc.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>{format(new Date(record.date),"dd/MM/yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{record.totalHours}h</span>
                    <span className="flex items-center gap-1"><Route className="h-3 w-3"/>{record.kmDriven} km</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 mt-1" />
              </button>
            );
          })}
        </div>

        {/* Footer - Ver tudo */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-center border-t border-gray-100 px-5 py-3">
            <button className="flex items-center gap-1 text-sm font-semibold text-[#1E4ED8] transition hover:text-[#0B1F4D]">
              Ver todas as inserções <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: NOVO REGISTRO ────────────────────────────────── */}
      <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-hidden flex flex-col rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-gray-100 pb-4">
            <DialogTitle className="text-[#0B1F4D]">Novo registro de tacógrafo (papel)</DialogTitle>
            <DialogDescription className="text-xs text-gray-400">Preencha os dados da sua jornada de hoje</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              {/* Dados do veículo */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Dados do veículo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Veículo *</Label>
                    <Select value={newRecord.vehicleId} onValueChange={v => setNewRecord(p => ({...p, vehicleId: v}))}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayVehicles.map(v => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.plate} – {v.model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados da leitura */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Dados da leitura</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 space-y-1.5 sm:col-span-1">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Data da leitura *</Label>
                    <Input type="date" className="h-11 rounded-xl" value={newRecord.date}
                      onChange={e => setNewRecord(p => ({...p, date: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Hora inicial *</Label>
                    <Input type="time" className="h-11 rounded-xl" value={newRecord.startTime}
                      onChange={e => setNewRecord(p => ({...p, startTime: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Hora final *</Label>
                    <Input type="time" className="h-11 rounded-xl" value={newRecord.endTime}
                      onChange={e => setNewRecord(p => ({...p, endTime: e.target.value}))} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Quilometragem inicial *</Label>
                    <Input type="number" placeholder="000000" className="h-11 rounded-xl font-mono" value={newRecord.kmStart}
                      onChange={e => setNewRecord(p => ({...p, kmStart: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Quilometragem final *</Label>
                    <Input type="number" placeholder="000000" className={cn("h-11 rounded-xl font-mono", isKmInvalid && "border-red-400")} value={newRecord.kmEnd}
                      onChange={e => setNewRecord(p => ({...p, kmEnd: e.target.value}))} />
                  </div>
                </div>
                {newRecord.kmEnd && !isKmInvalid && kmPercorrido > 0 && (
                  <p className="mt-1.5 text-xs font-medium text-emerald-600">🛣️ Distância percorrida: {kmPercorrido.toLocaleString("pt-BR")} km</p>
                )}
                {isKmInvalid && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">⚠ KM final não pode ser menor que o KM inicial.</p>
                )}
              </div>

              {/* Dados do disco */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Dados do disco</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Número do disco (opcional)</Label>
                    <Input placeholder="Ex: 125678" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#0B1F4D]">Foto do disco (obrigatório)</Label>
                    <div className="relative">
                      <input
                        type="file" accept="image/*" capture="environment" aria-label="Foto do disco"
                        onChange={e => setUploadedPhoto(e.target.files?.[0]?.name || null)}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      />
                      <div className={cn("flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-dashed text-xs transition",
                        uploadedPhoto ? "border-[#1E4ED8] bg-blue-50 text-[#1E4ED8]" : "border-gray-200 text-gray-400 hover:border-[#1E4ED8]"
                      )}>
                        <Camera className="h-4 w-4" />
                        <span className="truncate">{uploadedPhoto || "Clique para enviar"}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">JPG, PNG ou PDF (máx. 10MB)</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#0B1F4D]">Observações (opcional)</Label>
                <textarea
                  placeholder="Adicione observações sobre a leitura..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#1E4ED8] focus:ring-1 focus:ring-[#1E4ED8]/20"
                  rows={3}
                  value={newRecord.notes}
                  onChange={e => setNewRecord(p => ({...p, notes: e.target.value}))}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="shrink-0 gap-2 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setIsNewRecordOpen(false)} className="flex-1 rounded-xl sm:flex-none">Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!newRecord.vehicleId || !newRecord.startTime || !newRecord.endTime || !newRecord.kmEnd || isKmInvalid || isSubmitting}
              className="flex-1 rounded-xl bg-[#0B1F4D] hover:bg-[#0d2460] sm:flex-none active:scale-95 transition-transform"
            >
              {isSubmitting ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Salvar registro</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: DETALHES ─────────────────────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[92vh] max-w-md overflow-hidden flex flex-col rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-gray-100 pb-4">
            <DialogTitle className="text-[#0B1F4D]">Detalhes do Registro</DialogTitle>
            <DialogDescription className="sr-only">Detalhes completos do registro selecionado</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {(() => { const sc = statusConfig[selectedRecord.status] || statusConfig.Sincronizado; return (
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", sc.bg, sc.color)}>
                      <span className={cn("h-2 w-2 rounded-full", sc.dot)} />{sc.label}
                    </span>
                  );})()}
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-xs font-semibold text-[#0B1F4D]">
                    {selectedRecord.vehiclePlate}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{selectedRecord.readingType}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Data</p>
                    <p className="mt-0.5 font-semibold text-[#0B1F4D]">{format(new Date(selectedRecord.date),"dd/MM/yyyy")}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">Horário</p>
                    <p className="mt-0.5 font-semibold text-[#0B1F4D]">{selectedRecord.startTime} – {selectedRecord.endTime}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Clock, label: "Horas", value: `${selectedRecord.totalHours}h`, color: "text-[#FF7A00]", bg: "bg-orange-50" },
                    { icon: Route, label: "KM Rodados", value: `${selectedRecord.kmDriven} km`, color: "text-[#1E4ED8]", bg: "bg-blue-50" },
                    { icon: Zap, label: "Vel. Máx.", value: `${selectedRecord.maxSpeed} km/h`, color: "text-purple-600", bg: "bg-purple-50" },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className={cn("flex flex-col items-center gap-1 rounded-xl p-3 text-center", bg)}>
                      <Icon className={cn("h-5 w-5", color)} />
                      <p className="text-base font-bold text-[#0B1F4D]">{value}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3">
                  <div><p className="text-[10px] text-gray-400">KM Inicial</p><p className="font-mono font-semibold text-[#0B1F4D]">{selectedRecord.kmStart.toLocaleString("pt-BR")} km</p></div>
                  <div><p className="text-[10px] text-gray-400">KM Final</p><p className="font-mono font-semibold text-[#0B1F4D]">{selectedRecord.kmEnd.toLocaleString("pt-BR")} km</p></div>
                </div>
                {selectedRecord.hasInfraction && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                    <AlertOctagon className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Infração Registrada</p>
                      <p className="text-sm text-red-600 mt-0.5">{getInfractionLabel(selectedRecord.infractionType)}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="shrink-0 border-t border-gray-100 pt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="w-full rounded-xl">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
