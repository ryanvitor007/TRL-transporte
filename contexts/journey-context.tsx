"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// --- TYPES ---
export type JourneyStatus =
  | "inactive"
  | "inspection"
  | "ready_to_start"
  | "on_journey"
  | "resting"
  | "meal"
  | "checkout";

export interface VehicleData {
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
  journeyId: string | null;
  status: JourneyStatus;
  startTime: number | null; // timestamp
  vehicleData: VehicleData | null;
  lastLocation: string;
  startKm: string;
  // Timer breakdowns (accumulated seconds before current segment)
  accumulatedDrivingSeconds: number;
  accumulatedRestSeconds: number;
  accumulatedMealSeconds: number;
  // Current segment start time (for calculating current segment duration)
  currentSegmentStart: number | null;
  // Inspection state
  inspectionItems: InspectionItemState[];
  hasProblems: boolean;
}

interface JourneyContextType {
  journey: JourneyState;
  // Actions
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
  ) => void;
  pauseJourney: (type: "rest" | "meal") => void;
  resumeJourney: () => void;
  startCheckout: () => void;
  endJourney: () => void;
  updateLocation: (location: string) => void;
  // Computed values
  getTotalElapsedSeconds: () => number;
  getDrivingSeconds: () => number;
  getRestSeconds: () => number;
  getMealSeconds: () => number;
}

const STORAGE_KEY = "trl_journey_state";

const defaultJourneyState: JourneyState = {
  isActive: false,
  journeyId: null,
  status: "inactive",
  startTime: null,
  vehicleData: null,
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
  const [journey, setJourney] = useState<JourneyState>(defaultJourneyState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JourneyState;
        // Validate the stored state
        if (parsed.isActive && parsed.startTime) {
          setJourney(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load journey state:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (isHydrated) {
      try {
        if (journey.isActive) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to save journey state:", error);
      }
    }
  }, [journey, isHydrated]);

  // Calculate current segment duration
  const getCurrentSegmentSeconds = useCallback(() => {
    if (!journey.currentSegmentStart) return 0;
    return Math.floor((Date.now() - journey.currentSegmentStart) / 1000);
  }, [journey.currentSegmentStart]);

  // Get total elapsed time
  const getTotalElapsedSeconds = useCallback(() => {
    if (!journey.startTime) return 0;
    return Math.floor((Date.now() - journey.startTime) / 1000);
  }, [journey.startTime]);

  // Get driving seconds (accumulated + current if on_journey)
  const getDrivingSeconds = useCallback(() => {
    const current =
      journey.status === "on_journey" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedDrivingSeconds + current;
  }, [
    journey.status,
    journey.accumulatedDrivingSeconds,
    getCurrentSegmentSeconds,
  ]);

  // Get rest seconds (accumulated + current if resting)
  const getRestSeconds = useCallback(() => {
    const current =
      journey.status === "resting" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedRestSeconds + current;
  }, [
    journey.status,
    journey.accumulatedRestSeconds,
    getCurrentSegmentSeconds,
  ]);

  // Get meal seconds (accumulated + current if meal)
  const getMealSeconds = useCallback(() => {
    const current = journey.status === "meal" ? getCurrentSegmentSeconds() : 0;
    return journey.accumulatedMealSeconds + current;
  }, [
    journey.status,
    journey.accumulatedMealSeconds,
    getCurrentSegmentSeconds,
  ]);

  // --- ACTIONS ---

  const startInspection = useCallback(() => {
    setJourney((prev) => ({
      ...prev,
      isActive: true,
      journeyId: `journey_${Date.now()}`,
      status: "inspection",
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

  const startJourney = useCallback(
    (startKm: string, vehicleData: VehicleData, location: string) => {
      const now = Date.now();
      setJourney((prev) => ({
        ...prev,
        status: "on_journey",
        startTime: now,
        currentSegmentStart: now,
        startKm,
        vehicleData,
        lastLocation: location,
        accumulatedDrivingSeconds: 0,
        accumulatedRestSeconds: 0,
        accumulatedMealSeconds: 0,
      }));
    },
    [],
  );

  const pauseJourney = useCallback((type: "rest" | "meal") => {
    const now = Date.now();
    setJourney((prev) => {
      // Accumulate the current segment's driving time
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
  }, []);

  const resumeJourney = useCallback(() => {
    const now = Date.now();
    setJourney((prev) => {
      // Accumulate the current pause segment
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
  }, []);

  const startCheckout = useCallback(() => {
    const now = Date.now();
    setJourney((prev) => {
      // Accumulate the final segment
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
  }, []);

  const endJourney = useCallback(() => {
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
