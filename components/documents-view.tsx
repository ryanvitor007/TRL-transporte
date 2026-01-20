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
  Hash,
  Calendar,
  MapPin,
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

import { buscarMultasAPI, buscarDocumentosAPI } from "@/lib/api-service";
import { useToastNotification } from "@/contexts/notification-context";

// --- INTERFACES (Atualizadas com vehicle_plate) ---
interface FineFromAPI {
  id: number;
  vehicle_id?: number;
  vehicle_plate?: string; // <--- Novo Campo
  vehicles?: { placa: string; modelo: string } | null;
  driver_name: string;
  infraction_date: string;
  description: string;
  amount: number;
  status: string;
  location: string;
  due_date?: string;
  detranUrl?: string;
}

interface DocumentFromAPI {
  id: number;
  vehicle_plate?: string; // <--- Novo Campo
  renavam?: string;
  vehicles?: { placa: string; renavam: string } | null;
  ipva_status: string;
  ipva_valor: number;
  ipva_vencimento: string;
  licenciamento_status: string;
  licenciamento_vencimento: string;
  crlv_validade: string;
}

export function DocumentsView() {
  const toast = useToastNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fines, setFines] = useState<FineFromAPI[]>([]);
  const [documents, setDocuments] = useState<DocumentFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFine, setSelectedFine] = useState<FineFromAPI | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentFromAPI | null>(null);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [dadosMultas, dadosDocs] = await Promise.all([
        buscarMultasAPI(),
        buscarDocumentosAPI(),
      ]);
      setFines(Array.isArray(dadosMultas) ? dadosMultas : []);
      setDocuments(Array.isArray(dadosDocs) ? dadosDocs : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao carregar dados do sistema.");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTROS ---
  const filteredFines = fines.filter((fine) => {
    // Tenta pegar a placa do veículo cadastrado OU a placa salva na multa
    const placaReal = fine.vehicles?.placa || fine.vehicle_plate || "";

    const matchesSearch =
      placaReal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fine.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || fine.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalMultasValor = filteredFines.reduce(
    (acc, fine) => acc + Number(fine.amount),
    0,
  );
  const multasVencidas = filteredFines.filter(
    (f) => f.status === "Vencido",
  ).length;

  const expiringDocs = documents.filter(
    (doc) =>
      doc.ipva_status === "Pendente" ||
      doc.licenciamento_status === "Vencendo" ||
      doc.licenciamento_status === "Vencido",
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
              {documents.length - expiringDocs.length}
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

        {/* ABA DE MULTAS */}
        <TabsContent value="multas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Infrações</CardTitle>
            </CardHeader>
            <CardContent>
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
                  </SelectContent>
                </Select>
              </div>

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
                                  fine.infraction_date,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  fine.infraction_date,
                                ).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          {/* CORREÇÃO: Exibe a placa do cadastro ou a placa salva */}
                          <TableCell className="font-medium">
                            {fine.vehicles?.placa ||
                              fine.vehicle_plate ||
                              "---"}
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

        {/* ABA DE DOCUMENTOS */}
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
                      <TableHead>IPVA Status</TableHead>
                      <TableHead>Licenciamento</TableHead>
                      <TableHead>Validade CRLV</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Nenhum documento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      documents.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            {doc.vehicles?.placa || doc.vehicle_plate || "---"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {doc.vehicles?.renavam || doc.renavam || "---"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                doc.ipva_status === "Pago"
                                  ? "text-green-600 border-green-200 bg-green-50"
                                  : "text-yellow-600 border-yellow-200 bg-yellow-50"
                              }
                            >
                              {doc.ipva_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                doc.licenciamento_status === "Válido"
                                  ? "text-green-600 border-green-200 bg-green-50"
                                  : "text-red-600 border-red-200 bg-red-50"
                              }
                            >
                              {doc.licenciamento_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.crlv_validade
                              ? new Date(doc.crlv_validade).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "---"}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL DE DETALHES DA MULTA (Visual Rico) --- */}
      <Dialog open={!!selectedFine} onOpenChange={() => setSelectedFine(null)}>
        <DialogContent
          className="!max-w-none !w-[85vw] max-h-[90vh] overflow-y-auto p-6"
          style={{
            width: "85vw !important",
            maxWidth: "85vw !important",
          }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Detalhes da Infração
            </DialogTitle>
            <DialogDescription className="text-base">
              Informações da infração do veículo{" "}
              {selectedFine?.vehicles?.placa ||
                selectedFine?.vehicle_plate ||
                "N/A"}
            </DialogDescription>
          </DialogHeader>

          {selectedFine && (
            <div className="space-y-6 py-4">
              {/* --- 1. Info Cards (Grid no Topo) --- */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-red-100 p-3 text-red-600">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Placa
                        </p>
                        <p className="text-lg font-bold">
                          {selectedFine.vehicles?.placa ||
                            selectedFine.vehicle_plate ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-red-100 p-3 text-red-600">
                        <Hash className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Cód. Infração
                        </p>
                        <p className="text-lg font-bold">#{selectedFine.id}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-red-100 p-3 text-red-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Data
                        </p>
                        <p className="text-lg font-bold">
                          {new Date(
                            selectedFine.infraction_date,
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-red-100 p-3 text-red-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Valor
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          R${" "}
                          {Number(selectedFine.amount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* --- 2. Detalhes da Multa --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Informações Completas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Descrição da Infração
                      </p>
                      <p className="font-medium text-lg leading-snug">
                        {selectedFine.description}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Status Atual
                      </p>
                      <Badge
                        className={
                          selectedFine.status === "Pago"
                            ? "bg-green-100 text-green-800 hover:bg-green-100 px-3 py-1 text-base"
                            : selectedFine.status === "Vencido"
                              ? "bg-red-100 text-red-800 hover:bg-red-100 px-3 py-1 text-base"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-3 py-1 text-base"
                        }
                      >
                        {selectedFine.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Local da Infração
                      </p>
                      <p className="font-medium">{selectedFine.location}</p>
                    </div>

                    {selectedFine.driver_name && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Motorista Responsável
                        </p>
                        <p className="font-medium">
                          {selectedFine.driver_name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* --- 3. Aviso de Status --- */}
              {selectedFine.status === "Pendente" && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
                      <div>
                        <p className="font-bold text-amber-800 text-lg">
                          Multa Pendente de Pagamento
                        </p>
                        <p className="text-base text-amber-700">
                          Efetue o pagamento ou apresente recurso para evitar
                          acréscimos e bloqueio do licenciamento.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* --- 4. Botões de Ação --- */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t">
                {selectedFine.status === "Pendente" && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 h-12 text-base bg-transparent"
                    onClick={() =>
                      window.open("https://www.detran.sp.gov.br", "_blank")
                    }
                  >
                    <Scale className="h-5 w-5" />
                    Apresentar Recurso
                  </Button>
                )}
                <Button
                  size="lg"
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white h-12 text-base shadow-md"
                  onClick={() =>
                    window.open(
                      selectedFine.detranUrl || "https://www.detran.sp.gov.br",
                      "_blank",
                    )
                  }
                >
                  <ExternalLink className="h-5 w-5" />
                  Acessar Portal DETRAN
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE DETALHES DO DOCUMENTO (LARGURA TOTAL) --- */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent
          className="!max-w-none !w-[85vw] max-h-[90vh] overflow-y-auto p-6"
          style={{
            width: "85vw !important",
            maxWidth: "85vw !important",
          }}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl text-primary">
              <FileText className="h-6 w-6" />
              Detalhes da Documentação
            </DialogTitle>
            <DialogDescription className="text-base">
              Informações completas do veículo{" "}
              {selectedDocument?.vehicles?.placa ||
                selectedDocument?.vehicle_plate}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6 py-4">
              {/* --- 1. Info Cards (Grid de 3 Cards no Topo) --- */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Card Placa */}
                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Placa do Veículo
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                          {selectedDocument.vehicles?.placa ||
                            selectedDocument.vehicle_plate ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Renavam */}
                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                        <Hash className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Código RENAVAM
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                          {selectedDocument.vehicles?.renavam ||
                            selectedDocument.renavam ||
                            "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Vencimento (IPVA) */}
                <Card className="bg-muted/40 border-muted">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-orange-100 p-3 text-orange-600">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Vencimento IPVA
                        </p>
                        <p className="text-2xl font-bold tracking-tight">
                          {selectedDocument.ipva_vencimento
                            ? new Date(
                                selectedDocument.ipva_vencimento,
                              ).toLocaleDateString("pt-BR")
                            : "---"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* --- 2. Detalhes Completos (Card Principal) --- */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Bloco IPVA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      Situação do IPVA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Status</span>
                        <Badge
                          variant={
                            selectedDocument.ipva_status === "Pago"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            selectedDocument.ipva_status === "Pago"
                              ? "bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3"
                              : "bg-yellow-100 text-yellow-800 text-sm px-3"
                          }
                        >
                          {selectedDocument.ipva_status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Valor Total</span>
                        <span className="text-xl font-bold">
                          R${" "}
                          {Number(
                            selectedDocument.ipva_valor || 0,
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloco Licenciamento */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      Licenciamento & CRLV
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          Status Licenciamento
                        </span>
                        <Badge
                          variant={
                            selectedDocument.licenciamento_status === "Válido"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            selectedDocument.licenciamento_status === "Válido"
                              ? "bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3"
                              : "bg-red-100 text-red-800 text-sm px-3"
                          }
                        >
                          {selectedDocument.licenciamento_status}
                        </Badge>
                      </div>
                      <div className="p-3 border border-dashed border-green-300 bg-green-50 rounded-lg flex flex-col gap-1">
                        <span className="text-xs text-green-700 font-semibold uppercase">
                          Validade do Documento Digital (CRLV)
                        </span>
                        <span className="text-lg font-bold text-green-900 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {selectedDocument.crlv_validade
                            ? new Date(
                                selectedDocument.crlv_validade,
                              ).toLocaleDateString("pt-BR")
                            : "---"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* --- 3. Botão de Ação (DETRAN) --- */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  size="lg"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto h-12 text-base"
                  onClick={() =>
                    window.open("https://www.ipva.fazenda.sp.gov.br/", "_blank")
                  }
                >
                  <ExternalLink className="h-5 w-5" />
                  Acessar Portal da Fazenda / DETRAN
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
