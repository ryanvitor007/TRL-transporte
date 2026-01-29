"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  useJourney,
  type JourneyStatus,
  type VehicleData,
} from "@/contexts/journey-context";
import { buscarFrotaAPI, salvarManutencaoAPI } from "@/lib/api-service";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  ChevronsUpDown,
  Search,
  Check,
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

interface APIVehicle {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  status: string;
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

// --- STEPPER COMPONENT ---
function JourneyStepper({ currentStep }: { currentStep: number }) {
  const steps = ["Veiculo", "Vistoria", "Check-in", "Em Viagem"];

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
              i === currentStep
                ? "bg-primary text-primary-foreground"
                : i < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="mx-0.5 h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

export function DriverJourneyView() {
  const { user } = useAuth();
  const {
    journey,
    selectVehicle,
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
    cancelJourney, // Certifique-se de que esta função está no Contexto
  } = useJourney();

  const handleChangeVehicle = () => {
    if (journey.selectedVehicle) {
      // Ao "selecionar" o veiculo novamente, o Contexto reseta o status.
      selectVehicle(journey.selectedVehicle);
    }
  };

  // --- LOADING/ERROR STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // --- VEHICLE SELECTION STATE ---
  const [vehicles, setVehicles] = useState<APIVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesError, setVehiclesError] = useState(false);
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");

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
  const [showUrgentApprovalOption, setShowUrgentApprovalOption] = useState(false);
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);
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
  const getCurrentStep = () => {
    switch (journey.status) {
      case "vehicle_selection":
        return 0;
      case "inspection":
        return 1;
      case "ready_to_start":
        return 2;
      case "on_journey":
      case "resting":
      case "meal":
      case "checkout":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getCurrentStep();

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

  // --- LOAD VEHICLES ---
  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError(false);
    try {
      const data = await buscarFrotaAPI();
      setVehicles(data || []);
    } catch {
      setVehiclesError(true);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load vehicles when entering vehicle selection
  useEffect(() => {
    if (journey.status === "vehicle_selection") {
      loadVehicles();
    }
  }, [journey.status, loadVehicles]);

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

  // --- VEHICLE HANDLERS ---
  const handleSelectVehicle = (vehicle: APIVehicle) => {
    const vehicleData: VehicleData = {
      id: vehicle.id,
      plate: vehicle.placa,
      model: `${vehicle.marca} ${vehicle.modelo}`,
    };
    selectVehicle(vehicleData);
    setVehicleSearchOpen(false);
  };

  const handleConfirmVehicle = () => {
    if (journey.selectedVehicle) {
      startInspection();
      setInspectionItems((prev) =>
        prev.map((item) => ({ ...item, checked: null, problem: undefined })),
      );
    }
  };

  // --- INSPECTION HANDLERS ---
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

  const handleCheckIn = async () => {
    // Adicionado verificação do veículo selecionado
    if (!startKm || !journey.selectedVehicle) return;

    try {
      // CORREÇÃO: Passando os 3 argumentos exigidos (Km, Veículo, Localização)
      await startJourney(startKm, journey.selectedVehicle, currentLocation);
    } catch (error) {
      alert("Erro ao iniciar jornada. Tente novamente.");
    }
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

  const handleFinishJourney = async () => {
    // Reset all local states
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined })),
    );
    setStartKm("");
    setEndKm("");
    setObservations("");
    setShowSummaryDialog(false);
    // End journey in context
    await endJourney(endKm, observations);
  };

  const handleCancelJourney = () => {
    setInspectionItems((prev) =>
      prev.map((item) => ({ ...item, checked: null, problem: undefined })),
    );
    setStartKm("");
    cancelJourney();
  };

  // TAREFA 2: Handler para reportar manutencao via API
  const handleReportMaintenance = async () => {
    if (!journey.selectedVehicle || !user?.id) return;

    setIsSubmittingMaintenance(true);

    try {
      // Monta a lista de itens reprovados
      const itensReprovados = inspectionItems
        .filter((item) => item.checked === false)
        .map((item) => `${item.label}${item.problem ? ` (${item.problem})` : ""}`);

      // Monta o objeto de checklist para o banco
      const checklistItems = inspectionItems.reduce<Record<string, boolean>>(
        (acc, item) => {
          if (item.checked !== null) {
            acc[item.id] = item.checked;
          }
          return acc;
        },
        {},
      );

      // Monta as notas com os problemas descritos
      const checklistNotes = inspectionItems
        .filter((item) => item.checked === false && item.problem)
        .map((item) => `${item.id}: ${item.problem}`)
        .join("; ");

      // Garante que temos os dados do veiculo
      const selectedVehicle = journey.selectedVehicle;
      if (!selectedVehicle.plate || !selectedVehicle.model) {
        console.error("[v0] Dados do veiculo incompletos:", selectedVehicle);
        alert("Erro: Dados do veiculo incompletos. Tente selecionar novamente.");
        setIsSubmittingMaintenance(false);
        return;
      }

      const maintenancePayload = {
        vehicle_id: selectedVehicle.id,
        vehicle_plate: selectedVehicle.plate,
        vehicle_model: selectedVehicle.model,
        driver_id: Number(user.id),
        type: "Corretiva - Vistoria Inicial",
        description: `Vistoria Reprovada. Itens: ${itensReprovados.join(", ")}`,
        priority: "Alta",
        status: "Pendente",
        checklist_data: {
          items: checklistItems,
          notes: checklistNotes,
        },
      };

      console.log("[v0] Maintenance Payload:", JSON.stringify(maintenancePayload, null, 2));

      await salvarManutencaoAPI(maintenancePayload);

      // Fecha o modal e reseta estados
      setShowMaintenanceDialog(false);
      setShowUrgentApprovalOption(false);

      // Reseta a vistoria
      setInspectionItems((prev) =>
        prev.map((item) => ({ ...item, checked: null, problem: undefined })),
      );
      cancelJourney();

      // Mostra mensagem de sucesso
      alert("Solicitacao de manutencao enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar manutencao:", error);
      alert("Erro ao solicitar manutencao. Tente novamente.");
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  // Handler para solicitar aprovacao urgente (fluxo antigo)
  const handleRequestUrgentApproval = () => {
    setShowMaintenanceDialog(false);
    setShowUrgentApprovalOption(false);
    completeInspection(true); // Marca que tem problemas e continua
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

  // Filter vehicles by search
  const filteredVehicles = vehicles.filter((v) => {
    const query = vehicleSearchQuery.toLowerCase();
    return (
      v.placa.toLowerCase().includes(query) ||
      v.modelo.toLowerCase().includes(query) ||
      v.marca.toLowerCase().includes(query)
    );
  });

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
  // RENDER: PENDING APPROVAL STATE (Waiting for Admin)
  // ============================================
  if (journey.status === "pending_approval") {
    const waitingTime = journey.pendingApprovalSince
      ? Math.floor((Date.now() - journey.pendingApprovalSince) / 1000)
      : 0;
    const waitingMins = Math.floor(waitingTime / 60);
    const waitingSecs = waitingTime % 60;

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
          <div className="relative">
            <Clock className="h-12 w-12 text-amber-600" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
            </span>
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Aguardando Liberacao da Central
        </h2>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Seu checklist foi enviado para analise. A central precisa autorizar sua
          viagem devido aos itens reprovados.
        </p>

        {/* Veiculo selecionado */}
        {journey.vehicleData && (
          <Card className="mb-6 w-full max-w-sm border-amber-200 bg-amber-50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">
                  {journey.vehicleData.plate}
                </p>
                <p className="text-sm text-muted-foreground">
                  {journey.vehicleData.model}
                </p>
              </div>
              <Badge className="bg-amber-500 text-white">Em Analise</Badge>
            </CardContent>
          </Card>
        )}

        {/* Tempo de espera */}
        <div className="mb-6 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Tempo de espera</p>
          <p className="text-3xl font-bold font-mono text-foreground">
            {waitingMins.toString().padStart(2, "0")}:
            {waitingSecs.toString().padStart(2, "0")}
          </p>
        </div>

        {/* Info */}
        <div className="mb-6 flex max-w-sm items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              Problemas detectados no checklist
            </p>
            <p className="mt-1 text-amber-700">
              A central esta analisando os itens reprovados. Aguarde a
              autorizacao ou entre em contato.
            </p>
          </div>
        </div>

        {/* Botao cancelar */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleCancelJourney}
        >
          <XCircle className="h-4 w-4" />
          Cancelar e Voltar
        </Button>
      </div>
    );
  }

  // ============================================
  // RENDER: BLOCKED STATE (Admin blocked the journey)
  // ============================================
  if (journey.status === "blocked") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Jornada Bloqueada
        </h2>
        <p className="mb-6 max-w-sm text-muted-foreground">
          A central bloqueou esta viagem. O veiculo foi encaminhado para
          manutencao.
        </p>

        {/* Motivo do bloqueio */}
        {journey.blockReason && (
          <div className="mb-6 flex max-w-sm items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Motivo do bloqueio</p>
              <p className="mt-1 text-red-700">{journey.blockReason}</p>
            </div>
          </div>
        )}

        {/* Botao voltar */}
        <Button
          variant="default"
          className="gap-2"
          onClick={handleCancelJourney}
        >
          <Home className="h-4 w-4" />
          Voltar ao Inicio
        </Button>
      </div>
    );
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
            Gestão de Jornada
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle seu tempo de direção e faça a vistoria diária
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
              Selecione o veiculo e complete a vistoria diaria
            </p>
            <Button
              size="lg"
              className="h-14 px-8 text-base gap-2 active:scale-95 transition-transform"
              onClick={handleStartInspection}
            >
              <PlayCircle className="h-5 w-5" />
              Comecar Jornada
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
  // RENDER: VEHICLE SELECTION STATE
  // ============================================
  if (journey.status === "vehicle_selection") {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Seleção de Veículo
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha o veiculo para iniciar a jornada
          </p>
        </div>

        {/* Progress Steps */}
        <JourneyStepper currentStep={currentStep} />

        {/* Vehicle Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-primary" />
              Veiculo da Jornada
            </CardTitle>
            <CardDescription className="text-xs">
              Busque pela placa ou modelo do veiculo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vehicle Search Combobox */}
            {vehiclesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : vehiclesError ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <WifiOff className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Erro ao carregar veiculos
                </p>
                <Button
                  onClick={loadVehicles}
                  variant="outline"
                  className="bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <>
                <Popover
                  open={vehicleSearchOpen}
                  onOpenChange={setVehicleSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vehicleSearchOpen}
                      className="w-full h-12 justify-between bg-transparent"
                    >
                      {journey.selectedVehicle ? (
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {journey.selectedVehicle.plate} -{" "}
                          {journey.selectedVehicle.model}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Search className="h-4 w-4" />
                          Buscar veiculo...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    {/* AQUI ESTÁ O TRUQUE: shouldFilter={false} */}
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Digite a placa ou modelo..."
                        value={vehicleSearchQuery}
                        onValueChange={setVehicleSearchQuery}
                      />
                      <CommandList>
                        {filteredVehicles.length === 0 && (
                          <CommandEmpty>
                            Nenhum veiculo encontrado.
                          </CommandEmpty>
                        )}
                        <CommandGroup>
                          {filteredVehicles.map((vehicle) => (
                            <CommandItem
                              key={vehicle.id}
                              // CORREÇÃO CRÍTICA: O value deve conter o texto que está sendo buscado (Placa/Modelo).
                              // Se usarmos apenas o ID ("1"), o componente acha que não bate com a busca ("ABC") e desabilita o clique.
                              value={`${vehicle.placa} ${vehicle.marca} ${vehicle.modelo}`}
                              onSelect={() => {
                                handleSelectVehicle(vehicle);
                              }}
                              // Força o cursor e remove restrições de ponteiro caso o estilo esteja bloqueando
                              className="flex items-center gap-3 py-3 cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Truck className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{vehicle.placa}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {vehicle.marca} {vehicle.modelo}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 text-xs",
                                  vehicle.status === "Ativo" ||
                                    vehicle.status === "ativo"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700",
                                )}
                              >
                                {vehicle.status}
                              </Badge>
                              {journey.selectedVehicle?.id === vehicle.id && (
                                <Check className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Selected Vehicle Card */}
                {journey.selectedVehicle && (
                  <div className="rounded-xl border-2 border-primary/50 bg-primary/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Truck className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl font-bold tracking-wider">
                          {journey.selectedVehicle.plate}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {journey.selectedVehicle.model}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 shrink-0">
                        Selecionado
                      </Badge>
                    </div>
                  </div>
                )}

                {vehicles.length === 0 && !vehiclesLoading && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">Nenhum veiculo cadastrado</p>
                  </div>
                )}
              </>
            )}

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
                className="flex-1 h-12"
                disabled={!journey.selectedVehicle}
                onClick={handleConfirmVehicle}
              >
                Confirmar Veiculo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
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
        <JourneyStepper currentStep={currentStep} />

        {/* Selected Vehicle Info */}
        {journey.selectedVehicle && (
          <div className="rounded-xl border bg-muted/50 p-3 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{journey.selectedVehicle.plate}</p>
              <p className="text-xs text-muted-foreground truncate">
                {journey.selectedVehicle.model}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangeVehicle}
              className="text-xs shrink-0 bg-transparent"
            >
              Trocar Veiculo
            </Button>
          </div>
        )}

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

        {/* TAREFA 1: Modal Redesenhado - Problemas na Vistoria */}
        <Dialog
          open={showMaintenanceDialog}
          onOpenChange={(open) => {
            setShowMaintenanceDialog(open);
            if (!open) setShowUrgentApprovalOption(false);
          }}
        >
          <DialogContent className="max-w-md max-h-[85dvh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0 p-6 pb-4 bg-red-50 border-b border-red-200">
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-6 w-6" />
                Vistoria Reprovada
              </DialogTitle>
              <DialogDescription className="text-red-600">
                {inspectionItems.filter((i) => i.checked === false).length} item(ns) com problema(s) detectado(s)
              </DialogDescription>
            </DialogHeader>
            
            {/* Lista de problemas */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                Itens Reprovados
              </p>
              <div className="space-y-3">
                {inspectionItems
                  .filter((i) => i.checked === false)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border-2 border-red-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-red-800">
                            {item.label}
                          </p>
                          {item.problem && (
                            <p className="text-sm text-red-600 mt-1">
                              {item.problem}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Info box */}
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Recomendacao:</strong> Solicite manutencao para garantir a seguranca da viagem.
                  A equipe de manutencao sera notificada imediatamente.
                </p>
              </div>
            </div>

            {/* Footer com acoes */}
            <div className="shrink-0 p-6 pt-4 border-t bg-muted/30 space-y-3">
              {/* Botao Principal - Solicitar Manutencao */}
              <Button
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleReportMaintenance}
                disabled={isSubmittingMaintenance}
              >
                {isSubmittingMaintenance ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Solicitando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Solicitar Manutencao e Encerrar
                  </span>
                )}
              </Button>

              {/* Link sutil para opcao de urgencia */}
              {!showUrgentApprovalOption ? (
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-amber-600 underline py-2 transition-colors"
                  onClick={() => setShowUrgentApprovalOption(true)}
                >
                  Preciso realizar a viagem com urgencia (Solicitar Aprovacao)
                </button>
              ) : (
                <div className="space-y-3 pt-2 border-t border-dashed">
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold">Atencao:</p>
                        <p>Sua solicitacao sera enviada para a central. Voce devera aguardar a aprovacao antes de iniciar a viagem.</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={handleRequestUrgentApproval}
                    disabled={isSubmittingMaintenance}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Solicitar Aprovacao da Central
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1"
                    onClick={() => setShowUrgentApprovalOption(false)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
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
        <JourneyStepper currentStep={currentStep} />

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
            {/* Vehicle Info */}
            {journey.selectedVehicle && (
              <div className="rounded-xl border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Veiculo</p>
                    <p className="font-medium">
                      {journey.selectedVehicle.plate} -{" "}
                      {journey.selectedVehicle.model}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
              {isPaused
                ? journey.status === "resting"
                  ? "Em descanso"
                  : "Em refeicao"
                : "Dirigindo"}
            </p>
          </div>
        </div>

        {/* Main Timer Card */}
        <Card
          className={cn(
            "border-2",
            isPaused
              ? "border-amber-300 bg-amber-50"
              : "border-green-300 bg-green-50",
          )}
        >
          <CardContent className="pt-6">
            {/* Big Timer Display */}
            <div className="text-center mb-6">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                Tempo Total
              </p>
              <p className="text-5xl font-bold tracking-tight tabular-nums">
                {formatTime(displayTimes.total)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Iniciado as {journeyStartTimeDisplay}
              </p>
            </div>

            {/* Time Breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div
                className={cn(
                  "rounded-xl p-3 text-center",
                  journey.status === "on_journey"
                    ? "bg-green-500 text-white"
                    : "bg-white border",
                )}
              >
                <Car className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Direcao</p>
                <p className="font-bold tabular-nums">
                  {formatTimeShort(displayTimes.driving)}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl p-3 text-center",
                  journey.status === "resting"
                    ? "bg-amber-500 text-white"
                    : "bg-white border",
                )}
              >
                <Coffee className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Descanso</p>
                <p className="font-bold tabular-nums">
                  {formatTimeShort(displayTimes.rest)}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl p-3 text-center",
                  journey.status === "meal"
                    ? "bg-orange-500 text-white"
                    : "bg-white border",
                )}
              >
                <Utensils className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xs opacity-80">Refeicao</p>
                <p className="font-bold tabular-nums">
                  {formatTimeShort(displayTimes.meal)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isPaused ? (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold bg-green-500 hover:bg-green-600 active:scale-95 transition-transform"
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
                    className="h-14 text-sm font-medium bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => handlePause("rest")}
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    Descanso
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 text-sm font-medium bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
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
                Finalizar Jornada
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Journey Info Card */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Vehicle */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Veiculo</p>
                <p className="font-medium truncate">
                  {journey.vehicleData?.plate} - {journey.vehicleData?.model}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Localizacao</p>
                <p className="font-medium truncate">{journey.lastLocation}</p>
              </div>
            </div>

            {/* KM */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KM Inicial</p>
                <p className="font-medium">{journey.startKm}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            Finalizar Jornada
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados finais
          </p>
        </div>

        {/* Summary Card */}
        <Card className="border-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo da Jornada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted p-3 text-center">
                <Timer className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Tempo Total</p>
                <p className="font-bold">{formatTime(displayTimes.total)}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-center">
                <Car className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-muted-foreground">Direcao</p>
                <p className="font-bold text-green-700">
                  {formatTime(displayTimes.driving)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <Coffee className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-xs text-muted-foreground">Descanso</p>
                <p className="font-bold text-amber-700">
                  {formatTime(displayTimes.rest)}
                </p>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-center">
                <Utensils className="h-5 w-5 mx-auto text-orange-600 mb-1" />
                <p className="text-xs text-muted-foreground">Refeicao</p>
                <p className="font-bold text-orange-700">
                  {formatTime(displayTimes.meal)}
                </p>
              </div>
            </div>

            {/* End KM Input */}
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
              {endKm && Number(endKm) > Number(journey.startKm) && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Route className="h-4 w-4" />
                  Distancia percorrida: {calculateDistance()} km
                </p>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-sm">
                Observacoes (opcional)
              </Label>
              <Textarea
                id="observations"
                placeholder="Adicione observacoes sobre a viagem..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="min-h-[100px]"
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
                className="flex-1 h-14 bg-primary text-base font-semibold active:scale-95 transition-transform"
                disabled={!endKm || Number(endKm) <= Number(journey.startKm)}
                onClick={handleConfirmCheckout}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Confirmation Dialog */}
        <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Confirmar Finalizacao
              </DialogTitle>
              <DialogDescription>
                Revise os dados da jornada antes de finalizar
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-xl bg-green-50 p-4 text-center">
                <p className="text-3xl font-bold text-green-700">
                  {calculateDistance()} km
                </p>
                <p className="text-sm text-green-600">Distancia Percorrida</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">KM Inicial</p>
                  <p className="font-semibold">{journey.startKm}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">KM Final</p>
                  <p className="font-semibold">{endKm}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Tempo Total</p>
                <p className="font-semibold">
                  {formatTime(displayTimes.total)}
                </p>
              </div>
              {observations && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Observacoes</p>
                  <p className="font-medium">{observations}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSummaryDialog(false)}
                className="flex-1 sm:flex-none bg-transparent"
              >
                Revisar
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600"
                onClick={handleFinishJourney}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar Jornada
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Fallback
  return null;
}
