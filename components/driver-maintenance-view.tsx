"use client";

import type React from "react";
import { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Car,
  Eye,
  Filter,
  X,
  Camera,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// --- INTERFACES ---
interface MaintenanceRecord {
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
  requested_by: string;
}

// --- CONFIGURAÇÃO DE STATUS ---
const statusConfig: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
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

const problemTypes = [
  { value: "Freios", label: "Problema nos Freios" },
  { value: "Pneus", label: "Desgaste/Dano em Pneu" },
  { value: "Motor", label: "Luz de Alerta no Painel" },
  { value: "Vazamento", label: "Vazamento de Fluido" },
  { value: "Ruído", label: "Ruído Anormal" },
  { value: "Ar Condicionado", label: "Ar Condicionado" },
  { value: "Outro", label: "Outro" },
];

// --- MOCK DATA ---
const mockVehicles = [
  { id: 1, placa: "ABC-1234", modelo: "Volvo FH 460", km_atual: 150000 },
  { id: 2, placa: "DEF-5678", modelo: "Scania R450", km_atual: 120000 },
  { id: 3, placa: "GHI-9012", modelo: "Mercedes Actros", km_atual: 180000 },
];

const generateDriverMaintenanceRecords = (
  driverName: string
): MaintenanceRecord[] => {
  const records: MaintenanceRecord[] = [];
  const statuses = ["Agendada", "Em Andamento", "Concluída", "Urgente"];
  const types = ["Preventiva", "Corretiva", "Preditiva"];

  for (let i = 0; i < 15; i++) {
    const vehicle = mockVehicles[i % 3];
    const status = statuses[i % 4];
    records.push({
      id: i + 1,
      vehicle_id: vehicle.id,
      vehicle_plate: vehicle.placa,
      vehicle_model: vehicle.modelo,
      type: types[i % 3],
      description: `Manutenção ${i + 1} - ${problemTypes[i % 7].label}`,
      scheduled_date: format(subDays(new Date(), i * 3), "yyyy-MM-dd"),
      completed_date:
        status === "Concluída"
          ? format(subDays(new Date(), i * 3 - 1), "yyyy-MM-dd")
          : undefined,
      cost: Math.floor(500 + Math.random() * 2000),
      status,
      provider: ["Oficina Central", "Auto Mecânica Silva", "Truck Service"][
        i % 3
      ],
      km_at_maintenance: vehicle.km_atual - i * 1000,
      requested_by: driverName,
    });
  }
  return records;
};

export function DriverMaintenanceView() {
  const { user } = useAuth();
  const driverName = user?.name || "Motorista";

  // --- ESTADOS DE DADOS ---
  const [maintenances] = useState<MaintenanceRecord[]>(() =>
    generateDriverMaintenanceRecords(driverName)
  );

  // --- ESTADOS DOS MODAIS ---
  const [isNewMaintenanceOpen, setIsNewMaintenanceOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<MaintenanceRecord | null>(null);

  // --- ESTADOS DO FORMULÁRIO ---
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [newMaintenance, setNewMaintenance] = useState({
    type: "",
    problemType: "",
    description: "",
    urgency: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTADO DOS FILTROS ---
  const [filters, setFilters] = useState({
    vehicleId: "all",
    status: "all",
    type: "all",
  });

  const isAnyFilterActive = useMemo(() => {
    return (
      filters.vehicleId !== "all" ||
      filters.status !== "all" ||
      filters.type !== "all"
    );
  }, [filters]);

  // --- LÓGICA DE FILTRAGEM ---
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

  const clearFilters = () => {
    setFilters({ vehicleId: "all", status: "all", type: "all" });
  };

  // --- KPIs ---
  const scheduledCount = filteredMaintenances.filter(
    (m) => m.status === "Agendada"
  ).length;
  const inProgressCount = filteredMaintenances.filter(
    (m) => m.status === "Em Andamento"
  ).length;
  const completedCount = filteredMaintenances.filter(
    (m) => m.status === "Concluída"
  ).length;
  const urgentCount = filteredMaintenances.filter(
    (m) => m.status === "Urgente"
  ).length;

  // Helper para veículo selecionado
  const selectedVehicle = useMemo(
    () => mockVehicles.find((v) => String(v.id) === String(selectedVehicleId)),
    [selectedVehicleId]
  );

  // --- HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    // TODO: Integrar com backend
    // await api.post('/manutencao/solicitacao', {
    //   vehicle_id: selectedVehicleId,
    //   type: newMaintenance.type,
    //   problem_type: newMaintenance.problemType,
    //   description: newMaintenance.description,
    //   urgency: newMaintenance.urgency,
    //   requested_by: driverName,
    //   photo: uploadedFile
    // })

    setTimeout(() => {
      setIsSubmitting(false);
      setIsNewMaintenanceOpen(false);
      setNewMaintenance({
        type: "",
        problemType: "",
        description: "",
        urgency: "",
      });
      setSelectedVehicleId("");
      setUploadedFile(null);
    }, 1500);
  };

  const openDetails = (maintenance: MaintenanceRecord) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Minha Manutenção
          </h1>
          <p className="text-muted-foreground">
            Solicitações e acompanhamento de serviços
          </p>
        </div>
        <div className="flex gap-2">
          {/* FILTROS */}
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
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-semibold leading-none">Filtros</h4>
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
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os veículos</SelectItem>
                        {mockVehicles.map((v) => (
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
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="Agendada">Agendada</SelectItem>
                          <SelectItem value="Em Andamento">
                            Em Andamento
                          </SelectItem>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
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
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => setIsNewMaintenanceOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Reportar Problema
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Urgentes
              </p>
              <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Agendadas
              </p>
              <p className="text-2xl font-bold">{scheduledCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-yellow-100 p-3">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Em Andamento
              </p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Concluídas
              </p>
              <p className="text-2xl font-bold text-green-600">
                {completedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Solicitações</CardTitle>
          <CardDescription>
            Histórico de manutenções solicitadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data Agendada</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaintenances.map((item) => {
                  const config =
                    statusConfig[item.status] || statusConfig["Agendada"];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.vehicle_plate}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.vehicle_model}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.description}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.scheduled_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{item.provider}</TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", config.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* DIALOG: NOVA SOLICITAÇÃO */}
      <Dialog
        open={isNewMaintenanceOpen}
        onOpenChange={setIsNewMaintenanceOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reportar Problema</DialogTitle>
            <DialogDescription>
              Informe um problema ou necessidade de manutenção
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Veículo *</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o veículo" />
                </SelectTrigger>
                <SelectContent>
                  {mockVehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.placa} - {v.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Problema *</Label>
              <Select
                value={newMaintenance.problemType}
                onValueChange={(v) =>
                  setNewMaintenance((prev) => ({ ...prev, problemType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
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

            <div className="space-y-2">
              <Label>Nível de Urgência *</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "baixa",
                    label: "Baixa",
                    color: "border-green-500 bg-green-50 text-green-700",
                  },
                  {
                    id: "media",
                    label: "Média",
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
                      "h-10",
                      newMaintenance.urgency === u.id && u.color
                    )}
                    onClick={() =>
                      setNewMaintenance((prev) => ({ ...prev, urgency: u.id }))
                    }
                  >
                    {u.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição do Problema</Label>
              <Textarea
                placeholder="Descreva o problema com detalhes..."
                value={newMaintenance.description}
                onChange={(e) =>
                  setNewMaintenance((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Foto (opcional)</Label>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  uploadedFile
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Camera
                  className={cn(
                    "h-8 w-8 mx-auto mb-2",
                    uploadedFile ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      {uploadedFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique para adicionar foto
                  </p>
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
            <Button
              onClick={handleSubmitMaintenance}
              disabled={
                !selectedVehicleId ||
                !newMaintenance.problemType ||
                !newMaintenance.urgency ||
                isSubmitting
              }
            >
              {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETALHES */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedMaintenance && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Veículo</p>
                  <p className="font-medium">
                    {selectedMaintenance.vehicle_plate} -{" "}
                    {selectedMaintenance.vehicle_model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={cn(
                      "gap-1",
                      statusConfig[selectedMaintenance.status]?.color
                    )}
                  >
                    {selectedMaintenance.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{selectedMaintenance.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Agendada</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedMaintenance.scheduled_date),
                      "dd/MM/yyyy"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oficina</p>
                  <p className="font-medium">{selectedMaintenance.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KM</p>
                  <p className="font-medium">
                    {selectedMaintenance.km_at_maintenance.toLocaleString()} km
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedMaintenance.description}</p>
              </div>
              {selectedMaintenance.completed_date && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data Conclusão
                  </p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedMaintenance.completed_date),
                      "dd/MM/yyyy"
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
