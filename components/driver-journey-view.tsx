"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useJourney, type JourneyStatus } from "@/contexts/journey-context";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlayCircle,
  StopCircle,
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
  Calendar,
  Route,
  RefreshCw,
  WifiOff,
  Utensils,
  Car,
  Minimize2,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- TYPES ---
interface InspectionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  checked: boolean | null;
  problem?: string;
}

interface JourneyRecord {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  drivingTime: string;
  restTime: string;
  mealTime: string;
  kmStart: number;
  kmEnd: number;
  distance: number;
  status: "Concluida" | "Em Andamento" | "Cancelada";
  vehicle: string;
  checklistOk: boolean;
  observations?: string;
}

// --- MOCK DATA ---
const mockJourneyHistory: JourneyRecord[] = [
  {
    id: 1,
    date: "2026-01-19",
    startTime: "06:30",
    endTime: "15:45",
    duration: "09:15:00",
    drivingTime: "07:30:00",
    restTime: "01:00:00",
    mealTime: "00:45:00",
    kmStart: 125000,
    kmEnd: 125342,
    distance: 342,
    status: "Concluida",
    vehicle: "ABC-1234 - Volvo FH 460",
    checklistOk: true,
    observations: "Viagem tranquila, sem ocorrencias.",
  },
  {
    id: 2,
    date: "2026-01-18",
    startTime: "07:00",
    endTime: "14:30",
    duration: "07:30:00",
    drivingTime: "06:00:00",
    restTime: "00:45:00",
    mealTime: "00:45:00",
    kmStart: 124700,
    kmEnd: 124998,
    distance: 298,
    status: "Concluida",
    vehicle: "ABC-1234 - Volvo FH 460",
    checklistOk: true,
  },
  {
    id: 3,
    date: "2026-01-17",
    startTime: "05:45",
    endTime: "16:00",
    duration: "10:15:00",
    drivingTime: "08:30:00",
    restTime: "01:00:00",
    mealTime: "00:45:00",
    kmStart: 124285,
    kmEnd: 124700,
    distance: 415,
    status: "Concluida",
    vehicle: "ABC-1234 - Volvo FH 460",
    checklistOk: false,
    observations: "Problema nos freios reportado no checklist.",
  },
];

// Default vehicle data
const defaultVehicle = { plate: "ABC-1234", model: "Volvo FH 460" };

// --- SKELETON COMPONENTS ---
function JourneyCardSkeleton() {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full shrink-0" />
      </div>
    </div>
  );
}

// --- ERROR STATE ---
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Sem conexao</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Nao foi possivel carregar os dados. Verifique sua conexao.
      </p>
      <Button
        onClick={onRetry}
        size="lg"
        className="gap-2 min-w-[200px] h-12 active:scale-95 transition-transform"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  );
}

export function DriverJourneyView() {
  const { user } = useAuth();
  const {
    journey,
    startInspection,
    updateInspectionItem,
    completeInspection,
    startJourney,
    pauseJourney,
    resumeJourney,
    startCheckout,
    endJourney,
    updateLocation,
    getTotalElapsedSeconds,
    getDrivingSeconds,
    getRestSeconds,
    getMealSeconds,
  } = useJourney();

  // --- LOADING/ERROR STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // --- LOCAL UI STATES ---
  const [journeyHistory, setJourneyHistory] = useState<JourneyRecord[]>([]);

  // --- DETAILS MODAL ---
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<JourneyRecord | null>(
    null,
  );

  // --- INSPECTION STATE (local UI) ---
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    {
      id: "tires",
      label: "Pneus (Calibragem e Estado)",
      icon: <CircleDot className="h-5 w-5" />,
      checked: null,
    },
    {
      id: "fluids",
      label: "Niveis (Agua e Oleo)",
      icon: <Droplets className="h-5 w-5" />,
      checked: null,
    },
    {
      id: "brakes",
      label: "Freios (Teste visual/pedal)",
      icon: <Disc className="h-5 w-5" />,
      checked: null,
    },
    {
      id: "lights",
      label: "Iluminacao (Farois, Setas e Freio)",
      icon: <Lightbulb className="h-5 w-5" />,
      checked: null,
    },
    {
      id: "panel",
      label: "Painel e Instrumentos",
      icon: <Battery className="h-5 w-5" />,
      checked: null,
    },
  ]);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [currentProblemItem, setCurrentProblemItem] = useState<string | null>(
    null,
  );

  // --- CHECK-IN STATE ---
  const [startKm, setStartKm] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Detectando...");
  const [locationError, setLocationError] = useState(false);

  // --- TIMER DISPLAY (updated every second) ---
  const [displayTimes, setDisplayTimes] = useState({
    total: 0,
    driving: 0,
    rest: 0,
    meal: 0,
  });

  // --- CHECK-OUT STATE ---
  const [endKm, setEndKm] = useState("");
  const [observations, setObservations] = useState("");
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  // --- CURRENT STEP FOR UI ---
  const currentStep =
    journey.status === "inspection"
      ? 0
      : journey.status === "ready_to_start"
        ? 1
        : 2;

  // --- LOAD DATA ---
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setJourneyHistory(mockJourneyHistory);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- SIMULATE GPS ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Math.random() > 0.1) {
        const location = "Sao Paulo, SP - Detectado";
        setCurrentLocation(location);
        setLocationError(false);
        if (journey.isActive) {
          updateLocation(location);
        }
      } else {
        setCurrentLocation("Falha na deteccao");
        setLocationError(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [journey.status, journey.isActive, updateLocation]);

  // --- UPDATE DISPLAY TIMES (calculate from startTime, not interval counter) ---
  useEffect(() => {
    if (!journey.isActive || !journey.startTime) return;

    const updateTimes = () => {
      setDisplayTimes({
        total: getTotalElapsedSeconds(),
        driving: getDrivingSeconds(),
        rest: getRestSeconds(),
        meal: getMealSeconds(),
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [
    journey.isActive,
    journey.startTime,
    journey.status,
    getTotalElapsedSeconds,
    getDrivingSeconds,
    getRestSeconds,
    getMealSeconds,
  ]);

  // --- FORMATTERS ---
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeShort = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h${mins.toString().padStart(2, "0")}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return format(date, "dd/MM", { locale: ptBR });
  };

  // --- HANDLERS ---
  const handleInspectionChange = (id: string, value: boolean) => {
    if (value === false) {
      setCurrentProblemItem(id);
    } else {
      setInspectionItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, checked: value, problem: undefined }
            : item,
        ),
      );
      updateInspectionItem(id, value);
    }
  };

  const handleProblemConfirm = (problem: string) => {
    if (currentProblemItem) {
      setInspectionItems((prev) =>
        prev.map((item) =>
          item.id === currentProblemItem
            ? { ...item, checked: false, problem }
            : item,
        ),
      );
      updateInspectionItem(currentProblemItem, false, problem);
      setCurrentProblemItem(null);
    }
  };

  const canProceedFromInspection = useCallback(() => {
    const allChecked = inspectionItems.every((item) => item.checked !== null);
    const problemsWithoutDescription = inspectionItems.some(
      (item) =>
        item.checked === false && (!item.problem || item.problem.trim() === ""),
    );
    return allChecked && !problemsWithoutDescription;
  }, [inspectionItems]);

  const handleStartInspection = () => {
    startInspection();
    // Reset local inspection items
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined })),
    );
  };

  const handleConfirmInspection = () => {
    const problems = inspectionItems.filter((item) => item.checked === false);
    if (problems.length > 0) {
      setShowMaintenanceDialog(true);
    } else {
      completeInspection(false);
    }
  };

  const handleCheckIn = () => {
    if (!startKm) return;
    startJourney(startKm, defaultVehicle, currentLocation);
  };

  const handlePause = (type: "rest" | "meal") => {
    pauseJourney(type);
  };

  const handleResume = () => {
    resumeJourney();
  };

  const handleStartCheckout = () => {
    startCheckout();
  };

  const handleConfirmCheckout = () => {
    setShowSummaryDialog(true);
  };

  const handleFinishJourney = () => {
    // Reset all local states
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined })),
    );
    setStartKm("");
    setEndKm("");
    setObservations("");
    setShowSummaryDialog(false);
    // End journey in context
    endJourney();
  };

  const handleCancelJourney = () => {
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined })),
    );
    setStartKm("");
    endJourney();
  };

  const calculateDistance = () => {
    const start = Number.parseFloat(journey.startKm || startKm) || 0;
    const end = Number.parseFloat(endKm) || 0;
    return Math.max(0, end - start);
  };

  const openJourneyDetails = (journeyRecord: JourneyRecord) => {
    setSelectedJourney(journeyRecord);
    setIsDetailsOpen(true);
  };

  // Format start time for display
  const journeyStartTimeDisplay = journey.startTime
    ? new Date(journey.startTime).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // --- RENDER: LOADING ---
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3].map((i) => (
            <JourneyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  if (hasError) {
    return <ErrorState onRetry={loadData} />;
  }

  // ============================================
  // RENDER: INACTIVE STATE (Start + History)
  // ============================================
  if (!journey.isActive || journey.status === "inactive") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Gestao de Jornada
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle seu tempo de direcao e faca a vistoria diaria
          </p>
        </div>

        {/* Start Journey Card */}
        <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Truck className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Iniciar Nova Jornada
            </h2>
            <p className="mb-6 text-sm text-muted-foreground max-w-xs">
              Complete a vistoria diaria do veiculo antes de iniciar
            </p>
            <Button
              size="lg"
              className="h-14 px-8 text-base gap-2 active:scale-95 transition-transform"
              onClick={handleStartInspection}
            >
              <PlayCircle className="h-5 w-5" />
              Comecar Vistoria
            </Button>
          </CardContent>
        </Card>

        {/* Recent Journeys - Clean List */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            Ultimas Jornadas
          </h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {journeyHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Route className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma jornada registrada
                  </p>
                </div>
              ) : (
                journeyHistory.map((journeyRecord) => (
                  <button
                    key={journeyRecord.id}
                    type="button"
                    onClick={() => openJourneyDetails(journeyRecord)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted/70 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {formatDate(journeyRecord.date)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {journeyRecord.startTime} - {journeyRecord.endTime}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0",
                        journeyRecord.status === "Concluida"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : journeyRecord.status === "Em Andamento"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-red-200 bg-red-50 text-red-700",
                      )}
                    >
                      {journeyRecord.status}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Journey Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
            <DialogHeader className="shrink-0 p-6 pb-4">
              <DialogTitle>Detalhes da Jornada</DialogTitle>
              <DialogDescription>
                {selectedJourney && formatDate(selectedJourney.date)} -{" "}
                {selectedJourney?.vehicle}
              </DialogDescription>
            </DialogHeader>
            {selectedJourney && (
              <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge
                      className={cn(
                        selectedJourney.status === "Concluida"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {selectedJourney.status}
                    </Badge>
                    {selectedJourney.checklistOk ? (
                      <Badge className="bg-green-100 text-green-700">
                        Checklist OK
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">
                        Problemas no Checklist
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-card p-3 text-center">
                      <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Inicio</p>
                      <p className="font-semibold">
                        {selectedJourney.startTime}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-card p-3 text-center">
                      <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Fim</p>
                      <p className="font-semibold">{selectedJourney.endTime}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-3 text-center">
                      <Timer className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Duracao</p>
                      <p className="font-semibold">
                        {selectedJourney.duration.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4 space-y-3">
                    <h4 className="font-medium text-sm">
                      Detalhamento de Tempo
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Car className="h-4 w-4" />
                          Tempo de Direcao
                        </span>
                        <span className="font-mono font-medium">
                          {selectedJourney.drivingTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Coffee className="h-4 w-4" />
                          Tempo de Descanso
                        </span>
                        <span className="font-mono font-medium">
                          {selectedJourney.restTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Utensils className="h-4 w-4" />
                          Tempo de Refeicao
                        </span>
                        <span className="font-mono font-medium">
                          {selectedJourney.mealTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4 space-y-3">
                    <h4 className="font-medium text-sm">Quilometragem</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          KM Inicial
                        </p>
                        <p className="font-semibold">
                          {selectedJourney.kmStart.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          KM Final
                        </p>
                        <p className="font-semibold">
                          {selectedJourney.kmEnd.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Distancia
                        </p>
                        <p className="font-semibold text-green-600">
                          {selectedJourney.distance} km
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedJourney.observations && (
                    <div className="rounded-xl border p-4">
                      <h4 className="font-medium text-sm mb-2">Observacoes</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedJourney.observations}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================
  // RENDER: INSPECTION STATE (Checklist)
  // ============================================
  if (journey.status === "inspection") {
    return (
      <div className="space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Vistoria Diaria
            </h1>
            <p className="text-sm text-muted-foreground">
              Verifique todos os itens de seguranca
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["Vistoria", "Check-in", "Em Viagem"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground",
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

        {/* Checklist Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Checklist de Inspecao
            </CardTitle>
            <CardDescription className="text-xs">
              Marque cada item como OK ou Nao OK
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inspectionItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  item.checked === true && "border-green-200 bg-green-50",
                  item.checked === false && "border-red-200 bg-red-50",
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      item.checked === true
                        ? "bg-green-500 text-white"
                        : item.checked === false
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm leading-tight">
                    {item.label}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant={item.checked === true ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12 text-sm font-medium",
                      item.checked === true
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "hover:bg-green-50 hover:border-green-300 hover:text-green-700 bg-transparent",
                    )}
                    onClick={() => handleInspectionChange(item.id, true)}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    OK
                  </Button>
                  <Button
                    size="lg"
                    variant={item.checked === false ? "default" : "outline"}
                    className={cn(
                      "flex-1 h-12 text-sm font-medium",
                      item.checked === false
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "hover:bg-red-50 hover:border-red-300 hover:text-red-700 bg-transparent",
                    )}
                    onClick={() => handleInspectionChange(item.id, false)}
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Nao OK
                  </Button>
                </div>
                {item.checked === false && item.problem && (
                  <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-200">
                    <p className="text-xs text-red-600 font-medium mb-1">
                      Problema reportado:
                    </p>
                    <p className="text-sm text-red-700">{item.problem}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 bg-transparent"
                onClick={handleCancelJourney}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="flex-1 h-12"
                disabled={!canProceedFromInspection()}
                onClick={handleConfirmInspection}
              >
                Confirmar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Problem Description Dialog */}
        <Dialog
          open={!!currentProblemItem}
          onOpenChange={() => setCurrentProblemItem(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Descreva o Problema
              </DialogTitle>
              <DialogDescription>
                {
                  inspectionItems.find((i) => i.id === currentProblemItem)
                    ?.label
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                id="problem-description"
                placeholder="Ex: Pneu dianteiro esquerdo com calibragem baixa..."
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentProblemItem(null)}
                className="flex-1 sm:flex-none bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600"
                onClick={() => {
                  const textarea = document.getElementById(
                    "problem-description",
                  ) as HTMLTextAreaElement;
                  handleProblemConfirm(
                    textarea?.value || "Problema nao especificado",
                  );
                }}
              >
                Confirmar Problema
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Maintenance Problems Dialog */}
        <Dialog
          open={showMaintenanceDialog}
          onOpenChange={setShowMaintenanceDialog}
        >
          <DialogContent className="max-w-md max-h-[85dvh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0 p-6 pb-4">
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Problemas Detectados
              </DialogTitle>
              <DialogDescription>
                Foram encontrados problemas na vistoria. Recomendamos reportar a
                manutencao.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-4">
              <div className="space-y-3">
                {inspectionItems
                  .filter((i) => i.checked === false)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-red-200 bg-red-50 p-4"
                    >
                      <p className="font-medium text-red-700 mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm text-red-600">{item.problem}</p>
                    </div>
                  ))}
              </div>
            </div>
            <DialogFooter className="shrink-0 gap-2 p-6 pt-4 border-t flex-col sm:flex-row">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
                onClick={() => {
                  setShowMaintenanceDialog(false);
                  completeInspection(true);
                }}
              >
                Continuar Mesmo Assim
              </Button>
              <Button
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
                onClick={() => {
                  setShowMaintenanceDialog(false);
                  handleCancelJourney();
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Reportar Manutencao
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================
  // RENDER: CHECK-IN STATE
  // ============================================
  if (journey.status === "ready_to_start") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Check-in
          </h1>
          <p className="text-sm text-muted-foreground">
            Confirme os dados para iniciar
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["Vistoria", "Check-in", "Em Viagem"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground",
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

        {/* Inspection Completed Badge */}
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-500 p-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-700">Vistoria Concluida</p>
            <p className="text-sm text-green-600">
              {journey.hasProblems
                ? "Problemas reportados, prosseguindo com cautela"
                : "Todos os itens verificados"}
            </p>
          </div>
        </div>

        {/* Check-in Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados de Rastreio</CardTitle>
            <CardDescription className="text-xs">
              Confirme sua localizacao e km inicial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GPS Location */}
            <div className="rounded-xl border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-full p-3",
                    locationError ? "bg-red-500/10" : "bg-green-500/10",
                  )}
                >
                  <Navigation
                    className={cn(
                      "h-5 w-5",
                      locationError ? "text-red-500" : "text-green-500",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Localizacao GPS
                  </p>
                  <p className="font-medium truncate">{currentLocation}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    locationError
                      ? "border-red-500 text-red-600"
                      : "border-green-500 text-green-600",
                  )}
                >
                  {locationError ? "Erro" : "Ativo"}
                </Badge>
              </div>
              {locationError && (
                <p className="text-xs text-red-500 mt-2">
                  GPS indisponivel. Voce pode continuar, mas a localizacao sera
                  registrada manualmente.
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="rounded-xl border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data e Hora</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString("pt-BR")} as{" "}
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
              <Label
                htmlFor="startKm"
                className="text-sm flex items-center gap-1"
              >
                <Gauge className="h-4 w-4" />
                Quilometragem Atual (Hodometro) *
              </Label>
              <Input
                id="startKm"
                type="number"
                inputMode="numeric"
                placeholder="Ex: 125430"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Driver Info */}
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Motorista</p>
              <p className="font-medium">{user?.name}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 bg-transparent"
                onClick={handleCancelJourney}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                className="flex-1 h-14 bg-green-500 hover:bg-green-600 text-base font-semibold active:scale-95 transition-transform"
                disabled={!startKm}
                onClick={handleCheckIn}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                INICIAR JORNADA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: ON JOURNEY / PAUSED STATE
  // ============================================
  if (
    journey.status === "on_journey" ||
    journey.status === "resting" ||
    journey.status === "meal"
  ) {
    const isPaused = journey.status === "resting" || journey.status === "meal";

    return (
      <div className="space-y-4">
        {/* Header with Minimize Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Jornada em Andamento
            </h1>
            <p className="text-sm text-muted-foreground">
              Iniciada as {journeyStartTimeDisplay}
            </p>
          </div>
          {/* This button is more for desktop - on mobile the user can just use the bottom nav */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs bg-transparent hidden sm:flex"
            onClick={() => {
              // On desktop, this would need to be handled by parent
              // For now, it's just informational
            }}
          >
            <Minimize2 className="h-4 w-4" />
            Minimizar
          </Button>
        </div>

        {/* KPI Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Car className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-lg font-bold leading-none truncate">
                {formatTimeShort(displayTimes.driving)}
              </p>
              <p className="text-xs text-muted-foreground truncate">Direcao</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-lg font-bold leading-none truncate">
                {formatTimeShort(displayTimes.rest)}
              </p>
              <p className="text-xs text-muted-foreground truncate">Descanso</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-lg font-bold leading-none truncate">
                {formatTimeShort(displayTimes.meal)}
              </p>
              <p className="text-xs text-muted-foreground truncate">Refeicao</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-green-600">
                Ativo
              </p>
              <p className="text-xs text-muted-foreground truncate">GPS</p>
            </div>
          </div>
        </div>

        {/* Main Chronometer Card */}
        <Card
          className={cn(
            "border-2",
            isPaused
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
              : "border-green-500 bg-green-50 dark:bg-green-950",
          )}
        >
          <CardContent className="py-6 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              {journey.status === "resting" ? (
                <>
                  <Coffee className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Parada para Descanso
                  </span>
                </>
              ) : journey.status === "meal" ? (
                <>
                  <Utensils className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Parada para Refeicao
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                  </span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Em Viagem - Rastreamento Ativo
                  </span>
                </>
              )}
            </div>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">
                Tempo Total de Jornada
              </p>
              <p className="font-mono text-5xl font-bold tracking-wider">
                {formatTime(displayTimes.total)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {journey.lastLocation || currentLocation}
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                KM: {journey.startKm}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isPaused ? (
            <Button
              size="lg"
              className="w-full h-14 bg-green-500 hover:bg-green-600 text-base font-semibold active:scale-95 transition-transform"
              onClick={handleResume}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Retomar Viagem
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-amber-500 text-amber-600 hover:bg-amber-50 bg-transparent active:scale-95 transition-transform"
                onClick={() => handlePause("rest")}
              >
                <Coffee className="mr-2 h-5 w-5" />
                Descanso
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-purple-500 text-purple-600 hover:bg-purple-50 bg-transparent active:scale-95 transition-transform"
                onClick={() => handlePause("meal")}
              >
                <Utensils className="mr-2 h-5 w-5" />
                Refeicao
              </Button>
            </div>
          )}

          <Button
            size="lg"
            variant="destructive"
            className="w-full h-14 text-base font-semibold active:scale-95 transition-transform"
            onClick={handleStartCheckout}
          >
            <StopCircle className="mr-2 h-5 w-5" />
            Encerrar Jornada
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: CHECKOUT STATE
  // ============================================
  if (journey.status === "checkout") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Check-out
          </h1>
          <p className="text-sm text-muted-foreground">Finalize sua jornada</p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Encerramento de Jornada</CardTitle>
            <CardDescription className="text-xs">
              Jornada iniciada as {journeyStartTimeDisplay}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">KM Inicial</p>
                <p className="text-xl font-bold">{journey.startKm}</p>
              </div>
              <div className="rounded-xl border bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Tempo Total</p>
                <p className="font-mono text-xl font-bold">
                  {formatTime(displayTimes.total)}
                </p>
              </div>
            </div>

            {/* KM Final Input */}
            <div className="space-y-2">
              <Label
                htmlFor="endKm"
                className="text-sm flex items-center gap-1"
              >
                <Gauge className="h-4 w-4" />
                Quilometragem Final (Hodometro) *
              </Label>
              <Input
                id="endKm"
                type="number"
                inputMode="numeric"
                placeholder="Ex: 125780"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="h-14 text-lg"
              />
            </div>

            {/* Distance Calculated */}
            {endKm && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Distancia Percorrida</span>
                  <span className="text-2xl font-bold text-green-700">
                    {calculateDistance()} km
                  </span>
                </div>
              </div>
            )}

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-sm">
                Observacoes (Opcional)
              </Label>
              <Textarea
                id="observations"
                placeholder="Registre ocorrencias ou observacoes..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-12 bg-transparent"
                onClick={handleResume}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-base font-semibold active:scale-95 transition-transform"
                disabled={!endKm}
                onClick={handleConfirmCheckout}
              >
                <StopCircle className="mr-2 h-5 w-5" />
                CONFIRMAR
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Jornada Finalizada!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="rounded-xl border p-4">
                <h4 className="mb-3 font-medium text-sm">Resumo da Jornada</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium">
                      {journey.startTime
                        ? new Date(journey.startTime).toLocaleDateString(
                            "pt-BR",
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horario</span>
                    <span className="font-medium">
                      {journeyStartTimeDisplay} -{" "}
                      {new Date().toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tempo de Direcao
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(displayTimes.driving)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tempo de Descanso
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(displayTimes.rest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tempo de Refeicao
                    </span>
                    <span className="font-mono font-medium">
                      {formatTime(displayTimes.meal)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Distancia Total</span>
                    <span className="font-bold text-green-600">
                      {calculateDistance()} km
                    </span>
                  </div>
                </div>
              </div>
              {observations && (
                <div className="rounded-xl border p-4">
                  <h4 className="mb-2 font-medium text-sm">Observacoes</h4>
                  <p className="text-sm text-muted-foreground">
                    {observations}
                  </p>
                </div>
              )}
            </div>
            <Button
              className="w-full h-12 active:scale-95 transition-transform"
              onClick={handleFinishJourney}
            >
              Concluir
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
