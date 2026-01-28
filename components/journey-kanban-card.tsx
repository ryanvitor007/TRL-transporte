"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Truck,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coffee,
  Utensils,
  Play,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JornadaMonitoramento } from "@/lib/api-service";

interface JourneyKanbanCardProps {
  journey: JornadaMonitoramento;
  onOpenDetails?: (journey: JornadaMonitoramento) => void;
  variant?: "default" | "critical";
}

// Calcula tempo decorrido desde o inicio
function useElapsedTime(startTime: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

function formatElapsedTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, "0")}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function getStatusConfig(status: JornadaMonitoramento["status"]) {
  switch (status) {
    case "pending_approval":
      return {
        label: "Aguardando",
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: AlertTriangle,
      };
    case "active":
      return {
        label: "Em Viagem",
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: Play,
      };
    case "resting":
      return {
        label: "Descanso",
        color: "bg-amber-500",
        textColor: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: Coffee,
      };
    case "meal":
      return {
        label: "Almoco",
        color: "bg-orange-500",
        textColor: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: Utensils,
      };
    case "finished":
      return {
        label: "Finalizada",
        color: "bg-slate-500",
        textColor: "text-slate-700",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
        icon: CheckCircle2,
      };
    case "cancelled":
      return {
        label: "Cancelada",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: XCircle,
      };
    default:
      return {
        label: "Desconhecido",
        color: "bg-gray-500",
        textColor: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: Clock,
      };
  }
}

export function JourneyKanbanCard({
  journey,
  onOpenDetails,
  variant = "default",
}: JourneyKanbanCardProps) {
  const elapsedSeconds = useElapsedTime(journey.startTime);
  const statusConfig = getStatusConfig(journey.status);
  const StatusIcon = statusConfig.icon;

  const isCritical = variant === "critical" || journey.status === "pending_approval";
  const isResting = journey.status === "resting";
  const isMeal = journey.status === "meal";
  const isPaused = isResting || isMeal;
  const hasProblems = journey.rejectedItems && journey.rejectedItems.length > 0;

  // Determina as cores do card baseado no status
  const getCardClasses = () => {
    if (isCritical) {
      return "border-red-300 bg-red-50/50 shadow-red-100";
    }
    if (isResting) {
      return "border-amber-300 bg-amber-50/50 shadow-amber-100";
    }
    if (isMeal) {
      return "border-orange-300 bg-orange-50/50 shadow-orange-100";
    }
    return statusConfig.borderColor;
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        getCardClasses()
      )}
      onClick={() => onOpenDetails?.(journey)}
    >
      <CardContent className="p-4">
        {/* Header: Foto + Info */}
        <div className="flex items-start gap-3">
          {/* Avatar/Foto */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              isCritical && "bg-red-100",
              isResting && "bg-amber-100",
              isMeal && "bg-orange-100",
              !isCritical && !isPaused && "bg-muted"
            )}
          >
            {journey.driverPhoto ? (
              <img
                src={journey.driverPhoto}
                alt={journey.driverName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : isPaused ? (
              <StatusIcon
                className={cn(
                  "h-6 w-6",
                  isResting && "text-amber-600",
                  isMeal && "text-orange-600"
                )}
              />
            ) : (
              <User
                className={cn(
                  "h-6 w-6",
                  isCritical ? "text-red-600" : "text-muted-foreground"
                )}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-foreground truncate">
                {journey.driverName}
              </h4>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* Placa Badge */}
            <Badge
              variant="outline"
              className={cn(
                "mt-1 font-mono text-xs",
                isCritical && "border-red-300 bg-red-100 text-red-700",
                isResting && "border-amber-300 bg-amber-100 text-amber-700",
                isMeal && "border-orange-300 bg-orange-100 text-orange-700"
              )}
            >
              <Truck className="mr-1 h-3 w-3" />
              {journey.vehiclePlate}
            </Badge>

            {/* Modelo */}
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {journey.vehicleModel}
            </p>
          </div>
        </div>

        {/* Timer + Status */}
        <div className="mt-3 flex items-center justify-between">
          {/* Cronometro */}
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className={cn(
              "h-4 w-4", 
              isCritical && "text-red-500",
              isResting && "text-amber-500",
              isMeal && "text-orange-500",
              !isCritical && !isPaused && "text-muted-foreground"
            )} />
            <span
              className={cn(
                "font-mono font-medium",
                isCritical && "text-red-600",
                isResting && "text-amber-600",
                isMeal && "text-orange-600",
                !isCritical && !isPaused && "text-foreground"
              )}
            >
              {formatElapsedTime(elapsedSeconds)}
            </span>
          </div>

          {/* Status Badge */}
          <Badge
            className={cn(
              "gap-1 text-xs text-white",
              statusConfig.color
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Alerta de Problemas */}
        {hasProblems && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-red-100 p-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              {journey.rejectedItems?.length} item(ns) reprovado(s) no checklist
            </span>
          </div>
        )}

        {/* Localizacao */}
        {journey.currentLocation && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{journey.currentLocation}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- DETALHES MODAL ---
interface JourneyDetailsModalProps {
  journey: JornadaMonitoramento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JourneyDetailsModal({
  journey,
  open,
  onOpenChange,
}: JourneyDetailsModalProps) {
  if (!journey) return null;

  const statusConfig = getStatusConfig(journey.status);
  const elapsedSeconds = useElapsedTime(journey.startTime);

  // Mapeia IDs de checklist para labels legiveis
  const checklistLabels: Record<string, string> = {
    tires: "Pneus (Calibragem e Estado)",
    fluids: "Niveis (Agua e Oleo)",
    brakes: "Freios (Teste visual/pedal)",
    lights: "Iluminacao (Farois, Setas e Freio)",
    panel: "Painel e Instrumentos",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {journey.driverName}
          </DialogTitle>
          <DialogDescription>
            Detalhes da jornada em andamento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Veiculo */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Truck className="h-4 w-4 text-primary" />
                Veiculo
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Placa:</span>{" "}
                  <span className="font-mono font-medium">{journey.vehiclePlate}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Modelo:</span>{" "}
                  {journey.vehicleModel}
                </p>
              </div>
            </div>

            {/* Tempo */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Tempo de Jornada
              </div>
              <p className="mt-2 text-2xl font-bold font-mono">
                {formatElapsedTime(elapsedSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">
                Inicio: {new Date(journey.startTime).toLocaleTimeString("pt-BR")}
              </p>
            </div>

            {/* Localizacao */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Localizacao
              </div>
              <p className="mt-2 text-sm">
                {journey.currentLocation || journey.startLocation || "Nao informada"}
              </p>
            </div>

            {/* Checklist */}
            {journey.checklistItems && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Checklist de Vistoria
                </div>
                <div className="space-y-2">
                  {Object.entries(journey.checklistItems).map(([key, value]) => (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center justify-between rounded-md p-2 text-sm",
                        value ? "bg-green-50" : "bg-red-50"
                      )}
                    >
                      <span className={value ? "text-green-700" : "text-red-700"}>
                        {checklistLabels[key] || key}
                      </span>
                      {value ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Notas de problemas */}
                {journey.checklistNotes && (
                  <div className="mt-3 rounded-md bg-red-100 p-2 text-xs text-red-700">
                    <p className="font-medium">Observacoes:</p>
                    <p>{journey.checklistNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
