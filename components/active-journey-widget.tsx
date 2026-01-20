"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useJourney } from "@/contexts/journey-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Square,
  ChevronRight,
  MapPin,
  Coffee,
  Utensils,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveJourneyWidgetProps {
  onNavigateToJourney: () => void;
}

export function ActiveJourneyWidget({
  onNavigateToJourney,
}: ActiveJourneyWidgetProps) {
  const {
    journey,
    getTotalElapsedSeconds,
    getDrivingSeconds,
    getRestSeconds,
    getMealSeconds,
    startCheckout,
    endJourney,
  } = useJourney();

  const [displayTime, setDisplayTime] = useState("00:00:00");
  const [showStopDialog, setShowStopDialog] = useState(false);

  // Update display time every second
  useEffect(() => {
    const updateTime = () => {
      const totalSeconds = getTotalElapsedSeconds();
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      setDisplayTime(
        `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [getTotalElapsedSeconds]);

  // Don't render if no active journey
  if (
    !journey.isActive ||
    !["on_journey", "resting", "meal", "checkout"].includes(journey.status)
  ) {
    return null;
  }

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStopDialog(true);
  };

  const handleConfirmStop = () => {
    startCheckout();
    setShowStopDialog(false);
    onNavigateToJourney();
  };

  const getStatusInfo = () => {
    switch (journey.status) {
      case "resting":
        return {
          icon: <Coffee className="h-4 w-4" />,
          text: "Em descanso",
          color: "text-amber-600",
        };
      case "meal":
        return {
          icon: <Utensils className="h-4 w-4" />,
          text: "Em refeicao",
          color: "text-orange-600",
        };
      case "checkout":
        return {
          icon: <Navigation className="h-4 w-4" />,
          text: "Finalizando",
          color: "text-purple-600",
        };
      default:
        return {
          icon: <Navigation className="h-4 w-4" />,
          text: "Em viagem",
          color: "text-green-600",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <div
        className={cn(
          "w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-all",
          "hover:border-blue-300 hover:bg-blue-100",
          "dark:border-blue-800 dark:bg-blue-950/50 dark:hover:bg-blue-900/50",
        )}
      >
        <div className="flex items-center gap-3">
          {/* Clickable area - Icon + Info */}
          <button
            type="button"
            onClick={onNavigateToJourney}
            className="flex flex-1 items-center gap-3 text-left active:scale-[0.98] transition-transform min-w-0"
          >
            {/* Animated Icon */}
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Truck className="h-6 w-6" />
              </div>
              {/* Pulse indicator */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    journey.status === "on_journey"
                      ? "bg-green-400"
                      : journey.status === "resting" ||
                          journey.status === "meal"
                        ? "bg-amber-400"
                        : "bg-blue-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-4 w-4 rounded-full",
                    journey.status === "on_journey"
                      ? "bg-green-500"
                      : journey.status === "resting" ||
                          journey.status === "meal"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                  )}
                />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Timer */}
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {displayTime}
              </p>
              {/* Status + Vehicle */}
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn("flex items-center gap-1", statusInfo.color)}
                >
                  {statusInfo.icon}
                  {statusInfo.text}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground truncate">
                  {journey.vehicleData?.plate || "---"}
                </span>
              </div>
              {/* Location */}
              {journey.lastLocation && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {journey.lastLocation}
                </p>
              )}
            </div>

            {/* Chevron */}
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </button>

          {/* Stop Button - Outside the navigation button */}
          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 rounded-lg shrink-0"
            onClick={handleStopClick}
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </div>

      {/* Stop Confirmation Dialog */}
      <Dialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Encerrar Jornada?</DialogTitle>
            <DialogDescription>
              Voce sera direcionado para a tela de checkout para registrar o KM
              final e observacoes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tempo total:</span>
              <span className="font-medium">{displayTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veiculo:</span>
              <span className="font-medium">
                {journey.vehicleData?.plate || "---"}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowStopDialog(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmStop}
              className="flex-1"
            >
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
