"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Car,
  Upload,
  FileText,
  Eye,
  ChevronsUpDown,
  Check,
  Gauge,
  GitCompare,
  Loader2,
} from "lucide-react";

// Importações REAIS da API
import { useApp } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { useToastNotification } from "@/contexts/toast-context";
import {
  buscarFrotaAPI,
  buscarManutencoesAPI,
  salvarManutencaoAPI,
  concluirManutencaoAPI,
} from "@/lib/api-service";

// Interface adaptada para o Banco de Dados
interface ExtendedMaintenance {
  id: number; // ID agora é numérico no banco
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_model: string;
  type: string;
  description: string;
  scheduled_date: string; // ISO string
  completed_date?: string;
  cost: number;
  status: string;
  provider: string;
  km_at_maintenance: number;
  invoice_url?: string;
}

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
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados Reais
  const [maintenances, setMaintenances] = useState<ExtendedMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]); // Lista para o Combobox
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<ExtendedMaintenance | null>(null);

  // Form states
  const [vehicleComboOpen, setVehicleComboOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const [newMaintenance, setNewMaintenance] = useState({
    type: "",
    description: "",
    date: "",
    kmAtMaintenance: "",
    provider: "",
    cost: "",
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingService, setIsCompletingService] = useState(false);

  // 1. Carregar Dados ao Iniciar
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
      setVehicles(frota || []);
      setMaintenances(manuts || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  // Helper para achar veículo selecionado (Dados do Banco)
  // ID do banco é number, o select as vezes volta string, convertemos para garantir
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(selectedVehicleId)),
    [selectedVehicleId, vehicles]
  );

  // Filtros
  const filteredMaintenances = maintenances.filter((m) => {
    // Normaliza status para bater com o filtro (Banco pode vir 'Agendada' ou 'Agendado')
    const statusNormalized = m.status === "Agendado" ? "Agendada" : m.status;
    return statusFilter === "all" || statusNormalized === statusFilter;
  });

  // KPIs
  const totalCostMonth = maintenances.reduce(
    (sum, m) => sum + Number(m.cost || 0),
    0
  );

  const scheduledCount = maintenances.filter(
    (m) => m.status === "Agendada" || m.status === "Agendado"
  ).length;
  const inProgressCount = maintenances.filter(
    (m) => m.status === "Em Andamento"
  ).length;
  const completedCount = maintenances.filter(
    (m) => m.status === "Concluída"
  ).length;

  // 2. Salvar Nova Manutenção (POST)
  const handleSubmitMaintenance = async () => {
    if (!selectedVehicleId || !newMaintenance.type || !newMaintenance.date) {
      toast.error("Atenção", "Preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vehicle_id: Number(selectedVehicleId),
        vehicle_plate: selectedVehicle.placa,
        vehicle_model: selectedVehicle.modelo,
        type: newMaintenance.type,
        description: newMaintenance.description,
        scheduled_date: newMaintenance.date,
        cost: Number(newMaintenance.cost) || 0,
        status: "Agendada",
        provider: newMaintenance.provider,
        km_at_maintenance:
          Number(newMaintenance.kmAtMaintenance) ||
          selectedVehicle.km_atual ||
          0,
        // invoice_url: aqui você implementaria o upload real futuramente
      };

      await salvarManutencaoAPI(payload);

      toast.success("Sucesso", "Manutenção agendada com sucesso!");
      setIsNewMaintenanceOpen(false);

      // Limpa form
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

      // Recarrega lista
      carregarTudo();
    } catch (error) {
      toast.error("Erro", "Falha ao salvar manutenção.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Dar Baixa (PATCH)
  const handleCompleteService = async () => {
    if (!selectedMaintenance) return;
    setIsCompletingService(true);

    try {
      await concluirManutencaoAPI(selectedMaintenance.id);

      toast.success("Concluído", "Serviço baixado com sucesso!");
      setIsDetailsOpen(false);
      carregarTudo();
    } catch (error) {
      toast.error("Erro", "Falha ao dar baixa na manutenção.");
    } finally {
      setIsCompletingService(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Manutenção
          </h1>
          <p className="text-muted-foreground">
            Preventivas, corretivas e controle de oficina.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsNewMaintenanceOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
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
              <p className="text-sm text-muted-foreground">Custo Total</p>
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

      {/* Lista */}
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
              {filteredMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhuma manutenção encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaintenances.map((maintenance) => {
                  // Normaliza para achar a cor correta
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

      {/* MODAL NOVA MANUTENÇÃO */}
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
            {/* Input Inteligente de Veículo (Combobox) */}
            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Popover
                open={vehicleComboOpen}
                onOpenChange={setVehicleComboOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedVehicle
                      ? `${selectedVehicle.placa} - ${selectedVehicle.modelo}`
                      : "Selecione um veículo..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar placa..." />
                    <CommandList>
                      <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {vehicles.map((vehicle) => (
                          <CommandItem
                            key={vehicle.id}
                            value={`${vehicle.placa} ${vehicle.modelo}`}
                            onSelect={() => {
                              setSelectedVehicleId(String(vehicle.id));
                              setVehicleComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                String(selectedVehicleId) === String(vehicle.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {vehicle.placa} - {vehicle.modelo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Info Automática do Veículo */}
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

            {/* Upload Fake (Visual) */}
            <div className="space-y-2">
              <Label>Nota Fiscal (Opcional)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {uploadedFile ? (
                  <div className="text-green-600 flex items-center justify-center gap-2">
                    <FileText /> {uploadedFile.name}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p>Arraste ou clique para selecionar</p>
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

      {/* MODAL DETALHES + DAR BAIXA */}
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

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Fechar
                </Button>
                {selectedMaintenance.status !== "Concluída" && (
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
