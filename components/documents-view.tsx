"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Scale,
  ExternalLink,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Importações da API e Contexto
import { buscarMultasAPI } from "@/lib/api-service";
import { useToastNotification } from "@/contexts/toast-context";

// Importamos apenas os Documentos do Mock
import { mockVehicleDocuments } from "@/lib/mock-data";

// --- INTERFACES LOCAIS (Para bater com o Banco de Dados) ---
interface FineFromAPI {
  id: number;
  vehicle_id: number;
  vehicles?: { placa: string; modelo: string }; // Join do Supabase
  driver_name: string;
  infraction_date: string;
  description: string;
  amount: number;
  status: string;
  location: string;
  due_date?: string;
  detranUrl?: string;
}

export function DocumentsView() {
  const toast = useToastNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Estados de Dados da API
  const [fines, setFines] = useState<FineFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para Modais
  const [selectedFine, setSelectedFine] = useState<FineFromAPI | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  // --- CARREGAR DADOS AO ABRIR ---
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dadosMultas = await buscarMultasAPI();
      setFines(dadosMultas);
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao carregar multas do sistema.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE FILTRO (Multas Reais) ---
  const filteredFines = fines.filter((fine) => {
    const placa = fine.vehicles?.placa || "N/A";
    const matchesSearch =
      placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || fine.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  
  // KPIs
  const totalMultasValor = filteredFines.reduce(
    (acc, fine) => acc + Number(fine.amount),
    0
  );
  const multasVencidas = filteredFines.filter(
    (f) => f.status === "Vencido"
  ).length;

  // CORREÇÃO AQUI: Removemos 'doc.ipva.status === "Vencendo"' pois esse status não existe na interface IPVA
  const expiringDocs = mockVehicleDocuments.filter(
    (doc) =>
      doc.ipva.status === "Pendente" ||
      doc.licenciamento.status === "Vencendo" ||
      doc.licenciamento.status === "Vencido"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Documentos e Multas
          </h1>
          <p className="text-muted-foreground">
            Controle integrado com o Financeiro e Jurídico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => carregarDados()} variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* --- CARDS DE KPI --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Multas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalMultasValor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredFines.length} infrações encontradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Multas Vencidas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {multasVencidas}
            </div>
            <p className="text-xs text-muted-foreground">Atenção Imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Docs Pendentes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringDocs.length}</div>
            <p className="text-xs text-muted-foreground">
              IPVA ou Licenciamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Docs Válidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockVehicleDocuments.length - expiringDocs.length}
            </div>
            <p className="text-xs text-muted-foreground">Situação regular</p>
          </CardContent>
        </Card>
      </div>

      {/* --- ABAS --- */}
      <Tabs defaultValue="multas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="multas" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Infrações e Multas
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            IPVA e Licenciamento
          </TabsTrigger>
        </TabsList>

        {/* ABA DE MULTAS (CONECTADA AO BANCO) */}
        <TabsContent value="multas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Infrações</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col gap-4 mb-6 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    placeholder="Buscar por placa, motorista ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                    <SelectItem value="Em Recurso">Em Recurso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Infração</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Carregando dados...
                        </TableCell>
                      </TableRow>
                    ) : filteredFines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Nenhuma multa encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFines.map((fine) => (
                        <TableRow
                          key={fine.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedFine(fine)}
                        >
                          <TableCell>
                            <Badge
                              variant={
                                fine.status === "Pago" ? "default" : "secondary"
                              }
                              className={
                                fine.status === "Pago"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : fine.status === "Vencido"
                                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : fine.status === "Pendente"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              }
                            >
                              {fine.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                {new Date(
                                  fine.infraction_date
                                ).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  fine.infraction_date
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {fine.vehicles?.placa || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="truncate max-w-[200px]">
                                {fine.description}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {fine.location}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{fine.driver_name}</TableCell>
                          <TableCell className="font-bold">
                            R${" "}
                            {Number(fine.amount).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA DE DOCUMENTOS (MOCK DATA) */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Situação Documental da Frota</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Renavam</TableHead>
                      <TableHead>IPVA 2026</TableHead>
                      <TableHead>Licenciamento</TableHead>
                      <TableHead>Validade CRLV</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockVehicleDocuments.map((doc) => (
                      <TableRow
                        key={doc.vehicleId}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {doc.vehiclePlate}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {doc.renavam}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={
                                doc.ipva.status === "Pago"
                                  ? "text-green-600 border-green-200 bg-green-50"
                                  : "text-yellow-600 border-yellow-200 bg-yellow-50"
                              }
                            >
                              {doc.ipva.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              doc.licenciamento.status === "Válido"
                                ? "text-green-600 border-green-200 bg-green-50"
                                : "text-red-600 border-red-200 bg-red-50"
                            }
                          >
                            {doc.licenciamento.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(doc.crlvExpiry).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE DETALHES DA MULTA */}
      <Dialog open={!!selectedFine} onOpenChange={() => setSelectedFine(null)}>
        <DialogContent className="max-w-[85vw] md:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Detalhes da Infração
            </DialogTitle>
            <DialogDescription>
              Veículo: {selectedFine?.vehicles?.placa} -{" "}
              {selectedFine?.vehicles?.modelo}
            </DialogDescription>
          </DialogHeader>

          {selectedFine && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Motorista
                  </span>
                  <p className="font-medium">{selectedFine.driver_name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Data/Hora
                  </span>
                  <p className="font-medium">
                    {new Date(selectedFine.infraction_date).toLocaleString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Descrição
                  </span>
                  <p className="font-medium">{selectedFine.description}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-xs text-muted-foreground">Local</span>
                  <p className="text-sm">{selectedFine.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <p className="text-lg font-bold text-red-600">
                    R${" "}
                    {Number(selectedFine.amount).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge>{selectedFine.status}</Badge>
                </div>
              </div>

              {selectedFine.status === "Pendente" && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Multa pendente. Evite juros efetuando o pagamento ou
                    entrando com recurso.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedFine(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      selectedFine.detranUrl || "https://www.detran.sp.gov.br",
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Portal DETRAN
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

