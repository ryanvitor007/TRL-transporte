"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Gauge,
  Route,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Truck,
  Calendar,
  Fuel,
  AlertCircle,
  CheckCheck,
  ClipboardList,
  Loader2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChecklistData {
  items?: Record<string, boolean>;
  notes?: string;
}

interface Incident {
  id: number;
  type: string;
  status: string;
  description?: string;
  date?: string;
}

interface JourneyHistoryEntry {
  id: number;
  driver_id: number;
  vehicle_id: number;
  start_time: string;
  end_time?: string | null;
  start_location?: string;
  end_location?: string;
  start_odometer?: number;
  end_odometer?: number;
  status: string;
  block_reason?: string | null;
  admin_notes?: string | null;
  vehicle?: {
    id: number;
    placa: string;
    modelo: string;
    marca: string;
  };
  checklist?: ChecklistData[];
  incidents?: Incident[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchDriverHistory(driverId: number): Promise<JourneyHistoryEntry[]> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("trl_auth_token") : null;
  const res = await fetch(`${API_BASE_URL}/journeys/driver/${driverId}/history`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
}

function getStatusMeta(status: string) {
  switch (status) {
    case "active":
      return {
        label: "Em Andamento",
        borderColor: "border-l-green-500",
        badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
        icon: Activity,
        iconColor: "text-green-500",
      };
    case "finished":
      return {
        label: "Finalizada",
        borderColor: "border-l-blue-500",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
        icon: CheckCircle2,
        iconColor: "text-blue-500",
      };
    case "cancelled":
      return {
        label: "Cancelada",
        borderColor: "border-l-red-500",
        badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
        icon: XCircle,
        iconColor: "text-red-500",
      };
    case "pending_approval":
      return {
        label: "Aguard. Aprovação",
        borderColor: "border-l-amber-500",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        icon: AlertTriangle,
        iconColor: "text-amber-500",
      };
    case "resting":
      return {
        label: "Em Descanso",
        borderColor: "border-l-amber-400",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        icon: Clock,
        iconColor: "text-amber-400",
      };
    case "meal":
      return {
        label: "Em Refeição",
        borderColor: "border-l-amber-400",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
        icon: Clock,
        iconColor: "text-amber-400",
      };
    default:
      return {
        label: status,
        borderColor: "border-l-muted",
        badgeClass: "bg-muted text-muted-foreground",
        icon: Clock,
        iconColor: "text-muted-foreground",
      };
  }
}

function getChecklistStatus(checklist: ChecklistData[] | undefined) {
  if (!checklist || checklist.length === 0) return "no_data";
  const allItems = checklist.flatMap((c) =>
    c.items ? Object.values(c.items) : []
  );
  if (allItems.length === 0) return "no_data";
  const hasFailure = allItems.some((v) => v === false);
  return hasFailure ? "failed" : "passed";
}

function calcDistance(entry: JourneyHistoryEntry): number | null {
  if (
    entry.start_odometer != null &&
    entry.end_odometer != null &&
    entry.end_odometer > entry.start_odometer
  ) {
    return entry.end_odometer - entry.start_odometer;
  }
  return null;
}

function calcDuration(entry: JourneyHistoryEntry): string | null {
  if (!entry.start_time) return null;
  const start = parseISO(entry.start_time);
  const end = entry.end_time ? parseISO(entry.end_time) : new Date();
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return null;
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}min`;
  return `${mins}min`;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/60 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-5">
        <Route className="h-9 w-9 text-muted-foreground/60" />
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-lg">Nenhuma viagem ainda</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Seu histórico de jornadas aparecerá aqui assim que você iniciar sua primeira viagem.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-5">
        <WifiOff className="h-9 w-9 text-muted-foreground/60" />
      </div>
      <h3 className="font-semibold text-foreground mb-2 text-lg">Sem conexão</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Não foi possível carregar o histórico. Verifique sua conexão e tente novamente.
      </p>
      <Button onClick={onRetry} className="gap-2 h-11 px-6">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────

function JourneyDetailModal({
  journey,
  open,
  onClose,
}: {
  journey: JourneyHistoryEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!journey) return null;

  const statusMeta = getStatusMeta(journey.status);
  const checklistStatus = getChecklistStatus(journey.checklist);
  const distance = calcDistance(journey);
  const duration = calcDuration(journey);
  const StatusIcon = statusMeta.icon;

  const failedItems = journey.checklist?.flatMap((c) =>
    c.items
      ? Object.entries(c.items)
          .filter(([, v]) => v === false)
          .map(([k]) => k)
      : []
  ) ?? [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Truck className="h-5 w-5 text-primary" />
            {journey.vehicle
              ? `${journey.vehicle.placa} — ${journey.vehicle.marca} ${journey.vehicle.modelo}`
              : `Jornada #${journey.id}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes completos da jornada
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={cn("gap-1.5 text-xs font-medium", statusMeta.badgeClass)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusMeta.label}
              </Badge>
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Início
                </p>
                <p className="text-sm font-medium">
                  {format(parseISO(journey.start_time), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {journey.end_time && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Encerramento
                  </p>
                  <p className="text-sm font-medium">
                    {format(parseISO(journey.end_time), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {/* Duration + Distance */}
            <div className="grid grid-cols-2 gap-3">
              {duration && (
                <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Duração
                  </p>
                  <p className="text-sm font-semibold">{duration}</p>
                </div>
              )}
              {distance != null && (
                <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Route className="h-3.5 w-3.5" /> Distância
                  </p>
                  <p className="text-sm font-semibold">{distance.toLocaleString("pt-BR")} km</p>
                </div>
              )}
            </div>

            {/* Odometer */}
            {(journey.start_odometer != null || journey.end_odometer != null) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" /> Hodômetro
                </p>
                <div className="flex items-center gap-3 text-sm">
                  {journey.start_odometer != null && (
                    <span className="text-muted-foreground">
                      Saída: <span className="font-medium text-foreground">{journey.start_odometer.toLocaleString("pt-BR")} km</span>
                    </span>
                  )}
                  {journey.start_odometer != null && journey.end_odometer != null && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  {journey.end_odometer != null && (
                    <span className="text-muted-foreground">
                      Chegada: <span className="font-medium text-foreground">{journey.end_odometer.toLocaleString("pt-BR")} km</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Locations */}
            {(journey.start_location || journey.end_location) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Localização
                </p>
                <div className="text-sm space-y-1">
                  {journey.start_location && (
                    <p className="text-muted-foreground">
                      Origem: <span className="text-foreground">{journey.start_location}</span>
                    </p>
                  )}
                  {journey.end_location && (
                    <p className="text-muted-foreground">
                      Destino: <span className="text-foreground">{journey.end_location}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Checklist
              </p>
              {checklistStatus === "no_data" && (
                <p className="text-sm text-muted-foreground">Sem dados de vistoria.</p>
              )}
              {checklistStatus === "passed" && (
                <Badge className="gap-1.5 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Vistoria aprovada
                </Badge>
              )}
              {checklistStatus === "failed" && (
                <div className="space-y-2">
                  <Badge className="gap-1.5 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Itens reprovados
                  </Badge>
                  {failedItems.length > 0 && (
                    <ul className="text-sm text-muted-foreground space-y-1 ml-1">
                      {failedItems.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Incidents */}
            {journey.incidents && journey.incidents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Incidentes
                </p>
                <div className="space-y-2">
                  {journey.incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{inc.type}</span>
                        <Badge variant="outline" className="text-xs">
                          {inc.status}
                        </Badge>
                      </div>
                      {inc.description && (
                        <p className="text-muted-foreground mt-1 text-xs line-clamp-2">
                          {inc.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Block reason */}
            {journey.block_reason && (
              <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-4 py-3 space-y-1">
                <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Motivo do bloqueio
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {(() => {
                    try {
                      const parsed = JSON.parse(journey.block_reason);
                      return parsed.failedItems?.join(", ") || journey.block_reason;
                    } catch {
                      return journey.block_reason;
                    }
                  })()}
                </p>
              </div>
            )}

            {/* Admin notes */}
            {journey.admin_notes && (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 space-y-1">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Notas do administrador
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{journey.admin_notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border p-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Journey Card
// ─────────────────────────────────────────────

function JourneyCard({
  entry,
  onClick,
}: {
  entry: JourneyHistoryEntry;
  onClick: () => void;
}) {
  const isActive = entry.status === "active";
  const statusMeta = getStatusMeta(entry.status);
  const checklistStatus = getChecklistStatus(entry.checklist);
  const distance = calcDistance(entry);
  const StatusIcon = statusMeta.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl border border-border/60 border-l-4 bg-card",
        "hover:shadow-md hover:bg-accent/30 active:scale-[0.99]",
        "transition-all duration-200 overflow-hidden",
        statusMeta.borderColor
      )}
    >
      {/* Active pulse indicator */}
      {isActive && (
        <span className="absolute top-3 right-3 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 pr-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Vehicle icon */}
            <div
              className={cn(
                "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                isActive
                  ? "bg-green-100 dark:bg-green-900/40"
                  : "bg-muted/60"
              )}
            >
              <StatusIcon
                className={cn("h-5 w-5", statusMeta.iconColor)}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {entry.vehicle
                  ? `${entry.vehicle.placa}`
                  : `Jornada #${entry.id}`}
              </p>
              {entry.vehicle && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.vehicle.marca} {entry.vehicle.modelo}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn("shrink-0 text-xs font-medium", statusMeta.badgeClass)}>
            {statusMeta.label}
          </Badge>
        </div>

        {/* Info row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {isActive
              ? "Agora • " +
                formatDistanceToNow(parseISO(entry.start_time), {
                  locale: ptBR,
                  addSuffix: false,
                })
              : format(parseISO(entry.start_time), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
          </span>

          {distance != null && (
            <span className="flex items-center gap-1.5">
              <Route className="h-3.5 w-3.5 shrink-0" />
              {distance.toLocaleString("pt-BR")} km
            </span>
          )}

          {entry.start_odometer != null && (
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 shrink-0" />
              {entry.start_odometer.toLocaleString("pt-BR")} km
            </span>
          )}
        </div>

        {/* Checklist + Incidents badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {checklistStatus === "passed" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[11px] font-medium px-2.5 py-0.5">
              <CheckCheck className="h-3 w-3" />
              Vistoria OK
            </span>
          )}
          {checklistStatus === "failed" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[11px] font-medium px-2.5 py-0.5">
              <AlertCircle className="h-3 w-3" />
              Vistoria com falhas
            </span>
          )}
          {entry.incidents && entry.incidents.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-medium px-2.5 py-0.5">
              <AlertTriangle className="h-3 w-3" />
              {entry.incidents.length} incidente{entry.incidents.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function DriverHistoryView() {
  const { user } = useAuth();

  const [history, setHistory] = useState<JourneyHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<JourneyHistoryEntry | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchDriverHistory(Number(user.id));
      setHistory(data ?? []);
    } catch (err) {
      console.error("[DriverHistoryView] Erro ao buscar histórico:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const activeJourneys = history.filter((j) =>
    ["active", "resting", "meal", "pending_approval"].includes(j.status)
  );
  const pastJourneys = history.filter(
    (j) => !["active", "resting", "meal", "pending_approval"].includes(j.status)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Viagens</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Carregando..."
              : hasError
              ? "Erro ao carregar"
              : history.length === 0
              ? "Nenhuma jornada registrada"
              : `${history.length} jornada${history.length !== 1 ? "s" : ""} registrada${history.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <HistorySkeleton />
      ) : hasError ? (
        <ErrorState onRetry={loadHistory} />
      ) : history.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {/* Active journeys */}
          {activeJourneys.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75" />
                </span>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Jornada Ativa
                </h2>
              </div>
              <div className="space-y-2">
                {activeJourneys.map((entry) => (
                  <JourneyCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedJourney(entry)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past journeys */}
          {pastJourneys.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Viagens Anteriores
              </h2>
              <div className="space-y-2">
                {pastJourneys.map((entry) => (
                  <JourneyCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedJourney(entry)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <JourneyDetailModal
        journey={selectedJourney}
        open={!!selectedJourney}
        onClose={() => setSelectedJourney(null)}
      />
    </div>
  );
}
