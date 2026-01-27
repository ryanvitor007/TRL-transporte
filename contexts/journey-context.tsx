"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToastNotification } from "@/contexts/notification-context";
import {
  iniciarJornadaAPI,
  finalizarJornadaAPI,
  registrarEventoJornadaAPI,
  buscarJornadaAtivaAPI,
  buscarStatusJornadaAPI,
} from "@/lib/api-service";

export type JourneyStatus =
  | "inactive"
  | "inspection"
  | "ready_to_start"
  | "vehicle_selection"
  | "pending_approval"
  | "on_journey"
  | "resting"
  | "meal"
  | "checkout"
  | "blocked";

export interface VehicleData {
  id: number;
  plate: string;
  model: string;
}

export interface InspectionItemState {
  id: string;
  checked: boolean | null;
  problem?: string;
}

export interface JourneyState {
  isActive: boolean;
  journeyId: number | null;
  status: JourneyStatus;
  startTime: number | null;
  vehicleData: VehicleData | null;
  selectedVehicle: VehicleData | null;
  lastLocation: string;
  startKm: string;
  accumulatedDrivingSeconds: number;
  accumulatedRestSeconds: number;
  accumulatedMealSeconds: number;
  currentSegmentStart: number | null;
  inspectionItems: InspectionItemState[];
  hasProblems: boolean;
  pendingApprovalSince: number | null;
  blockReason: string | null;
}

interface JourneyContextType {
  journey: JourneyState;
  selectVehicle: (vehicle: VehicleData) => void;
  startInspection: () => void;
  updateInspectionItem: (
    id: string,
    checked: boolean,
    problem?: string,
  ) => void;
  completeInspection: (hasProblems: boolean) => void;
  startJourney: (
    startKm: string,
    vehicleData: VehicleData,
    location: string,
  ) => Promise<void>;
  pauseJourney: (type: "rest" | "meal") => Promise<void>;
  resumeJourney: () => Promise<void>;
  startCheckout: () => void;
  endJourney: (endKm: string, observations?: string) => Promise<void>;
  updateLocation: (location: string) => void;
  cancelJourney: () => void;
  getTotalElapsedSeconds: () => number;
  getDrivingSeconds: () => number;
  getRestSeconds: () => number;
  getMealSeconds: () => number;
  confirmVehicleSelection: () => void;
  checkApprovalStatus: () => Promise<void>;
  handleApprovalGranted: () => void;
  handleJourneyBlocked: (reason: string) => void;
}

const STORAGE_KEY = "trl_journey_state";

const defaultJourneyState: JourneyState = {
  isActive: false,
  journeyId: null,
  status: "inactive",
  startTime: null,
  vehicleData: null,
  selectedVehicle: null,
  lastLocation: "",
  startKm: "",
  accumulatedDrivingSeconds: 0,
  accumulatedRestSeconds: 0,
  accumulatedMealSeconds: 0,
  currentSegmentStart: null,
  inspectionItems: [],
  hasProblems: false,
  pendingApprovalSince: null,
  blockReason: null,
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToastNotification();
  const [journey, setJourney] = useState<JourneyState>(defaultJourneyState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JourneyState;
        if (parsed.isActive) {
          setJourney(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estado da jornada:", error);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const checkActiveJourney = async () => {
      if (user?.id && !journey.isActive) {
        try {
          const active = await buscarJornadaAtivaAPI(user.id);
          if (active) {
            console.log("Jornada ativa encontrada no banco:", active);
            // TODO: Restaurar estado do banco se necessário
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    if (isHydrated) checkActiveJourney();
  }, [user, isHydrated, journey.isActive]);

  useEffect(() => {
    if (isHydrated) {
      try {
        if (journey.isActive) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Erro ao salvar estado:", error);
      }
    }
  }, [journey, isHydrated]);

  // Cálculos de tempo (mantidos iguais)
  const getCurrentSegmentSeconds = useCallback(() => {
    if (!journey.currentSegmentStart) return 0;
    return Math.floor((Date.now() - journey.currentSegmentStart) / 1000);
  }, [journey.currentSegmentStart]);

  const getTotalElapsedSeconds = useCallback(() => {
    if (!journey.startTime) return 0;
    return Math.floor((Date.now() - journey.startTime) / 1000);
  }, [journey.startTime]);

  const getDrivingSeconds = useCallback(() => {
    const current =
      journey.status === "on_journey" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedDrivingSeconds + current;
  }, [
    journey.status,
    journey.accumulatedDrivingSeconds,
    getCurrentSegmentSeconds,
  ]);

  const getRestSeconds = useCallback(() => {
    const current =
      journey.status === "resting" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedRestSeconds + current;
  }, [
    journey.status,
    journey.accumulatedRestSeconds,
    getCurrentSegmentSeconds,
  ]);

  const getMealSeconds = useCallback(() => {
    const current = journey.status === "meal" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedMealSeconds + current;
  }, [
    journey.status,
    journey.accumulatedMealSeconds,
    getCurrentSegmentSeconds,
  ]);

  // --- AÇÕES ---

  const selectVehicle = useCallback((vehicle: VehicleData) => {
    setJourney((prev) => ({
      ...prev,
      isActive: true,
      status: "vehicle_selection",
      selectedVehicle: vehicle,
      vehicleData: vehicle,
    }));
  }, []);

  const confirmVehicleSelection = useCallback(() => {
    setJourney((prev) => {
      if (!prev.selectedVehicle) return prev;
      return {
        ...prev,
        status: "inspection", // Avança para a vistoria
      };
    });
  }, []);

  const startInspection = useCallback(() => {
    setJourney((prev) => {
      const hasSelectedVehicle = Boolean(prev.selectedVehicle);
      const nextStatus: JourneyStatus = hasSelectedVehicle
        ? "inspection"
        : "vehicle_selection";
      return {
        ...prev,
        isActive: true,
        status: nextStatus,
        inspectionItems: [],
        hasProblems: false,
      };
    });
  }, []);

  const updateInspectionItem = useCallback(
    (id: string, checked: boolean, problem?: string) => {
      setJourney((prev) => {
        const existingIndex = prev.inspectionItems.findIndex(
          (item) => item.id === id,
        );
        const newItems = [...prev.inspectionItems];

        if (existingIndex >= 0) {
          newItems[existingIndex] = { id, checked, problem };
        } else {
          newItems.push({ id, checked, problem });
        }

        console.log("Checklist atualizado:", newItems); // Debug visual
        return { ...prev, inspectionItems: newItems };
      });
    },
    [],
  );

  const completeInspection = useCallback((hasProblems: boolean) => {
    setJourney((prev) => ({
      ...prev,
      status: "ready_to_start",
      hasProblems,
    }));
  }, []);

  const startJourney = useCallback(
    async (startKm: string, vehicleData: VehicleData, location: string) => {
      const now = Date.now();

      // TRANSFORMAÇÃO DE DADOS (CRUCIAL):
      // Converte o Array da UI para o Objeto JSON que o Backend espera
      // CORREÇÃO: Agora inclui TODOS os itens, mesmo os com checked = null (não interagidos)
      // Isso garante que o backend receba o estado completo do checklist
      const checklistItemsPayload = journey.inspectionItems.reduce<
        Record<string, boolean>
      >((acc, item) => {
        // Inclui o item se o valor for explicitamente true ou false
        // Itens null (não preenchidos) são tratados como true (aprovado por padrão)
        if (item.checked === true || item.checked === false) {
          acc[item.id] = item.checked;
        } else if (item.checked === null) {
          // Se o item não foi interagido, considera como aprovado
          acc[item.id] = true;
        }
        return acc;
      }, {});

      // Monta as notas de problemas (apenas itens explicitamente reprovados)
      const problemsNote = journey.inspectionItems
        .filter((i) => i.checked === false && i.problem)
        .map((i) => `${i.id}: ${i.problem}`)
        .join("; ");

      const hasRejectedItems =
        journey.hasProblems ||
        journey.inspectionItems.some((item) => item.checked === false);

      try {
        if (!user?.id) throw new Error("Usuário não identificado");

        // Garante o ID do veículo
        const finalVehicleId = vehicleData?.id || journey.selectedVehicle?.id;
        if (!finalVehicleId) throw new Error("Veículo não selecionado");

        const payload = {
          driverId: Number(user.id),
          vehicleId: finalVehicleId,
          startLocation: location,
          startOdometer: Number(startKm),
          checklist: {
            items: checklistItemsPayload,
            notes: problemsNote || "",
          },
        };

        // DEBUG: Log detalhado para rastrear o fluxo de dados
        console.log("[v0] === INICIO DEBUG CHECKLIST ===");
        console.log(
          "[v0] inspectionItems (estado bruto):",
          JSON.stringify(journey.inspectionItems, null, 2),
        );
        console.log(
          "[v0] checklistItemsPayload (após reduce):",
          JSON.stringify(checklistItemsPayload, null, 2),
        );
        console.log("[v0] hasRejectedItems:", hasRejectedItems);
        console.log(
          "[v0] PAYLOAD FINAL PARA API:",
          JSON.stringify(payload, null, 2),
        );
        console.log("[v0] === FIM DEBUG CHECKLIST ===");

        const data = await iniciarJornadaAPI(payload);
        console.log("Resposta Backend Iniciar:", data);

        // Se tem itens rejeitados, entra em modo de espera de aprovacao
        if (hasRejectedItems) {
          toast.warning(
            "Aguardando aprovacao",
            "Checklist com problemas enviado para analise da central.",
          );

          setJourney((prev) => ({
            ...prev,
            journeyId: data.id,
            status: "pending_approval",
            pendingApprovalSince: now,
            startKm,
            vehicleData,
            lastLocation: location,
          }));
          return;
        }

        // Jornada aprovada automaticamente (sem problemas no checklist)
        setJourney((prev) => ({
          ...prev,
          journeyId: data.id,
          status: "on_journey",
          startTime: now,
          currentSegmentStart: now,
          startKm,
          vehicleData,
          lastLocation: location,
          accumulatedDrivingSeconds: 0,
          accumulatedRestSeconds: 0,
          accumulatedMealSeconds: 0,
          pendingApprovalSince: null,
        }));
      } catch (error) {
        console.error("Erro ao iniciar jornada:", error);
        alert("Erro de conexão ao iniciar jornada. Tente novamente.");
      }
    },
    [
      journey.inspectionItems,
      journey.selectedVehicle,
      journey.hasProblems,
      toast,
      user,
    ],
  );

  // ... (pauseJourney, resumeJourney, startCheckout mantidos iguais) ...
  const pauseJourney = useCallback(
    async (type: "rest" | "meal") => {
      const now = Date.now();
      if (journey.journeyId) {
        registrarEventoJornadaAPI({
          journeyId: journey.journeyId,
          type: type === "rest" ? "start_rest" : "start_meal",
          location: journey.lastLocation,
        }).catch(console.error);
      }
      setJourney((prev) => {
        const segmentSeconds = prev.currentSegmentStart
          ? Math.floor((now - prev.currentSegmentStart) / 1000)
          : 0;
        return {
          ...prev,
          status: type === "rest" ? "resting" : "meal",
          currentSegmentStart: now,
          accumulatedDrivingSeconds:
            prev.status === "on_journey"
              ? prev.accumulatedDrivingSeconds + segmentSeconds
              : prev.accumulatedDrivingSeconds,
        };
      });
    },
    [journey.journeyId, journey.lastLocation],
  );

  const resumeJourney = useCallback(async () => {
    const now = Date.now();
    if (journey.journeyId) {
      const eventType = journey.status === "resting" ? "end_rest" : "end_meal";
      registrarEventoJornadaAPI({
        journeyId: journey.journeyId,
        type: eventType,
        location: journey.lastLocation,
      }).catch(console.error);
    }
    setJourney((prev) => {
      const segmentSeconds = prev.currentSegmentStart
        ? Math.floor((now - prev.currentSegmentStart) / 1000)
        : 0;
      return {
        ...prev,
        status: "on_journey",
        currentSegmentStart: now,
        accumulatedRestSeconds:
          prev.status === "resting"
            ? prev.accumulatedRestSeconds + segmentSeconds
            : prev.accumulatedRestSeconds,
        accumulatedMealSeconds:
          prev.status === "meal"
            ? prev.accumulatedMealSeconds + segmentSeconds
            : prev.accumulatedMealSeconds,
      };
    });
  }, [journey.journeyId, journey.status, journey.lastLocation]);

  const startCheckout = useCallback(() => {
    const now = Date.now();
    setJourney((prev) => {
      const segmentSeconds = prev.currentSegmentStart
        ? Math.floor((now - prev.currentSegmentStart) / 1000)
        : 0;
      return {
        ...prev,
        status: "checkout",
        currentSegmentStart: null,
        accumulatedDrivingSeconds:
          prev.status === "on_journey"
            ? prev.accumulatedDrivingSeconds + segmentSeconds
            : prev.accumulatedDrivingSeconds,
      };
    });
  }, []);

  const endJourney = useCallback(
    async (endKm?: string, observations?: string) => {
      if (journey.journeyId && endKm) {
        try {
          await finalizarJornadaAPI(journey.journeyId, {
            endLocation: journey.lastLocation,
            endOdometer: Number(endKm),
            checklist: {
              items: {},
              notes: observations,
            },
          });
        } catch (e) {
          console.error("Erro ao finalizar no backend", e);
        }
      }
      setJourney(defaultJourneyState);
    },
    [journey.journeyId, journey.lastLocation],
  );

  const updateLocation = useCallback((location: string) => {
    setJourney((prev) => ({
      ...prev,
      lastLocation: location,
    }));
  }, []);

  const cancelJourney = useCallback(() => {
    setJourney(defaultJourneyState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Funcao para verificar status de aprovacao (polling)
  const checkApprovalStatus = useCallback(async () => {
    if (!journey.journeyId || journey.status !== "pending_approval") return;

    try {
      const status = await buscarStatusJornadaAPI(journey.journeyId);

      if (status === "active") {
        // Admin aprovou - libera para jornada
        const now = Date.now();
        toast.success(
          "Jornada autorizada",
          "A central liberou sua viagem. Tenha uma boa jornada!",
        );
        setJourney((prev) => ({
          ...prev,
          status: "on_journey",
          startTime: now,
          currentSegmentStart: now,
          pendingApprovalSince: null,
          accumulatedDrivingSeconds: 0,
          accumulatedRestSeconds: 0,
          accumulatedMealSeconds: 0,
        }));
      } else if (status === "cancelled" || status === "blocked") {
        // Admin bloqueou
        toast.error(
          "Jornada bloqueada",
          "A central bloqueou esta viagem. Verifique com a manutencao.",
        );
        setJourney((prev) => ({
          ...prev,
          status: "blocked",
          blockReason: "Bloqueado pela central - checklist reprovado",
        }));
      }
    } catch (error) {
      console.error("Erro ao verificar status de aprovacao:", error);
    }
  }, [journey.journeyId, journey.status, toast]);

  // Handler quando aprovacao e concedida (chamado via socket ou polling)
  const handleApprovalGranted = useCallback(() => {
    const now = Date.now();
    toast.success(
      "Jornada autorizada",
      "A central liberou sua viagem. Tenha uma boa jornada!",
    );
    setJourney((prev) => ({
      ...prev,
      status: "on_journey",
      startTime: now,
      currentSegmentStart: now,
      pendingApprovalSince: null,
      accumulatedDrivingSeconds: 0,
      accumulatedRestSeconds: 0,
      accumulatedMealSeconds: 0,
    }));
  }, [toast]);

  // Handler quando jornada e bloqueada
  const handleJourneyBlocked = useCallback(
    (reason: string) => {
      toast.error(
        "Jornada bloqueada",
        reason || "A central bloqueou esta viagem.",
      );
      setJourney((prev) => ({
        ...prev,
        status: "blocked",
        blockReason: reason,
      }));
    },
    [toast],
  );

  // Polling automatico quando em estado de espera
  useEffect(() => {
    if (journey.status !== "pending_approval" || !journey.journeyId) return;

    // Verifica a cada 5 segundos
    const interval = setInterval(() => {
      checkApprovalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [journey.status, journey.journeyId, checkApprovalStatus]);

  if (!isHydrated) return null;

  return (
    <JourneyContext.Provider
      value={{
        journey,
        selectVehicle,
        confirmVehicleSelection,
        startInspection,
        updateInspectionItem,
        completeInspection,
        startJourney,
        pauseJourney,
        resumeJourney,
        startCheckout,
        endJourney,
        updateLocation,

        cancelJourney,
        checkApprovalStatus,
        handleApprovalGranted,
        handleJourneyBlocked,

        getTotalElapsedSeconds,
        getDrivingSeconds,
        getRestSeconds,
        getMealSeconds,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error("useJourney must be used within a JourneyProvider");
  }
  return context;
}
