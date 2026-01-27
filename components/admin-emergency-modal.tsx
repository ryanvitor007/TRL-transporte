"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Truck,
  User,
  Wrench,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JornadaMonitoramento } from "@/lib/api-service";
import {
  autorizarJornadaComRiscoAPI,
  bloquearJornadaAPI,
} from "@/lib/api-service";

interface AdminEmergencyModalProps {
  journey: JornadaMonitoramento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

// Mapeia IDs de checklist para labels legiveis
const checklistLabels: Record<string, string> = {
  tires: "Pneus (Calibragem e Estado)",
  fluids: "Niveis (Agua e Oleo)",
  brakes: "Freios (Teste visual/pedal)",
  lights: "Iluminacao (Farois, Setas e Freio)",
  panel: "Painel e Instrumentos",
};

export function AdminEmergencyModal({
  journey,
  open,
  onOpenChange,
  onActionComplete,
}: AdminEmergencyModalProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showConfirmAuthorize, setShowConfirmAuthorize] = useState(false);
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);

  if (!journey) return null;

  const rejectedItems = journey.rejectedItems || [];
  const hasRejectedItems = rejectedItems.length > 0;

  const handleAuthorize = async () => {
    if (!showConfirmAuthorize) {
      setShowConfirmAuthorize(true);
      return;
    }

    setIsAuthorizing(true);
    try {
      await autorizarJornadaComRiscoAPI(journey.id, adminNotes);
      onOpenChange(false);
      onActionComplete?.();
      // Reset states
      setAdminNotes("");
      setShowConfirmAuthorize(false);
    } catch (error) {
      console.error("Erro ao autorizar jornada:", error);
      alert("Erro ao autorizar. Tente novamente.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleBlock = async () => {
    if (!showConfirmBlock) {
      setShowConfirmBlock(true);
      return;
    }

    setIsBlocking(true);
    try {
      const reason = adminNotes || "Checklist reprovado - itens criticos";
      await bloquearJornadaAPI(journey.id, reason);
      onOpenChange(false);
      onActionComplete?.();
      // Reset states
      setAdminNotes("");
      setShowConfirmBlock(false);
    } catch (error) {
      console.error("Erro ao bloquear jornada:", error);
      alert("Erro ao bloquear. Tente novamente.");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleClose = () => {
    setShowConfirmAuthorize(false);
    setShowConfirmBlock(false);
    setAdminNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-red-200 bg-gradient-to-b from-red-50 to-background">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl text-red-700">
                Alerta de Manutencao
              </DialogTitle>
              <DialogDescription>
                Checklist com itens reprovados requer sua aprovacao
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 pr-4">
            {/* Info do Motorista/Veiculo */}
            <div className="rounded-lg border border-red-200 bg-white p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
                  {journey.driverPhoto ? (
                    <img
                      src={journey.driverPhoto}
                      alt={journey.driverName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-7 w-7 text-red-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {journey.driverName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-red-300 bg-red-100 font-mono text-red-700"
                    >
                      <Truck className="mr-1 h-3 w-3" />
                      {journey.vehiclePlate}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {journey.vehicleModel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Itens Reprovados */}
            {hasRejectedItems && (
              <div className="rounded-lg border border-red-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
                  <FileWarning className="h-4 w-4" />
                  Itens Reprovados no Checklist ({rejectedItems.length})
                </div>
                <div className="space-y-2">
                  {rejectedItems.map((itemId) => (
                    <div
                      key={itemId}
                      className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700"
                    >
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{checklistLabels[itemId] || itemId}</span>
                    </div>
                  ))}
                </div>

                {/* Notas do motorista */}
                {journey.checklistNotes && (
                  <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm">
                    <p className="font-medium text-amber-800">
                      Observacao do motorista:
                    </p>
                    <p className="mt-1 text-amber-700">
                      {journey.checklistNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Campo de Notas do Admin */}
            <div className="space-y-2">
              <Label htmlFor="admin-notes" className="text-sm font-medium">
                Observacoes do Administrador (opcional)
              </Label>
              <Textarea
                id="admin-notes"
                placeholder="Adicione observacoes sobre sua decisao..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Avisos de Confirmacao */}
            {showConfirmAuthorize && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800">
                      Confirmar autorizacao com risco?
                    </p>
                    <p className="mt-1 text-amber-700">
                      Esta acao sera registrada e o motorista podera iniciar a
                      viagem mesmo com itens reprovados.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showConfirmBlock && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <Wrench className="h-5 w-5 shrink-0 text-red-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-800">
                      Confirmar bloqueio e manutencao?
                    </p>
                    <p className="mt-1 text-red-700">
                      A jornada sera cancelada, o veiculo ficara bloqueado e uma
                      ordem de manutencao sera criada automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {/* Botao Bloquear */}
          <Button
            variant="destructive"
            className="flex-1 gap-2"
            onClick={handleBlock}
            disabled={isAuthorizing || isBlocking}
          >
            {isBlocking ? (
              <span className="animate-pulse">Bloqueando...</span>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                {showConfirmBlock
                  ? "Confirmar Bloqueio"
                  : "Bloquear e Solicitar Manutencao"}
              </>
            )}
          </Button>

          {/* Botao Autorizar */}
          <Button
            variant="outline"
            className={cn(
              "flex-1 gap-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
              showConfirmAuthorize &&
                "border-green-300 bg-green-50 text-green-700 hover:bg-green-100",
            )}
            onClick={handleAuthorize}
            disabled={isAuthorizing || isBlocking}
          >
            {isAuthorizing ? (
              <span className="animate-pulse">Autorizando...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {showConfirmAuthorize
                  ? "Confirmar Autorizacao"
                  : "Autorizar Viagem com Risco"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
