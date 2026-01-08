"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardView } from "@/components/dashboard-view"
import { FleetView } from "@/components/fleet-view"
import { MaintenanceView } from "@/components/maintenance-view"
import { DocumentsView } from "@/components/documents-view"
import { SettingsView } from "@/components/settings-view"
import { FinancialsView } from "@/components/financials-view"
import { TiresView } from "@/components/tires-view"
import { IncidentsView } from "@/components/incidents-view"
import { TachographView } from "@/components/tachograph-view"

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard")

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />
      case "fleet":
        return <FleetView />
      case "financials":
        return <FinancialsView />
      case "tires":
        return <TiresView />
      case "tachograph":
        return <TachographView />
      case "incidents":
        return <IncidentsView />
      case "maintenance":
        return <MaintenanceView />
      case "documents":
        return <DocumentsView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-auto bg-background p-4 pt-16 lg:p-8 lg:pt-8 max-h-screen">{renderView()}</main>
    </div>
  )
}
