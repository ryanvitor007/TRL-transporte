"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Calendar,
  Car,
  ChevronDown,
  DollarSign,
  ExternalLink,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
export interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  note?: string;
}

export interface ChecklistData {
  type: "initial" | "final";
  completedAt: string;
  driverName: string;
  items: ChecklistItem[];
}

export interface ChecklistMaintenance {
  id: number;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_model: string;
  type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  status: string;
  provider: string;
  km_at_maintenance: number;
  invoice_url?: string;
  journey_id?: number;
  checklistData: ChecklistData;
}

interface ChecklistMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: ChecklistMaintenance | null;
  onApproveQuote?: (maintenanceId: number) => Promise<void>;
  onMarkResolved?: (maintenanceId: number) => Promise<void>;
  onViewJourney?: (journeyId: number) => void;
}

export function ChecklistMaintenanceModal({
  open,
  onOpenChange,
  maintenance,
  onApproveQuote,
  onMarkResolved,
  onViewJourney,
}: ChecklistMaintenanceModalProps) {
  const [isApprovingQuote, setIsApprovingQuote] = useState(false);
  const [isMarkingResolved, setIsMarkingResolved] = useState(false);
  const [isApprovedOpen, setIsApprovedOpen] = useState(false);

  if (!maintenance) return null;

  const { checklistData } = maintenance;

  // Separate items into failed and passed
  const failedItems = checklistData.items.filter((item) => !item.passed);
  const passedItems = checklistData.items.filter((item) => item.passed);

  // Origin badge styling based on checklist type
  const originBadgeConfig = {
    initial: {
      label: "Origem: Checklist Inicial",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    final: {
      label: "Origem: Checklist Final",
      className: "bg-purple-100 text-purple-800 border-purple-200",
    },
  };

  const originConfig = originBadgeConfig[checklistData.type];

  // Format date
  const formattedDate = format(
    new Date(checklistData.completedAt),
    "dd/MM/yyyy 'as' HH:mm",
    { locale: ptBR },
  );

  // Handlers
  const handleApproveQuote = async () => {
    if (!onApproveQuote) return;
    setIsApprovingQuote(true);
    try {
      await onApproveQuote(maintenance.id);
    } finally {
      setIsApprovingQuote(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!onMarkResolved) return;
    setIsMarkingResolved(true);
    try {
      await onMarkResolved(maintenance.id);
    } finally {
      setIsMarkingResolved(false);
    }
  };

  const handleViewJourney = () => {
    if (onViewJourney && maintenance.journey_id) {
      onViewJourney(maintenance.journey_id);
    }
  };

  // Group failed items by category for better organization
  const failedByCategory = failedItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        {/* --- HEADER --- */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <DialogTitle className="text-lg font-semibold">
                  Detalhes da Manutencao
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium", originConfig.className)}
                >
                  {originConfig.label}
                </Badge>
              </div>
              <DialogDescription className="sr-only">
                Detalhes da manutencao gerada a partir do checklist de jornada
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {maintenance.vehicle_plate}
                  </span>
                  <span className="text-muted-foreground">
                    - {maintenance.vehicle_model}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* --- BODY --- */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* Section 1: Failed Items (The Reason for Maintenance) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-100">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Itens Reprovados
                </h3>
                <Badge variant="destructive" className="ml-auto text-xs">
                  {failedItems.length}{" "}
                  {failedItems.length === 1 ? "problema" : "problemas"}
                </Badge>
              </div>

              {failedItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center text-sm text-muted-foreground">
                  Nenhum item foi reprovado neste checklist.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(failedByCategory).map(([category, items]) => (
                    <div
                      key={category}
                      className="rounded-lg border border-red-200 bg-red-50/50 overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-red-100/50 border-b border-red-200">
                        <span className="text-xs font-medium text-red-800 uppercase tracking-wide">
                          {category}
                        </span>
                      </div>
                      <div className="divide-y divide-red-100">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-3 flex items-start gap-3"
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 shrink-0 mt-0.5">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-red-900">
                                {item.name}
                              </p>
                              {item.note && (
                                <p className="mt-1 text-sm text-red-700/80 bg-red-100/50 rounded px-2 py-1 italic">
                                  "{item.note}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Section 2: Passed Items (Collapsible) */}
            <Collapsible open={isApprovedOpen} onOpenChange={setIsApprovedOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 py-2 text-left hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground flex-1">
                    Itens Aprovados
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-green-100 text-green-700"
                  >
                    {passedItems.length}{" "}
                    {passedItems.length === 1 ? "item" : "itens"}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isApprovedOpen && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50/30 p-3">
                  {passedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum item foi aprovado.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {passedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm text-green-700/80"
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Additional Info */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Informacoes Adicionais
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Motorista:</span>
                  <p className="font-medium">{checklistData.driverName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{maintenance.status}</p>
                </div>
                {maintenance.cost > 0 && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Custo Estimado:
                    </span>
                    <p className="font-medium">
                      {maintenance.cost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                )}
                {maintenance.provider && (
                  <div>
                    <span className="text-muted-foreground">Oficina:</span>
                    <p className="font-medium">{maintenance.provider}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* --- FOOTER --- */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2">
          {maintenance.journey_id && onViewJourney && (
            <Button
              variant="outline"
              onClick={handleViewJourney}
              className="gap-2 bg-transparent"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Detalhes da Jornada</span>
              <span className="sm:hidden">Ver Jornada</span>
            </Button>
          )}

          <div className="flex gap-2 ml-auto">
            {onMarkResolved && (
              <Button
                variant="outline"
                onClick={handleMarkResolved}
                disabled={isMarkingResolved || isApprovingQuote}
                className="gap-2 bg-transparent"
              >
                {isMarkingResolved ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Marcar como Resolvido</span>
                <span className="sm:hidden">Resolvido</span>
              </Button>
            )}

            {onApproveQuote && (
              <Button
                onClick={handleApproveQuote}
                disabled={isApprovingQuote || isMarkingResolved}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                {isApprovingQuote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Aprovar Orcamento</span>
                <span className="sm:hidden">Aprovar</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- EXAMPLE USAGE DATA ---
export const exampleChecklistMaintenance: ChecklistMaintenance = {
  id: 1,
  vehicle_id: 1,
  vehicle_plate: "ABC-1234",
  vehicle_model: "Volvo FH 460",
  type: "Corretiva",
  description: "Manutencao gerada a partir do checklist inicial da jornada",
  scheduled_date: "2026-01-21",
  cost: 1500,
  status: "Aguardando Aprovacao",
  provider: "Oficina Central",
  km_at_maintenance: 150000,
  journey_id: 123,
  checklistData: {
    type: "initial",
    completedAt: "2026-01-21T08:30:00",
    driverName: "Joao Silva",
    items: [
      {
        id: "1",
        name: "Pneu Dianteiro Esquerdo",
        category: "Pneus",
        passed: false,
        note: "Pneu careca, precisa trocar urgente",
      },
      {
        id: "2",
        name: "Pneu Dianteiro Direito",
        category: "Pneus",
        passed: true,
      },
      {
        id: "3",
        name: "Pneu Traseiro Esquerdo",
        category: "Pneus",
        passed: true,
      },
      {
        id: "4",
        name: "Pneu Traseiro Direito",
        category: "Pneus",
        passed: true,
      },
      {
        id: "5",
        name: "Nivel do Oleo",
        category: "Fluidos",
        passed: false,
        note: "Oleo abaixo do minimo",
      },
      {
        id: "6",
        name: "Nivel do Liquido de Arrefecimento",
        category: "Fluidos",
        passed: true,
      },
      {
        id: "7",
        name: "Farol Dianteiro Esquerdo",
        category: "Iluminacao",
        passed: false,
        note: "Lampada queimada",
      },
      {
        id: "8",
        name: "Farol Dianteiro Direito",
        category: "Iluminacao",
        passed: true,
      },
      {
        id: "9",
        name: "Lanterna Traseira",
        category: "Iluminacao",
        passed: true,
      },
      {
        id: "10",
        name: "Freio de Servico",
        category: "Freios",
        passed: true,
      },
      {
        id: "11",
        name: "Freio de Estacionamento",
        category: "Freios",
        passed: true,
      },
      {
        id: "12",
        name: "Extintor de Incendio",
        category: "Seguranca",
        passed: true,
      },
      {
        id: "13",
        name: "Triangulo de Sinalizacao",
        category: "Seguranca",
        passed: true,
      },
      {
        id: "14",
        name: "Cinto de Seguranca",
        category: "Seguranca",
        passed: true,
      },
      {
        id: "15",
        name: "Limpador de Para-brisa",
        category: "Acessorios",
        passed: true,
      },
    ],
  },
};
