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
  FileX, // <--- Ícone novo para quando não tem arquivo
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastNotification } from "@/contexts/toast-context";
// Importações da API
import {
  buscarFrotaAPI,
  buscarManutencoesAPI,
  salvarManutencaoAPI,
  concluirManutencaoAPI,
} from "@/lib/api-service";

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

  // --- ESTADOS DO FORMULÁRIO (Nova Manutenção) ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [newMaintenance, setNewMaintenance] = useState({
    type: "",
    description: "",
    date: "",
    kmAtMaintenance: "",
    provider: "",
    cost: "",
  });

  // Estado e Ref para Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingService, setIsCompletingService] = useState(false);

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
    [selectedVehicleId, vehicles]
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

  // --- KPIs ---
  const totalCostMonth = filteredMaintenances.reduce(
    (sum, m) => sum + Number(m.cost || 0),
    0
  );
  const scheduledCount = filteredMaintenances.filter((m) =>
    m.status.includes("Agendad")
  ).length;
  const inProgressCount = filteredMaintenances.filter(
    (m) => m.status === "Em Andamento"
  ).length;
  const completedCount = filteredMaintenances.filter(
    (m) => m.status === "Concluída" || m.status === "Concluído"
  ).length;

  // --- 2. LÓGICA DE UPLOAD ---
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

      const payload = {
        vehicle_id: Number(selectedVehicleId),
        vehicle_plate: selectedVehicle?.placa || "N/A",
        vehicle_model: selectedVehicle?.modelo || "N/A",
        type: newMaintenance.type,
        description: newMaintenance.description,
        scheduled_date: newMaintenance.date,
        cost: Number(newMaintenance.cost) || 0,
        status: "Agendada",
        provider: newMaintenance.provider,
        km_at_maintenance:
          Number(newMaintenance.kmAtMaintenance) ||
          selectedVehicle?.km_atual ||
          0,
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
                    "border-primary text-primary bg-primary/5"
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

      {/* TABELA */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
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
              ) : filteredMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma manutenção encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenances.map((maintenance) => {
                  const statusKey =
                    maintenance.status === "Agendado"
                      ? "Agendada"
                      : maintenance.status;
                  const config =
                    statusConfig[statusKey] || statusConfig.Agendada;
                  const StatusIcon = config.icon;

                  return (
                    <TableRow
                      key={maintenance.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedMaintenance(maintenance);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <TableCell>
                        {new Date(
                          maintenance.scheduled_date
                        ).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {maintenance.vehicle_plate}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {maintenance.vehicle_model}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{maintenance.type}</TableCell>
                      <TableCell>{maintenance.provider || "-"}</TableCell>
                      <TableCell>
                        R${" "}
                        {Number(maintenance.cost).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {maintenance.status}
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

              <div className="space-y-2">
                <Label>Km na Manutenção</Label>
                <Input
                  type="number"
                  placeholder={
                    selectedVehicle ? String(selectedVehicle.km_atual) : "0"
                  }
                  value={newMaintenance.kmAtMaintenance}
                  onChange={(e) =>
                    setNewMaintenance((prev) => ({
                      ...prev,
                      kmAtMaintenance: e.target.value,
                    }))
                  }
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

              <div className="col-span-2 space-y-2">
                <Label>Custo Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost}
                  onChange={(e) =>
                    setNewMaintenance((prev) => ({
                      ...prev,
                      cost: e.target.value,
                    }))
                  }
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
                    : "border-muted-foreground/25"
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
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(
                      selectedMaintenance.scheduled_date
                    ).toLocaleDateString("pt-BR")}
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
                  /* CASO SEM ARQUIVO (Pontilhado Acinzentado) */
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
