"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { consultarVeiculoAPI, salvarVeiculoAPI, buscarFrotaAPI } from "@/lib/api-service"
import { useToastNotification } from "@/contexts/toast-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { type Vehicle, getVehicleDocuments } from "@/lib/mock-data"

const statusColors: Record<Vehicle["status"], string> = {
  Ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Em Oficina": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Problema Documental": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

interface NewVehicleForm {
  placa: string
  modelo: string
  ano: string
  quilometragem: string
  status: string
  renavam: string
  chassi: string
  cor: string
  combustivel: string
}

export function FleetView() {
  const toast = useToastNotification()
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const dados = await buscarFrotaAPI()
      setVehicles(dados)
    } catch (error) {
      console.error("Erro ao carregar frota:", error)
      toast.error("Erro", "Não foi possível carregar a lista de veículos.")
    }
  }

  const [searchPlate, setSearchPlate] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showForm, setShowForm] = useState(false)
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
  })

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDocModalOpen(true)
  }

  const handleBuscarVeiculo = async () => {
    if (!searchPlate.trim()) {
      toast.error("Placa obrigatória", "Digite a placa do veículo para buscar.")
      return
    }

    setIsSearching(true)

    try {
      const dadosVeiculo = await consultarVeiculoAPI(searchPlate)

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
      })

      setShowForm(true)
      toast.success("Veículo encontrado!", `Dados do ${dadosVeiculo.marca_modelo} carregados com sucesso.`)
    } catch (error) {
      console.error(error)
      toast.error("Erro na busca", "Não foi possível encontrar o veículo. Preencha manualmente.")
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
      })
      setShowForm(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirmarVeiculo = async () => {
    if (!newVehicle.placa || !newVehicle.modelo || !newVehicle.ano) {
      toast.error("Campos Obrigatórios", "Por favor, preencha Placa, Modelo e Ano.")
      return
    }

    setIsSaving(true)

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
      }

      await salvarVeiculoAPI(novoCarro)
      await carregarDados()

      toast.success("Veículo Cadastrado", `${novoCarro.modelo} adicionado à frota!`)
      handleCloseModal()
    } catch (error: any) {
      console.error(error)
      const mensagemErro = error.message || ""

      if (mensagemErro.includes("unique") || mensagemErro.includes("duplicate")) {
        toast.error("Duplicidade", "Esta placa já está cadastrada.")
      } else {
        toast.error("Erro", "Falha ao salvar no banco de dados.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setShowForm(false)
    setSearchPlate("")
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
    })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (
        file &&
        (file.type === "text/csv" ||
          file.type === "application/pdf" ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".pdf"))
      ) {
        setUploadedFile(file)
        toast.success("Arquivo carregado", `${file.name} pronto para processamento.`)
      } else {
        toast.error("Formato inválido", "Por favor, envie um arquivo CSV ou PDF.")
      }
    },
    [toast],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (
        file &&
        (file.type === "text/csv" ||
          file.type === "application/pdf" ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".pdf"))
      ) {
        setUploadedFile(file)
        toast.success("Arquivo carregado", `${file.name} pronto para processamento.`)
      } else if (file) {
        toast.error("Formato inválido", "Por favor, envie um arquivo CSV ou PDF.")
      }
    },
    [toast],
  )

  const handleProcessFile = useCallback(() => {
    if (uploadedFile) {
      toast.success("Processando...", "O extrato está sendo processado. Aguarde a atualização dos dados.")
      // Simula processamento
      setTimeout(() => {
        setUploadedFile(null)
        toast.success("Extrato importado", "Saldo e gastos atualizados com sucesso!")
      }, 2000)
    }
  }, [uploadedFile, toast])

  const vehicleDocuments = selectedVehicle
    ? getVehicleDocuments(String(selectedVehicle.id)) || {
        id: "temp",
        vehicleId: String(selectedVehicle.id),
        vehiclePlate: selectedVehicle.placa,
        renavam: selectedVehicle.renavam || "Não informado",
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
        tollTag: {
          tag: "-",
          saldo: 0,
          mediaGastoMensal: 0,
          ultimoUso: new Date().toISOString(),
          ativo: false,
          tagProvider: "Sem Parar" as const,
          lastUpdate: undefined,
          updateMethod: undefined,
        },
        branch: selectedVehicle.branch || "São Paulo",
        status: "Válido",
      }
    : null

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
        )
      case "Pendente":
      case "Vencendo":
      case "Parcelado":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      case "Vencido":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getProviderBadge = (provider: "Sem Parar" | "Tag Itaú") => {
    if (provider === "Sem Parar") {
      return (
        <Badge className="bg-yellow-100 text-red-700 border border-red-200">
          <Radio className="mr-1 h-3 w-3" />
          Sem Parar
        </Badge>
      )
    }
    return (
      <Badge className="bg-orange-100 text-blue-700 border border-blue-200">
        <CreditCard className="mr-1 h-3 w-3" />
        Tag Itaú
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventário da Frota</h1>
          <p className="text-muted-foreground">Gerencie todos os veículos da sua frota</p>
        </div>
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseModal()
            else setIsModalOpen(true)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className={showForm ? "sm:max-w-[1000px]" : "sm:max-w-[500px]"}>
            <DialogHeader>
              <DialogTitle>{showForm ? "Confirmar Dados do Veículo" : "Adicionar Novo Veículo"}</DialogTitle>
            </DialogHeader>

            {!showForm ? (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="searchPlate">Placa do Veículo</Label>
                  <Input
                    id="searchPlate"
                    placeholder="Ex: ABC-1234 ou ABC1D23"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleBuscarVeiculo()
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite a placa para buscar automaticamente os dados do veículo no DETRAN
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
                      onChange={(e) => setNewVehicle({ ...newVehicle, placa: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="modelo">Modelo</Label>
                    <Input
                      id="modelo"
                      value={newVehicle.modelo}
                      onChange={(e) => setNewVehicle({ ...newVehicle, modelo: e.target.value })}
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
                      onChange={(e) => setNewVehicle({ ...newVehicle, ano: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      value={newVehicle.cor}
                      onChange={(e) => setNewVehicle({ ...newVehicle, cor: e.target.value })}
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
                      onChange={(e) => setNewVehicle({ ...newVehicle, chassi: e.target.value })}
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
                      onValueChange={(value) => setNewVehicle({ ...newVehicle, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Em Oficina">Em Oficina</SelectItem>
                        <SelectItem value="Problema Documental">Problema Documental</SelectItem>
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
                <SelectItem value="Problema Documental">Problema Documental</SelectItem>
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
                    <TableCell className="font-medium">{vehicle.modelo}</TableCell>
                    <TableCell>{vehicle.placa}</TableCell>
                    <TableCell>{vehicle.ano}</TableCell>
                    <TableCell>{vehicle.km_atual?.toLocaleString("pt-BR") || 0} km</TableCell>
                    <TableCell>
                      <Badge className={statusColors[vehicle.status as keyof typeof statusColors]}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.proxima_manutencao
                        ? new Date(vehicle.proxima_manutencao).toLocaleDateString("pt-BR")
                        : "-"}
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
                    Ano {selectedVehicle?.ano} • {selectedVehicle?.km_atual?.toLocaleString("pt-BR") || 0} km
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
                            <p className="text-sm text-muted-foreground">RENAVAM</p>
                            <p className="font-mono font-medium">{vehicleDocuments.renavam}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Chassi</p>
                            <p className="font-mono font-medium text-sm">{vehicleDocuments.chassi}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Placa</p>
                            <p className="font-medium">{vehicleDocuments.vehiclePlate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CRLV</p>
                            <p className="font-mono font-medium">{vehicleDocuments.crlv}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resumo de Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">IPVA</span>
                          {getStatusBadge(vehicleDocuments.ipva.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Licenciamento</span>
                          {getStatusBadge(vehicleDocuments.licenciamento.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Seguro</span>
                          {getStatusBadge(vehicleDocuments.seguro.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Tag Pedágio</span>
                          {getStatusBadge(vehicleDocuments.tollTag?.ativo ? "Ativo" : "Vencido")}
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
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="text-2xl font-bold">
                            R$ {vehicleDocuments.ipva.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Parcelas</p>
                          <p className="text-2xl font-bold">
                            {vehicleDocuments.ipva.parcelasPagas}/{vehicleDocuments.ipva.parcelas}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vencimento</p>
                          <p className="text-lg font-medium">
                            {new Date(vehicleDocuments.ipva.vencimento).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
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
                          <p className="font-mono font-medium">{vehicleDocuments.crlv}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Validade</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.crlvExpiry).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          {getStatusBadge(vehicleDocuments.licenciamento.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="text-xl font-bold">
                            R${" "}
                            {vehicleDocuments.licenciamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vencimento</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.licenciamento.vencimento).toLocaleDateString("pt-BR")}
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
                          <p className="text-sm text-muted-foreground">Seguradora</p>
                          <p className="font-medium">{vehicleDocuments.seguro.seguradora}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Apólice</p>
                          <p className="font-mono font-medium">{vehicleDocuments.seguro.apolice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          {getStatusBadge(vehicleDocuments.seguro.status)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Cobertura</p>
                          <p className="text-xl font-bold">
                            R$ {vehicleDocuments.seguro.cobertura.toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vigência Início</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.seguro.vigenciaInicio).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Vigência Fim</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.seguro.vigenciaFim).toLocaleDateString("pt-BR")}
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

                <TabsContent value="tags" className="space-y-6">
                  {/* Provider Card */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Radio className="h-5 w-5 text-primary" />
                          Tags & Pedágio
                        </CardTitle>
                        {vehicleDocuments.tollTag && getProviderBadge(vehicleDocuments.tollTag.tagProvider)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Provider Visual Identity */}
                      <div
                        className={`p-4 rounded-lg border-2 ${
                          vehicleDocuments.tollTag?.tagProvider === "Sem Parar"
                            ? "bg-gradient-to-r from-yellow-50 to-red-50 border-red-200"
                            : "bg-gradient-to-r from-orange-50 to-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-16 w-16 rounded-full flex items-center justify-center ${
                              vehicleDocuments.tollTag?.tagProvider === "Sem Parar" ? "bg-red-600" : "bg-orange-500"
                            }`}
                          >
                            {vehicleDocuments.tollTag?.tagProvider === "Sem Parar" ? (
                              <Radio className="h-8 w-8 text-yellow-300" />
                            ) : (
                              <CreditCard className="h-8 w-8 text-blue-800" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{vehicleDocuments.tollTag?.tagProvider}</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              Tag: {vehicleDocuments.tollTag?.tag}
                            </p>
                          </div>
                          <div className="ml-auto">
                            {vehicleDocuments.tollTag?.ativo ? (
                              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-1">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 text-lg px-4 py-1">
                                <XCircle className="mr-2 h-4 w-4" />
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Wallet className="h-4 w-4" />
                              <span className="text-xs">Saldo Atual</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {vehicleDocuments.tollTag?.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <CircleDollarSign className="h-4 w-4" />
                              <span className="text-xs">Gasto Mensal</span>
                            </div>
                            <p className="text-2xl font-bold">
                              R${" "}
                              {vehicleDocuments.tollTag?.mediaGastoMensal.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs">Último Uso</span>
                            </div>
                            <p className="text-lg font-medium">
                              {vehicleDocuments.tollTag?.ultimoUso
                                ? new Date(vehicleDocuments.tollTag.ultimoUso).toLocaleDateString("pt-BR")
                                : "-"}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs">Última Atualização</span>
                            </div>
                            <p className="text-sm font-medium">
                              {vehicleDocuments.tollTag?.lastUpdate
                                ? new Date(vehicleDocuments.tollTag.lastUpdate).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </p>
                            {vehicleDocuments.tollTag?.updateMethod && (
                              <p className="text-xs text-muted-foreground">
                                via {vehicleDocuments.tollTag.updateMethod}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Import Extract Section */}
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Atualização de Saldo
                        </h4>
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDragging
                              ? "border-primary bg-primary/5"
                              : "border-muted-foreground/25 hover:border-primary/50"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          {uploadedFile ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-center gap-2 text-green-600">
                                <CheckCircle2 className="h-8 w-8" />
                                <span className="font-medium">{uploadedFile.name}</span>
                              </div>
                              <div className="flex justify-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setUploadedFile(null)}>
                                  Remover
                                </Button>
                                <Button size="sm" onClick={handleProcessFile}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Processar Extrato
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                              <p className="font-medium mb-2">Importar Extrato (CSV/PDF)</p>
                              <p className="text-sm text-muted-foreground mb-4">
                                Envie o extrato do Sem Parar ou Tag Itaú para atualizar gastos e saldos automaticamente.
                              </p>
                              <label htmlFor="file-upload">
                                <Button variant="outline" asChild>
                                  <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Selecionar Arquivo
                                  </span>
                                </Button>
                              </label>
                              <input
                                id="file-upload"
                                type="file"
                                accept=".csv,.pdf"
                                className="hidden"
                                onChange={handleFileInput}
                              />
                              <p className="text-xs text-muted-foreground mt-4">
                                Arraste e solte ou clique para selecionar
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Access Provider Portal */}
                      <div className="pt-4 border-t flex flex-wrap gap-2">
                        <Button
                          className={
                            vehicleDocuments.tollTag?.tagProvider === "Sem Parar"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-orange-500 hover:bg-orange-600"
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Acessar Portal {vehicleDocuments.tollTag?.tagProvider}
                        </Button>
                        <Button variant="outline">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Recarregar Saldo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
