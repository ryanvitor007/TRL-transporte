"use client";

import { useState, useEffect } from "react";
import {
  consultarVeiculoAPI,
  salvarVeiculoAPI,
  buscarFrotaAPI,
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
} from "lucide-react";
import {
  mockVehicles,
  type Vehicle,
  getVehicleDocuments,
} from "@/lib/mock-data";

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
  const [isSaving, setIsSaving] = useState(false); // estado para indicar salvamento
  const [loadingDetran, setLoadingDetran] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // MUDANÇA 1: Estado para guardar os veículos do banco (começa vazio)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // MUDANÇA 2: Efeito para carregar os dados assim que a tela abre
  useEffect(() => {
    carregarDados();
  }, []);

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

  // CORREÇÃO: Mudamos de 'mockVehicles' para 'vehicles' (o estado real do banco)
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

      // Preenche o formulário com os dados retornados
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
      // Permite preencher manualmente em caso de erro
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
    // 1. Validação Básica antes de enviar
    if (!newVehicle.placa || !newVehicle.modelo || !newVehicle.ano) {
      toast.error("Campos Obrigatórios", "Por favor, preencha Placa, Modelo e Ano.");
      return;
    }

    setIsSaving(true);

    try {
      // 2. Monta o objeto COMPLETO (agora com Cor, Combustível e Chassi)
      const novoCarro = {
        placa: newVehicle.placa,
        modelo: newVehicle.modelo,
        ano: Number(newVehicle.ano),
        km_atual: Number(newVehicle.quilometragem) || 0,
        renavam: newVehicle.renavam || "",
        status: newVehicle.status || "Ativo",
        // Campos que faltavam:
        cor: newVehicle.cor || "",
        combustivel: newVehicle.combustivel || "",
        chassi: newVehicle.chassi || "",
      };

      await salvarVeiculoAPI(novoCarro);
      await carregarDados(); 

      toast.success("Veículo Cadastrado", `${novoCarro.modelo} adicionado à frota com sucesso!`);
      handleCloseModal();
      
    } catch (error: any) {
      console.error(error);
      const mensagemErro = error.message || "";
      
      if (mensagemErro.includes("unique") || mensagemErro.includes("duplicate")) {
        toast.error("Duplicidade", "Esta placa já está cadastrada no sistema.");
      } else {
        toast.error("Erro no Servidor", "Não foi possível salvar os dados. Tente novamente.");
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

  const vehicleDocuments = selectedVehicle
    ? getVehicleDocuments(String(selectedVehicle.id))
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
            className={showForm ? "sm:max-w-[600px]" : "sm:max-w-[425px]"}
          >
            <DialogHeader>
              <DialogTitle>
                {showForm
                  ? "Confirmar Dados do Veículo"
                  : "Adicionar Novo Veículo"}
              </DialogTitle>
            </DialogHeader>

            {!showForm ? (
              // Estado inicial: apenas campo de busca
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
              // Estado após busca: formulário preenchido
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
                  <Button
                    onClick={handleConfirmarVeiculo}
                    disabled={isSaving} // Trava o clique se estiver salvando
                  >
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
                  <TableHead>Ano</TableHead>
                  <TableHead>Quilometragem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próx. Manutenção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    {/* Ajuste os nomes para bater com o Banco de Dados */}
                    <TableCell className="font-medium">
                      {vehicle.modelo}
                    </TableCell>
                    <TableCell>{vehicle.placa}</TableCell>
                    <TableCell>{vehicle.ano}</TableCell>
                    <TableCell>
                      {/* km_atual pode vir como string ou number, garantimos a formatação */}
                      {Number(vehicle.km_atual).toLocaleString("pt-BR")} km
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[vehicle.status] || "bg-gray-100"
                        }
                      >
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(
                        vehicle.data_cadastro || new Date()
                      ).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Documentos do Veículo*/}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogContent className="max-w-[85vw] h-[85vh] overflow-hidden flex flex-col">
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
                    {selectedVehicle?.km_atual?.toLocaleString("pt-BR")} km
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
                  <TabsTrigger value="semparar">Sem Parar</TabsTrigger>
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
                          <span>IPVA</span>
                          {getStatusBadge(vehicleDocuments.ipva.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Licenciamento</span>
                          {getStatusBadge(
                            vehicleDocuments.licenciamento.status
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Seguro</span>
                          {getStatusBadge(vehicleDocuments.seguro.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sem Parar</span>
                          {vehicleDocuments.semParar.ativo ? (
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
                      <CardTitle className="flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-primary" />
                        IPVA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Valor Total
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            R${" "}
                            {vehicleDocuments.ipva.valor.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <div>
                            {getStatusBadge(vehicleDocuments.ipva.status)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Vencimento
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.ipva.vencimento
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Parcelas
                        </p>
                        <p className="font-medium">
                          {vehicleDocuments.ipva.parcelasPagas} de{" "}
                          {vehicleDocuments.ipva.parcelas} pagas
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          asChild
                        >
                          <a
                            href="https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/pagamentoIPVA"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Acessar Portal DETRAN - IPVA
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Licenciamento */}
                <TabsContent value="licenciamento" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Licenciamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Número CRLV
                          </p>
                          <p className="font-mono text-lg font-medium">
                            {vehicleDocuments.crlv}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <div>
                            {getStatusBadge(
                              vehicleDocuments.licenciamento.status
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Validade
                          </p>
                          <p className="font-medium">
                            {new Date(
                              vehicleDocuments.licenciamento.vencimento
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            RENAVAM
                          </p>
                          <p className="font-mono font-medium">
                            {vehicleDocuments.renavam}
                          </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Chassi
                          </p>
                          <p className="font-mono font-medium text-sm">
                            {vehicleDocuments.chassi}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          asChild
                        >
                          <a
                            href="https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/licenciamentoAnual"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Acessar Portal DETRAN - Licenciamento
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Seguro */}
                <TabsContent value="seguro" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Seguro do Veículo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Seguradora
                          </p>
                          <p className="font-medium text-lg">
                            {vehicleDocuments.seguro.seguradora}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Apólice
                          </p>
                          <p className="font-mono font-medium">
                            {vehicleDocuments.seguro.apolice}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Cobertura
                          </p>
                          <p className="font-medium">
                            R${" "}
                            {vehicleDocuments.seguro.cobertura.toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <div>
                            {getStatusBadge(vehicleDocuments.seguro.status)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Vigência
                            </p>
                            <p className="font-medium">
                              {new Date(
                                vehicleDocuments.seguro.vigenciaInicio
                              ).toLocaleDateString("pt-BR")}{" "}
                              até{" "}
                              {new Date(
                                vehicleDocuments.seguro.vigenciaFim
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Aba Sem Parar */}
                <TabsContent value="semparar" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Sem Parar / Tag de Pedágio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicleDocuments.semParar.ativo ? (
                        <>
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Número da Tag
                              </p>
                              <p className="font-mono text-lg font-medium">
                                {vehicleDocuments.semParar.tag}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Saldo Atual
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                R${" "}
                                {vehicleDocuments.semParar.saldo.toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Gasto Médio/Mês
                              </p>
                              <p className="font-medium">
                                R${" "}
                                {vehicleDocuments.semParar.mediaGastoMensal.toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Último Uso
                              </p>
                              <p className="font-medium">
                                {new Date(
                                  vehicleDocuments.semParar.ultimoUso
                                ).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              className="w-full bg-transparent"
                              asChild
                            >
                              <a
                                href="https://www.semparar.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Acessar Portal Sem Parar
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Este veículo não possui tag Sem Parar ativa
                          </p>
                          <Button
                            className="mt-4 bg-transparent"
                            variant="outline"
                            asChild
                          >
                            <a
                              href="https://www.semparar.com.br"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Contratar Sem Parar
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
