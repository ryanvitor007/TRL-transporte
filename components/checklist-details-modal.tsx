"use client";

import { useState } from "react";
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
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- MAPEAMENTO DE TRADUCAO ---
const CHECKLIST_LABELS: Record<string, string> = {
  tires: "Pneus e Rodas",
  fluids: "Niveis de Fluidos (Oleo/Agua)",
  brakes: "Sistema de Freios",
  lights: "Luzes e Sinalizacao",
  panel: "Painel e Instrumentos",
  windows: "Vidros e Espelhos",
  security: "Itens de Seguranca",
  body: "Lataria e Pintura",
  // Adicione mais traducoes conforme necessario
};

// Helper para traduzir o nome do item
function translateItemName(name: string): string {
  const key = name.toLowerCase().trim();
  return CHECKLIST_LABELS[key] || name;
}

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
            className="relative shrink-0 h-7 w-7 rounded-full border-2 border-background shadow-md overflow-hidden transition-all duration-300 ease-out"
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
            className="relative shrink-0 h-7 w-7 rounded-full border-2 border-background bg-red-600 shadow-md
              flex items-center justify-center text-white text-[10px] font-bold"
            style={{ marginLeft: -10, zIndex: 0 }}
          >
            +{displayPhotos.length - 3}
          </div>
        )}
        <Camera className="h-3 w-3 text-red-500 ml-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
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

          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-white text-xs font-medium">
              {currentIndex + 1} / {displayPhotos.length}
            </span>
          </div>

          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

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

// --- INTERFACES ---
interface ChecklistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: any | null;
}

function parseChecklistItems(
  checklistData: any,
): { name: string; passed: boolean; note?: string; photos?: string[] }[] {
  if (!checklistData) return [];

  // Se ja e um array de itens estruturados (formato antigo)
  if (Array.isArray(checklistData.items)) {
    return checklistData.items.map((item: any) => ({
      name: item.name || item.id || "Item",
      passed: item.passed ?? item.value ?? true,
      note: item.note || item.observacao,
      photos: item.photos || item.fotos || [],
    }));
  }

  // Se items e um objeto { "Pneus": false, "Freios": true }
  if (checklistData.items && typeof checklistData.items === "object") {
    return Object.entries(checklistData.items).map(([key, value]) => ({
      name: key,
      passed: value === true || value === "true" || value === "ok",
      note: undefined,
      photos: checklistData.photos?.[key] || [],
    }));
  }

  // Se o proprio checklistData e um objeto simples { "Pneus": false }
  if (typeof checklistData === "object" && !Array.isArray(checklistData)) {
    // Ignorar campos de metadados conhecidos
    const metadataKeys = [
      "type",
      "completedAt",
      "driverName",
      "notes",
      "observacoes",
      "created_at",
      "photos",
      "fotos"
    ];
    return Object.entries(checklistData)
      .filter(([key]) => !metadataKeys.includes(key))
      .map(([key, value]) => ({
        name: key,
        passed: value === true || value === "true" || value === "ok",
        note: undefined,
        photos: checklistData.photos?.[key] || [],
      }));
  }

  return [];
}

// Helper para extrair observacoes/notas
function getChecklistNotes(checklistData: any): string | null {
  if (!checklistData) return null;
  return (
    checklistData.notes ||
    checklistData.observacoes ||
    checklistData.note ||
    null
  );
}

export function ChecklistDetailsModal({
  isOpen,
  onClose,
  maintenance,
}: ChecklistDetailsModalProps) {
  if (!maintenance) return null;

  // Tenta pegar checklist_data ou checklistData
  const rawChecklistData =
    maintenance.checklist_data || maintenance.checklistData;

  // Parseia os dados do checklist
  const allItems = parseChecklistItems(rawChecklistData);
  const failedItems = allItems.filter((item) => !item.passed);
  const notes = getChecklistNotes(rawChecklistData);

  // Extrai informacoes do veiculo e motorista com fallbacks seguros
  const vehiclePlate =
    maintenance.vehicle?.placa || maintenance.vehicle_plate || "N/A";
  const vehicleModel =
    maintenance.vehicle?.modelo || maintenance.vehicle_model || "";
  const driverName =
    rawChecklistData?.driverName ||
    maintenance.requested_by ||
    maintenance.driver?.name ||
    "Nao informado";

  // Formata a data
  const createdDate = maintenance.created_at || maintenance.scheduled_date;
  let formattedDate = "Data nao informada";
  if (createdDate) {
    try {
      formattedDate = format(new Date(createdDate), "dd/MM HH:mm", {
        locale: ptBR,
      });
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
              <p className="text-sm text-muted-foreground">#{maintenance.id}</p>
            </div>
            {failedItems.length > 0 && (
              <Badge variant="destructive" className="shrink-0">
                {failedItems.length}{" "}
                {failedItems.length === 1 ? "problema" : "problemas"}
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
                  <p className="text-xs text-muted-foreground leading-tight">
                    Data/Hora
                  </p>
                  <p className="text-sm font-medium truncate">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <Car className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Veiculo
                  </p>
                  <p className="text-sm font-medium truncate">{vehiclePlate}</p>
                  {vehicleModel && (
                    <p className="text-xs text-muted-foreground truncate">
                      {vehicleModel}
                    </p>
                  )}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-muted/50 border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Motorista
                  </p>
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
                  <h3 className="font-semibold text-foreground">
                    Itens Reprovados
                  </h3>
                </div>

                {failedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-green-300 bg-green-50/50 p-4 text-center">
                    <p className="text-sm text-green-700">
                      Todos os itens foram aprovados na vistoria.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {failedItems.map((item, index) => {
                      // Extract photos correctly
                      const globalPhotos = rawChecklistData?.photos || maintenance.photos || maintenance.fotos || maintenance.incident?.fotos || maintenance.incident?.photos || [];
                      const itemPhotos = item.photos && item.photos.length > 0 ? item.photos : globalPhotos;

                      return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl",
                          "bg-red-50 border border-red-200",
                        )}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 shrink-0 mt-0.5">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-red-900">
                            {translateItemName(item.name)}
                          </p>
                          {item.note && (
                            <p className="mt-1 text-sm text-red-700/80 italic">
                              "{item.note}"
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <ChecklistPhotoViewer photos={itemPhotos} />
                        </div>
                      </div>
                    )})}
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
            {(notes || rawChecklistData?.notes) && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">
                      Observacoes
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border space-y-2">
                    {/* Exibe notas especificas de cada item reprovado */}
                    {rawChecklistData?.notes &&
                      typeof rawChecklistData.notes === "object" &&
                      Object.entries(rawChecklistData.notes).map(
                        ([key, value]) =>
                          value && (
                            <p
                              key={key}
                              className="text-sm text-muted-foreground"
                            >
                              <span className="font-medium">
                                {translateItemName(key)}:
                              </span>{" "}
                              {String(value)}
                            </p>
                          ),
                      )}
                    {/* Exibe notas gerais se for string */}
                    {typeof notes === "string" && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {notes}
                      </p>
                    )}
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
