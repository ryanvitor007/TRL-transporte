"use client"

import { useState } from "react"
import { consultarVeiculoAPI } from '@/lib/api-service'; 
import { useToastNotification } from '@/contexts/toast-context';
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
} from "lucide-react"
import { mockVehicles, type Vehicle, getVehicleDocuments } from "@/lib/mock-data"

const statusColors: Record<Vehicle["status"], string> = {
  Ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Em Oficina": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Problema Documental": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export function FleetView() {
  
  const toast = useToastNotification(); 
  const [loadingDetran, setLoadingDetran] = useState(false);

  const handleSincronizarDetran = async (placa: string) => {
    setLoadingDetran(true);
    // toast.info removido pois seu sistema só suporta success/error por enquanto

    try {
      const dadosReais = await consultarVeiculoAPI(placa, '12345678900'); 
      console.log("Dados Recebidos:", dadosReais);

      // 2. Uso correto: toast.success("Título", "Descrição")
      toast.success("Veículo Atualizado", `Os dados do ${dadosReais.marca_modelo} foram sincronizados.`);
      
    } catch (error) {
      console.error(error);
      // 3. Uso correto: toast.error("Título")
      toast.error("Erro na Conexão", "Não foi possível conectar ao Detran.");
    } finally {
      setLoadingDetran(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)

  const filteredVehicles = mockVehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDocModalOpen(true)
  }

  const vehicleDocuments = selectedVehicle ? getVehicleDocuments(selectedVehicle.id) : null

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventário da Frota</h1>
          <p className="text-muted-foreground">Gerencie todos os veículos da sua frota</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" placeholder="Ex: Volvo FH 540" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plate">Placa</Label>
                <Input id="plate" placeholder="Ex: ABC-1234" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input id="year" type="number" placeholder="2024" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mileage">Quilometragem</Label>
                  <Input id="mileage" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Salvar</Button>
            </div>
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
                    <TableCell className="font-medium">{vehicle.model}</TableCell>
                    <TableCell>{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.mileage.toLocaleString("pt-BR")} km</TableCell>
                    <TableCell>
                      <Badge className={statusColors[vehicle.status]}>{vehicle.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(vehicle.nextMaintenance).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                    {selectedVehicle?.model} - {selectedVehicle?.plate}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Ano {selectedVehicle?.year} • {selectedVehicle?.mileage.toLocaleString("pt-BR")} km
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
                          <span>IPVA</span>
                          {getStatusBadge(vehicleDocuments.ipva.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Licenciamento</span>
                          {getStatusBadge(vehicleDocuments.licenciamento.status)}
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
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="text-2xl font-bold text-primary">
                            R$ {vehicleDocuments.ipva.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div>{getStatusBadge(vehicleDocuments.ipva.status)}</div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Vencimento</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.ipva.vencimento).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Parcelas</p>
                        <p className="font-medium">
                          {vehicleDocuments.ipva.parcelasPagas} de {vehicleDocuments.ipva.parcelas} pagas
                        </p>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" className="w-full bg-transparent" asChild>
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
                          <p className="text-sm text-muted-foreground">Número CRLV</p>
                          <p className="font-mono text-lg font-medium">{vehicleDocuments.crlv}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div>{getStatusBadge(vehicleDocuments.licenciamento.status)}</div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Validade</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.licenciamento.vencimento).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">RENAVAM</p>
                          <p className="font-mono font-medium">{vehicleDocuments.renavam}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Chassi</p>
                          <p className="font-mono font-medium text-sm">{vehicleDocuments.chassi}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" className="w-full bg-transparent" asChild>
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
                          <p className="text-sm text-muted-foreground">Seguradora</p>
                          <p className="font-medium text-lg">{vehicleDocuments.seguro.seguradora}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Apólice</p>
                          <p className="font-mono font-medium">{vehicleDocuments.seguro.apolice}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <div>{getStatusBadge(vehicleDocuments.seguro.status)}</div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Valor de Cobertura</p>
                          <p className="text-xl font-bold text-green-600">
                            R$ {vehicleDocuments.seguro.cobertura.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <Shield className="inline mr-2 h-4 w-4" />
                          Vigência: {new Date(vehicleDocuments.seguro.vigenciaInicio).toLocaleDateString("pt-BR")} até{" "}
                          {new Date(vehicleDocuments.seguro.vigenciaFim).toLocaleDateString("pt-BR")}
                        </p>
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
                        Sem Parar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Tag</p>
                          <p className="font-mono font-medium">{vehicleDocuments.semParar.tag}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Saldo Atual</p>
                          <p className="text-2xl font-bold text-primary">
                            R$ {vehicleDocuments.semParar.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Média Mensal</p>
                          <p className="font-medium">
                            R${" "}
                            {vehicleDocuments.semParar.mediaGastoMensal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Último Uso</p>
                          <p className="font-medium">
                            {new Date(vehicleDocuments.semParar.ultimoUso).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6">
                        {vehicleDocuments.semParar.ativo ? (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-800">
                              <CheckCircle2 className="inline mr-2 h-4 w-4" />
                              Tag ativa e funcionando normalmente
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm text-red-800">
                              <XCircle className="inline mr-2 h-4 w-4" />
                              Tag inativa - verifique o saldo ou entre em contato com o suporte
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" className="w-full bg-transparent" asChild>
                          <a href="https://www.semparar.com.br" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Acessar Portal Sem Parar
                          </a>
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