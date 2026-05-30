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
// SUB-COMPONENTE: Visualizador de fotos — Mobile-first fan stack
// =============================================================
function ChecklistPhotoViewer({ photos }: { photos?: string[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const realPhotos = (photos ?? []).filter((p) => p && p.trim() !== "");
  const hasPhotos = realPhotos.length > 0;

  const openAt = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCurrentIndex(idx);
    setLightboxOpen(true);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? realPhotos.length - 1 : prev - 1));
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === realPhotos.length - 1 ? 0 : prev + 1));
  };

  if (!hasPhotos) return null;

  return (
    <>
      {/* Header da secao de fotos */}
      <div className="flex items-center justify-between mb-1.5 w-full">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <Camera className="h-3.5 w-3.5" />
          {realPhotos.length === 1 ? "1 foto anexada" : `${realPhotos.length} fotos anexadas`}
        </span>
        <button
          type="button"
          onClick={(e) => openAt(e, 0)}
          className="text-[10px] text-red-500 hover:text-red-700 font-semibold underline underline-offset-2 transition-colors"
        >
          Ver todas
        </button>
      </div>

      {/* Faixa de miniaturas quadradas */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none w-full">
        {realPhotos.map((src, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => openAt(e, idx)}
            className="relative shrink-0 h-16 w-16 rounded-xl overflow-hidden border-2 border-white shadow-sm
              hover:border-red-400 hover:scale-105 active:scale-95
              transition-all duration-200 ease-out focus:outline-none"
          >
            <img
              src={src}
              alt={`Evidência ${idx + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/96x96/dc2626/ffffff?text=!";
              }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/40 py-0.5 text-center">
              <span className="text-white text-[8px] font-bold">{idx + 1}/{realPhotos.length}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className={cn(
            "p-0 bg-black/97 border-neutral-800 overflow-hidden",
            "w-[95vw] max-w-lg md:max-w-2xl",
            "rounded-2xl",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Evidências do Checklist</DialogTitle>
            <DialogDescription>
              Fotos registradas pelo motorista como evidência dos itens reprovados
            </DialogDescription>
          </DialogHeader>

          {/* Barra superior */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-white/60" />
              <span className="text-white text-sm font-medium">Evidências</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-xs">
                {currentIndex + 1} / {realPhotos.length}
              </span>
              <button
                onClick={() => setLightboxOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Área principal: foto grande */}
          <div className="relative flex items-center justify-center bg-black min-h-[240px] max-h-[55vh]">
            <img
              src={realPhotos[currentIndex]}
              alt={`Evidência ${currentIndex + 1} de ${realPhotos.length}`}
              className="max-h-[55vh] max-w-full object-contain select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/800x600/dc2626/ffffff?text=Imagem+Indisponivel";
              }}
            />
            {realPhotos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-95 transition-all"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-95 transition-all"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Galeria de thumbs */}
          {realPhotos.length > 1 && (
            <div className="flex gap-2 px-3 py-3 bg-black/80 overflow-x-auto snap-x snap-mandatory scrollbar-none">
              {realPhotos.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "snap-start shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95",
                    currentIndex === idx
                      ? "border-red-500 scale-105 shadow-lg shadow-red-500/30"
                      : "border-white/20 opacity-50 hover:opacity-80",
                  )}
                  aria-label={`Ver foto ${idx + 1}`}
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

          {/* Dots de paginação */}
          {realPhotos.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2 bg-black/80">
              {realPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    currentIndex === idx
                      ? "w-4 bg-red-500"
                      : "w-1.5 bg-white/30 hover:bg-white/60",
                  )}
                  aria-label={`Ir para foto ${idx + 1}`}
                />
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

                    // Extrai o relato específico deste item de checklistNotes
                    // Formato: "tires: Pneu careca; brakes: Freio falhando"
                    const itemProblem = (() => {
                      if (!journey.checklistNotes) return undefined;
                      const parts = journey.checklistNotes.split(";");
                      const match = parts.find((p) =>
                        p.trim().toLowerCase().startsWith(itemId.toLowerCase() + ":"),
                      );
                      return match
                        ? match.trim().substring(itemId.length + 1).trim()
                        : undefined;
                    })();

                    const photos = (journey.checklistPhotos ?? []).filter(
                      (p) => p && p.trim() !== "",
                    );
                    const hasPhotos = photos.length > 0;
                    const showEvidenceBlock = !!itemProblem || hasPhotos;

                    return (
                      /* ── Card com Bloco de Evidência Interno ── */
                      <div
                        key={itemId}
                        className="flex flex-col gap-3 rounded-xl border-2 border-red-200 bg-white p-4"
                      >
                        {/* 1. Cabeçalho do Item */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                isHighSeverity ? "bg-red-100" : "bg-amber-100",
                              )}
                            >
                              <XCircle
                                className={cn(
                                  "h-4 w-4",
                                  isHighSeverity ? "text-red-600" : "text-amber-600",
                                )}
                              />
                            </div>
                            <div className="min-w-0">
                              <span
                                className={cn(
                                  "font-semibold leading-tight",
                                  isHighSeverity ? "text-red-800" : "text-amber-800",
                                )}
                              >
                                {itemInfo.label}
                              </span>
                              {isHighSeverity && (
                                <div className="mt-0.5">
                                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                                    CRITICO
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0",
                              isHighSeverity
                                ? "border-red-300 bg-red-50 text-red-700"
                                : "border-amber-300 bg-amber-50 text-amber-700",
                            )}
                          >
                            Reprovado
                          </Badge>
                        </div>

                        {/* 2. Bloco de Evidência Interno */}
                        {showEvidenceBlock && (
                          <div
                            className={cn(
                              "flex flex-col rounded-lg border overflow-hidden",
                              isHighSeverity
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50",
                            )}
                          >
                            {/* Relato do motorista */}
                            {itemProblem && (
                              <p
                                className={cn(
                                  "text-sm leading-relaxed p-3",
                                  isHighSeverity ? "text-red-700" : "text-amber-700",
                                )}
                              >
                                <span
                                  className={cn(
                                    "mr-1 font-semibold",
                                    isHighSeverity
                                      ? "text-red-800"
                                      : "text-amber-800",
                                  )}
                                >
                                  Relato:
                                </span>
                                {itemProblem}
                              </p>
                            )}

                            {/* Seção de fotos — idêntica à da tela do motorista */}
                            {hasPhotos && (
                              <div
                                className={cn(
                                  "bg-white/70 p-3 flex flex-col gap-2.5",
                                  itemProblem &&
                                    cn(
                                      "border-t",
                                      isHighSeverity
                                        ? "border-red-200"
                                        : "border-amber-200",
                                    ),
                                )}
                              >
                                <ChecklistPhotoViewer photos={photos} />
                              </div>
                            )}
                          </div>
                        )}
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
