"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  buscarFrotaAPI,
  buscarDadosRelatorioAPI,
  buscarHistoricoRelatoriosAPI,
  salvarRelatorioHistoricoAPI,
} from "@/lib/api-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  FileText,
  ShieldCheck,
  Lock,
  Calendar as CalendarIcon,
  Car,
  Loader2,
  AlertTriangle,
  FileWarning,
  Wrench,
  AlertOctagon,
  Building2,
  UserCheck,
  Eye,
  X,
  Brain,
  FileCheck,
  Download,
  History,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Truck,
} from "lucide-react";
import Image from "next/image";

// ==================== HELPER FUNCTIONS (PREVENÇÃO DE ERROS) ====================

// Formata data com segurança (evita crash se null/undefined)
const safeFormat = (
  dateStr: string | null | undefined,
  formatStr: string = "dd/MM/yyyy",
) => {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), formatStr, { locale: ptBR });
  } catch (error) {
    return "Data Inválida";
  }
};

// Formata dinheiro com segurança (evita crash do toLocaleString em undefined)
const safeCurrency = (value: number | string | undefined | null) => {
  const num = Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Função segura para verificar intervalo
const safeIsWithinInterval = (
  dateStr: string | null | undefined,
  interval: { start: Date; end: Date },
) => {
  if (!dateStr) return false;
  try {
    return isWithinInterval(parseISO(dateStr), interval);
  } catch {
    return false;
  }
};

// ==================== INTERFACES ====================
interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
}

interface ReportHistory {
  id: string;
  dataGeracao: string;
  horaGeracao: string;
  periodoInicio: string;
  periodoFim: string;
  veiculos: { placa: string; modelo: string }[];
  conteudo: {
    multas: boolean;
    licenciamento: boolean;
    manutencoes: boolean;
    sinistros: boolean;
  };
  totalMultas: number;
  totalManutencoes: number;
  totalSinistros: number;
  quantidadeMultas: number;
  quantidadeManutencoes: number;
  quantidadeSinistros: number;
  docHash: string;
  geradoPor: string;
}

// ==================== MOCK DATA (Mantidos apenas para Histórico Visual) ====================
const mockMultas: any[] = [];
const mockManutencoes: any[] = [];
const mockSinistros: any[] = [];
const mockLicenciamentos: any[] = [];
const mockReportHistory: ReportHistory[] = [];

// ==================== HELPER FUNCTIONS ====================
const generateDocHash = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = "";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) hash += "-";
  }
  return hash;
};

// ==================== COMPONENT ====================
export function ReportsView() {
  // --- 1. HOOKS DE ESTADO (Devem ficar sempre no topo) ---
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);

  const [includeMultas, setIncludeMultas] = useState(false);
  const [includeLicenciamento, setIncludeLicenciamento] = useState(false);
  const [includeManutencoes, setIncludeManutencoes] = useState(false);
  const [includeSinistros, setIncludeSinistros] = useState(false);

  const [selectedSinistros, setSelectedSinistros] = useState<string[]>([]);
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVehicleSelectOpen, setIsVehicleSelectOpen] = useState(false);
  // Gera o hash apenas uma vez na montagem ou quando necessário
  const [docHash] = useState(() =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estados de dados da API
  const [vehicles, setVehicles] = useState<any[]>([]);

  // ESTADO PRINCIPAL DOS DADOS (Inicializado antes de ser usado)
  const [reportData, setReportData] = useState({
    incidents: [] as any[],
    fines: [] as any[],
    maintenances: [] as any[],
    documents: [] as any[],
    summary: {
      totalCost: 0,
      totalIncidents: 0,
      totalMaintenances: 0,
      analysisText: "Aguardando dados...",
    },
  });

  // Refs e Effects
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehiclesData = await buscarFrotaAPI();
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      } catch (error) {
        console.error("Erro ao carregar frota:", error);
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const historyData = await buscarHistoricoRelatoriosAPI();
      setReportHistory(historyData);
    };
    loadHistory();
  }, []);

  // --- 2. VARIÁVEIS DERIVADAS (Declaradas APÓS o reportData existir) ---
  const filteredMultas = reportData.fines || [];
  const filteredSinistros = reportData.incidents || [];
  const filteredManutencoes = reportData.maintenances || [];

  const filteredLicenciamentos = (reportData.documents || []).filter(
    (doc: any) =>
      selectedVehicles.length === 0 || selectedVehicles.includes(doc.plate),
  );

  const generateAIAnalysis =
    reportData.summary?.analysisText || "Aguardando dados do relatório...";

  const toggleVehicle = (placa: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
    );
  };

  const selectAllVehicles = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map((v) => v.placa));
    }
  };

  const toggleSinistro = (id: string) => {
    setSelectedSinistros((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert("Por favor, selecione um período válido.");
      return;
    }

    // Validação da Senha
    if (!pdfPassword || pdfPassword.length < 4) {
      alert(
        "Por favor, defina uma senha de segurança (mínimo 4 dígitos) para visualizar o relatório.",
      );
      return;
    }

    setIsGenerating(true);
    try {
      const vehiclePlate =
        selectedVehicles.length === 1 ? selectedVehicles[0] : "all";

      const data = await buscarDadosRelatorioAPI({
        startDate: dateRange.from.toISOString().split("T")[0],
        endDate: dateRange.to.toISOString().split("T")[0],
        vehiclePlate: vehiclePlate,
      });

      setReportData(data);

      // Auto-selecionar todos os sinistros
      if (data.incidents) {
        setSelectedSinistros(data.incidents.map((i: any) => i.id));
      }

      setIsPreviewOpen(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar dados. Verifique a conexão com o servidor.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para baixar o PDF usando impressão do navegador
  // Função atualizada para baixar e salvar histórico
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      // 1. Aciona a impressão do navegador (Gera o arquivo visual)
      window.print();

      // 2. Prepara os dados para salvar no banco
      const novoRelatorio = {
        titulo: `Relatório Frota - ${format(new Date(), "dd/MM/yyyy")}`,
        periodo_inicio: dateRange?.from,
        periodo_fim: dateRange?.to,
        veiculos_ids:
          selectedVehicles.length > 0
            ? selectedVehicles
            : vehicles.map((v) => v.placa),
        criado_por: "Usuário Atual",
        tipo: "Completo",
        resumo_financeiro: {
          multas: totalMultasValor,
          manutencoes: totalManutencoesValor,
          sinistros: totalSinistrosValor,
        },
      };

      // 3. Salva no Backend
      await salvarRelatorioHistoricoAPI(novoRelatorio);

      // 4. Atualiza a lista de histórico na tela imediatamente
      const historicoAtualizado = await buscarHistoricoRelatoriosAPI();
      setReportHistory(historicoAtualizado);

      console.log("Relatório salvo no histórico com sucesso.");
    } catch (error) {
      console.error("Erro ao processar download:", error);
      alert("O arquivo foi gerado, mas houve um erro ao salvar no histórico.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Função legado para baixar histórico (mantida para compatibilidade visual)
  const handleDownloadHistoryPDF = async (report: ReportHistory) => {
    alert("Função de download de histórico em manutenção.");
  };

  // Dados da empresa
  const empresaData = {
    nome: "TRL Transporte",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Patos, 1500 - Galpão 3, São Paulo - SP, CEP 01310-100",
    telefone: "(11) 3456-7890",
    site: "www.trltransporte.com.br",
    email: "contato@trltransporte.com.br",
  };

  // Cálculos de Resumo (Usando safeCurrency internamente na exibição)
  const totalMultasValor = filteredMultas.reduce(
    (acc, m) => acc + (Number(m.cost) || Number(m.valor) || 0),
    0,
  );
  const totalManutencoesValor = filteredManutencoes.reduce(
    (acc, m) => acc + (Number(m.cost) || Number(m.custo) || 0),
    0,
  );
  const totalSinistrosValor = filteredSinistros.reduce(
    (acc, s) => acc + (Number(s.cost) || Number(s.custo) || 0),
    0,
  );

  return (
    <>
      {/* Estilos de Impressão CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 0;
            margin: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <div className="space-y-6 animate-in fade-in duration-500 no-print">
        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Gerador de Relatórios Oficiais
              </h1>
              <p className="text-muted-foreground">
                Gere documentos detalhados, assinados e protegidos da frota.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* COLUNA PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">
            {/* SEÇÃO 1: SELEÇÃO DE ESCOPO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Seleção de Escopo
                </CardTitle>
                <CardDescription>
                  Defina os veículos e o período do relatório
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multi-Select de Veículos */}
                <div className="space-y-2">
                  <Label>Veículos da Frota</Label>
                  <Popover
                    open={isVehicleSelectOpen}
                    onOpenChange={setIsVehicleSelectOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start font-normal h-auto min-h-10 py-2 bg-transparent"
                      >
                        <Car className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {selectedVehicles.length === 0
                            ? "Selecionar veículos..."
                            : selectedVehicles.length === vehicles.length
                              ? "Todos os veículos selecionados"
                              : `${selectedVehicles.length} veículo(s) selecionado(s)`}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            Selecionar Veículos
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAllVehicles}
                            className="h-auto p-1 text-xs"
                          >
                            {selectedVehicles.length === vehicles.length
                              ? "Desmarcar todos"
                              : "Selecionar todos"}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="p-2 space-y-1">
                          {vehicles.map((vehicle) => (
                            <div
                              key={vehicle.placa}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                                selectedVehicles.includes(vehicle.placa)
                                  ? "bg-primary/10"
                                  : "hover:bg-muted",
                              )}
                              onClick={() => toggleVehicle(vehicle.placa)}
                            >
                              <Checkbox
                                checked={selectedVehicles.includes(
                                  vehicle.placa,
                                )}
                                onCheckedChange={() =>
                                  toggleVehicle(vehicle.placa)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm font-medium">
                                  {vehicle.placa}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {vehicle.modelo}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  {selectedVehicles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedVehicles.map((placa) => (
                        <Badge
                          key={placa}
                          variant="secondary"
                          className="gap-1 cursor-pointer hover:bg-destructive/10"
                          onClick={() => toggleVehicle(placa)}
                        >
                          {placa}
                          <X className="h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Range Picker */}
                <div className="space-y-2">
                  <Label>Período do Relatório</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy", {
                                locale: ptBR,
                              })}{" "}
                              -{" "}
                              {format(dateRange.to, "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          )
                        ) : (
                          "Selecione o período"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange as any}
                        onSelect={setDateRange as any}
                        numberOfMonths={2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* SEÇÃO 2: CONTEÚDO DO RELATÓRIO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Conteúdo do Relatório
                </CardTitle>
                <CardDescription>
                  Selecione os dados que deseja incluir no documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Multas */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      includeMultas
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                    onClick={() => setIncludeMultas(!includeMultas)}
                  >
                    <Checkbox
                      checked={includeMultas}
                      onCheckedChange={(checked) =>
                        setIncludeMultas(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-destructive" />
                        <span className="font-medium">Multas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Data, hora, local, motorista, valor e status
                      </p>
                    </div>
                  </div>

                  {/* Licenciamento */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      includeLicenciamento
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                    onClick={() =>
                      setIncludeLicenciamento(!includeLicenciamento)
                    }
                  >
                    <Checkbox
                      checked={includeLicenciamento}
                      onCheckedChange={(checked) =>
                        setIncludeLicenciamento(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Documentação</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tipo documento, vencimento e status
                      </p>
                    </div>
                  </div>

                  {/* Manutenções */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      includeManutencoes
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                    onClick={() => setIncludeManutencoes(!includeManutencoes)}
                  >
                    <Checkbox
                      checked={includeManutencoes}
                      onCheckedChange={(checked) =>
                        setIncludeManutencoes(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">Manutenções</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Peças, oficina, custo e nota fiscal
                      </p>
                    </div>
                  </div>

                  {/* Sinistros */}
                  <div
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
                      includeSinistros
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30",
                    )}
                    onClick={() => setIncludeSinistros(!includeSinistros)}
                  >
                    <Checkbox
                      checked={includeSinistros}
                      onCheckedChange={(checked) =>
                        setIncludeSinistros(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Sinistros</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Motorista, custo e status do seguro
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA LATERAL - SEGURANÇA E AÇÃO */}
          <div className="space-y-6">
            {/* SEÇÃO 4: SEGURANÇA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Segurança do PDF
                </CardTitle>
                <CardDescription>Proteja o documento com senha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-password">Senha de Criptografia *</Label>
                  <div className="relative">
                    <Input
                      id="pdf-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite uma senha segura"
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta senha será necessária para abrir o PDF gerado
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DADOS DA EMPRESA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados da Empresa
                </CardTitle>
                <CardDescription>
                  Informações que aparecerão no documento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Image
                    src="/images/image.png"
                    alt="TRL Transporte"
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div>
                    <p className="font-medium text-sm">{empresaData.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {empresaData.cnpj}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Assinaturas Digitais
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Luiz - Diretor
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Fran - Gerente
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Marca D'Água
                  </p>
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/30"
                  >
                    CONFIDENCIAL - INTRANSFERÍVEL
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* BOTÃO GERAR */}
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando Relatório...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Gerar Relatório PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE HISTÓRICO DE RELATÓRIOS (APENAS VISUAL) */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Relatórios
            </CardTitle>
            <CardDescription>
              Relatórios gerados anteriormente, prontos para download
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ALTERAÇÃO: Use reportHistory.length em vez de mockReportHistory */}
            {reportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum relatório foi gerado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {reportHistory.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Relatório {safeFormat(report.dataGeracao, "dd/MM")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {safeFormat(report.periodoInicio)} a{" "}
                          {safeFormat(report.periodoFim)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadHistoryPDF(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE PREVIEW */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !rounded-none border-0 p-0 overflow-hidden bg-slate-900/95">
          <DialogHeader className="absolute top-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur border-b no-print">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview do Relatório Oficial
                </DialogTitle>
                <DialogDescription>
                  Visualização prévia do documento em formato A4. Clique em
                  &quot;Baixar PDF&quot; para fazer download.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="no-print"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                  className="no-print"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="w-full h-full overflow-auto pt-24 pb-8 px-4">
            <div className="flex justify-center" ref={printRef}>
              {/* Documento A4 com largura fixa de 794px (210mm) escalado */}
              <div
                className="print-content bg-white relative shadow-2xl"
                style={{
                  width: "794px",
                  minHeight: "1123px", // Aproximadamente 297mm em 12px font-size
                  padding: "60px",
                  fontFamily: "Georgia, serif",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#1a1a1a",
                }}
              >
                {/* Watermark */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
                  style={{ zIndex: 0 }}
                >
                  <div
                    className="text-center opacity-[0.04] font-bold tracking-widest"
                    style={{
                      transform: "rotate(-35deg)",
                      fontSize: "56px",
                      color: "#1e3a5f",
                      whiteSpace: "nowrap",
                    }}
                  >
                    TRL TRANSPORTE
                    <br />
                    CONFIDENCIAL
                  </div>
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between mb-8 pb-4 border-b-2 border-slate-300">
                  <div className="flex items-center gap-4">
                    <Image
                      src="/images/image.png"
                      alt="TRL Transporte"
                      width={70}
                      height={70}
                      className="rounded"
                    />
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        {empresaData.nome}
                      </h1>
                      <p className="text-sm text-slate-600">
                        Transporte Rodoviário de Cargas
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>
                      <strong>CNPJ:</strong> {empresaData.cnpj}
                    </p>
                    <p>{empresaData.endereco}</p>
                    <p>{empresaData.telefone}</p>
                    <p>{empresaData.site}</p>
                  </div>
                </div>

                {/* TÍTULO DO RELATÓRIO */}
                <div className="relative z-10 text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                    Relatório Oficial da Frota
                  </h2>
                  <p className="text-xs text-slate-500">
                    Período:{" "}
                    {dateRange?.from && dateRange?.to
                      ? `${safeFormat(dateRange.from.toISOString(), "dd 'de' MMMM 'de' yyyy")} a ${safeFormat(dateRange.to.toISOString(), "dd 'de' MMMM 'de' yyyy")}`
                      : "N/A"}
                  </p>
                </div>

                {/* INFORMAÇÕES DO RELATÓRIO */}
                <div className="relative z-10 mb-8 p-5 bg-slate-50 rounded border border-slate-200">
                  <div className="grid grid-cols-2 gap-5 text-xs">
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase">
                        Veículos Analisados:
                      </p>
                      <p className="font-medium text-slate-800">
                        {selectedVehicles.length > 0
                          ? selectedVehicles.join(", ")
                          : "Todos"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase">
                        Gerado em:
                      </p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase">
                        Status do Documento:
                      </p>
                      <p className="font-medium text-green-700 flex items-center gap-1">
                        <FileCheck className="h-4 w-4" />
                        Protegido por Senha
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase">
                        ID do Documento:
                      </p>
                      <p className="font-mono font-medium text-slate-800">
                        {docHash}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI ANALYSIS */}
                {(includeMultas ||
                  includeManutencoes ||
                  includeSinistros ||
                  includeLicenciamento) && (
                  <div className="relative z-10 mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 shrink-0">
                        <Brain className="h-6 w-6 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          Análise Executiva Inteligente
                          <Badge className="bg-blue-600 text-white text-xs">
                            AI
                          </Badge>
                        </h3>
                        <p className="text-slate-700 text-xs leading-relaxed">
                          {generateAIAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESUMO FINANCEIRO */}
                {(includeMultas || includeManutencoes || includeSinistros) && (
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wide border-b pb-2">
                      Resumo Financeiro do Período
                    </h3>
                    <div className="grid grid-cols-3 gap-5">
                      {includeMultas && (
                        <div className="p-3 bg-red-50 rounded border border-red-100">
                          <p className="text-xs text-red-600 font-medium">
                            Total em Multas
                          </p>
                          <p className="text-base font-bold text-red-700">
                            {safeCurrency(totalMultasValor)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {filteredMultas.length} ocorrência(s)
                          </p>
                        </div>
                      )}
                      {includeManutencoes && (
                        <div className="p-3 bg-amber-50 rounded border border-amber-100">
                          <p className="text-xs text-amber-600 font-medium">
                            Total em Manutenções
                          </p>
                          <p className="text-base font-bold text-amber-700">
                            {safeCurrency(totalManutencoesValor)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {filteredManutencoes.length} serviço(s)
                          </p>
                        </div>
                      )}
                      {includeSinistros && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <p className="text-xs text-slate-600 font-medium">
                            Total em Sinistros
                          </p>
                          <p className="text-base font-bold text-slate-700">
                            {safeCurrency(totalSinistrosValor)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {filteredSinistros.length} sinistro(s)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TABELA DOCUMENTAÇÃO (LICENCIAMENTO) */}
                {includeLicenciamento && filteredLicenciamentos.length > 0 && (
                  <div className="mb-8 relative z-10">
                    <h4 className="text-xs font-bold uppercase border-b pb-1 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-green-600" /> Status
                      de Documentação
                    </h4>
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 border text-left">Placa</th>
                          <th className="p-2 border text-center">Tipo Doc.</th>
                          <th className="p-2 border text-center">CRLV</th>
                          <th className="p-2 border text-center">IPVA</th>
                          <th className="p-2 border text-center">
                            Licenciamento
                          </th>
                          <th className="p-2 border text-center">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLicenciamentos.map((lic: any) => (
                          <tr key={lic.id || lic.plate}>
                            <td className="p-2 border font-mono font-bold">
                              {lic.plate}
                            </td>
                            <td className="p-2 border text-center">
                              {lic.tipoDoc}
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.crlv === "Válido"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.crlv}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.ipvaStatus === "Pago" ||
                                    lic.ipvaStatus === "Em dia"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {lic.ipvaStatus}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.licenciamentoStatus === "Regular"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.licenciamentoStatus}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              {safeFormat(lic.vencimento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* TABELA MULTAS - CORRIGIDA */}
                {includeMultas && filteredMultas.length > 0 && (
                  <div className="mb-8 relative z-10">
                    <h4 className="text-xs font-bold uppercase border-b pb-1 mb-3 flex items-center gap-2">
                      <FileWarning className="h-3 w-3 text-red-600" />{" "}
                      Detalhamento de Multas
                    </h4>
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 border text-left">Data/Hora</th>
                          <th className="p-2 border text-left">
                            Veículo/Local
                          </th>
                          <th className="p-2 border text-left">Motorista</th>
                          <th className="p-2 border text-left">Descrição</th>
                          <th className="p-2 border text-right">Valor</th>
                          <th className="p-2 border text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMultas.map((m: any) => (
                          <tr key={m.id}>
                            <td className="p-2 border">
                              {safeFormat(m.date)}
                              <br />
                              <span className="text-[10px] text-slate-500">
                                {m.time}
                              </span>
                            </td>
                            <td className="p-2 border">
                              <span className="font-mono font-bold">
                                {m.plate}
                              </span>
                              <br />
                              <span className="text-[10px] text-slate-500">
                                {m.location}
                              </span>
                            </td>
                            <td className="p-2 border">{m.driver}</td>
                            <td className="p-2 border">{m.description}</td>
                            <td className="p-2 border text-right font-medium text-red-700">
                              {safeCurrency(m.cost)}
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${m.status === "Paga" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* MANUTENÇÕES TABLE */}
                {includeManutencoes && filteredManutencoes.length > 0 && (
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                      <Wrench className="h-4 w-4 text-amber-600" />
                      Histórico Detalhado de Manutenções
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Data
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Placa/Tipo
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Descrição / Peças
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Oficina
                          </th>
                          <th className="p-2 text-right border border-slate-300 font-semibold">
                            Custo
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            NF
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredManutencoes.map((manut: any) => (
                          <tr key={manut.id}>
                            <td className="p-2 border border-slate-200">
                              {safeFormat(manut.date || manut.data)}
                            </td>
                            <td className="p-2 border border-slate-200">
                              <span className="font-mono text-xs font-bold">
                                {manut.plate || manut.placa}
                              </span>
                              <br />
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-xs",
                                  manut.tipo === "Preventiva"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-orange-100 text-orange-700",
                                )}
                              >
                                {manut.type || manut.tipo}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-xs">
                              {manut.items || manut.pecas}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {manut.oficina || "Oficina Credenciada"}
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {safeCurrency(manut.cost || manut.custo)}
                            </td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-xs">
                              {manut.notaFiscal || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold">
                          <td
                            colSpan={4}
                            className="p-2 border border-slate-300 text-right"
                          >
                            TOTAL:
                          </td>
                          <td className="p-2 border border-slate-300 text-right">
                            {safeCurrency(totalManutencoesValor)}
                          </td>
                          <td className="p-2 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* SINISTROS TABLE */}
                {includeSinistros && filteredSinistros.length > 0 && (
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                      <AlertOctagon className="h-4 w-4 text-red-600" />
                      Registro de Sinistros e Acidentes
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Data/Veículo
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Tipo
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Motorista
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Descrição
                          </th>
                          <th className="p-2 text-right border border-slate-300 font-semibold">
                            Custo Est.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSinistros.map((sinistro: any) => (
                          <tr key={sinistro.id}>
                            <td className="p-2 border border-slate-200">
                              {safeFormat(sinistro.date || sinistro.data)}
                              <br />
                              <strong className="font-mono">
                                {sinistro.plate || sinistro.placa}
                              </strong>
                            </td>
                            <td className="p-2 border border-slate-200">
                              {sinistro.type || sinistro.tipo}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {sinistro.driver || sinistro.motorista}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {sinistro.description || sinistro.descricao}
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {safeCurrency(sinistro.cost || sinistro.custo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold">
                          <td
                            colSpan={4}
                            className="p-2 border border-slate-300 text-right"
                          >
                            TOTAL:
                          </td>
                          <td className="p-2 border border-slate-300 text-right">
                            {safeCurrency(totalSinistrosValor)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* LICENCIAMENTO TABLE - ATUALIZADO */}
                {includeLicenciamento && filteredLicenciamentos.length > 0 && (
                  <div className="mb-8 relative z-10">
                    <h4 className="text-xs font-bold uppercase border-b pb-1 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-green-600" /> Status
                      de Documentação
                    </h4>
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2 border text-left">Placa</th>
                          <th className="p-2 border text-center">Tipo Doc.</th>
                          <th className="p-2 border text-center">CRLV</th>
                          <th className="p-2 border text-center">IPVA</th>
                          <th className="p-2 border text-center">
                            Licenciamento
                          </th>
                          <th className="p-2 border text-center">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLicenciamentos.map((lic: any) => (
                          <tr key={lic.id || lic.plate}>
                            <td className="p-2 border font-mono font-bold">
                              {/* CORREÇÃO: Usar .plate em vez de .placa */}
                              {lic.plate}
                            </td>
                            <td className="p-2 border text-center">
                              {lic.tipoDoc}
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.crlv === "Válido"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.crlv}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.ipvaStatus === "Pago" ||
                                    lic.ipvaStatus === "Em dia"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {lic.ipvaStatus}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              <span
                                className={cn(
                                  "px-1 rounded",
                                  lic.licenciamentoStatus === "Regular"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.licenciamentoStatus}
                              </span>
                            </td>
                            <td className="p-2 border text-center">
                              {safeFormat(lic.vencimento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* FOOTER WITH SIGNATURES */}
                <div className="relative z-10 mt-12 pt-6 border-t-2 border-slate-300">
                  <div className="flex justify-between items-start mb-8">
                    <div className="text-slate-600 text-xs">
                      <p className="font-bold text-slate-800">
                        {empresaData.nome}
                      </p>
                      <p>{empresaData.endereco}</p>
                      <p>
                        CNPJ: {empresaData.cnpj} | {empresaData.telefone}
                      </p>
                      <p>{empresaData.email}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-slate-500 mb-4">
                        Assinaturas Digitais Autorizadas:
                      </p>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <div className="w-28 border-b-2 border-slate-400 mb-2 h-8" />
                          <p className="font-bold text-slate-800">
                            Luiz Henrique
                          </p>
                          <p className="text-slate-500">Diretor Operacional</p>
                        </div>
                        <div className="text-center">
                          <div className="w-28 border-b-2 border-slate-400 mb-2 h-8" />
                          <p className="font-bold text-slate-800">
                            Franciele Silva
                          </p>
                          <p className="text-slate-500">
                            Gerente Administrativa
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HASH DE SEGURANÇA E PÁGINA - Visível apenas no preview */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                    <div>
                      <p>
                        Documento gerado em{" "}
                        {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", {
                          locale: ptBR,
                        })}{" "}
                        | Sistema TRL Frota v2.0
                      </p>
                      <p className="font-mono">
                        Doc ID: {docHash} | Classificação: CONFIDENCIAL - USO
                        INTERNO
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 italic">
                        (Paginação automática no PDF)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
