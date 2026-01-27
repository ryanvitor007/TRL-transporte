"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Play,
  Coffee,
  Utensils,
  CheckCircle2,
  RefreshCw,
  Activity,
  Clock,
  Truck,
  Users,
  History,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  JourneyKanbanCard,
  JourneyDetailsModal,
} from "@/components/journey-kanban-card";
import { AdminEmergencyModal } from "@/components/admin-emergency-modal";
import {
  buscarJornadasMonitoramentoAPI,
  buscarHistoricoJornadasDiaAPI,
  type JornadaMonitoramento,
} from "@/lib/api-service";

// Intervalo de polling em ms
const POLLING_INTERVAL = 10000;

// Agrupa jornadas por status para o Kanban
function groupJourneysByStatus(journeys: JornadaMonitoramento[]) {
  return {
    pending: journeys.filter((j) => j.status === "pending_approval"),
    active: journeys.filter((j) => j.status === "active"),
    resting: journeys.filter((j) => j.status === "resting"),
    meal: journeys.filter((j) => j.status === "meal"),
  };
}

// Configuracao das colunas do Kanban
const kanbanColumns = [
  {
    id: "pending",
    title: "Aguardando Aprovacao",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emptyText: "Nenhuma jornada aguardando",
  },
  {
    id: "active",
    title: "Em Viagem",
    icon: Play,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    emptyText: "Nenhuma viagem ativa",
  },
  {
    id: "resting",
    title: "Parada/Descanso",
    icon: Coffee,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    emptyText: "Nenhum motorista em descanso",
  },
  {
    id: "meal",
    title: "Almoco",
    icon: Utensils,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    emptyText: "Nenhum motorista em almoco",
  },
];

// Skeleton para o Kanban
function KanbanColumnSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MonitoringView() {
  // Estados
  const [journeys, setJourneys] = useState<JornadaMonitoramento[]>([]);
  const [history, setHistory] = useState<JornadaMonitoramento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Modais
  const [selectedJourney, setSelectedJourney] =
    useState<JornadaMonitoramento | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [emergencyJourney, setEmergencyJourney] =
    useState<JornadaMonitoramento | null>(null);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  // Carrega dados
  const loadData = useCallback(async () => {
    try {
      const [activeJourneys, historyJourneys] = await Promise.all([
        buscarJornadasMonitoramentoAPI(),
        buscarHistoricoJornadasDiaAPI(),
      ]);

      setJourneys(activeJourneys);
      setHistory(historyJourneys);
      setLastUpdate(new Date());

      // Verifica se tem alguma jornada pendente para alerta
      const pendingJourneys = activeJourneys.filter(
        (j) => j.status === "pending_approval",
      );
      if (pendingJourneys.length > 0 && !isEmergencyOpen) {
        // Abre o modal de emergencia para a primeira pendente
        setEmergencyJourney(pendingJourneys[0]);
        setIsEmergencyOpen(true);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de monitoramento:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isEmergencyOpen]);

  // Polling automatico
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handlers
  const handleOpenDetails = (journey: JornadaMonitoramento) => {
    if (journey.status === "pending_approval") {
      setEmergencyJourney(journey);
      setIsEmergencyOpen(true);
    } else {
      setSelectedJourney(journey);
      setIsDetailsOpen(true);
    }
  };

  const handleEmergencyClose = () => {
    setIsEmergencyOpen(false);
    setEmergencyJourney(null);
  };

  const handleActionComplete = () => {
    loadData();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadData();
  };

  // Agrupa jornadas
  const grouped = groupJourneysByStatus(journeys);

  // Estatisticas
  const stats = {
    total: journeys.length,
    pending: grouped.pending.length,
    active: grouped.active.length,
    resting: grouped.resting.length + grouped.meal.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Monitoramento de Jornadas
          </h1>
          <p className="text-sm text-muted-foreground">
            Torre de controle em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className={cn(stats.pending > 0 && "border-red-200 bg-red-50")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                stats.pending > 0 ? "bg-red-100" : "bg-muted",
              )}
            >
              <Bell
                className={cn(
                  "h-5 w-5",
                  stats.pending > 0 ? "text-red-600" : "text-muted-foreground",
                )}
              />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Em Viagem</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Coffee className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resting}</p>
              <p className="text-xs text-muted-foreground">Em Pausa</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Ativas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 lg:grid-cols-4">
        {kanbanColumns.map((column) => {
          const columnJourneys =
            grouped[column.id as keyof typeof grouped] || [];
          const ColumnIcon = column.icon;

          return (
            <Card
              key={column.id}
              className={cn("min-h-[400px]", column.borderColor)}
            >
              <CardHeader className={cn("pb-3", column.bgColor)}>
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className={cn("flex items-center gap-2", column.color)}>
                    <ColumnIcon className="h-4 w-4" />
                    {column.title}
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-mono",
                      column.id === "pending" &&
                        columnJourneys.length > 0 &&
                        "bg-red-500 text-white",
                    )}
                  >
                    {columnJourneys.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {isLoading ? (
                  <KanbanColumnSkeleton />
                ) : columnJourneys.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-center">
                    <ColumnIcon className="mb-2 h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                      {column.emptyText}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] pr-2">
                    <div className="space-y-3">
                      {columnJourneys.map((journey) => (
                        <JourneyKanbanCard
                          key={journey.id}
                          journey={journey}
                          onOpenDetails={handleOpenDetails}
                          variant={
                            column.id === "pending" ? "critical" : "default"
                          }
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Historico do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historico de Jornadas do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma jornada finalizada hoje
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Veiculo</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((journey) => (
                    <TableRow key={journey.id}>
                      <TableCell className="font-medium">
                        {journey.driverName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          <Truck className="mr-1 h-3 w-3" />
                          {journey.vehiclePlate}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(journey.startTime).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            journey.status === "finished"
                              ? "bg-green-500"
                              : journey.status === "cancelled"
                                ? "bg-red-500"
                                : "bg-gray-500",
                          )}
                        >
                          {journey.status === "finished"
                            ? "Finalizada"
                            : journey.status === "cancelled"
                              ? "Cancelada"
                              : journey.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <JourneyDetailsModal
        journey={selectedJourney}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <AdminEmergencyModal
        journey={emergencyJourney}
        open={isEmergencyOpen}
        onOpenChange={handleEmergencyClose}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
