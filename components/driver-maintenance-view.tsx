"use client";

import type React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buscarManutencoesAPI } from "@/lib/api-service";
import { ChecklistDetailsModal } from "@/components/checklist-details-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Filter,
  X,
  Camera,
  ChevronRight,
  ChevronDown,
  FileText,
  DollarSign,
  Gauge,
  Calendar,
  Building2,
  Upload,
  RefreshCw,
  WifiOff,
  Edit,
  CheckCheck,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// --- INTERFACES ---
// Localize a interface existente e SUBSTITUA por esta atualizada:
export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  type: string;
  description: string;
  // Adicionei | string para evitar erro se a API trouxer algo diferente, mas mantive as sugestões
  status: "Pendente" | "Em Andamento" | "Concluída" | "Cancelada" | string;
  priority: "Baixa" | "Média" | "Alta" | "Crítica" | string;
  created_at: string;

  // CORREÇÃO DOS ERROS 2339 (Propriedades faltando)
  checklist_data?: any;
  checklistData?: any;
  vehicle_plate?: string; // Adicionado para compatibilidade
  vehicle_model?: string; // Adicionado para compatibilidade

  // Relacionamento com veículo
  vehicle?: {
    placa: string;
    modelo?: string;
  };

  cost?: number;
  provider?: string;
  scheduled_date?: string;
  completed_date?: string;
  invoice_url?: string;
  requested_by?: string;
  photos?: string[];
  km_at_maintenance?: number;
}

// --- STATUS CONFIG ---
const statusConfig: Record<
  string,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  Urgente: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: AlertCircle,
    label: "Urgente",
  },
  Agendada: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Clock,
    label: "Agendada",
  },
  "Em Andamento": {
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    icon: Wrench,
    label: "Em Andamento",
  },
  Concluida: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: CheckCircle2,
    label: "Concluida",
  },
};

const maintenanceTypes = [
  { value: "Preventiva", label: "Preventiva" },
  { value: "Corretiva", label: "Corretiva" },
  { value: "Corretiva - Checklist", label: "Corretiva - Checklist" },
  { value: "Preditiva", label: "Preditiva" },
];

const problemTypes = [
  { value: "Freios", label: "Problema nos Freios" },
  { value: "Pneus", label: "Desgaste/Dano em Pneu" },
  { value: "Motor", label: "Luz de Alerta no Painel" },
  { value: "Vazamento", label: "Vazamento de Fluido" },
  { value: "Ruido", label: "Ruido Anormal" },
  { value: "Ar Condicionado", label: "Ar Condicionado" },
  { value: "Troca de Oleo", label: "Troca de Oleo" },
  { value: "Revisao Geral", label: "Revisao Geral" },
  { value: "Outro", label: "Outro" },
];

// --- MOCK DATA ---
const mockVehicles = [
  { id: 1, placa: "ABC-1234", modelo: "Volvo FH 460", km_atual: 150000 },
  { id: 2, placa: "DEF-5678", modelo: "Scania R450", km_atual: 120000 },
  { id: 3, placa: "GHI-9012", modelo: "Mercedes Actros", km_atual: 180000 },
];

const generateDriverMaintenanceRecords = (
  driverName: string,
): MaintenanceRecord[] => {
  const records: MaintenanceRecord[] = [];
  const statuses = ["Agendada", "Em Andamento", "Concluida", "Urgente"];
  const types = ["Preventiva", "Corretiva", "Preditiva"];

  for (let i = 0; i < 15; i++) {
    const vehicle = mockVehicles[i % 3];
    const status = statuses[i % 4];
    const createdAt = format(subDays(new Date(), i * 3), "yyyy-MM-dd");
    records.push({
      id: i + 1,
      vehicle_id: vehicle.id,
      vehicle_plate: vehicle.placa,
      vehicle_model: vehicle.modelo,
      type: types[i % 3],
      description: `${problemTypes[i % 9].label} - Servico agendado para revisao completa do sistema`,
      scheduled_date: createdAt,
      completed_date:
        status === "Concluida"
          ? format(subDays(new Date(), i * 3 - 1), "yyyy-MM-dd")
          : undefined,
      cost: Math.floor(500 + Math.random() * 2000),
      status,
      priority: status === "Urgente" ? "Critica" : "Media",
      created_at: createdAt,
      provider: ["Oficina Central", "Auto Mecanica Silva", "Truck Service"][
        i % 3
      ],
      km_at_maintenance: vehicle.km_atual - i * 1000,
      invoice_url:
        status === "Concluida" && i % 2 === 0 ? "nf-123.pdf" : undefined,
      photos: i % 3 === 0 ? ["foto1.jpg", "foto2.jpg"] : undefined,
      requested_by: driverName,
    });
  }
  return records;
};

// --- SKELETON COMPONENTS ---
function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function MaintenanceCardSkeleton() {
  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      </div>
    </div>
  );
}

// --- ERROR STATE ---
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Sem conexao</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Nao foi possivel carregar as manutencoes. Verifique sua conexao e tente
        novamente.
      </p>
      <Button
        onClick={onRetry}
        size="lg"
        className="gap-2 min-w-[200px] h-12 active:scale-95 transition-transform"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar Novamente
      </Button>
    </div>
  );
}

// --- EMPTY STATE ---
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Nenhuma manutencao</h3>
      <p className="text-sm text-muted-foreground">
        Voce nao possui manutencoes registradas
      </p>
    </div>
  );
}

export function DriverMaintenanceView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  // --- LOADING/ERROR STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // --- DATA STATES ---
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);

  // --- MODAL STATES ---
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<MaintenanceRecord | null>(null);

  // --- ATTACHMENT VIEWER STATES ---
  const [attachmentViewerOpen, setAttachmentViewerOpen] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<{
    type: "photo" | "invoice";
    url: string;
    name: string;
  } | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);

  // --- FORM STATES ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [newMaintenance, setNewMaintenance] = useState({
    type: "",
    problemType: "",
    description: "",
    urgency: "",
    scheduledDate: format(new Date(), "yyyy-MM-dd"),
    km: "",
    provider: "",
    estimatedCost: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedInvoice, setUploadedInvoice] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FILTER STATES ---
  const [filters, setFilters] = useState({
    vehicleId: "all",
    status: "all",
    type: "all",
  });

  // --- COLLAPSIBLE STATE (Alertas de Vistoria) ---
  const [isInspectionAlertsOpen, setIsInspectionAlertsOpen] = useState(true);

  // --- LOAD DATA ---
  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setMaintenances(generateDriverMaintenanceRecords(driverName));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega dados reais da API
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true); // Usando o nome correto da variável

        const data = await buscarManutencoesAPI();

        // Ordena por data
        const sorted = (data || []).sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        // CORREÇÃO DO ERRO 2322 (Type string is not assignable)
        // Mapeamos e dizemos ao TS: "Confie em mim, isso é um MaintenanceRecord"
        const safeData = sorted.map((item: any) => {
          const fallbackDate =
            item.scheduled_date || item.created_at || new Date().toISOString();
          return {
            ...item,
            checklistData: item.checklist_data || item.checklistData,
            // Preenche os campos auxiliares que o erro 2339 reclamou
            vehicle_plate: item.vehicle?.placa,
            vehicle_model: item.vehicle?.modelo,
            status: item.status || "Agendada",
            priority: item.priority || "Media",
            created_at: item.created_at || fallbackDate,
            scheduled_date: item.scheduled_date || fallbackDate,
          };
        }) as MaintenanceRecord[];

        setMaintenances(safeData);
      } catch (error) {
        console.error("Erro ao carregar manutenções:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehicleId !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all"
    );
  }, [filters]);

  // --- FILTERING ---
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((item) => {
      if (
        filters.vehicleId !== "all" &&
        String(item.vehicle_id) !== filters.vehicleId
      )
        return false;
      if (filters.status !== "all" && item.status !== filters.status)
        return false;
      if (filters.type !== "all" && item.type !== filters.type) return false;
      return true;
    });
  }, [maintenances, filters]);

  // TAREFA 3: Filtra manutencoes de vistoria (Corretiva - Vistoria Inicial)
  const inspectionMaintenances = useMemo(() => {
    return filteredMaintenances.filter(
      (m) =>
        m.type === "Corretiva - Vistoria Inicial" ||
        m.type === "Corretiva - Checklist",
    );
  }, [filteredMaintenances]);

  // Manutencoes comuns (excluindo as de vistoria)
  const regularMaintenances = useMemo(() => {
    return filteredMaintenances.filter(
      (m) =>
        m.type !== "Corretiva - Vistoria Inicial" &&
        m.type !== "Corretiva - Checklist",
    );
  }, [filteredMaintenances]);

  const clearFilters = () => {
    setFilters({ vehicleId: "all", status: "all", type: "all" });
  };

  // --- KPIs ---
  const stats = useMemo(() => {
    const urgent = filteredMaintenances.filter(
      (m) => m.status === "Urgente",
    ).length;
    const scheduled = filteredMaintenances.filter(
      (m) => m.status === "Agendada",
    ).length;
    const inProgress = filteredMaintenances.filter(
      (m) => m.status === "Em Andamento",
    ).length;
    const completed = filteredMaintenances.filter(
      (m) => m.status === "Concluida",
    ).length;
    return { urgent, scheduled, inProgress, completed };
  }, [filteredMaintenances]);

  const selectedVehicle = useMemo(
    () => mockVehicles.find((v) => String(v.id) === String(selectedVehicleId)),
    [selectedVehicleId],
  );

  // --- HANDLERS ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const names = Array.from(files)
        .map((f) => f.name)
        .slice(0, 5 - uploadedPhotos.length);
      setUploadedPhotos((prev) => [...prev, ...names].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedInvoice(file.name);
    }
  };

  const removeInvoice = () => {
    setUploadedInvoice(null);
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
  };

  const handleSubmitMaintenance = async () => {
    if (
      !selectedVehicleId ||
      !newMaintenance.problemType ||
      !newMaintenance.urgency
    ) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsNewMaintenanceOpen(false);
      resetForm();
      loadData();
    }, 1500);
  };

  const handleCompleteMaintenance = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCompleteOpen(false);
      setIsDetailsOpen(false);
      setUploadedInvoice(null);
      loadData();
    }, 1500);
  };

  const resetForm = () => {
    setNewMaintenance({
      type: "",
      problemType: "",
      description: "",
      urgency: "",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      km: "",
      provider: "",
      estimatedCost: "",
    });
    setSelectedVehicleId("");
    setUploadedPhotos([]);
    setUploadedInvoice(null);
  };

  // detalhes da manutencao
  const openDetails = (maintenance: MaintenanceRecord) => {
    setSelectedMaintenance(maintenance);
    setIsEditMode(false);

    if (
      maintenance.type === "Corretiva - Checklist" ||
      maintenance.checklist_data
    ) {
      setShowChecklistModal(true);
    } else {
      setIsDetailsOpen(true); // Usando o nome correto da variável de estado existente
    }
  };

  const openEditMode = () => {
    if (selectedMaintenance) {
      setNewMaintenance({
        type: selectedMaintenance.type,
        problemType: (selectedMaintenance.description ?? "").split(" - ")[0],
        description: selectedMaintenance.description,
        urgency: selectedMaintenance.status === "Urgente" ? "alta" : "media",
        scheduledDate:
          selectedMaintenance.scheduled_date ??
          format(new Date(), "yyyy-MM-dd"),
        km:
          selectedMaintenance.km_at_maintenance != null
            ? String(selectedMaintenance.km_at_maintenance)
            : "",
        provider: selectedMaintenance.provider ?? "",
        estimatedCost:
          selectedMaintenance.cost != null
            ? String(selectedMaintenance.cost)
            : "",
      });
      setSelectedVehicleId(String(selectedMaintenance.vehicle_id));
      setIsEditMode(true);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Preventiva":
        return "bg-blue-100 text-blue-700";
      case "Corretiva":
        return "bg-orange-100 text-orange-700";
      case "Corretiva - Checklist":
        return "bg-red-100 text-red-700 font-bold";
      case "Preditiva":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // --- ATTACHMENT VIEWER HANDLERS ---
  const openAttachmentViewer = (
    type: "photo" | "invoice",
    url: string,
    name: string,
  ) => {
    setViewerAttachment({ type, url, name });
    setViewerZoom(1);
    setViewerRotation(0);
    setAttachmentViewerOpen(true);
  };

  const closeAttachmentViewer = () => {
    setAttachmentViewerOpen(false);
    setViewerAttachment(null);
    setViewerZoom(1);
    setViewerRotation(0);
  };

  const handleZoomIn = () => {
    setViewerZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setViewerZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setViewerRotation((prev) => (prev + 90) % 360);
  };

  const handleDownloadAttachment = () => {
    if (viewerAttachment) {
      // In production, this would trigger an actual download
      // For now, we simulate it
      const link = document.createElement("a");
      link.href = viewerAttachment.url.startsWith("http")
        ? viewerAttachment.url
        : `/uploads/${viewerAttachment.url}`;
      link.download = viewerAttachment.name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER COMPACTO MOBILE */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate md:text-2xl">
            Manutencoes
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Solicitacoes e servicos
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Filtros */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 md:h-10 md:w-auto md:px-3 active:scale-95 transition-transform",
                  isAnyFilterActive &&
                    "border-primary text-primary bg-primary/5",
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Filtros</span>
                {isAnyFilterActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary ml-1" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold text-sm">Filtros</h4>
                  {isAnyFilterActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-xs text-red-500 hover:text-red-600 hover:bg-transparent"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Veiculo</Label>
                  <Select
                    value={filters.vehicleId}
                    onValueChange={(v) =>
                      setFilters((prev) => ({ ...prev, vehicleId: v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {mockVehicles.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.placa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, status: v }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                        <SelectItem value="Agendada">Agendada</SelectItem>
                        <SelectItem value="Em Andamento">
                          Em Andamento
                        </SelectItem>
                        <SelectItem value="Concluida">Concluida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, type: v }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {maintenanceTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Botao Nova Manutencao */}
          <Button
            onClick={() => setIsNewMaintenanceOpen(true)}
            size="icon"
            className="h-9 w-9 md:h-10 md:w-auto md:px-4 active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Reportar</span>
          </Button>
        </div>
      </div>

      {/* KPI CARDS - GRID 2x2 COMPACTO */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          {/* Urgentes */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground truncate">Urgentes</p>
            </div>
          </div>

          {/* Agendadas */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{stats.scheduled}</p>
              <p className="text-xs text-muted-foreground truncate">
                Agendadas
              </p>
            </div>
          </div>

          {/* Em Andamento */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
              <Wrench className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Em Andamento
              </p>
            </div>
          </div>

          {/* Concluidas */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted/50 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Concluidas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAREFA 3: ALERTAS DE VISTORIA - SECAO COLAPSAVEL */}
      {inspectionMaintenances.length > 0 && (
        <Collapsible
          open={isInspectionAlertsOpen}
          onOpenChange={setIsInspectionAlertsOpen}
          className="rounded-xl border-2 border-red-200 bg-red-50/50 overflow-hidden"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 hover:bg-red-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-red-800">
                    Alertas de Vistoria
                  </h3>
                  <p className="text-xs text-red-600">
                    {inspectionMaintenances.length} solicitacao(oes) pendente(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white">
                  {
                    inspectionMaintenances.filter(
                      (m) => m.status !== "Concluida",
                    ).length
                  }
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-red-600 transition-transform duration-200",
                    isInspectionAlertsOpen && "rotate-180",
                  )}
                />
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-red-200 bg-white p-4 space-y-3">
              {inspectionMaintenances.map((maintenance) => {
                const config =
                  statusConfig[maintenance.status] || statusConfig.Agendada;
                const StatusIcon = config.icon;
                const vehiclePlate =
                  maintenance.vehicle?.placa ||
                  maintenance.vehicle_plate ||
                  "N/A";

                return (
                  <div
                    key={maintenance.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-100/50 transition-colors"
                    onClick={() => openDetails(maintenance)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && openDetails(maintenance)
                    }
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        config.bgColor,
                      )}
                    >
                      <ClipboardList className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono border-red-300 text-red-700"
                        >
                          {vehiclePlate}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs",
                            config.bgColor,
                            config.color,
                          )}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {maintenance.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Solicitado em{" "}
                        {format(
                          new Date(maintenance.created_at),
                          "dd/MM/yyyy",
                          { locale: ptBR },
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* LISTA DE MANUTENCOES - FEED STYLE */}
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 md:p-6">
          <CardTitle className="text-base md:text-lg">
            Minhas Solicitacoes
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {regularMaintenances.length} manutencao(oes) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <MaintenanceCardSkeleton />
              <MaintenanceCardSkeleton />
              <MaintenanceCardSkeleton />
              <MaintenanceCardSkeleton />
            </div>
          ) : hasError ? (
            <ErrorState onRetry={loadData} />
          ) : regularMaintenances.length === 0 ? (
            <EmptyState />
          ) : (
            <ScrollArea className="h-[400px] md:h-[450px]">
              <div className="px-4 pb-4 md:px-6 md:pb-6">
                {regularMaintenances.map((maintenance) => {
                  const config =
                    statusConfig[maintenance.status] ||
                    statusConfig["Agendada"];
                  const StatusIcon = config.icon;
                  const relativeDate = formatDistanceToNow(
                    new Date(
                      maintenance.scheduled_date ?? maintenance.created_at,
                    ),
                    {
                      addSuffix: true,
                      locale: ptBR,
                    },
                  );

                  return (
                    <button
                      key={maintenance.id}
                      onClick={() => openDetails(maintenance)}
                      className="w-full text-left border-b border-border py-3 last:border-0 hover:bg-muted/30 active:bg-muted/50 transition-colors -mx-4 px-4 md:-mx-6 md:px-6"
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            config.bgColor,
                          )}
                        >
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Header: Status Badge + Date */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={cn(
                                "text-xs px-2 py-0.5 font-medium",
                                config.bgColor,
                                config.color,
                              )}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {relativeDate}
                            </span>
                          </div>

                          {/* Service Type + Plate */}
                          <p className="text-sm text-foreground line-clamp-1">
                            {(maintenance.description ?? "").split(" - ")[0]}
                          </p>

                          {/* Footer: Plate + Type + Indicators */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">
                              {maintenance.vehicle_plate}
                            </span>
                            <span>•</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4",
                                getTypeColor(maintenance.type),
                              )}
                            >
                              {maintenance.type}
                            </Badge>
                            {/* Attachment Indicators */}
                            {maintenance.photos &&
                              maintenance.photos.length > 0 && (
                                <Camera className="h-3 w-3 text-muted-foreground" />
                              )}
                            {maintenance.invoice_url && (
                              <FileText className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* DIALOG: NOVA MANUTENCAO / EDICAO - MOBILE OPTIMIZED */}
      <Dialog
        open={isNewMaintenanceOpen}
        onOpenChange={(open) => {
          setIsNewMaintenanceOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>
              {isEditMode ? "Editar Manutencao" : "Reportar Problema"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Altere as informacoes da manutencao"
                : "Preencha os detalhes da manutencao necessaria"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6">
            <div className="space-y-4 pb-4">
              {/* Veiculo */}
              <div className="space-y-2">
                <Label className="text-sm">Veiculo *</Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o veiculo" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVehicles.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.placa} - {v.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVehicle && (
                  <p className="text-xs text-muted-foreground">
                    KM Atual: {selectedVehicle.km_atual.toLocaleString()} km
                  </p>
                )}
              </div>

              {/* Tipo Manutencao e Problema */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Tipo</Label>
                  <Select
                    value={newMaintenance.type}
                    onValueChange={(v) =>
                      setNewMaintenance((prev) => ({ ...prev, type: v }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Servico *</Label>
                  <Select
                    value={newMaintenance.problemType}
                    onValueChange={(v) =>
                      setNewMaintenance((prev) => ({ ...prev, problemType: v }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {problemTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data e KM */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Data Agendada</Label>
                  <Input
                    type="date"
                    className="h-11"
                    value={newMaintenance.scheduledDate}
                    onChange={(e) =>
                      setNewMaintenance((prev) => ({
                        ...prev,
                        scheduledDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Hodometro (km)</Label>
                  <Input
                    type="number"
                    className="h-11"
                    placeholder="Ex: 150000"
                    value={newMaintenance.km}
                    onChange={(e) =>
                      setNewMaintenance((prev) => ({
                        ...prev,
                        km: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Oficina e Custo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Oficina/Fornecedor</Label>
                  <Input
                    className="h-11"
                    placeholder="Nome da oficina"
                    value={newMaintenance.provider}
                    onChange={(e) =>
                      setNewMaintenance((prev) => ({
                        ...prev,
                        provider: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Custo Estimado</Label>
                  <Input
                    type="number"
                    className="h-11"
                    placeholder="R$ 0,00"
                    value={newMaintenance.estimatedCost}
                    onChange={(e) =>
                      setNewMaintenance((prev) => ({
                        ...prev,
                        estimatedCost: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Urgencia */}
              <div className="space-y-2">
                <Label className="text-sm">Nivel de Urgencia *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "baixa",
                      label: "Baixa",
                      color: "border-green-500 bg-green-50 text-green-700",
                    },
                    {
                      id: "media",
                      label: "Media",
                      color: "border-yellow-500 bg-yellow-50 text-yellow-700",
                    },
                    {
                      id: "alta",
                      label: "Alta",
                      color: "border-red-500 bg-red-50 text-red-700",
                    },
                  ].map((u) => (
                    <Button
                      key={u.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 active:scale-95 transition-transform",
                        newMaintenance.urgency === u.id && u.color,
                      )}
                      onClick={() =>
                        setNewMaintenance((prev) => ({
                          ...prev,
                          urgency: u.id,
                        }))
                      }
                    >
                      {u.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Descricao */}
              <div className="space-y-2">
                <Label className="text-sm">Descricao Detalhada</Label>
                <Textarea
                  placeholder="Descreva o problema ou servico necessario..."
                  className="min-h-[80px] resize-none"
                  value={newMaintenance.description}
                  onChange={(e) =>
                    setNewMaintenance((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Fotos */}
              <div className="space-y-2">
                <Label className="text-sm">Fotos (ate 5)</Label>
                <div
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors active:bg-muted/50",
                    uploadedPhotos.length > 0
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Camera
                    className={cn(
                      "h-6 w-6 mx-auto mb-2",
                      uploadedPhotos.length > 0
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  {uploadedPhotos.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-primary">
                        {uploadedPhotos.length} foto(s)
                      </p>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {uploadedPhotos.map((photo, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="gap-1 text-xs"
                          >
                            {photo.substring(0, 10)}...
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto(i);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Toque para adicionar fotos
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 p-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsNewMaintenanceOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitMaintenance}
              disabled={
                !selectedVehicleId ||
                !newMaintenance.problemType ||
                !newMaintenance.urgency ||
                isSubmitting
              }
              className="flex-1 sm:flex-none active:scale-95 transition-transform"
            >
              {isSubmitting
                ? "Enviando..."
                : isEditMode
                  ? "Salvar"
                  : "Enviar Solicitacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- MODAL ESPECÍFICO: DETALHES DO CHECKLIST --- */}
      <ChecklistDetailsModal
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        maintenance={selectedMaintenance}
      />

      {/* DIALOG: DETALHES - MOBILE OPTIMIZED */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="shrink-0 p-6 pb-4">
            <DialogTitle>Detalhes da Manutencao</DialogTitle>
          </DialogHeader>
          {selectedMaintenance && (
            <div className="flex-1 overflow-y-auto overscroll-contain px-6">
              <div className="space-y-4 pb-4">
                {/* Status + Type Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      statusConfig[selectedMaintenance.status]?.bgColor,
                      statusConfig[selectedMaintenance.status]?.color,
                    )}
                  >
                    {selectedMaintenance.status}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1",
                      getTypeColor(selectedMaintenance.type),
                    )}
                  >
                    {selectedMaintenance.type}
                  </Badge>
                </div>

                {/* Vehicle Info */}
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Veiculo</p>
                  <p className="font-medium">
                    {selectedMaintenance.vehicle_plate} -{" "}
                    {selectedMaintenance.vehicle_model}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm font-medium">
                      {format(
                        new Date(
                          selectedMaintenance.scheduled_date ??
                            selectedMaintenance.created_at,
                        ),
                        "dd/MM/yy",
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Gauge className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">KM</p>
                    <p className="text-sm font-medium">
                      {(
                        (selectedMaintenance.km_at_maintenance ?? 0) / 1000
                      ).toFixed(0)}
                      k
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Custo</p>
                    <p className="text-sm font-medium">
                      R$ {(selectedMaintenance.cost ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Provider */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Oficina/Fornecedor
                  </p>
                  <p className="text-sm font-medium">
                    {selectedMaintenance.provider}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Descricao</p>
                  <p className="text-sm">{selectedMaintenance.description}</p>
                </div>

                {/* Photos */}
                {selectedMaintenance.photos &&
                  selectedMaintenance.photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        Fotos anexadas ({selectedMaintenance.photos.length})
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedMaintenance.photos.map((photo, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              openAttachmentViewer(
                                "photo",
                                photo,
                                `Foto ${i + 1}`,
                              )
                            }
                            className="relative w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden group cursor-pointer active:scale-95 transition-transform border border-border hover:border-primary"
                          >
                            <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Toque para visualizar em tela cheia
                      </p>
                    </div>
                  )}

                {/* Invoice */}
                {selectedMaintenance.invoice_url && (
                  <button
                    type="button"
                    onClick={() =>
                      openAttachmentViewer(
                        "invoice",
                        selectedMaintenance.invoice_url!,
                        selectedMaintenance.invoice_url!,
                      )
                    }
                    className="w-full p-3 rounded-lg bg-green-50 border border-green-200 hover:border-green-400 hover:bg-green-100 transition-colors cursor-pointer active:scale-[0.98] text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-700 flex items-center gap-1 mb-1">
                          <FileText className="h-3 w-3" />
                          Nota Fiscal
                        </p>
                        <p className="text-sm font-medium text-green-800 truncate">
                          {selectedMaintenance.invoice_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <ZoomIn className="h-4 w-4 text-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <ChevronRight className="h-4 w-4 text-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <p className="text-[10px] text-green-600 mt-1">
                      Toque para visualizar em tela cheia
                    </p>
                  </button>
                )}

                {/* Completion Date */}
                {selectedMaintenance.completed_date && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Data de Conclusao
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {format(
                        new Date(selectedMaintenance.completed_date),
                        "dd/MM/yyyy",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 gap-2 p-6 pt-4 border-t flex-col sm:flex-row">
            {selectedMaintenance?.status !== "Concluida" && (
              <>
                <Button
                  variant="outline"
                  onClick={openEditMode}
                  className="w-full sm:w-auto gap-2 bg-transparent"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  onClick={() => setIsCompleteOpen(true)}
                  className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCheck className="h-4 w-4" />
                  Dar Baixa
                </Button>
              </>
            )}
            {selectedMaintenance?.status === "Concluida" && (
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
                className="w-full"
              >
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONCLUSAO / DAR BAIXA */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir Manutencao</DialogTitle>
            <DialogDescription>
              Confirme a conclusao e anexe a nota fiscal (recomendado)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Summary */}
            {selectedMaintenance && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="font-medium">
                  {(selectedMaintenance.description ?? "").split(" - ")[0]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMaintenance.vehicle_plate} - R${" "}
                  {(selectedMaintenance.cost ?? 0).toLocaleString()}
                </p>
              </div>
            )}

            {/* Invoice Upload */}
            <div className="space-y-2">
              <Label className="text-sm">Nota Fiscal (Recomendado)</Label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors active:bg-muted/50",
                  uploadedInvoice
                    ? "border-green-500 bg-green-50"
                    : "border-border hover:border-primary/50",
                )}
                onClick={() => invoiceInputRef.current?.click()}
              >
                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleInvoiceSelect}
                  className="hidden"
                />
                {uploadedInvoice ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-green-600" />
                    <p className="text-sm font-medium text-green-700">
                      {uploadedInvoice}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeInvoice();
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Toque para anexar NF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF ou Imagem
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCompleteOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompleteMaintenance}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:scale-95 transition-transform"
            >
              {isSubmitting ? "Salvando..." : "Confirmar Conclusao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULLSCREEN ATTACHMENT VIEWER */}
      {attachmentViewerOpen && viewerAttachment && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={closeAttachmentViewer}
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              {viewerAttachment.type === "invoice" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <FileText className="h-5 w-5 text-green-400" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <Camera className="h-5 w-5 text-blue-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-medium truncate">
                  {viewerAttachment.type === "invoice"
                    ? "Nota Fiscal"
                    : viewerAttachment.name}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {viewerAttachment.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeAttachmentViewer}
              className="h-10 w-10 rounded-full text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{
                transform: `scale(${viewerZoom}) rotate(${viewerRotation}deg)`,
                transition: "transform 0.2s ease-out",
              }}
            >
              {viewerAttachment.type === "invoice" &&
              viewerAttachment.name.endsWith(".pdf") ? (
                // PDF Preview
                <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
                  <FileText className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <p className="text-lg font-semibold text-gray-800 mb-2">
                    Nota Fiscal
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {viewerAttachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Clique em &quot;Baixar&quot; para visualizar o PDF completo
                  </p>
                </div>
              ) : (
                // Image Preview (simulated with placeholder)
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                  <div className="w-[90vw] max-w-2xl aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {viewerAttachment.type === "invoice" ? (
                      <div className="text-center p-8">
                        <FileText className="h-20 w-20 mx-auto text-green-600 mb-4" />
                        <p className="text-lg font-semibold text-gray-800 mb-2">
                          Nota Fiscal
                        </p>
                        <p className="text-sm text-gray-600">
                          {viewerAttachment.name}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <Camera className="h-20 w-20 mx-auto text-blue-600 mb-4" />
                        <p className="text-lg font-semibold text-gray-800 mb-2">
                          {viewerAttachment.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Foto da manutencao
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Footer Controls */}
          <div
            className="shrink-0 p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              {/* Zoom Controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={viewerZoom <= 0.5}
                className="h-10 w-10 rounded-full text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-white text-sm min-w-[60px] text-center">
                {Math.round(viewerZoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={viewerZoom >= 3}
                className="h-10 w-10 rounded-full text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              {/* Separator */}
              <div className="w-px h-6 bg-white/20 mx-2" />

              {/* Rotate */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="h-10 w-10 rounded-full text-white hover:bg-white/10"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownloadAttachment}
              className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white active:scale-[0.98] transition-transform"
            >
              <Download className="h-5 w-5" />
              Baixar{" "}
              {viewerAttachment.type === "invoice" ? "Nota Fiscal" : "Foto"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
