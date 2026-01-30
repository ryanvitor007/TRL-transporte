"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Car,
  User,
  XCircle,
  FileText,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- INTERFACES ---
interface ChecklistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: any | null;
}

// Helper para parsear e normalizar os dados do checklist
function parseChecklistItems(checklistData: any): { name: string; passed: boolean; note?: string }[] {
  if (!checklistData) return [];

  // Se ja e um array de itens estruturados (formato antigo)
  if (Array.isArray(checklistData.items)) {
    return checklistData.items.map((item: any) => ({
      name: item.name || item.id || "Item",
      passed: item.passed ?? item.value ?? true,
      note: item.note || item.observacao,
    }));
  }

  // Se items e um objeto { "Pneus": false, "Freios": true }
  if (checklistData.items && typeof checklistData.items === "object") {
    return Object.entries(checklistData.items).map(([key, value]) => ({
      name: key,
      passed: value === true || value === "true" || value === "ok",
      note: undefined,
    }));
  }

  // Se o proprio checklistData e um objeto simples { "Pneus": false }
  if (typeof checklistData === "object" && !Array.isArray(checklistData)) {
    // Ignorar campos de metadados conhecidos
    const metadataKeys = ["type", "completedAt", "driverName", "notes", "observacoes", "created_at"];
    return Object.entries(checklistData)
      .filter(([key]) => !metadataKeys.includes(key))
      .map(([key, value]) => ({
        name: key,
        passed: value === true || value === "true" || value === "ok",
        note: undefined,
      }));
  }

  return [];
}

// Helper para extrair observacoes/notas
function getChecklistNotes(checklistData: any): string | null {
  if (!checklistData) return null;
  return checklistData.notes || checklistData.observacoes || checklistData.note || null;
}

export function ChecklistDetailsModal({
  isOpen,
  onClose,
  maintenance,
}: ChecklistDetailsModalProps) {
  if (!maintenance) return null;

  // Tenta pegar checklist_data ou checklistData
  const rawChecklistData = maintenance.checklist_data || maintenance.checklistData;

  // Parseia os dados do checklist
  const allItems = parseChecklistItems(rawChecklistData);
  const failedItems = allItems.filter((item) => !item.passed);
  const notes = getChecklistNotes(rawChecklistData);

  // Extrai informacoes do veiculo e motorista com fallbacks seguros
  const vehiclePlate = maintenance.vehicle?.placa || maintenance.vehicle_plate || "N/A";
  const vehicleModel = maintenance.vehicle?.modelo || maintenance.vehicle_model || "";
  const driverName = rawChecklistData?.driverName || maintenance.requested_by || maintenance.driver?.name || "Nao informado";

  // Formata a data
  const createdDate = maintenance.created_at || maintenance.scheduled_date;
  let formattedDate = "Data nao informada";
  if (createdDate) {
    try {
      formattedDate = format(new Date(createdDate), "dd/MM HH:mm", { locale: ptBR });
    } catch {
      formattedDate = String(createdDate);
    }
  }

  // Se nao houver dados de checklist validos
  const hasValidData = allItems.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        {/* --- HEADER --- */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b bg-muted/30 space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold leading-tight">
                Detalhes da Vistoria
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                #{maintenance.id}
              </p>
            </div>
            {failedItems.length > 0 && (
              <Badge variant="destructive" className="shrink-0">
                {failedItems.length} {failedItems.length === 1 ? "problema" : "problemas"}
              </Badge>
            )}
          </div>
          <DialogDescription className="sr-only">
            Detalhes da manutencao gerada a partir do checklist de vistoria
          </DialogDescription>
        </DialogHeader>

        {/* --- BODY --- */}
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Card de Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground leading-tight">Data/Hora</p>
                  <p className="text-sm font-medium truncate">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <Car className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground leading-tight">Veiculo</p>
                  <p className="text-sm font-medium truncate">{vehiclePlate}</p>
                  {vehicleModel && (
                    <p className="text-xs text-muted-foreground truncate">{vehicleModel}</p>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground leading-tight">Motorista</p>
                  <p className="text-sm font-medium truncate">{driverName}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Secao de Itens Reprovados */}
            {hasValidData ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Itens Reprovados</h3>
                </div>

                {failedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-green-300 bg-green-50/50 p-4 text-center">
                    <p className="text-sm text-green-700">
                      Todos os itens foram aprovados na vistoria.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {failedItems.map((item, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl",
                          "bg-red-50 border border-red-200"
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 shrink-0 mt-0.5">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-red-900">
                            {item.name}
                          </p>
                          {item.note && (
                            <p className="mt-1 text-sm text-red-700/80 italic">
                              "{item.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-muted-foreground/25 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum detalhe de checklist disponivel.
                </p>
              </div>
            )}

            {/* Secao de Observacoes */}
            {notes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">Observacoes</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {notes}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
