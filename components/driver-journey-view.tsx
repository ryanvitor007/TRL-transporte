"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlayCircle,
  StopCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Gauge,
  AlertTriangle,
  CircleDot,
  Droplets,
  Disc,
  Lightbulb,
  Battery,
  Wrench,
  Navigation,
  Timer,
  Coffee,
  ChevronRight,
  ChevronLeft,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type JourneyState =
  | "inactive"
  | "inspection"
  | "ready_to_start"
  | "on_journey"
  | "paused"
  | "checkout";

interface InspectionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean | null;
  problem?: string;
}

export function DriverJourneyView() {
  const { user } = useAuth();
  const [journeyState, setJourneyState] = useState<JourneyState>("inactive");
  const [currentStep, setCurrentStep] = useState(0);

  // Inspection state
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    {
      id: "tires",
      label: "Pneus (Calibragem e Estado)",
      icon: <CircleDot className="h-6 w-6" />,
      checked: null,
    },
    {
      id: "fluids",
      label: "Níveis (Água e Óleo)",
      icon: <Droplets className="h-6 w-6" />,
      checked: null,
    },
    {
      id: "brakes",
      label: "Freios (Teste visual/pedal)",
      icon: <Disc className="h-6 w-6" />,
      checked: null,
    },
    {
      id: "lights",
      label: "Iluminação (Faróis, Setas e Freio)",
      icon: <Lightbulb className="h-6 w-6" />,
      checked: null,
    },
    {
      id: "panel",
      label: "Painel e Instrumentos",
      icon: <Battery className="h-6 w-6" />,
      checked: null,
    },
  ]);
  const [hasProblems, setHasProblems] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  // Check-in state
  const [startKm, setStartKm] = useState("");
  const [currentLocation, setCurrentLocation] = useState(
    "Detectando localização..."
  );

  // Journey state
  const [journeyStartTime, setJourneyStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPauseTime, setTotalPauseTime] = useState(0);

  // Check-out state
  const [endKm, setEndKm] = useState("");
  const [observations, setObservations] = useState("");
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  // Simulate GPS location
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentLocation("São Paulo, SP - Detectado");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Timer for journey
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (journeyState === "on_journey" && journeyStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed =
          Math.floor((now.getTime() - journeyStartTime.getTime()) / 1000) -
          totalPauseTime;
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [journeyState, journeyStartTime, totalPauseTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInspectionChange = (id: string, value: boolean) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: value,
              problem: value ? undefined : item.problem,
            }
          : item
      )
    );
  };

  const handleProblemDescription = (id: string, problem: string) => {
    setInspectionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, problem } : item))
    );
  };

  const canProceedFromInspection = useCallback(() => {
    const allChecked = inspectionItems.every((item) => item.checked !== null);
    const problemsWithoutDescription = inspectionItems.some(
      (item) =>
        item.checked === false && (!item.problem || item.problem.trim() === "")
    );
    return allChecked && !problemsWithoutDescription;
  }, [inspectionItems]);

  const handleStartInspection = () => {
    setJourneyState("inspection");
    setCurrentStep(0);
  };

  const handleConfirmInspection = () => {
    const problems = inspectionItems.filter((item) => item.checked === false);
    if (problems.length > 0) {
      setHasProblems(true);
      setShowMaintenanceDialog(true);
    } else {
      setJourneyState("ready_to_start");
      setCurrentStep(1);
    }
  };

  const handleCheckIn = () => {
    if (!startKm) return;
    setJourneyStartTime(new Date());
    setJourneyState("on_journey");
    setCurrentStep(2);
  };

  const handlePause = () => {
    setPauseStartTime(new Date());
    setJourneyState("paused");
  };

  const handleResume = () => {
    if (pauseStartTime) {
      const pauseDuration = Math.floor(
        (new Date().getTime() - pauseStartTime.getTime()) / 1000
      );
      setTotalPauseTime((prev) => prev + pauseDuration);
    }
    setPauseStartTime(null);
    setJourneyState("on_journey");
  };

  const handleStartCheckout = () => {
    setJourneyState("checkout");
  };

  const handleConfirmCheckout = () => {
    // TODO: Enviar dados para o backend
    setShowSummaryDialog(true);
  };

  const handleFinishJourney = () => {
    // Reset all states
    setJourneyState("inactive");
    setCurrentStep(0);
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined }))
    );
    setStartKm("");
    setEndKm("");
    setObservations("");
    setJourneyStartTime(null);
    setElapsedTime(0);
    setPauseStartTime(null);
    setTotalPauseTime(0);
    setHasProblems(false);
    setShowSummaryDialog(false);
  };

  const calculateDistance = () => {
    const start = Number.parseFloat(startKm) || 0;
    const end = Number.parseFloat(endKm) || 0;
    return Math.max(0, end - start);
  };

  // Render inactive state - Start journey card
  if (journeyState === "inactive") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Gestão de Jornada
          </h1>
          <p className="text-muted-foreground">
            Controle seu tempo de direção e faça a vistoria diária
          </p>
        </div>

        <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <Truck className="h-16 w-16 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Iniciar Nova Jornada
            </h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              Antes de iniciar, você precisará completar a vistoria diária do
              veículo para garantir sua segurança.
            </p>
            <Button
              size="lg"
              className="h-14 px-8 text-lg"
              onClick={handleStartInspection}
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              Começar Vistoria
            </Button>
          </CardContent>
        </Card>

        {/* Recent journeys */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas Jornadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  date: "13/01/2026",
                  duration: "08:32:15",
                  km: 342,
                  status: "Concluída",
                },
                {
                  date: "12/01/2026",
                  duration: "07:45:00",
                  km: 298,
                  status: "Concluída",
                },
                {
                  date: "11/01/2026",
                  duration: "09:12:30",
                  km: 415,
                  status: "Concluída",
                },
              ].map((journey, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{journey.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {journey.km} km percorridos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{journey.duration}</p>
                    <Badge variant="outline" className="text-green-600">
                      {journey.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render inspection state
  if (journeyState === "inspection") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Vistoria Diária
          </h1>
          <p className="text-muted-foreground">
            Verifique todos os itens de segurança antes de iniciar
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {["Vistoria", "Check-in", "Em Viagem"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < 2 && (
                <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Checklist de Inspeção
            </CardTitle>
            <CardDescription>
              Marque cada item como OK ou Não OK. Itens com problemas exigem
              descrição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inspectionItems.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-full p-2",
                        item.checked === true
                          ? "bg-green-500/10 text-green-500"
                          : item.checked === false
                          ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={item.checked === true ? "default" : "outline"}
                      className={cn(
                        "min-w-[70px]",
                        item.checked === true &&
                          "bg-green-500 hover:bg-green-600"
                      )}
                      onClick={() => handleInspectionChange(item.id, true)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant={item.checked === false ? "default" : "outline"}
                      className={cn(
                        "min-w-[70px]",
                        item.checked === false && "bg-red-500 hover:bg-red-600"
                      )}
                      onClick={() => handleInspectionChange(item.id, false)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Não OK
                    </Button>
                  </div>
                </div>

                {item.checked === false && (
                  <div className="ml-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                    <Label className="text-sm text-red-700 dark:text-red-400">
                      Descreva o problema encontrado *
                    </Label>
                    <Textarea
                      placeholder="Ex: Pneu dianteiro esquerdo com calibragem baixa..."
                      value={item.problem || ""}
                      onChange={(e) =>
                        handleProblemDescription(item.id, e.target.value)
                      }
                      className="mt-2 border-red-200 dark:border-red-800"
                    />
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setJourneyState("inactive")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!canProceedFromInspection()}
                onClick={handleConfirmInspection}
              >
                Confirmar Vistoria
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance dialog for problems */}
        <Dialog
          open={showMaintenanceDialog}
          onOpenChange={setShowMaintenanceDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Problemas Detectados
              </DialogTitle>
              <DialogDescription>
                Foram encontrados problemas na vistoria. Recomendamos reportar à
                manutenção antes de iniciar a jornada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {inspectionItems
                .filter((i) => i.checked === false)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
                  >
                    <p className="font-medium text-red-700 dark:text-red-400">
                      {item.label}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {item.problem}
                    </p>
                  </div>
                ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setShowMaintenanceDialog(false);
                  setJourneyState("ready_to_start");
                  setCurrentStep(1);
                }}
              >
                Continuar Mesmo Assim
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  // TODO: Integrar com tela de manutenção
                  setShowMaintenanceDialog(false);
                  setJourneyState("inactive");
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Reportar Manutenção
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Render ready to start (check-in) state
  if (journeyState === "ready_to_start") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Check-in
          </h1>
          <p className="text-muted-foreground">
            Confirme os dados para iniciar sua jornada
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {["Vistoria", "Check-in", "Em Viagem"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < 2 && (
                <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Inspection completed card */}
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-green-500 p-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Vistoria Concluída
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {hasProblems
                  ? "Problemas reportados, prosseguindo com cautela"
                  : "Todos os itens verificados com sucesso"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados de Rastreio</CardTitle>
            <CardDescription>
              Confirme sua localização e quilometragem inicial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GPS Location */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-3">
                  <Navigation className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Localização GPS
                  </p>
                  <p className="font-medium">{currentLocation}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-600"
                >
                  <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  Ativo
                </Badge>
              </div>
            </div>

            {/* Date and time */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data e Hora</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString("pt-BR")} às{" "}
                    {new Date().toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* KM Input */}
            <div className="space-y-2">
              <Label htmlFor="startKm" className="text-base">
                <Gauge className="mr-2 inline h-4 w-4" />
                Quilometragem Atual (Hodômetro) *
              </Label>
              <Input
                id="startKm"
                type="number"
                placeholder="Ex: 125430"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Driver info */}
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Motorista</p>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setJourneyState("inspection");
                  setCurrentStep(0);
                }}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                className="flex-1 h-14 bg-green-500 text-lg hover:bg-green-600"
                disabled={!startKm}
                onClick={handleCheckIn}
              >
                <PlayCircle className="mr-2 h-6 w-6" />
                CONFIRMAR CHECK-IN
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render on journey or paused state
  if (journeyState === "on_journey" || journeyState === "paused") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Jornada em Andamento
          </h1>
          <p className="text-muted-foreground">
            Iniciada às{" "}
            {journeyStartTime?.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Status card */}
        <Card
          className={cn(
            "border-2",
            journeyState === "paused"
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
              : "border-green-500 bg-green-50 dark:bg-green-950"
          )}
        >
          <CardContent className="py-6 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              {journeyState === "paused" ? (
                <>
                  <PauseCircle className="h-6 w-6 text-amber-600" />
                  <span className="text-lg font-medium text-amber-700 dark:text-amber-400">
                    Parada para Descanso
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                  </span>
                  <span className="text-lg font-medium text-green-700 dark:text-green-400">
                    Em Viagem - Rastreamento Ativo
                  </span>
                </>
              )}
            </div>

            {/* Timer */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Tempo de Direção</p>
              <p className="font-mono text-5xl font-bold tracking-wider">
                {formatTime(elapsedTime)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{currentLocation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span>KM Inicial: {startKm}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid gap-4 sm:grid-cols-2">
          {journeyState === "paused" ? (
            <Button
              size="lg"
              className="h-16 bg-green-500 text-lg hover:bg-green-600"
              onClick={handleResume}
            >
              <PlayCircle className="mr-2 h-6 w-6" />
              Retomar Viagem
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-16 border-amber-500 text-lg text-amber-600 hover:bg-amber-50 bg-transparent"
              onClick={handlePause}
            >
              <Coffee className="mr-2 h-6 w-6" />
              Parada para Descanso
            </Button>
          )}

          <Button
            size="lg"
            variant="destructive"
            className="h-16 text-lg"
            onClick={handleStartCheckout}
          >
            <StopCircle className="mr-2 h-6 w-6" />
            Encerrar Jornada
          </Button>
        </div>

        {/* Journey info cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Timer className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total</p>
                <p className="font-mono text-lg font-bold">
                  {formatTime(elapsedTime)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <Coffee className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo de Pausa</p>
                <p className="font-mono text-lg font-bold">
                  {formatTime(totalPauseTime)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <Navigation className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status GPS</p>
                <p className="text-lg font-bold text-green-600">Ativo</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render checkout state
  if (journeyState === "checkout") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Check-out
          </h1>
          <p className="text-muted-foreground">
            Finalize sua jornada informando os dados finais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Encerramento de Jornada</CardTitle>
            <CardDescription>
              Jornada iniciada às{" "}
              {journeyStartTime?.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              - Tempo total: {formatTime(elapsedTime)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">KM Inicial</p>
                <p className="text-2xl font-bold">{startKm}</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Tempo de Direção
                </p>
                <p className="font-mono text-2xl font-bold">
                  {formatTime(elapsedTime)}
                </p>
              </div>
            </div>

            {/* KM Final Input */}
            <div className="space-y-2">
              <Label htmlFor="endKm" className="text-base">
                <Gauge className="mr-2 inline h-4 w-4" />
                Quilometragem Final (Hodômetro) *
              </Label>
              <Input
                id="endKm"
                type="number"
                placeholder="Ex: 125780"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Distance calculated */}
            {endKm && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 dark:text-green-400">
                    Distância Percorrida
                  </span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {calculateDistance()} km
                  </span>
                </div>
              </div>
            )}

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">
                Observações da Viagem (Opcional)
              </Label>
              <Textarea
                id="observations"
                placeholder="Registre qualquer ocorrência ou observação relevante..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setJourneyState("on_journey")}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                className="flex-1 h-14 bg-red-500 text-lg hover:bg-red-600"
                disabled={!endKm}
                onClick={handleConfirmCheckout}
              >
                <StopCircle className="mr-2 h-6 w-6" />
                CONFIRMAR CHECK-OUT
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Jornada Finalizada com Sucesso!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Resumo da Jornada</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {journeyStartTime?.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium">
                      {journeyStartTime?.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date().toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tempo de Direção
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tempo de Pausa
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(totalPauseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KM Inicial</span>
                    <span className="font-medium">{startKm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">KM Final</span>
                    <span className="font-medium">{endKm}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Distância Total</span>
                    <span className="font-bold text-green-600">
                      {calculateDistance()} km
                    </span>
                  </div>
                </div>
              </div>
              {observations && (
                <div className="rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Observações</h4>
                  <p className="text-sm text-muted-foreground">
                    {observations}
                  </p>
                </div>
              )}
            </div>
            <Button className="w-full" onClick={handleFinishJourney}>
              Concluir
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
