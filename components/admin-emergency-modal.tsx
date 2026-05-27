"use client";

import { useState, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Truck,
  User,
  Wrench,
  FileWarning,
  Loader2,
  Ban,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastNotification } from "@/contexts/notification-context";
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

// Mapeia IDs de checklist para labels legiveis com icones
const checklistLabels: Record<
  string,
  { label: string; severity: "high" | "medium" }
> = {
  tires: { label: "Pneu Careca / Calibragem", severity: "high" },
  fluids: { label: "Niveis de Fluidos (Agua/Oleo)", severity: "medium" },
  brakes: { label: "Sistema de Freios", severity: "high" },
  lights: { label: "Iluminacao e Sinalizacao", severity: "medium" },
  panel: { label: "Painel de Instrumentos", severity: "medium" },
};

// =============================================================
// SUB-COMPONENTE: Visualizador de fotos com efeito de leque
// =============================================================
const PLACEHOLDER_PHOTOS = [
  "https://placehold.co/800x600/1a1a2e/e94560?text=Foto+1",
  "https://placehold.co/800x600/16213e/0f3460?text=Foto+2",
  "https://placehold.co/800x600/0f3460/e94560?text=Foto+3",
];

function ChecklistPhotoViewer({ photos }: { photos?: string[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Usa placeholders se não vier fotos reais
  const displayPhotos =
    photos && photos.length > 0 ? photos : PLACEHOLDER_PHOTOS;

  const visibleCount = Math.min(displayPhotos.length, 3);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev === 0 ? displayPhotos.length - 1 : prev - 1,
    );
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev === displayPhotos.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <>
      {/* Leque de fotos */}
      <div
        className="group flex items-center cursor-pointer"
        style={{ width: `${20 + (visibleCount - 1) * 14}px` }}
        onClick={() => openLightbox(0)}
        title={`Ver ${displayPhotos.length} foto(s)`}
      >
        {displayPhotos.slice(0, 3).map((src, idx) => (
          <div
            key={idx}
            className="relative shrink-0 h-8 w-8 rounded-full border-2 border-white shadow-md overflow-hidden
              transition-all duration-300 ease-out
              group-hover:translate-x-0"
            style={{
              marginLeft: idx === 0 ? 0 : -10,
              zIndex: 3 - idx,
              transitionDelay: `${idx * 30}ms`,
            }}
          >
            <img
              src={src}
              alt={`Evidência ${idx + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/80x80/dc2626/ffffff?text=Err";
              }}
            />
          </div>
        ))}
        {displayPhotos.length > 3 && (
          <div
            className="relative shrink-0 h-8 w-8 rounded-full border-2 border-white bg-red-600 shadow-md
              flex items-center justify-center text-white text-[10px] font-bold"
            style={{ marginLeft: -10, zIndex: 0 }}
          >
            +{displayPhotos.length - 3}
          </div>
        )}
        <Camera className="h-3.5 w-3.5 text-red-500 ml-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 bg-black/95 border-neutral-800 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizador de Fotos</DialogTitle>
            <DialogDescription>
              Evidências fotográficas do item reprovado no checklist
            </DialogDescription>
          </DialogHeader>

          {/* Contador */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-medium">
              {currentIndex + 1} / {displayPhotos.length}
            </span>
          </div>

          {/* Fechar */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Imagem principal */}
          <div className="relative flex items-center justify-center min-h-[400px] max-h-[70vh]">
            <img
              src={displayPhotos[currentIndex]}
              alt={`Evidência ${currentIndex + 1}`}
              className="max-h-[70vh] max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/800x600/dc2626/ffffff?text=Imagem+Indisponivel";
              }}
            />

            {/* Navegação */}
            {displayPhotos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {displayPhotos.length > 1 && (
            <div className="flex gap-2 p-3 justify-center bg-black/80 overflow-x-auto">
              {displayPhotos.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all",
                    currentIndex === idx
                      ? "border-red-500 scale-105"
                      : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <img
                    src={src}
                    alt={`Thumb ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminEmergencyModal({
  journey,
  open,
  onOpenChange,
  onActionComplete,
}: AdminEmergencyModalProps) {
  // ========================================
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO
  // Nunca coloque hooks depois de um return condicional
  // ========================================
  const toast = useToastNotification();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showConfirmAuthorize, setShowConfirmAuthorize] = useState(false);
  const [showConfirmBlock, setShowConfirmBlock] = useState(false);

  // Reset de estados ao fechar
  const resetStates = useCallback(() => {
    setAdminNotes("");
    setShowConfirmAuthorize(false);
    setShowConfirmBlock(false);
    setIsAuthorizing(false);
    setIsBlocking(false);
  }, []);

  const handleAuthorize = useCallback(async () => {
    if (!journey) return;

    if (!showConfirmAuthorize) {
      setShowConfirmAuthorize(true);
      setShowConfirmBlock(false);
      return;
    }

    setIsAuthorizing(true);
    try {
      await autorizarJornadaComRiscoAPI(journey.id, adminNotes);
      onOpenChange(false);
      resetStates();
      setTimeout(() => {
        onActionComplete?.();
      }, 100);
    } catch (error: any) {
      console.error("Erro ao autorizar jornada:", error);
      setIsAuthorizing(false);
      
      // Feedback amigável para o administrador
      toast.error('Operação Negada', error.message || 'Não foi possível autorizar a viagem.');
      
      // Fecha o modal e atualiza o estado imediatamente
      onOpenChange(false);
      resetStates();
      setTimeout(() => {
        onActionComplete?.();
      }, 100);
    }
  }, [
    journey,
    adminNotes,
    showConfirmAuthorize,
    onOpenChange,
    onActionComplete,
    resetStates,
    toast,
  ]);

  const handleBlock = useCallback(async () => {
    if (!journey) return;

    if (!showConfirmBlock) {
      setShowConfirmBlock(true);
      setShowConfirmAuthorize(false);
      return;
    }

    setIsBlocking(true);
    try {
      const reason =
        adminNotes ||
        "Checklist reprovado - itens criticos identificados na vistoria";
      await bloquearJornadaAPI(journey.id, reason);
      onOpenChange(false);
      resetStates();
      setTimeout(() => {
        onActionComplete?.();
      }, 100);
    } catch (error: any) {
      console.error("Erro ao bloquear jornada:", error);
      setIsBlocking(false);
      
      // Feedback amigável para o administrador
      toast.error('Operação Negada', error.message || 'Não foi possível bloquear a viagem.');
      
      // Fecha o modal e atualiza o estado imediatamente
      onOpenChange(false);
      resetStates();
      setTimeout(() => {
        onActionComplete?.();
      }, 100);
    }
  }, [
    journey,
    adminNotes,
    showConfirmBlock,
    onOpenChange,
    onActionComplete,
    resetStates,
    toast,
  ]);

  const handleClose = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        if (isAuthorizing || isBlocking) return;
        resetStates();
        onOpenChange(false);
      }
    },
    [isAuthorizing, isBlocking, resetStates, onOpenChange],
  );

  // ========================================
  // AGORA SIM PODEMOS FAZER EARLY RETURN
  // Depois que todos os hooks foram chamados
  // ========================================
  if (!journey) {
    return null;
  }

  const rejectedItems = journey.rejectedItems || [];
  const hasRejectedItems = rejectedItems.length > 0;

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
            <div className="rounded-lg border-2 border-red-300 bg-white overflow-hidden">
              <div className="flex items-center gap-2 bg-red-100 px-4 py-3">
                <FileWarning className="h-5 w-5 text-red-600" />
                <span className="font-bold text-red-800">
                  Itens Criticos Reprovados
                </span>
                <Badge className="ml-auto bg-red-600 text-white">
                  {rejectedItems.length} item(ns)
                </Badge>
              </div>

              <div className="p-3 space-y-2">
                {hasRejectedItems ? (
                  rejectedItems.map((itemId) => {
                    const itemInfo = checklistLabels[itemId] || {
                      label: itemId,
                      severity: "medium",
                    };
                    const isHighSeverity = itemInfo.severity === "high";
                    const label = itemInfo.label;

                    return (
                      <div
                        key={itemId}
                        className={cn(
                          "flex items-center gap-3 rounded-lg p-3 text-sm",
                          isHighSeverity
                            ? "bg-red-100 border border-red-300"
                            : "bg-amber-50 border border-amber-200",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            isHighSeverity ? "bg-red-200" : "bg-amber-200",
                          )}
                        >
                          <XCircle
                            className={cn(
                              "h-5 w-5",
                              isHighSeverity
                                ? "text-red-600"
                                : "text-amber-600",
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <span
                            className={cn(
                              "font-semibold",
                              isHighSeverity
                                ? "text-red-800"
                                : "text-amber-800",
                            )}
                          >
                            {label}
                          </span>
                          {isHighSeverity && (
                            <Badge className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0">
                              CRITICO
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <ChecklistPhotoViewer />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isHighSeverity
                                ? "border-red-400 text-red-700"
                                : "border-amber-400 text-amber-700",
                            )}
                          >
                            Reprovado
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm">
                      Checklist reprovado sem itens especificos
                    </p>
                  </div>
                )}
              </div>

              {journey.checklistNotes && (
                <>
                  <Separator />
                  <div className="p-3 bg-amber-50">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-800 text-sm">
                          Observacao do Motorista:
                        </p>
                        <p className="mt-1 text-amber-700 text-sm">
                          {journey.checklistNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

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

        <DialogFooter className="flex-col gap-3 sm:flex-row pt-2">
          <Button
            variant="destructive"
            size="lg"
            className={cn(
              "flex-1 gap-2 font-semibold",
              showConfirmBlock && "bg-red-700 hover:bg-red-800",
            )}
            onClick={handleBlock}
            disabled={isAuthorizing || isBlocking}
          >
            {isBlocking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Bloqueando...
              </>
            ) : (
              <>
                {showConfirmBlock ? (
                  <Ban className="h-4 w-4" />
                ) : (
                  <Wrench className="h-4 w-4" />
                )}
                {showConfirmBlock
                  ? "CONFIRMAR BLOQUEIO"
                  : "Bloquear + Manutencao"}
              </>
            )}
          </Button>

          <Button
            size="lg"
            className={cn(
              "flex-1 gap-2 font-semibold transition-colors",
              showConfirmAuthorize
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white",
            )}
            onClick={handleAuthorize}
            disabled={isAuthorizing || isBlocking}
          >
            {isAuthorizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autorizando...
              </>
            ) : (
              <>
                {showConfirmAuthorize ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {showConfirmAuthorize
                  ? "CONFIRMAR LIBERACAO"
                  : "Autorizar com Risco"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
