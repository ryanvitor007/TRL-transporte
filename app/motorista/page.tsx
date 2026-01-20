"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DriverSidebar } from "@/components/driver-sidebar";
import { DriverTopBar } from "@/components/driver-top-bar";
import { DriverMobileNav } from "@/components/driver-mobile-nav";
import { DriverTachographView } from "@/components/driver-tachograph-view";
import { DriverMaintenanceView } from "@/components/driver-maintenance-view";
import { DriverIncidentsView } from "@/components/driver-incidents-view";
import { DriverJourneyView } from "@/components/driver-journey-view";
import { DriverProfileView } from "@/components/driver-profile-view";
import { LoaderTRL } from "@/components/ui/custom-loader";
import { useMobile } from "@/hooks/use-mobile";

export default function DriverDashboard() {
  const [activeView, setActiveView] = useState("journey");
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const isMobile = useMobile();

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
        <LoaderTRL size="lg" text="Carregando..." />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case "journey":
        return <DriverJourneyView />;
      case "tachograph":
        return <DriverTachographView />;
      case "incidents":
        return <DriverIncidentsView />;
      case "maintenance":
        return <DriverMaintenanceView />;
      case "profile":
        return <DriverProfileView />;
      default:
        return <DriverJourneyView />;
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              TRL Transporte
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Ola, {user?.name?.split(" ")[0] || "Motorista"}
          </div>
        </header>

        {/* Main Content - with bottom padding for nav */}
        <main className="flex-1 overflow-auto p-4 pb-24">{renderView()}</main>

        {/* Bottom Navigation */}
        <DriverMobileNav activeView={activeView} onViewChange={setActiveView} />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex min-h-screen">
      <DriverSidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 flex-col">
        <DriverTopBar />
        <main className="flex-1 overflow-auto bg-background p-4 pt-6 lg:p-8 lg:pt-8 max-h-[calc(100vh-57px)]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
