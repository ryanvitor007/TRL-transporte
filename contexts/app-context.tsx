"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Branch } from "@/lib/mock-data"

interface ComparisonConfig {
  isActive: boolean
  type: "vehicles" | "periods"
  selectedVehicles: string[]
  referenceMonth: string
  currentMonth: string
}

interface AppContextType {
  selectedBranch: Branch | "Todas"
  setSelectedBranch: (branch: Branch | "Todas") => void
  comparison: ComparisonConfig
  setComparison: (config: ComparisonConfig) => void
  toggleComparison: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | "Todas">("Todas")
  const [comparison, setComparison] = useState<ComparisonConfig>({
    isActive: false,
    type: "vehicles",
    selectedVehicles: [],
    referenceMonth: "Nov/25",
    currentMonth: "Jan/26",
  })

  const toggleComparison = () => {
    setComparison((prev) => ({ ...prev, isActive: !prev.isActive }))
  }

  return (
    <AppContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
        comparison,
        setComparison,
        toggleComparison,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
