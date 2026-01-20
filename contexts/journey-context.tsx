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
import {
  iniciarJornadaAPI,
  finalizarJornadaAPI,
  registrarEventoJornadaAPI,
  buscarJornadaAtivaAPI,
} from "@/lib/api-service";

// --- TYPES ---
export type JourneyStatus =
  | "inactive"
  | "vehicle_selection"
  | "inspection"
  | "ready_to_start"
  | "on_journey"
  | "resting"
  | "meal"
  | "checkout";

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
}

interface JourneyContextType {
  journey: JourneyState;
  selectVehicle: (vehicle: VehicleData) => void;
  confirmVehicleSelection: () => void;
  startInspection: () => void;
  updateInspectionItem: (
    id: string,
    checked: boolean,
    problem?: string,
  ) => void;
  completeInspection: (hasProblems: boolean) => void;
  startJourney: (startKm: string, location: string) => Promise<void>;
  pauseJourney: (type: "rest" | "meal") => Promise<void>;
  resumeJourney: () => Promise<void>;
  startCheckout: () => void;
  endJourney: (endKm?: string, observations?: string) => Promise<void>;
  updateLocation: (location: string) => void;
  getTotalElapsedSeconds: () => number;
  getDrivingSeconds: () => number;
  getRestSeconds: () => number;
  getMealSeconds: () => number;
  cancelJourney: () => void;
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
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [journey, setJourney] = useState<JourneyState>(defaultJourneyState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JourneyState;
        if (parsed.isActive && parsed.startTime) {
          setJourney(parsed);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estado da jornada:", error);
    }
    setIsHydrated(true);
  }, []);

  // Check for active journey in backend (sync)
  useEffect(() => {
    const checkActiveJourney = async () => {
      if (user?.id && !journey.isActive) {
        try {
          const active = await buscarJornadaAtivaAPI(user.id);
          if (active) {
            console.log("Jornada ativa encontrada no banco:", active);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    if (isHydrated) checkActiveJourney();
  }, [user, isHydrated, journey.isActive]);

  // Save to localStorage on changes
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

  // --- TIME CALCULATIONS ---
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

  // --- ACTIONS ---

  const selectVehicle = useCallback((vehicle: VehicleData) => {
    setJourney((prev) => ({
      ...prev,
      isActive: true,
      status: "vehicle_selection",
      selectedVehicle: vehicle,
    }));
  }, []);

  const confirmVehicleSelection = useCallback(() => {
    setJourney((prev) => ({
      ...prev,
      status: "inspection",
      inspectionItems: [],
      hasProblems: false,
    }));
  }, []);

  const startInspection = useCallback(() => {
    setJourney((prev) => ({
      ...prev,
      isActive: true,
      status: "vehicle_selection",
      selectedVehicle: null,
      inspectionItems: [],
      hasProblems: false,
    }));
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

  // --- START JOURNEY (INTEGRATED WITH BACKEND) ---
  const startJourney = useCallback(
    async (startKm: string, location: string) => {
      const now = Date.now();

      // Convert inspection items to backend format
      const checklistItemsMap = journey.inspectionItems.reduce(
        (acc: Record<string, boolean>, item) => {
          acc[item.id] = item.checked === true;
          return acc;
        },
        {},
      );

      // Capture problem notes
      const problemsNote = journey.inspectionItems
        .filter((i) => !i.checked && i.problem)
        .map((i) => `${i.id}: ${i.problem}`)
        .join("; ");

      try {
        if (!user?.id) throw new Error("Usuário não identificado");
        if (!journey.selectedVehicle)
          throw new Error("Veículo não selecionado");

        const data = await iniciarJornadaAPI({
          driverId: Number(user.id),
          vehicleId: journey.selectedVehicle.id,
          startLocation: location,
          startOdometer: Number(startKm),
          checklist: {
            items: checklistItemsMap,
            notes: problemsNote,
          },
        });

        console.log("Jornada criada no backend:", data);

        // Update local state
        setJourney((prev) => ({
          ...prev,
          journeyId: data.id,
          status: "on_journey",
          startTime: now,
          currentSegmentStart: now,
          startKm,
          vehicleData: prev.selectedVehicle,
          lastLocation: location,
          accumulatedDrivingSeconds: 0,
          accumulatedRestSeconds: 0,
          accumulatedMealSeconds: 0,
        }));
      } catch (error) {
        console.error("Erro ao iniciar jornada:", error);
        throw error;
      }
    },
    [journey.inspectionItems, journey.selectedVehicle, user],
  );

  // --- PAUSE (INTEGRATED) ---
  const pauseJourney = useCallback(
    async (type: "rest" | "meal") => {
      const now = Date.now();

      // Update backend
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

  // --- RESUME (INTEGRATED) ---
  const resumeJourney = useCallback(async () => {
    const now = Date.now();

    // Update backend
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

  // --- END JOURNEY (INTEGRATED) ---
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

  const cancelJourney = useCallback(() => {
    setJourney(defaultJourneyState);
  }, []);

  const updateLocation = useCallback((location: string) => {
    setJourney((prev) => ({
      ...prev,
      lastLocation: location,
    }));
  }, []);

  // Don't render children until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

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
        getTotalElapsedSeconds,
        getDrivingSeconds,
        getRestSeconds,
        getMealSeconds,
        cancelJourney,
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
