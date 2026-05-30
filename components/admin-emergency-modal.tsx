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

  // Só exibe se houver fotos reais — sem placeholders
  const realPhotos = (photos ?? []).filter((p) => p && p.trim() !== "");
  const hasPhotos = realPhotos.length > 0;

  // Máximo de 2 thumbs visíveis no leque, o +N indica o restante
  const MAX_VISIBLE = 2;
  const visiblePhotos = realPhotos.slice(0, MAX_VISIBLE);
  const extraCount = realPhotos.length - MAX_VISIBLE;

  const openLightbox = (e: React.MouseEvent, idx = 0) => {
    e.stopPropagation();
    if (!hasPhotos) return;
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

  // Sem fotos: ícone de câmera discreto
  if (!hasPhotos) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground/40" title="Sem fotos de evidência">
        <Camera className="h-4 w-4" />
        <span className="text-[10px] text-muted-foreground/60">Sem foto</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Leque empilhado ─────────────────────────────────────
           Mobile-first: thumbnails quadradas w-12 h-12 com
           sobreposição via -space-x-4, hover expande para space-x-1
      ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={(e) => openLightbox(e, 0)}
        className="group flex items-center -space-x-4 hover:space-x-1 transition-all duration-300 ease-out cursor-pointer focus:outline-none"
        aria-label={`Ver ${realPhotos.length} foto(s) de evidência`}
      >
        {visiblePhotos.map((src, idx) => (
          <div
            key={idx}
            className={cn(
              "relative shrink-0 w-12 h-12 rounded-md border-2 border-white shadow-md overflow-hidden",
              "transition-all duration-300 ease-out",
              // última foto visível pode ter overlay de +N
              idx === MAX_VISIBLE - 1 && extraCount > 0 ? "brightness-50" : "",
            )}
            style={{ zIndex: MAX_VISIBLE - idx }}
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
            {/* Overlay +N na última thumb visível */}
            {idx === MAX_VISIBLE - 1 && extraCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-md">
                <span className="text-white text-xs font-bold">+{extraCount}</span>
              </div>
            )}
          </div>
        ))}
        {/* Ícone de câmera como call-to-action */}
        <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-red-50 border border-red-200 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Camera className="h-3.5 w-3.5 text-red-500" />
        </div>
      </button>

      {/* ── Lightbox Mobile-first ───────────────────────────────
           • Mobile: carrossel vertical / scroll suave com polegar
           • md+: carrossel horizontal com setas laterais
      ──────────────────────────────────────────────────────── */}
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

          {/* ── Barra superior ── */}
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

          {/* ── Área principal: foto grande ── */}
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
            {/* Setas — tamanho confortável para toque */}
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

          {/* ── Galeria de thumbs: scroll horizontal tátil ── */}
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

          {/* ── Dots de paginação (mobile-friendly) ── */}
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
                    const label = itemInfo.label;

                    return (
                      /* ── Card Mobile-first ──────────────────────────────────
                           Mobile (default): flex-col, tudo empilhado
                           md+: flex-row com justify-between
                      ─────────────────────────────────────────────────────── */
                      <div
                        key={itemId}
                        className={cn(
                          "flex flex-col gap-2 rounded-xl p-3 text-sm",
                          "md:flex-row md:items-center md:justify-between",
                          isHighSeverity
                            ? "bg-red-50 border border-red-300"
                            : "bg-amber-50 border border-amber-200",
                        )}
                      >
                        {/* ── Grupo de texto (topo/esquerda) ── */}
                        <div className="flex items-start gap-2.5">
                          {/* Ícone de status */}
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                              isHighSeverity ? "bg-red-200" : "bg-amber-200",
                            )}
                          >
                            <XCircle
                              className={cn(
                                "h-4 w-4",
                                isHighSeverity ? "text-red-600" : "text-amber-600",
                              )}
                            />
                          </div>
                          {/* Label + badge CRITICO */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 md:justify-start">
                              <span
                                className={cn(
                                  "font-semibold text-sm leading-tight",
                                  isHighSeverity ? "text-red-800" : "text-amber-800",
                                )}
                              >
                                {label}
                              </span>
                              {/* Badge 'Reprovado' visível no mobile ao lado do nome */}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 whitespace-nowrap shrink-0 md:hidden",
                                  isHighSeverity
                                    ? "border-red-400 text-red-700"
                                    : "border-amber-400 text-amber-700",
                                )}
                              >
                                Reprovado
                              </Badge>
                            </div>
                            {isHighSeverity && (
                              <Badge className="mt-1 bg-red-500 text-white text-[10px] px-1.5 py-0">
                                CRITICO
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* ── Grupo de mídia + badge (rodapé mobile / direita desktop) ── */}
                        <div className="flex items-center justify-end gap-3 md:shrink-0">
                          <ChecklistPhotoViewer photos={journey.checklistPhotos} />
                          {/* Badge 'Reprovado' só no desktop (md+) */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs whitespace-nowrap hidden md:inline-flex",
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
