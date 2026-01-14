"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DriverSidebar } from "@/components/driver-sidebar";
import { DriverTopBar } from "@/components/driver-top-bar";
import { TachographView } from "@/components/tachograph-view";
import { MaintenanceView } from "@/components/maintenance-view";
import { IncidentsView } from "@/components/incidents-view";
import { Loader2 } from "lucide-react";

export default function DriverDashboard() {
  const [activeView, setActiveView] = useState("tachograph");
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "motorista") {
        router.push("/");
      } else {
        setIsChecking(false);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "tachograph":
        return <TachographView />;
      case "incidents":
        return <IncidentsView />;
      case "maintenance":
        return <MaintenanceView />;
      default:
        return <TachographView />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <DriverSidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 flex-col">
        <DriverTopBar />
        <main className="flex-1 overflow-auto bg-background p-4 pt-4 lg:p-8 lg:pt-6 max-h-[calc(100vh-57px)]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
