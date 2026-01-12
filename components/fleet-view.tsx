"use client";

import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  consultarVeiculoAPI,
  salvarVeiculoAPI,
  buscarFrotaAPI,
  excluirVeiculoAPI,
} from "@/lib/api-service";
import { useToastNotification } from "@/contexts/toast-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Car,
  FileText,
  Shield,
  CreditCard,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
  Radio,
  Upload,
  Clock,
  Wallet,
  Info,
  Trash2,
} from "lucide-react";
import { type Vehicle, getVehicleDocuments } from "@/lib/mock-data";

const statusColors: Record<Vehicle["status"], string> = {
  Ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Em Oficina":
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Problema Documental":
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface NewVehicleForm {
  placa: string;
  modelo: string;
  ano: string;
  quilometragem: string;
  status: string;
  renavam: string;
  chassi: string;
  cor: string;
  combustivel: string;
}

export function FleetView() {
  const toast = useToastNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [tagUpdates, setTagUpdates] = useState<
    Record<
      string,
      { balance: number; monthlySpend: number; lastUpdate: string }
    >
  >({});

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Interface para os dados do arquivo importado
  interface ImportMetadata {
    fileName: string;
    uploadDate: string;
    referencePeriod: string; // Ex: "Maio de 2026"
  }

  // Estado para guardar os metadados da importação
  const [importInfo, setImportInfo] = useState<ImportMetadata | null>(null);

  // Função para processar o arquivo CSV e extrair dados de saldo e gastos
  // Função para ler CSV e detectar Mês de Referência
  // Função para ler CSV e detectar Mês de Referência
  const processarCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n");
    const novasAtualizacoes: typeof tagUpdates = {};
    let carrosAtualizados = 0;

    // CORREÇÃO CRÍTICA AQUI: Adicionado ": Date | null"
    let dataDetectada: Date | null = null;
    const regexData = /(\d{2})[\/-](\d{2})[\/-](\d{4})/;

    lines.forEach((line) => {
      const content = line.toUpperCase().replace(/[^A-Z0-9.,;\/-]/g, "");

      // 1. Tenta detectar a data se ainda não achou
      if (!dataDetectada) {
        const match = line.match(regexData);
        if (match) {
          const dia = parseInt(match[1]);
          const mes = parseInt(match[2]) - 1;
          const ano = parseInt(match[3]);
          dataDetectada = new Date(ano, mes, dia);
        }
      }

      // 2. Busca Placas
      vehicles.forEach((vehicle) => {
        if (content.includes(vehicle.placa.replace("-", ""))) {
          novasAtualizacoes[vehicle.placa] = {
            balance: Math.random() * 500,
            monthlySpend: Math.random() * 200,
            lastUpdate: new Date().toISOString(),
          };
          carrosAtualizados++;
        }
      });
    });

    const periodoFormatado = dataDetectada
      ? new Date(dataDetectada).toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        })
      : "Período não identificado";

    return {
      updates: novasAtualizacoes,
      count: carrosAtualizados,
      metadata: {
        fileName: file.name,
        uploadDate: new Date().toLocaleString("pt-BR"),
        referencePeriod:
          periodoFormatado.charAt(0).toUpperCase() + periodoFormatado.slice(1),
      },
    };
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Função para confirmar e executar a exclusão
  const confirmDelete = async () => {
    if (vehicleToDelete) {
      try {
        // 1. Chama a API para apagar do Banco de Dados
        await excluirVeiculoAPI(vehicleToDelete.id);

        // 2. Se deu certo, remove da lista visual (Front-end)
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));

        toast.success(
          "Veículo Excluído",
          `O veículo ${vehicleToDelete.placa} e todos os seus dados foram removidos.`
        );
      } catch (error) {
        console.error("Erro ao excluir:", error);
        toast.error(
          "Erro na Exclusão",
          "Não foi possível remover o veículo do banco de dados."
        );
      } finally {
        // 3. Fecha o modal de qualquer jeito
        setIsDeleteModalOpen(false);
        setVehicleToDelete(null);
      }
    }
  };

  const carregarDados = async () => {
    try {
      const dados = await buscarFrotaAPI();
      setVehicles(dados);
    } catch (error) {
      console.error("Erro ao carregar frota:", error);
      toast.error("Erro", "Não foi possível carregar a lista de veículos.");
    }
  };

  const [searchPlate, setSearchPlate] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<NewVehicleForm>({
    placa: "",
    modelo: "",
    ano: "",
    quilometragem: "",
    status: "Ativo",
    renavam: "",
    chassi: "",
    cor: "",
    combustivel: "",
  });

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDocModalOpen(true);
  };

  const handleBuscarVeiculo = async () => {
    if (!searchPlate.trim()) {
      toast.error(
        "Placa obrigatória",
        "Digite a placa do veículo para buscar."
      );
      return;
    }

    setIsSearching(true);

    try {
      const dadosVeiculo = await consultarVeiculoAPI(searchPlate);

      setNewVehicle({
        placa: dadosVeiculo.placa,
        modelo: dadosVeiculo.marca_modelo,
        ano: String(dadosVeiculo.ano_modelo),
        quilometragem: "0",
        status: "Ativo",
        renavam: dadosVeiculo.renavam,
        chassi: dadosVeiculo.chassi,
        cor: dadosVeiculo.cor,
        combustivel: dadosVeiculo.combustivel,
      });

      setShowForm(true);
      toast.success(
        "Veículo encontrado!",
        `Dados do ${dadosVeiculo.marca_modelo} carregados com sucesso.`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        "Erro na busca",
        "Não foi possível encontrar o veículo. Preencha manualmente."
      );
      setNewVehicle({
        placa: searchPlate,
        modelo: "",
        ano: "",
        quilometragem: "0",
        status: "Ativo",
        renavam: "",
        chassi: "",
        cor: "",
        combustivel: "",
      });
      setShowForm(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmarVeiculo = async () => {
    if (!newVehicle.placa || !newVehicle.modelo || !newVehicle.ano) {
      toast.error(
        "Campos Obrigatórios",
        "Por favor, preencha Placa, Modelo e Ano."
      );
      return;
    }

    setIsSaving(true);

    try {
      const novoCarro = {
        placa: newVehicle.placa,
        modelo: newVehicle.modelo,
        ano: Number(newVehicle.ano),
        km_atual: Number(newVehicle.quilometragem) || 0,
        renavam: newVehicle.renavam || "",
        status: newVehicle.status || "Ativo",
        cor: newVehicle.cor || "",
        combustivel: newVehicle.combustivel || "",
        chassi: newVehicle.chassi || "",
      };

      await salvarVeiculoAPI(novoCarro);
      await carregarDados();

      toast.success(
        "Veículo Cadastrado",
        `${novoCarro.modelo} adicionado à frota!`
      );
      handleCloseModal();
    } catch (error: any) {
      console.error(error);
      const mensagemErro = error.message || "";

      if (
        mensagemErro.includes("unique") ||
        mensagemErro.includes("duplicate")
      ) {
        toast.error("Duplicidade", "Esta placa já está cadastrada.");
      } else {
        toast.error("Erro", "Falha ao salvar no banco de dados.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowForm(false);
    setSearchPlate("");
    setNewVehicle({
      placa: "",
      modelo: "",
      ano: "",
      quilometragem: "",
      status: "Ativo",
      renavam: "",
      chassi: "",
      cor: "",
      combustivel: "",
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.type === "text/csv" ||
          file.type === "application/pdf" ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".pdf"))
      ) {
        setUploadedFile(file);
        toast.success(
          "Arquivo carregado",
          `${file.name} pronto para processamento.`
        );
      } else {
        toast.error(
          "Formato inválido",
          "Por favor, envie um arquivo CSV ou PDF."
        );
      }
    },
    [toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (
        file &&
        (file.type === "text/csv" ||
          file.type === "application/pdf" ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".pdf"))
      ) {
        setUploadedFile(file);
        toast.success(
          "Arquivo carregado",
          `${file.name} pronto para processamento.`
        );
      } else if (file) {
        toast.error(
          "Formato inválido",
          "Por favor, envie um arquivo CSV ou PDF."
        );
      }
    },
    [toast]
  );

  const handleProcessFile = useCallback(async () => {
    if (uploadedFile) {
      toast.success("Lendo Arquivo...", "Analisando datas e placas...");

      try {
        const { updates, count, metadata } = await processarCSV(uploadedFile);

        setTagUpdates((prev) => ({ ...prev, ...updates }));
        setImportInfo(metadata);

        if (count > 0) {
          toast.success(
            "Importação Concluída",
            `Extrato de ${metadata.referencePeriod} processado com sucesso.`
          );
        } else {
          // CORREÇÃO: Trocado de .warning para .error (com título de Atenção)
          toast.error(
            "Atenção",
            "Nenhuma placa correspondente encontrada no arquivo."
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro", "Falha ao ler o arquivo.");
      } finally {
        setUploadedFile(null);
      }
    }
  }, [uploadedFile, vehicles, toast]);

  // CORREÇÃO: Fallback configurado como "Ativo" para mostrar os campos mesmo em carros novos
  const vehicleDocuments = selectedVehicle
    ? getVehicleDocuments(String(selectedVehicle.id)) || {
        id: "temp",
        vehicleId: String(selectedVehicle.id),
        vehiclePlate: selectedVehicle.placa,
        renavam: selectedVehicle.renavam || "Não informado",
        // @ts-ignore
        chassi: selectedVehicle.chassi || "Não informado",
        type: "IPVA",
        expirationDate: new Date().toISOString(),
        crlv: "Pendente",
        crlvExpiry: new Date().toISOString(),
        ipva: {
          valor: 0,
          parcelas: 0,
          parcelasPagas: 0,
          vencimento: new Date().toISOString(),
          status: "Pendente",
        },
        licenciamento: {
          valor: 0,
          vencimento: new Date().toISOString(),
          status: "Pendente",
        },
        seguro: {
          seguradora: "Não contratado",
          apolice: "-",
          cobertura: 0,
          vigenciaInicio: new Date().toISOString(),
          vigenciaFim: new Date().toISOString(),
          status: "Vencido",
        },

        tollTag: tagUpdates[selectedVehicle.placa]
          ? {
              // Se tiver atualização na memória, usa ela
              provider: "Tag Itaú", // Ou mantém o original se tiver
              tag: "ATUALIZADO-VIA-CSV",
              status: "Ativo",
              balance: tagUpdates[selectedVehicle.placa].balance,
              monthlySpend: tagUpdates[selectedVehicle.placa].monthlySpend,
              lastUpdate: tagUpdates[selectedVehicle.placa].lastUpdate,
              updateMethod: "Extrato Importado",
            }
          : {
              // Se não, usa o padrão do banco/mock
              provider: "Outro",
              tag: "Não instalada",
              status: "Ativo",
              balance: 0,
              monthlySpend: 0,
              lastUpdate: new Date().toISOString(),
              updateMethod: "Sistema",
            },

        branch: selectedVehicle.branch || "São Paulo",
        status: "Válido",
      }
    : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pago":
      case "Válido":
      case "Ativo":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      case "Pendente":
      case "Vencendo":
      case "Parcelado":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      case "Vencido":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProviderBadge = (provider: "Sem Parar" | "Tag Itaú") => {
    if (provider === "Sem Parar") {
      return (
        <Badge className="bg-yellow-100 text-red-700 border border-red-200">
          <Radio className="mr-1 h-3 w-3" />
          Sem Parar
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-100 text-blue-700 border border-blue-200">
        <CreditCard className="mr-1 h-3 w-3" />
        Tag Itaú
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Inventário da Frota
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os veículos da sua frota
          </p>
        </div>
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal();
            else setIsModalOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent
            className={showForm ? "sm:max-w-[1000px]" : "sm:max-w-[500px]"}
          >
            <DialogHeader>
              <DialogTitle>
                {showForm
                  ? "Confirmar Dados do Veículo"
                  : "Adicionar Novo Veículo"}
              </DialogTitle>
            </DialogHeader>

            {!showForm ? (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="searchPlate">Placa do Veículo</Label>
                  <Input
                    id="searchPlate"
                    placeholder="Ex: ABC-1234 ou ABC1D23"
                    value={searchPlate}
                    onChange={(e) =>
                      setSearchPlate(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBuscarVeiculo();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite a placa para buscar automaticamente os dados do
                    veículo no DETRAN
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button onClick={handleBuscarVeiculo} disabled={isSearching}>
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar Dados
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input
                      id="placa"
                      value={newVehicle.placa}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, placa: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={newVehicle.modelo}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, modelo: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={newVehicle.ano}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, ano: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      value={newVehicle.cor}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, cor: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="combustivel">Combustível</Label>
                    <Input
                      id="combustivel"
                      value={newVehicle.combustivel}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          combustivel: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="renavam">RENAVAM</Label>
                    <Input
                      id="renavam"
                      value={newVehicle.renavam}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          renavam: e.target.value,
                        })
                      }
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="chassi">Chassi</Label>
                    <Input
                      id="chassi"
                      value={newVehicle.chassi}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, chassi: e.target.value })
                      }
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quilometragem">Quilometragem</Label>
                    <Input
                      id="quilometragem"
                      type="number"
                      value={newVehicle.quilometragem}
                      onChange={(e) =>
                        setNewVehicle({
                          ...newVehicle,
                          quilometragem: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newVehicle.status}
                      onValueChange={(value) =>
                        setNewVehicle({ ...newVehicle, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Em Oficina">Em Oficina</SelectItem>
                        <SelectItem value="Problema Documental">
                          Problema Documental
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Voltar
                  </Button>
                  <Button onClick={handleConfirmarVeiculo} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar e Adicionar Veículo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por modelo ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Em Oficina">Em Oficina</SelectItem>
                <SelectItem value="Problema Documental">
                  Problema Documental
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Veículos ({filteredVehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Placa</TableHead>
                  {/* CORREÇÃO: Coluna Km Atual Restaurada */}
                  <TableHead className="hidden md:table-cell">Km Atual</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  {/* Alinhamento corrigido à direita */}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
                <Dialog
                  open={isDeleteModalOpen}
                  onOpenChange={setIsDeleteModalOpen}
                >
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Confirmar Exclusão
                      </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        Você tem certeza que deseja excluir o veículo{" "}
                        <span className="font-bold text-foreground">
                          {vehicleToDelete?.modelo} ({vehicleToDelete?.placa})
                        </span>
                        ?
                      </p>
                      <p className="mt-2 text-xs text-red-500 font-medium">
                        Esta ação não pode ser desfeita e removerá todos os
                        dados associados.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteModalOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir Veículo
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setIsDocModalOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{vehicle.modelo}</span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {vehicle.placa}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.placa}</TableCell>
                    
                    {/* CORREÇÃO: Célula de Km Atual inserida para alinhar as colunas */}
                    <TableCell className="hidden md:table-cell">
                      {vehicle.km_atual ? vehicle.km_atual.toLocaleString() : 0} km
                    </TableCell>

                    <TableCell className="hidden md:table-cell">{vehicle.ano}</TableCell>
                    
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={vehicle.status === "Ativo" ? "default" : "secondary"}
                        className={
                          vehicle.status === "Ativo"
                            ? "bg-green-600 hover:bg-green-700"
                            : vehicle.status === "Em Oficina"
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      >
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation(); // Impede de abrir o modal de detalhes ao clicar na lixeira
                          setVehicleToDelete(vehicle);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Documentos do Veículo */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogContent className="sm:max-w-[1200px] w-[90vw] h-[85vh] overflow-hidden flex flex-col">
          {" "}
          <DialogHeader className="flex-shrink-0 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    {selectedVehicle?.modelo} - {selectedVehicle?.placa}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Ano {selectedVehicle?.ano} •{" "}
                    {selectedVehicle?.km_atual?.toLocaleString("pt-BR") || 0} km
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>
          {vehicleDocuments && (
            <div className="flex-1 overflow-y-auto py-4">
              <Tabs defaultValue="geral" className="h-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="ipva">IPVA</TabsTrigger>
                  <TabsTrigger value="licenciamento">Licenciamento</TabsTrigger>
                  <TabsTrigger value="seguro">Seguro</TabsTrigger>
                  <TabsTrigger value="tags">Tags & Pedágio</TabsTrigger>
                </TabsList>

                {/* Aba Geral */}
                <TabsContent value="geral" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-primary" />
                          Dados do Veículo
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              RENAVAM
                            </p>
                            <p className="font-mono font-medium">
                              {vehicleDocuments.renavam}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Chassi
                            </p>
                            <p className="font-mono font-medium text-sm">
                              {vehicleDocuments.chassi}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Placa
                            </p>
                            <p className="font-medium">
                              {vehicleDocuments.vehiclePlate}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              CRLV
                            </p>
                            <p className="font-mono font-medium">
                              {vehicleDocuments.crlv}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Resumo de Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">IPVA</span>
                          {getStatusBadge(vehicleDocuments.ipva.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Licenciamento</span>
                          {getStatusBadge(
                            vehicleDocuments.licenciamento.status
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Seguro</span>
                          {getStatusBadge(vehicleDocuments.seguro.status)}
                        </div>

                        {/* --- NOVO BLOCO: Informações do Extrato Importado --- */}
                        {importInfo &&
                          tagUpdates[vehicleDocuments.vehiclePlate] && (
                            <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-blue-900">
                                    Extrato: {importInfo.fileName}
                                  </h4>
                                  <p className="text-xs text-blue-700">
                                    Referência:{" "}
                                    <span className="font-medium">
                                      {importInfo.referencePeriod}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 px-3 py-1 rounded-full border border-blue-100">
                                <Clock className="h-3 w-3" />
                                Importado em: {importInfo.uploadDate}
                              </div>
                            </div>
                          )}
                        {/* --- Fim do Novo Bloco --- */}
                        <div className="flex items-center justify-between">
                          <span>Sem Parar / Tags</span>
                          {vehicleDocuments.tollTag?.status === "Ativo" ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Aba IPVA */}
                <TabsContent value="ipva" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CircleDollarSign className="h-5 w-5 text-primary" />
                        IPVA 2026
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Valor Total
                          </p>
                          <p className="text-2xl font-bold">
                            R${" "}
                            {vehicleDocuments.ipva.valor.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Parcelas
                          </p>
                          <p className="text-2xl font-bold">
                            {vehicleDocuments.ipva.parcelasPagas}/
                            {vehicleDocuments.ipva.parcelas}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vencimento
                          </p>
                          <p className="text-lg font-medium">
                            {new Date(
                              vehicleDocuments.ipva.vencimento
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          {getStatusBadge(vehicleDocuments.ipva.status)}
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Button className="w-full sm:w-auto">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Acessar Portal DETRAN
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Licenciamento */}
                <TabsContent value="licenciamento" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Licenciamento Anual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">CRLV</p>
                          <p className="font-mono font-medium">
                            {vehicleDocuments.crlv}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Validade
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.crlvExpiry
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          {getStatusBadge(
                            vehicleDocuments.licenciamento.status
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="text-xl font-bold">
                            R${" "}
                            {vehicleDocuments.licenciamento.valor.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vencimento
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.licenciamento.vencimento
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Button className="w-full sm:w-auto">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Emitir CRLV Digital
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Seguro */}
                <TabsContent value="seguro" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-primary" />
                        Seguro do Veículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Seguradora
                          </p>
                          <p className="font-medium">
                            {vehicleDocuments.seguro.seguradora}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Apólice
                          </p>
                          <p className="font-mono font-medium">
                            {vehicleDocuments.seguro.apolice}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          {getStatusBadge(vehicleDocuments.seguro.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Cobertura
                          </p>
                          <p className="text-xl font-bold">
                            R${" "}
                            {vehicleDocuments.seguro.cobertura.toLocaleString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vigência Início
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.seguro.vigenciaInicio
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Vigência Fim
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.seguro.vigenciaFim
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Button className="w-full sm:w-auto">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Contatar Seguradora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* INÍCIO DO BLOCO DA ABA SEM PARAR */}
                <TabsContent value="tags" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Gestão de Tags de Pedágio
                        </CardTitle>
                        {/* BADGES */}
                        {vehicleDocuments.tollTag?.provider === "Tag Itaú" ? (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                            Tag Itaú
                          </Badge>
                        ) : vehicleDocuments.tollTag?.provider ===
                          "Sem Parar" ? (
                          <Badge className="bg-red-600 hover:bg-red-700 text-white border-0">
                            Sem Parar
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {vehicleDocuments.tollTag?.provider || "Sem Tag"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* --- BLOCO DE METADADOS (INFO AZUL) --- */}
                      {importInfo &&
                        tagUpdates[vehicleDocuments.vehiclePlate] && (
                          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-blue-900">
                                  Extrato: {importInfo.fileName}
                                </h4>
                                <p className="text-xs text-blue-700">
                                  Referência:{" "}
                                  <span className="font-medium">
                                    {importInfo.referencePeriod}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 px-3 py-1 rounded-full border border-blue-100">
                              <Clock className="h-3 w-3" />
                              Importado em: {importInfo.uploadDate}
                            </div>
                          </div>
                        )}

                      {/* LÓGICA DE EXIBIÇÃO: Memória vs Banco */}
                      {vehicleDocuments.tollTag &&
                      (vehicleDocuments.tollTag.status === "Ativo" ||
                        tagUpdates[vehicleDocuments.vehiclePlate]) ? (
                        <div className="space-y-6">
                          {(() => {
                            const dadosAtuais = tagUpdates[
                              vehicleDocuments.vehiclePlate
                            ]
                              ? {
                                  ...vehicleDocuments.tollTag,
                                  ...tagUpdates[vehicleDocuments.vehiclePlate],
                                  updateMethod: "Extrato Importado",
                                }
                              : vehicleDocuments.tollTag;

                            return (
                              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Número da Tag
                                  </p>
                                  <p className="font-mono text-lg font-medium">
                                    {dadosAtuais.tag}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Saldo Atual
                                  </p>
                                  <p className="text-2xl font-bold text-green-600">
                                    R$ {Number(dadosAtuais.balance).toFixed(2)}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Gasto Mensal
                                  </p>
                                  <p className="text-lg font-medium">
                                    R${" "}
                                    {Number(dadosAtuais.monthlySpend).toFixed(
                                      2
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    Última Atualização
                                  </p>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {new Date(
                                        dadosAtuais.lastUpdate
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Via{" "}
                                      {dadosAtuais.updateMethod || "Sistema"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* ÁREA DE IMPORTAÇÃO */}
                          <div
                            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                              isDragging
                                ? "border-primary bg-primary/10"
                                : "border-muted-foreground/25 hover:bg-muted/50"
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {uploadedFile ? (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <FileText className="h-6 w-6" />
                                  </div>
                                  <h3 className="font-medium text-green-700">
                                    {uploadedFile.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    Pronto para importar
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setUploadedFile(null)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleProcessFile}
                                    >
                                      Confirmar Importação
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-primary" />
                                  </div>
                                  <h3 className="font-medium">
                                    Atualizar Saldo e Extrato
                                  </h3>
                                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    Arraste o arquivo PDF ou CSV do extrato aqui
                                    para atualizar os gastos.
                                  </p>
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv,.pdf"
                                    onChange={handleFileInput}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  >
                                    Selecionar Arquivo
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Este veículo não possui tag cadastrada.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                {/* FIM DA ABA SEM PARAR */}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
