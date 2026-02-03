"use client";

import type React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Wrench,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  Car,
  FileText,
  Eye,
  Loader2,
  Upload,
  Filter,
  X,
  FileX,
  ClipboardList,
  User,
  XCircle,
  CloudUpload,
  MessageSquareText,
  ImageIcon,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastNotification } from "@/contexts/notification-context";
// Importações da API
import {
  buscarFrotaAPI,
  buscarManutencoesAPI,
  salvarManutencaoAPI,
  concluirManutencaoAPI,
  atualizarManutencaoAPI,
} from "@/lib/api-service";

// --- MAPEAMENTO DE TRADUCAO DOS ITENS DO CHECKLIST ---
const CHECKLIST_LABELS: Record<string, string> = {
  tires: "Pneus",
  fluids: "Fluidos",
  brakes: "Freios",
  lights: "Luzes",
  panel: "Painel",
  windows: "Vidros",
  security: "Segurança",
  body: "Lataria",
};

function translateChecklistItem(key: string): string {
  return CHECKLIST_LABELS[key?.toLowerCase()] || key || "Item";
}

// --- INTERFACES ---
interface ExtendedMaintenance {
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
  checklist_data?: any;
  driver_name?: string;
  created_at?: string | null;
  incident?: {
    created_at?: string | null;
    fotos?: string[] | null;
  } | null;
  incident_id?: number | null;
  vehicle?: {
    placa?: string;
    modelo?: string;
  };
}

// Helper para extrair itens reprovados do checklist_data
function getFailedChecklistItems(
  checklistData: any,
): { name: string; note?: string }[] {
  if (!checklistData) return [];

  // Tenta parsear se for string JSON
  let data = checklistData;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  // Formato: { items: { tires: false, lights: true, ... }, notes: { tires: "pneu furado" } }
  if (data?.items && typeof data.items === "object") {
    const failedItems: { name: string; note?: string }[] = [];
    for (const [key, value] of Object.entries(data.items)) {
      if (value === false) {
        failedItems.push({
          name: key,
          note: data.notes?.[key] || undefined,
        });
      }
    }
    return failedItems;
  }

  // Formato simples: { tires: false, lights: true, ... }
  if (typeof data === "object" && !Array.isArray(data)) {
    const failedItems: { name: string; note?: string }[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== "notes" && value === false) {
        failedItems.push({
          name: key,
          note: data.notes?.[key] || undefined,
        });
      }
    }
    return failedItems;
  }

  return [];
}

// --- CONFIGURAÇÃO DE STATUS ---
const statusConfig: Record<
  string,
  { color: string; icon: any; label: string }
> = {
  Urgente: {
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
    label: "Urgente",
  },
  Agendada: {
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
    label: "Agendada",
  },
  "Em Andamento": {
    color: "bg-yellow-100 text-yellow-800",
    icon: Wrench,
    label: "Em Andamento",
  },
  Concluída: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Concluída",
  },
};

const maintenanceTypes = [
  { value: "Preventiva", label: "Preventiva" },
  { value: "Corretiva", label: "Corretiva" },
  { value: "Preditiva", label: "Preditiva" },
];

const getRequestDate = (maintenance: ExtendedMaintenance): string => {
  const dateValue =
    maintenance.created_at || maintenance.incident?.created_at || null;
  return dateValue
    ? new Date(dateValue).toLocaleDateString("pt-BR")
    : "-";
};

const normalizeStatus = (status?: string) => {
  if (!status) return "Agendada";
  if (status === "Agendado") return "Agendada";
  if (status === "Concluído") return "Concluída";
  if (status === "Em andamento") return "Em Andamento";
  const allowed = ["Agendada", "Em Andamento", "Concluída"];
  return allowed.includes(status) ? status : "Agendada";
};

const formatDateInput = (dateValue?: string) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

export function MaintenanceView() {
  const toast = useToastNotification();

  // --- ESTADOS DE DADOS (API) ---
  const [maintenances, setMaintenances] = useState<ExtendedMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DOS MODAIS ---
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<ExtendedMaintenance | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [activePhotosMaintenanceId, setActivePhotosMaintenanceId] = useState<
    number | null
  >(null);

  // --- ESTADOS DO FORMULÁRIO (Nova Manutenção) ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [newMaintenance, setNewMaintenance] = useState({
    type: "",
    description: "",
    date: "",
    kmAtMaintenance: "", // Agora armazena string formatada (ex: "10.000")
    provider: "",
    cost: "", // Agora armazena string formatada (ex: "R$ 1.500,00")
  });

  // Estado e Ref para Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingService, setIsCompletingService] = useState(false);

  // --- ESTADOS DO MODAL EDITAR/DAR BAIXA ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] =
    useState<ExtendedMaintenance | null>(null);
  const [editMaintenanceData, setEditMaintenanceData] = useState({
    status: "Agendada",
    provider: "",
    cost: "",
  });
  const [editInvoiceFile, setEditInvoiceFile] = useState<File | null>(null);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const editInvoiceInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADO DOS FILTROS ---
  const [filters, setFilters] = useState({
    vehicleId: "all",
    status: "all",
    type: "all",
    provider: "",
    startDate: "",
    endDate: "",
    minCost: "",
    maxCost: "",
  });

  // Verifica se há algum filtro ativo para mudar a cor do botão
  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehicleId !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all" ||
      filters.provider !== "" ||
      filters.startDate !== "" ||
      filters.endDate !== "" ||
      filters.minCost !== "" ||
      filters.maxCost !== ""
    );
  }, [filters]);

  // --- 1. CARREGAR DADOS AO ABRIR ---
  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    setShowPhotos(false);
    setActivePhotosMaintenanceId(null);
  }, [selectedMaintenance?.id]);

  const carregarTudo = async () => {
    try {
      setLoading(true);
      const [frota, manuts] = await Promise.all([
        buscarFrotaAPI(),
        buscarManutencoesAPI(),
      ]);
      setVehicles(Array.isArray(frota) ? frota : []);
      setMaintenances(Array.isArray(manuts) ? manuts : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao carregar dados do sistema.");
    } finally {
      setLoading(false);
    }
  };

  // Helper para achar o veículo selecionado no array de frota
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(selectedVehicleId)),
    [selectedVehicleId, vehicles],
  );

  // --- LÓGICA DE FILTRAGEM ---
  const filteredMaintenances = useMemo(() => {
    return maintenances.filter((item) => {
      if (
        filters.vehicleId !== "all" &&
        String(item.vehicle_id) !== filters.vehicleId
      )
        return false;

      if (filters.status !== "all") {
        const itemStatus =
          item.status === "Agendado" ? "Agendada" : item.status;
        if (itemStatus !== filters.status) return false;
      }

      if (filters.type !== "all" && item.type !== filters.type) return false;

      if (
        filters.provider &&
        !item.provider.toLowerCase().includes(filters.provider.toLowerCase())
      )
        return false;

      if (filters.startDate || filters.endDate) {
        const itemDate = new Date(item.scheduled_date);
        if (filters.startDate && itemDate < new Date(filters.startDate))
          return false;
        if (filters.endDate && itemDate > new Date(filters.endDate))
          return false;
      }

      const itemCost = Number(item.cost);
      if (filters.minCost && itemCost < Number(filters.minCost)) return false;
      if (filters.maxCost && itemCost > Number(filters.maxCost)) return false;

      return true;
    });
  }, [maintenances, filters]);

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      vehicleId: "all",
      status: "all",
      type: "all",
      provider: "",
      startDate: "",
      endDate: "",
      minCost: "",
      maxCost: "",
    });
  };

  // --- SEPARAR VISTORIAS DAS DEMAIS MANUTENCOES ---
  const vistoriaMaintenances = useMemo(() => {
    return filteredMaintenances.filter(
      (m) =>
        m.type?.includes("Vistoria") ||
        m.type?.includes("Corretiva - Vistoria"),
    );
  }, [filteredMaintenances]);

  const otherMaintenances = useMemo(() => {
    return filteredMaintenances.filter(
      (m) =>
        !m.type?.includes("Vistoria") &&
        !m.type?.includes("Corretiva - Vistoria"),
    );
  }, [filteredMaintenances]);

  // --- KPIs ---
  const totalCostMonth = filteredMaintenances.reduce(
    (sum, m) => sum + Number(m.cost || 0),
    0,
  );
  const scheduledCount = filteredMaintenances.filter((m) =>
    m.status?.includes("Agendad"),
  ).length;
  const inProgressCount = filteredMaintenances.filter(
    (m) => m.status === "Em Andamento",
  ).length;
  const completedCount = filteredMaintenances.filter(
    (m) => m.status === "Concluída" || m.status === "Concluído",
  ).length;
  const vistoriaPendingCount = vistoriaMaintenances.filter(
    (m) => m.status !== "Concluída" && m.status !== "Concluído",
  ).length;

  const openEditMaintenanceModal = (maintenance: ExtendedMaintenance) => {
    setEditingMaintenance(maintenance);
    setEditMaintenanceData({
      status: normalizeStatus(maintenance.status),
      provider: maintenance.provider || "",
      cost: maintenance.cost ? String(maintenance.cost) : "",
    });
    setEditInvoiceFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditMaintenanceSave = async () => {
    if (!editingMaintenance) return;
    setIsSavingMaintenance(true);

    try {
      const formData = new FormData();
      formData.append("status", editMaintenanceData.status);
      if (editMaintenanceData.provider) {
        formData.append("provider", editMaintenanceData.provider);
      }
      if (editMaintenanceData.cost) {
        const parsedCost = Number(editMaintenanceData.cost);
        if (!Number.isNaN(parsedCost)) {
          formData.append("cost", String(parsedCost));
        }
      }

      const completedDate =
        editMaintenanceData.status === "Concluída"
          ? formatDateInput(new Date().toISOString())
          : "";
      if (completedDate) {
        formData.append("completed_date", completedDate);
      }

      if (editInvoiceFile) {
        formData.append("invoice", editInvoiceFile);
      }

      await atualizarManutencaoAPI(editingMaintenance.id, formData);

      toast.success("Atualizado", "Manutenção atualizada com sucesso!");
      setIsEditModalOpen(false);
      carregarTudo();
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao atualizar manutenção.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleEditInvoiceSelect = (file: File | null) => {
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Arquivo inválido",
          "Selecione um PDF ou imagem (PNG, JPG, WEBP).",
        );
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          "Arquivo muito grande",
          "O arquivo deve ter no máximo 10MB.",
        );
        return;
      }
    }
    setEditInvoiceFile(file);
  };

  const handleEditInvoiceDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0] || null;
    handleEditInvoiceSelect(file);
  };

  const handleEditInvoiceDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Helper para extrair notas do motorista do checklist_data
  const getDriverNotes = (checklistData: any): string | null => {
    if (!checklistData) return null;
    let data = checklistData;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return null;
      }
    }
    // Tenta diferentes formatos de notas
    if (typeof data.notes === "string") return data.notes;
    if (data.observations) return data.observations;
    if (data.observacoes) return data.observacoes;
    // Se notes for objeto, concatena todas as notas
    if (typeof data.notes === "object" && data.notes !== null) {
      const noteEntries = Object.entries(data.notes)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${translateChecklistItem(k)}: ${v}`);
      return noteEntries.length > 0 ? noteEntries.join("\n") : null;
    }
    return null;
  };

  // --- FORMATADORES DE INPUT (MÁSCARAS) ---

  // Formata Moeda (R$ 1.000,00)
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove tudo que não é dígito
    if (value === "") {
      setNewMaintenance((prev) => ({ ...prev, cost: "" }));
      return;
    }
    const amount = Number(value) / 100;
    const formatted = amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    setNewMaintenance((prev) => ({ ...prev, cost: formatted }));
  };

  // Formata KM (10.000 ou 10.000,5)
  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Permite apenas números e uma vírgula
    value = value.replace(/[^0-9,]/g, "");

    // Impede mais de uma vírgula
    const parts = value.split(",");
    if (parts.length > 2) return;

    // Formata milhar na parte inteira
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Reconstrói a string
    setNewMaintenance((prev) => ({
      ...prev,
      kmAtMaintenance: parts.join(","),
    }));
  };

  // --- LÓGICA DE UPLOAD ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- 3. SALVAR NOVA MANUTENÇÃO ---
  const handleSubmitMaintenance = async () => {
    if (!selectedVehicleId || !newMaintenance.type || !newMaintenance.date) {
      toast.error("Atenção", "Preencha Veículo, Tipo e Data.");
      return;
    }

    setIsSubmitting(true);

    try {
      const mockInvoiceUrl = uploadedFile
        ? URL.createObjectURL(uploadedFile)
        : null;

      // CONVERSÃO: Limpa a formatação para enviar números puros para a API
      // Remove R$, pontos e converte vírgula em ponto para float
      const rawCost = newMaintenance.cost
        ? Number(newMaintenance.cost.replace(/[^\d,]/g, "").replace(",", "."))
        : 0;

      const rawKm = newMaintenance.kmAtMaintenance
        ? Number(
            newMaintenance.kmAtMaintenance.replace(/\./g, "").replace(",", "."),
          )
        : selectedVehicle?.km_atual || 0;

      const payload = {
        vehicle_id: Number(selectedVehicleId),
        vehicle_plate: selectedVehicle?.placa || "N/A",
        vehicle_model: selectedVehicle?.modelo || "N/A",
        type: newMaintenance.type,
        description: newMaintenance.description,
        scheduled_date: newMaintenance.date,
        cost: rawCost, // Envia número puro
        status: "Agendada",
        provider: newMaintenance.provider,
        km_at_maintenance: rawKm, // Envia número puro
        invoice_url: mockInvoiceUrl,
      };

      await salvarManutencaoAPI(payload);

      toast.success("Sucesso", "Manutenção agendada com sucesso!");
      setIsNewMaintenanceOpen(false);

      setNewMaintenance({
        type: "",
        description: "",
        date: "",
        kmAtMaintenance: "",
        provider: "",
        cost: "",
      });
      setSelectedVehicleId("");
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      carregarTudo();
    } catch (error) {
      toast.error("Erro", "Falha ao salvar manutenção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. DAR BAIXA (CONCLUIR) ---
  const handleCompleteService = async () => {
    if (!selectedMaintenance) return;
    setIsCompletingService(true);

    try {
      await concluirManutencaoAPI(selectedMaintenance.id);
      toast.success("Concluído", "Serviço baixado com sucesso!");
      setIsDetailsOpen(false);
      carregarTudo();
    } catch (error) {
      toast.error("Erro", "Falha ao dar baixa.");
    } finally {
      setIsCompletingService(false);
    }
  };

  const selectedIncidentPhotos = selectedMaintenance?.incident?.fotos || [];
  const isModalPhotosOpen =
    !!selectedMaintenance &&
    showPhotos &&
    activePhotosMaintenanceId === selectedMaintenance.id;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestão de Manutenção
          </h1>
          <p className="text-muted-foreground">
            Preventivas, corretivas e controle de oficina.
          </p>
        </div>
        <div className="flex gap-2">
          {/* --- BOTÃO DE FILTRO UNIFICADO --- */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2",
                  isAnyFilterActive &&
                    "border-primary text-primary bg-primary/5",
                )}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {isAnyFilterActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold leading-none">
                    Filtros Avançados
                  </h4>
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

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Veículo</Label>
                    <Select
                      value={filters.vehicleId}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, vehicleId: v }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todos os veículos" />
                      </SelectTrigger>
                      <SelectContent className="z-[300] max-h-[200px]">
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.placa} - {v.modelo}
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
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="Agendada">Agendada</SelectItem>
                          <SelectItem value="Em Andamento">
                            Em Andamento
                          </SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
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
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="z-[300]">
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

                  <div className="space-y-1">
                    <Label className="text-xs">Oficina / Fornecedor</Label>
                    <Input
                      placeholder="Nome da oficina..."
                      className="h-8"
                      value={filters.provider}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          provider: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={filters.startDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="date"
                        className="h-8"
                        value={filters.endDate}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Custo (R$)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Mín"
                        type="number"
                        className="h-8"
                        value={filters.minCost}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minCost: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="Máx"
                        type="number"
                        className="h-8"
                        value={filters.maxCost}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxCost: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => carregarTudo()} variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button
            onClick={() => setIsNewMaintenanceOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nova Manutenção
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {totalCostMonth.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                Custo Total (Filtro)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-sm text-muted-foreground">Agendadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- SECAO 1: SOLICITACOES DE VISTORIA (ACCORDION) --- */}
      {vistoriaMaintenances.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <ClipboardList className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Solicitações de Vistoria (Checklist)
                </h2>
                <p className="text-sm text-muted-foreground">
                  {vistoriaPendingCount} pendente
                  {vistoriaPendingCount !== 1 ? "s" : ""} de aprovação
                </p>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {vistoriaMaintenances.map((maintenance) => {
                const failedItems = getFailedChecklistItems(
                  maintenance.checklist_data,
                );
                const isCompleted =
                  maintenance.status === "Concluída" ||
                  maintenance.status === "Concluído";
                const incidentPhotos = maintenance.incident?.fotos || [];
                const isPhotosOpen =
                  showPhotos && activePhotosMaintenanceId === maintenance.id;

                return (
                  <AccordionItem
                    key={maintenance.id}
                    value={String(maintenance.id)}
                    className="border rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                        {/* Placa e Modelo */}
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {maintenance.vehicle_plate ||
                              maintenance.vehicle?.placa ||
                              "N/A"}
                          </span>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {maintenance.vehicle_model ||
                              maintenance.vehicle?.modelo ||
                              ""}
                          </span>
                        </div>

                        {/* Motorista */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{maintenance.driver_name || "Motorista"}</span>
                        </div>

                        {/* Data */}
                        <span className="text-sm text-muted-foreground">
                          {getRequestDate(maintenance)}
                        </span>

                        {/* Badges */}
                        <div className="flex items-center gap-2 ml-auto mr-4">
                          {failedItems.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {failedItems.length} problema
                              {failedItems.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              isCompleted
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800",
                            )}
                          >
                            {isCompleted
                              ? "Concluída"
                              : maintenance.status || "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-4">
                      <Separator className="mb-4" />
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* COLUNA 1: Detalhes da Reprovacao */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Detalhes da Reprovacao
                          </h4>

                          {/* Lista de Itens Reprovados */}
                          {failedItems.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">
                              Nenhum item reprovado encontrado.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {failedItems.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
                                >
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-red-900">
                                      {translateChecklistItem(item.name)}
                                    </p>
                                    {item.note && (
                                      <p className="text-xs text-red-700 mt-1">
                                        {item.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Notas do Motorista (Secao de Destaque) */}
                          {(() => {
                            const driverNotes = getDriverNotes(
                              maintenance.checklist_data,
                            );
                            return (
                              <div className="mt-4">
                                <h5 className="font-medium text-sm flex items-center gap-2 mb-2">
                                  <MessageSquareText className="h-4 w-4 text-amber-600" />
                                  Observacoes do Motorista
                                </h5>
                                <div className="relative pl-4 py-3 pr-3 rounded-lg bg-amber-50 border-l-4 border-amber-400">
                                  <p className="text-sm text-amber-900 whitespace-pre-wrap">
                                    {driverNotes ||
                                      "Sem observacoes adicionais."}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* COLUNA 2: Formulario de Acao (Admin) */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-primary" />
                            Acao do Administrador
                          </h4>

                          <div className="rounded-xl border bg-background p-4 space-y-3">
                            <Collapsible
                              open={isPhotosOpen}
                              onOpenChange={(open) => {
                                setActivePhotosMaintenanceId(
                                  open ? maintenance.id : null,
                                );
                                setShowPhotos(open);
                              }}
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-2 text-blue-600 border-blue-200/70 hover:text-blue-700 hover:bg-blue-50/60"
                                >
                                  <ImageIcon className="h-4 w-4" />
                                  {isPhotosOpen
                                    ? "Ocultar Fotos"
                                    : "Ver Fotos do Sinistro"}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="mt-3 overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                                {incidentPhotos.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {incidentPhotos.map((foto, index) => (
                                      <a
                                        key={`${maintenance.id}-foto-${index}`}
                                        href={foto}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block"
                                      >
                                        <img
                                          src={foto}
                                          alt={`Foto do sinistro ${index + 1}`}
                                          className="aspect-square w-full rounded-lg object-cover"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Nenhuma foto do sinistro disponível.
                                  </p>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>

                          {isCompleted ? (
                            <div className="space-y-3">
                              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-green-800">
                                  Manutencao Finalizada
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                  Custo: R${" "}
                                  {Number(maintenance.cost || 0).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                                {maintenance.provider && (
                                  <p className="text-xs text-green-700">
                                    Oficina: {maintenance.provider}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 rounded-xl border bg-background p-4">
                              <p className="text-xs text-muted-foreground">
                                Atualize status, valores finais e anexe a nota
                                fiscal para concluir a manutenção.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        <Button
                          onClick={() => openEditMaintenanceModal(maintenance)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar / Finalizar Manutenção
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* --- SECAO 2: HISTORICO GERAL (TABELA) --- */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Histórico Geral de Manutenções</h2>
            <p className="text-sm text-muted-foreground">
              {otherMaintenances.length} registro
              {otherMaintenances.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data da Solicitação</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Oficina</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando dados...
                  </TableCell>
                </TableRow>
              ) : otherMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma manutenção encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                otherMaintenances.map((maintenance) => {
                  const statusKey =
                    maintenance.status === "Agendado"
                      ? "Agendada"
                      : maintenance.status;
                  const config =
                    statusConfig[statusKey] || statusConfig.Agendada;
                  const StatusIcon = config?.icon || Clock;

                  return (
                    <TableRow
                      key={maintenance.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedMaintenance(maintenance);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <TableCell>{getRequestDate(maintenance)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {maintenance.vehicle_plate ||
                              maintenance.vehicle?.placa ||
                              "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {maintenance.vehicle_model ||
                              maintenance.vehicle?.modelo ||
                              ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{maintenance.type || "-"}</TableCell>
                      <TableCell>{maintenance.provider || "-"}</TableCell>
                      <TableCell>
                        R${" "}
                        {Number(maintenance.cost || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            config?.color || "bg-gray-100 text-gray-800"
                          }
                        >
                          {StatusIcon && (
                            <StatusIcon className="mr-1 h-3 w-3" />
                          )}
                          {maintenance.status || "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- MODAL NOVA MANUTENÇÃO --- */}
      <Dialog
        open={isNewMaintenanceOpen}
        onOpenChange={setIsNewMaintenanceOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Manutenção</DialogTitle>
            <DialogDescription>
              Preencha os dados para agendar o serviço.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Input Veículo */}
            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={(value) => setSelectedVehicleId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um veículo..." />
                </SelectTrigger>
                <SelectContent className="z-[300] max-h-[300px]">
                  {vehicles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum veículo disponível
                    </div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                        <span className="font-medium">{vehicle.placa}</span>
                        <span className="text-muted-foreground ml-2">
                          {" "}
                          - {vehicle.modelo}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Info Automática */}
            {selectedVehicle && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo</p>
                      <p className="font-medium">{selectedVehicle.modelo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Km Atual</p>
                      <p className="font-medium">
                        {selectedVehicle.km_atual} km
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Campos do Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={newMaintenance.type}
                  onValueChange={(v) =>
                    setNewMaintenance((prev) => ({ ...prev, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="z-[300]">
                    {maintenanceTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) =>
                    setNewMaintenance((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

              {/* INPUT KM FORMATADO */}
              <div className="space-y-2">
                <Label>Km na Manutenção</Label>
                <Input
                  type="text"
                  placeholder={
                    selectedVehicle ? String(selectedVehicle.km_atual) : "0"
                  }
                  value={newMaintenance.kmAtMaintenance}
                  onChange={handleKmChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Oficina/Fornecedor</Label>
                <Input
                  value={newMaintenance.provider}
                  onChange={(e) =>
                    setNewMaintenance((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                />
              </div>

              {/* INPUT CUSTO FORMATADO */}
              <div className="col-span-2 space-y-2">
                <Label>Custo Estimado (R$)</Label>
                <Input
                  type="text"
                  placeholder="R$ 0,00"
                  value={newMaintenance.cost}
                  onChange={handleCostChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={newMaintenance.description}
                onChange={(e) =>
                  setNewMaintenance((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* UPLOAD DE NOTA FISCAL */}
            <div className="space-y-2">
              <Label>Nota Fiscal (Opcional)</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted/50",
                  uploadedFile
                    ? "border-green-500 bg-green-50/50"
                    : "border-muted-foreground/25",
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleFileDrop}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                />

                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="rounded-full bg-green-100 p-2 text-green-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-700">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">
                      Clique para selecionar ou arraste aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, PNG, JPG (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewMaintenanceOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitMaintenance} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Agendar Manutenção"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL EDITAR / DAR BAIXA --- */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingMaintenance(null);
            setEditInvoiceFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar / Dar Baixa</DialogTitle>
            <DialogDescription>
              Atualize status, valores e anexe a nota fiscal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editMaintenanceData.status}
                  onValueChange={(value) =>
                    setEditMaintenanceData((prev) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="z-[300]">
                    <SelectItem value="Agendada">Agendada</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Oficina/Fornecedor</Label>
                <Input
                  value={editMaintenanceData.provider}
                  onChange={(e) =>
                    setEditMaintenanceData((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                  placeholder="Nome da oficina..."
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={editMaintenanceData.cost}
                  onChange={(e) =>
                    setEditMaintenanceData((prev) => ({
                      ...prev,
                      cost: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            {editMaintenanceData.status === "Concluída" &&
              editingMaintenance?.incident_id && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>
                  Ao concluir, o Sinistro vinculado também será baixado
                  automaticamente.
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nota Fiscal</Label>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                ref={editInvoiceInputRef}
                onChange={(e) =>
                  handleEditInvoiceSelect(e.target.files?.[0] || null)
                }
              />
              {editInvoiceFile ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {editInvoiceFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(editInvoiceFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleEditInvoiceSelect(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-accent/50"
                  onClick={() => editInvoiceInputRef.current?.click()}
                  onDragOver={handleEditInvoiceDragOver}
                  onDrop={handleEditInvoiceDrop}
                >
                  <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Arraste e solte sua Nota Fiscal aqui
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Ou clique para selecionar arquivo (PDF, Imagem)
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditMaintenanceSave}
              disabled={isSavingMaintenance}
              className="bg-primary hover:bg-primary/90"
            >
              {isSavingMaintenance ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DETALHES + DAR BAIXA --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Manutenção</DialogTitle>
          </DialogHeader>

          {selectedMaintenance && (
            <div className="space-y-6 py-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedMaintenance.vehicle_plate}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedMaintenance.vehicle_model}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedMaintenance.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data da Solicitação
                  </p>
                  <p className="font-medium">
                    {getRequestDate(selectedMaintenance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oficina</p>
                  <p className="font-medium">{selectedMaintenance.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo</p>
                  <p className="font-medium">
                    R${" "}
                    {Number(selectedMaintenance.cost).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="p-2 bg-muted rounded">
                  {selectedMaintenance.description}
                </p>
              </div>

              <div className="space-y-3">
                <Collapsible
                  open={isModalPhotosOpen}
                  onOpenChange={(open) => {
                    setActivePhotosMaintenanceId(
                      open ? selectedMaintenance.id : null,
                    );
                    setShowPhotos(open);
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-blue-600 border-blue-200/70 hover:text-blue-700 hover:bg-blue-50/60"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {isModalPhotosOpen
                        ? "Ocultar Fotos"
                        : "Ver Fotos do Sinistro"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    {selectedIncidentPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {selectedIncidentPhotos.map((foto, index) => (
                          <a
                            key={`${selectedMaintenance.id}-modal-foto-${index}`}
                            href={foto}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={foto}
                              alt={`Foto do sinistro ${index + 1}`}
                              className="aspect-square w-full rounded-lg object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhuma foto do sinistro disponível.
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* LÓGICA DE NOTA FISCAL (Com e Sem arquivo) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Nota Fiscal / Comprovante
                </Label>

                {selectedMaintenance.invoice_url ? (
                  /* CASO COM ARQUIVO */
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Nota Fiscal Anexada
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Documento digital
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(selectedMaintenance.invoice_url, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                ) : (
                  /* CASO SEM ARQUIVO */
                  <div className="border-2 border-dashed border-muted bg-muted/10 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileX className="h-8 w-8 opacity-20" />
                    <span className="text-sm italic">
                      Nenhuma nota fiscal foi anexada
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Fechar
                </Button>
                {selectedMaintenance.status !== "Concluída" &&
                  selectedMaintenance.status !== "Concluído" && (
                    <Button
                      onClick={handleCompleteService}
                      disabled={isCompletingService}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isCompletingService ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Dar Baixa
                        </>
                      )}
                    </Button>
                  )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
