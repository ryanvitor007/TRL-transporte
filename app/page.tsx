"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { DashboardView } from "@/components/dashboard-view";
import { FleetView } from "@/components/fleet-view";
import { MaintenanceView } from "@/components/maintenance-view";
import { DocumentsView } from "@/components/documents-view";
import { SettingsView } from "@/components/settings-view";
import { FinancialsView } from "@/components/financials-view";
import { TiresView } from "@/components/tires-view";
import { IncidentsView } from "@/components/incidents-view";
import { TachographView } from "@/components/tachograph-view";
import { ReportsView } from "@/components/reports-view";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        setIsChecking(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  if (isChecking && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "fleet":
        return <FleetView />;
      case "financials":
        return <FinancialsView />;
      case "tires":
        return <TiresView />;
      case "tachograph":
        return <TachographView />;
      case "incidents":
        return <IncidentsView />;
      case "maintenance":
        return <MaintenanceView />;
      case "documents":
        return <DocumentsView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto bg-background p-4 pt-4 lg:p-8 lg:pt-6 max-h-[calc(100vh-57px)]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
