"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertOctagon,
  Plus,
  FileText,
  DollarSign,
  Wrench,
  AlertTriangle,
  Loader2,
  MapPin,
  User,
  UploadCloud,
  X,
  Filter,
  Clock,
  CheckCircle2,
  Eye,
  FileCheck,
  FileX,
  Download,
} from "lucide-react";
import Image from "next/image";

// Importação dos serviços reais
import {
  buscarIncidentesAPI,
  salvarIncidenteAPI,
  buscarFrotaAPI,
  atualizarStatusIncidenteAPI,
  concluirIncidenteAPI, // Nova função
  transformarIncidenteEmManutencao,
} from "@/lib/api-service";

export function IncidentsView() {
  const router = useRouter();

  // --- ESTADOS DE CONTROLE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingMaintenance, setProcessingMaintenance] = useState(false);
  const [processingConclusion, setProcessingConclusion] = useState(false);

  // Estado para o modo de "Dar Baixa" dentro do modal
  const [isConcludingMode, setIsConcludingMode] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // --- DADOS ---
  const [incidents, setIncidents] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // --- FILTROS ---
  const [filters, setFilters] = useState({
    vehiclePlate: "all",
    status: "all",
    type: "all",
  });

  // --- UPLOAD ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    async function loadData() {
      try {
        const [incidentsData, vehiclesData] = await Promise.all([
          buscarIncidentesAPI(),
          buscarFrotaAPI(),
        ]);
        setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Limpar estados ao fechar modais
  useEffect(() => {
    if (!isCreateOpen) setSelectedFiles([]);
  }, [isCreateOpen]);

  useEffect(() => {
    if (!isDetailsOpen) {
      setIsConcludingMode(false);
      setInvoiceFile(null);
    }
  }, [isDetailsOpen]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      if (
        filters.vehiclePlate !== "all" &&
        item.vehiclePlate !== filters.vehiclePlate
      )
        return false;
      if (filters.status !== "all" && item.status !== filters.status)
        return false;
      if (filters.type !== "all" && item.type !== filters.type) return false;
      return true;
    });
  }, [incidents, filters]);

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehiclePlate !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all"
    );
  }, [filters]);

  const clearFilters = () =>
    setFilters({ vehiclePlate: "all", status: "all", type: "all" });

  // --- ESTATÍSTICAS ---
  const stats = useMemo(() => {
    const open = filteredIncidents.filter((i) => i.status === "Aberto").length;
    const inRepair = filteredIncidents.filter(
      (i) => i.status === "Em Reparo"
    ).length;
    const maintenance = filteredIncidents.filter(
      (i) => i.status === "Em Manutenção"
    ).length;
    const closed = filteredIncidents.filter(
      (i) => i.status === "Concluído" || i.status === "Fechado"
    ).length;
    const totalCost = filteredIncidents.reduce(
      (acc, i) => acc + Number(i.estimatedCost || 0),
      0
    );
    return { open, inRepair, maintenance, closed, totalCost };
  }, [filteredIncidents]);

  // --- STATUS CONFIG ---
  const statusConfig: Record<
    string,
    { color: string; icon: any; label: string }
  > = {
    Aberto: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: AlertOctagon,
      label: "Aberto",
    },
    "Em Reparo": {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: Wrench,
      label: "Em Reparo",
    },
    "Em Manutenção": {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Wrench,
      label: "Em Manutenção",
    },
    "Aguardando Manutenção": {
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: Clock,
      label: "Aguardando Manutenção",
    },
    Concluído: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle2,
      label: "Concluído",
    },
  };

  // --- HANDLERS UPLOAD ---
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  }, []);
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0)
      setSelectedFiles((prev) => [...prev, ...files].slice(0, 5));
  };
  const removeFile = (idx: number) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  // --- SUBMIT CRIAR ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.append("status", "Aberto");
    const insuranceChecked = formData.get("insuranceClaim") === "on";
    formData.set("insuranceClaim", String(insuranceChecked));

    const placa = formData.get("vehiclePlate") as string;
    const veiculoObj = vehicles.find((v) => v.placa === placa);
    const modelo =
      veiculoObj?.modelo || veiculoObj?.marca_modelo || "Não identificado";
    formData.append("vehicleModel", modelo);

    selectedFiles.forEach((file) => formData.append("photos", file));

    try {
      const saved = await salvarIncidenteAPI(formData);
      setIncidents([saved, ...incidents]);
      setIsCreateOpen(false);
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // --- SOLICITAR MANUTENÇÃO ---
  const handleRequestMaintenance = async () => {
    if (!selectedIncident) return;
    setProcessingMaintenance(true);
    try {
      await transformarIncidenteEmManutencao(selectedIncident.id);
      await atualizarStatusIncidenteAPI(selectedIncident.id, "Em Manutenção");

      const updatedList = incidents.map((inc) =>
        inc.id === selectedIncident.id
          ? { ...inc, status: "Em Manutenção" }
          : inc
      );
      setIncidents(updatedList);
      setSelectedIncident({ ...selectedIncident, status: "Em Manutenção" });
      alert("Solicitação de manutenção criada com sucesso!");
    } catch (error) {
      alert("Erro ao solicitar manutenção.");
    } finally {
      setProcessingMaintenance(false);
    }
  };

  // --- DAR BAIXA (CONCLUIR) ---
  const handleConclude = async () => {
    if (!selectedIncident) return;
    setProcessingConclusion(true);

    const formData = new FormData();
    if (invoiceFile) {
      formData.append("invoice", invoiceFile);
    }

    try {
      const updated = await concluirIncidenteAPI(selectedIncident.id, formData);

      // Atualiza lista e seleção
      const updatedList = incidents.map((inc) =>
        inc.id === selectedIncident.id ? updated : inc
      );
      setIncidents(updatedList);
      setSelectedIncident(updated);
      setIsConcludingMode(false);

      alert("Manutenção concluída e baixa realizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao dar baixa. Tente novamente.");
    } finally {
      setProcessingConclusion(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type?.includes("Acidente") || type?.includes("Colisão"))
      return <AlertOctagon className="h-5 w-5 text-red-500" />;
    if (type?.includes("Avaria"))
      return <Wrench className="h-5 w-5 text-amber-500" />;
    return <AlertTriangle className="h-5 w-5 text-blue-500" />;
  };

  const hasMaintenanceOrigin = Boolean(
    selectedIncident?.maintenanceId || selectedIncident?.journeyId
  );
  const shouldShowMaintenanceCTA =
    selectedIncident?.status === "Aguardando Manutenção" ||
    selectedIncident?.status === "Em Manutenção";

  const handleGoToMaintenance = () => {
    router.push("/admin/manutencao");
  };

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & FILTROS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestão de Sinistros
          </h1>
          <p className="text-muted-foreground">
            Monitoramento e controle de ocorrências da frota
          </p>
        </div>
        <div className="flex gap-2">
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
                <Filter className="h-4 w-4" /> Filtros
                {isAnyFilterActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold leading-none">Filtros Ativos</h4>
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
                      value={filters.vehiclePlate}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, vehiclePlate: v }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.placa}>
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
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Em Reparo">Em Reparo</SelectItem>
                          <SelectItem value="Em Manutenção">
                            Em Manutenção
                          </SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Registrar Incidente
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* ... (Cards de KPI iguais ao anterior) ... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Abertos
            </CardTitle>
            <AlertOctagon className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Reparo
            </CardTitle>
            <Wrench className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.inRepair}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Manut.
            </CardTitle>
            <Wrench className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.maintenance}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.closed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTA DE CARDS (Com indicador de NF) */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Histórico de Ocorrências</CardTitle>
          <CardDescription>
            Visualização detalhada dos registros ({filteredIncidents.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhum registro encontrado.
                </div>
              ) : (
                filteredIncidents.map((incident) => {
                  const config =
                    statusConfig[incident.status] || statusConfig["Aberto"];
                  return (
                    <div
                      key={incident.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                          {getTypeIcon(incident.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                              {incident.type}
                            </span>
                            <Badge variant="outline" className="font-mono">
                              {incident.vehiclePlate}
                            </Badge>
                            <Badge
                              className={cn("gap-1 font-normal", config.color)}
                              variant="outline"
                            >
                              {config.icon && (
                                <config.icon className="h-3 w-3" />
                              )}{" "}
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {incident.vehicleModel} • Motorista:{" "}
                            {incident.driverName}
                          </p>

                          {/* Indicador de NF */}
                          <div className="flex items-center gap-2 mt-1">
                            {incident.invoiceUrl ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 bg-green-50 text-green-700 hover:bg-green-100 gap-1 px-1.5"
                              >
                                <FileCheck className="h-3 w-3" /> NF Anexada
                              </Badge>
                            ) : incident.status === "Concluído" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 bg-orange-50 text-orange-700 hover:bg-orange-100 gap-1 px-1.5"
                              >
                                <FileX className="h-3 w-3" /> Sem NF
                              </Badge>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />{" "}
                              {format(new Date(incident.date), "dd/MM/yyyy")} às{" "}
                              {incident.time}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />{" "}
                              {incident.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-lg font-bold">
                          {Number(incident.estimatedCost).toLocaleString(
                            "pt-BR",
                            { style: "currency", currency: "BRL" }
                          )}
                        </span>
                        {incident.insuranceClaim && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="mr-1 h-3 w-3" /> Seguro
                            Acionado
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-8 text-muted-foreground"
                        >
                          <Eye className="mr-2 h-3 w-3" /> Detalhes
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* MODAL DE CADASTRO (MANTIDO DO ADMIN) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nova Ocorrência (Admin)</DialogTitle>
            <DialogDescription>
              Preencha os detalhes e anexe fotos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {/* ... (campos de cadastro mantidos idênticos ao anterior) ... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colisão Frontal">
                      Colisão Frontal
                    </SelectItem>
                    <SelectItem value="Colisão Traseira">
                      Colisão Traseira
                    </SelectItem>
                    <SelectItem value="Avaria Mecânica">
                      Avaria Mecânica
                    </SelectItem>
                    <SelectItem value="Roubo/Furto">Roubo/Furto</SelectItem>
                    <SelectItem value="Dano a Terceiros">
                      Dano a Terceiros
                    </SelectItem>
                    <SelectItem value="Multa de Trânsito">
                      Multa de Trânsito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input name="date" type="date" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Hora</Label>
                <Input name="time" type="time" required />
              </div>
              <div className="grid gap-2">
                <Label>Veículo</Label>
                <Select name="vehiclePlate" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Placa" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id || v.placa} value={v.placa}>
                        {v.placa} - {v.modelo || v.marca_modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Motorista</Label>
              <Select name="driverName" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carlos Silva">Carlos Silva</SelectItem>
                  <SelectItem value="Roberto Santos">Roberto Santos</SelectItem>
                  <SelectItem value="Ana Oliveira">Ana Oliveira</SelectItem>
                  <SelectItem value="Marcos Souza">Marcos Souza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Local</Label>
              <Input
                name="location"
                placeholder="Endereço ou Rodovia/KM"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="grid gap-2">
                <Label>Custo Estimado (R$)</Label>
                <Input
                  name="estimatedCost"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                />
              </div>
              <div className="flex items-center space-x-2 pb-3">
                <Checkbox id="insurance" name="insuranceClaim" />
                <Label htmlFor="insurance">Acionar Seguro?</Label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea name="description" placeholder="Detalhes..." required />
            </div>
            <div className="grid gap-2">
              <Label>Fotos (Máx. 5)</Label>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:bg-accent"
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  multiple
                  accept="image/*"
                />
                <UploadCloud
                  className={`h-6 w-6 ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="text-sm font-medium">Arraste fotos ou clique</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-md overflow-hidden border"
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="mt-2 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Registrar Ocorrência"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DETALHES COM BAIXA (CONCLUIR) --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isConcludingMode
                ? "Concluir Manutenção / Dar Baixa"
                : "Detalhes da Ocorrência"}
            </DialogTitle>
            <DialogDescription>
              {isConcludingMode
                ? "Anexe a Nota Fiscal para finalizar o processo."
                : `ID: ${selectedIncident?.id} | ${
                    selectedIncident &&
                    format(new Date(selectedIncident.date), "dd/MM/yyyy")
                  }`}
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && !isConcludingMode && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold text-lg">
                    {selectedIncident.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {selectedIncident.status && (
                    <Badge
                      variant="outline"
                      className={statusConfig[selectedIncident.status]?.color}
                    >
                      {selectedIncident.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Veículo</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <div className="font-medium">
                      {selectedIncident.vehiclePlate}
                    </div>
                    <div className="text-xs text-muted-foreground border-l pl-2">
                      {selectedIncident.vehicleModel}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Emissor</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="font-medium">
                      {selectedIncident.driverName}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Local</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-destructive" />
                    <span>{selectedIncident.location}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">
                    Custo Estimado
                  </Label>
                  <div className="flex items-center gap-1 font-bold text-lg text-red-600">
                    <DollarSign className="h-4 w-4" />
                    {Number(selectedIncident.estimatedCost).toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}
                  </div>
                  {selectedIncident.insuranceClaim && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Seguro Acionado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Descrição</Label>
                <div className="p-3 bg-muted/50 rounded-md text-sm border">
                  {selectedIncident.description}
                </div>
              </div>

              {selectedIncident && shouldShowMaintenanceCTA && (
                <div className="mt-4 p-4 border rounded-md bg-yellow-50 border-yellow-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-sm text-yellow-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <span>
                        Este sinistro gerou uma manutenção e precisa ser
                        finalizado na aba de manutenções.
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="border-yellow-200 text-yellow-900 hover:bg-yellow-100"
                      onClick={handleGoToMaintenance}
                    >
                      Gerenciar na Aba Manutenções
                    </Button>
                  </div>
                </div>
              )}

              {/* Exibição de Nota Fiscal se existir */}
              {selectedIncident.invoiceUrl && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <FileCheck className="h-5 w-5" />
                    <span className="font-medium text-sm">
                      Nota Fiscal Anexada
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-200 hover:bg-green-100 text-green-800"
                    onClick={() =>
                      window.open(selectedIncident.invoiceUrl, "_blank")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" /> Baixar PDF/Imagem
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Fotos ({selectedIncident.fotos?.length || 0})
                </Label>
                {selectedIncident.fotos?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedIncident.fotos.map(
                      (url: string, index: number) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-md overflow-hidden border bg-muted"
                        >
                          <Image
                            src={url}
                            alt="Foto"
                            fill
                            className="object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(url, "_blank")}
                          />
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground text-sm">
                    Sem fotos.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODO DE CONCLUSÃO (DAR BAIXA) */}
          {isConcludingMode && (
            <div className="py-6 space-y-4">
              <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                Você está prestes a concluir a manutenção do sinistro{" "}
                <strong>#{selectedIncident.id}</strong>. Por favor, anexe a Nota
                Fiscal ou comprovante do serviço realizado.
              </div>
              <div className="grid gap-2">
                <Label>Nota Fiscal (PDF ou Imagem)</Label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-between items-center">
            {!isConcludingMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Fechar
                </Button>
                <div className="flex gap-2">
                  {/* Botão Solicitar Manutenção */}
                  {selectedIncident &&
                    selectedIncident.status !== "Em Manutenção" &&
                    selectedIncident.status !== "Concluído" && (
                      <Button
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={handleRequestMaintenance}
                        disabled={processingMaintenance}
                      >
                        {processingMaintenance ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="mr-2 h-4 w-4" />
                        )}{" "}
                        Solicitar Manutenção
                      </Button>
                    )}
                  {/* Botão Dar Baixa (Aparece apenas se estiver Em Manutenção) */}
                  {selectedIncident &&
                    (selectedIncident.status === "Em Manutenção" ||
                      selectedIncident.status === "Em Reparo") &&
                    !hasMaintenanceOrigin && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setIsConcludingMode(true)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir / Dar
                        Baixa
                      </Button>
                    )}
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsConcludingMode(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConclude}
                  disabled={processingConclusion}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingConclusion ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar Baixa"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
