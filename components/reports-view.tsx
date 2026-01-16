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
import { buscarFrotaAPI, buscarDadosRelatorioAPI } from "@/lib/api-service";
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
  CalendarIcon,
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

// ==================== INTERFACES ====================
interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
}

interface Multa {
  id: string;
  placa: string;
  data: string;
  hora: string;
  valor: number;
  local: string;
  status: "Paga" | "Pendente";
  infracao: string;
  motorista: string;
}

interface Manutencao {
  id: string;
  placa: string;
  data: string;
  tipo: "Preventiva" | "Corretiva";
  descricao: string;
  custo: number;
  pecas: string;
  oficina: string;
  notaFiscal: string;
}

interface Sinistro {
  id: string;
  placa: string;
  data: string;
  tipo: string;
  custo: number;
  descricao: string;
  motorista: string;
  statusSeguro: "Aprovado" | "Em Análise" | "Negado";
}

interface Licenciamento {
  placa: string;
  tipoDoc: string;
  crlv: "Válido" | "Pendente";
  ipvaStatus: string;
  licenciamentoStatus: "Regular" | "Irregular";
  vencimento: string;
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

// ==================== MOCK DATA - HISTÓRICO DE RELATÓRIOS (Para funcionalidade de histórico) ====================
// Arrays vazios para dados que virão da API no futuro
const mockMultas: any[] = [];
const mockManutencoes: any[] = [];
const mockSinistros: any[] = [];
const mockLicenciamentos: any[] = [];

// Histórico de relatórios - exemplo para demonstração
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
  // Estados de seleção
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 9, 1),
    to: new Date(),
  });

  // Estados de conteúdo do relatório
  const [includeMultas, setIncludeMultas] = useState(false);
  const [includeLicenciamento, setIncludeLicenciamento] = useState(false);
  const [includeManutencoes, setIncludeManutencoes] = useState(false);
  const [includeSinistros, setIncludeSinistros] = useState(false);

  // Estados de sinistros selecionados
  const [selectedSinistros, setSelectedSinistros] = useState<string[]>([]);

  // Estados de segurança
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados de controle
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVehicleSelectOpen, setIsVehicleSelectOpen] = useState(false);
  const [docHash] = useState(generateDocHash());

  // Estados para o PDF Download
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estado para histórico expandido
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(
    null,
  );

  // Ref para área de impressão
  const printRef = useRef<HTMLDivElement>(null);

  // Estados da API
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reportData, setReportData] = useState({
    incidents: [] as any[],
    maintenances: [] as any[],
    summary: {
      totalCost: 0,
      totalIncidents: 0,
      totalMaintenances: 0,
      analysisText: "Aguardando dados...",
    },
  });
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Carrega frota quando o componente monta
  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const vehiclesData = await buscarFrotaAPI();
        if (Array.isArray(vehiclesData)) {
          setVehicles(vehiclesData);
        } else {
          setVehicles([]);
        }
      } catch (error) {
        console.error("Erro ao carregar frota:", error);
        setVehicles([]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    
    loadVehicles();
  }, []);


  // Dados do relatório já vêm filtrados da API em reportData
  const filteredMultas: any[] = reportData.incidents || [];
  const filteredManutencoes: any[] = reportData.maintenances || [];
  const filteredSinistros: Sinistro[] = []; // Sinistros virão separados da API se necessário
  const filteredLicenciamentos: Licenciamento[] = []; // Licenciamentos virão da API se necessário

  // Análise é fornecida pela API
  const generateAIAnalysis = reportData.summary?.analysisText || "Aguardando dados do relatório...";

  // Handler para toggle de veículo
  const toggleVehicle = (placa: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(placa) ? prev.filter((p) => p !== placa) : [...prev, placa],
    );
  };

  // Handler para selecionar todos os veículos
  const selectAllVehicles = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map((v) => v.placa));
    }
  };

  // Handler para toggle de sinistro
  const toggleSinistro = (id: string) => {
    setSelectedSinistros((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // Handler para gerar PDF
  const handleGenerateReport = async () => {
    // Validação básica
    if (!dateRange?.from || !dateRange?.to) {
      alert("Por favor, selecione um período de data válido.");
      return;
    }

    if (!pdfPassword) {
      alert("Por favor, defina uma senha para o relatório.");
      return;
    }

    setIsGenerating(true);
    try {
      // Determinar placa selecionada
      const vehiclePlate = selectedVehicles.length === 1 
        ? selectedVehicles[0] 
        : "all";

      // Chamar API com filtros
      const data = await buscarDadosRelatorioAPI({
        startDate: dateRange.from.toISOString().split('T')[0],
        endDate: dateRange.to.toISOString().split('T')[0],
        vehiclePlate: vehiclePlate,
      });

      setReportData(data);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      alert("Erro ao gerar relatório. Verifique a conexão e tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);

    try {
      const printContent = printRef.current;
      if (!printContent) {
        throw new Error("Conteúdo do relatório não encontrado");
      }

      // Criar um iframe oculto para imprimir apenas o documento
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Não foi possível criar iframe");
      }

      // Capturar o HTML interno do preview
      const documentElement = printContent.querySelector(".print-content");
      if (!documentElement) {
        throw new Error("Documento não encontrado");
      }

      // Clonar o elemento para manipulação
      const clonedDoc = documentElement.cloneNode(true) as HTMLElement;

      // Converter todas as imagens para base64 inline
      const images = clonedDoc.querySelectorAll("img");
      for (const img of images) {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;
        if (src && !src.startsWith("data:")) {
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            imgElement.src = base64;
          } catch {
            // Se falhar, manter a imagem original
          }
        }
      }

      // Escrever o documento no iframe com estilos de impressão
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório TRL Transporte</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 12px;
              line-height: 1.5;
              color: #1a1a1a;
              background: white;
            }

            .document {
              width: 100%;
              max-width: 100%;
              padding: 0;
              background: white;
              position: relative;
            }

            /* Watermark */
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-35deg);
              font-size: 48px;
              font-weight: bold;
              color: rgba(30, 58, 95, 0.04);
              white-space: nowrap;
              pointer-events: none;
              z-index: 0;
              text-align: center;
              line-height: 1.5;
            }

            /* Header */
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #cbd5e1;
              position: relative;
              z-index: 1;
            }

            .header-logo {
              display: flex;
              align-items: center;
              gap: 15px;
            }

            .header-logo img {
              width: 60px;
              height: 60px;
              border-radius: 6px;
            }

            .header-logo h1 {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin: 0;
            }

            .header-logo p {
              font-size: 11px;
              color: #64748b;
              margin: 0;
            }

            .header-info {
              text-align: right;
              font-size: 10px;
              color: #64748b;
            }

            .header-info p {
              margin: 2px 0;
            }

            /* Title */
            .title-section {
              text-align: center;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .title-section h2 {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 5px 0;
            }

            .title-section p {
              font-size: 11px;
              color: #64748b;
              margin: 0;
            }

            /* Info box */
            .info-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }

            .info-item label {
              display: block;
              font-size: 9px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 3px;
            }

            .info-item p {
              font-size: 11px;
              font-weight: 500;
              color: #1e293b;
              margin: 0;
            }

            .info-item p.success {
              color: #059669;
            }

            .info-item p.mono {
              font-family: 'Courier New', monospace;
            }

            /* AI Analysis */
            .ai-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .ai-box-inner {
              display: flex;
              gap: 15px;
            }

            .ai-icon {
              width: 44px;
              height: 44px;
              background: #dbeafe;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .ai-icon svg {
              width: 22px;
              height: 22px;
              color: #1d4ed8;
            }

            .ai-content h3 {
              font-size: 13px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0 0 8px 0;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .ai-badge {
              background: #2563eb;
              color: white;
              font-size: 9px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
            }

            .ai-content p {
              font-size: 11px;
              color: #334155;
              margin: 0;
              line-height: 1.6;
            }

            /* Financial Cards */
            .financial-section {
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .financial-section h4 {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              margin: 0 0 15px 0;
            }

            .financial-cards {
              display: flex;
              gap: 15px;
            }

            .financial-card {
              flex: 1;
              padding: 15px;
              border-radius: 8px;
            }

            .financial-card.multas {
              background: #fef2f2;
              border: 1px solid #fecaca;
            }

            .financial-card.manutencoes {
              background: #fffbeb;
              border: 1px solid #fde68a;
            }

            .financial-card.sinistros {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }

            .financial-card label {
              display: block;
              font-size: 10px;
              font-weight: 600;
              margin-bottom: 5px;
            }

            .financial-card.multas label { color: #dc2626; }
            .financial-card.manutencoes label { color: #d97706; }
            .financial-card.sinistros label { color: #475569; }

            .financial-card .value {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }

            .financial-card.multas .value { color: #b91c1c; }
            .financial-card.manutencoes .value { color: #b45309; }
            .financial-card.sinistros .value { color: #334155; }

            .financial-card .count {
              font-size: 10px;
              color: #64748b;
              margin: 5px 0 0 0;
            }

            /* Tables */
            .table-section {
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
              page-break-inside: avoid;
            }

            .table-section h4 {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              margin: 0 0 12px 0;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .table-section h4 .icon {
              color: #dc2626;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th {
              background: #f1f5f9;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              color: #475569;
              border: 1px solid #e2e8f0;
              font-size: 9px;
              text-transform: uppercase;
            }

            td {
              padding: 10px 8px;
              border: 1px solid #e2e8f0;
              vertical-align: top;
            }

            .badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
            }

            .badge-success { background: #d1fae5; color: #059669; }
            .badge-danger { background: #fee2e2; color: #dc2626; }
            .badge-warning { background: #fef3c7; color: #d97706; }
            .badge-info { background: #dbeafe; color: #2563eb; }
            .badge-orange { background: #ffedd5; color: #ea580c; }

            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: 'Courier New', monospace; }
            .font-bold { font-weight: 600; }
            .text-small { font-size: 9px; color: #64748b; }

            /* Footer */
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #cbd5e1;
              position: relative;
              z-index: 1;
            }

            .footer-content {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }

            .footer-company p {
              margin: 2px 0;
              font-size: 10px;
              color: #475569;
            }

            .footer-company p:first-child {
              font-weight: bold;
              font-size: 12px;
              color: #1e293b;
            }

            .signatures {
              text-align: right;
            }

            .signatures-title {
              font-size: 9px;
              font-weight: 600;
              color: #64748b;
              margin-bottom: 15px;
            }

            .signature-boxes {
              display: flex;
              gap: 30px;
              justify-content: flex-end;
            }

            .signature-box {
              text-align: center;
            }

            .signature-line {
              width: 120px;
              border-bottom: 1px solid #1e293b;
              margin-bottom: 5px;
            }

            .signature-name {
              font-size: 11px;
              font-weight: bold;
              color: #1e293b;
            }

            .signature-role {
              font-size: 9px;
              color: #64748b;
            }

            .footer-meta {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #64748b;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
            }

            .footer-meta a {
              color: #2563eb;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="watermark">TRL TRANSPORTE<br/>CONFIDENCIAL</div>
            
            <div class="header">
              <div class="header-logo">
                ${clonedDoc.querySelector("img")?.outerHTML || ""}
                <div>
                  <h1>${empresaData.nome}</h1>
                  <p>Transporte Rodoviário de Cargas</p>
                </div>
              </div>
              <div class="header-info">
                <p><strong>CNPJ:</strong> ${empresaData.cnpj}</p>
                <p>${empresaData.endereco}</p>
                <p>${empresaData.telefone}</p>
                <p>${empresaData.site}</p>
              </div>
            </div>

            <div class="title-section">
              <h2>Relatório Oficial da Frota</h2>
              <p>Período: ${dateRange?.from && dateRange?.to ? `${format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} a ${format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : "N/A"}</p>
            </div>

            <div class="info-box">
              <div class="info-grid">
                <div class="info-item">
                  <label>Veículos Analisados:</label>
                  <p>${selectedVehicles.length > 0 ? selectedVehicles.join(", ") : "Todos"}</p>
                </div>
                <div class="info-item">
                  <label>Gerado em:</label>
                  <p>${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss")}</p>
                </div>
                <div class="info-item">
                  <label>Status do Documento:</label>
                  <p class="success">✓ Protegido por Senha</p>
                </div>
                <div class="info-item">
                  <label>ID do Documento:</label>
                  <p class="mono">${docHash}</p>
                </div>
              </div>
            </div>

            ${
              includeMultas ||
              includeManutencoes ||
              includeSinistros ||
              includeLicenciamento
                ? `
            <div class="ai-box">
              <div class="ai-box-inner">
                <div class="ai-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </div>
                <div class="ai-content">
                  <h3>Análise Executiva Inteligente <span class="ai-badge">AI</span></h3>
                  <p>${generateAIAnalysis}</p>
                </div>
              </div>
            </div>
            `
                : ""
            }

            <div class="financial-section">
              <h4>Resumo Financeiro do Período</h4>
              <div class="financial-cards">
                ${
                  includeMultas
                    ? `
                <div class="financial-card multas">
                  <label>Total em Multas</label>
                  <p class="value">${filteredMultas.reduce((acc, m) => acc + m.valor, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  <p class="count">${filteredMultas.length} ocorrência(s)</p>
                </div>
                `
                    : ""
                }
                ${
                  includeManutencoes
                    ? `
                <div class="financial-card manutencoes">
                  <label>Total em Manutenções</label>
                  <p class="value">${filteredManutencoes.reduce((acc, m) => acc + m.custo, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  <p class="count">${filteredManutencoes.length} serviço(s)</p>
                </div>
                `
                    : ""
                }
                ${
                  includeSinistros && selectedSinistros.length > 0
                    ? `
                <div class="financial-card sinistros">
                  <label>Total em Sinistros</label>
                  <p class="value">${filteredSinistros
                    .filter((s) => selectedSinistros.includes(s.id))
                    .reduce((acc, s) => acc + s.custo, 0)
                    .toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}</p>
                  <p class="count">${selectedSinistros.length} sinistro(s)</p>
                </div>
                `
                    : ""
                }
              </div>
            </div>

            ${
              includeLicenciamento && filteredLicenciamentos.length > 0
                ? `
            <div class="table-section">
              <h4><span class="icon">📋</span> Status de Documentação dos Veículos</h4>
              <table>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Tipo Doc.</th>
                    <th class="text-center">CRLV</th>
                    <th class="text-center">IPVA</th>
                    <th class="text-center">Licenciamento</th>
                    <th class="text-center">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLicenciamentos
                    .map(
                      (lic) => `
                    <tr>
                      <td class="font-mono font-bold">${lic.placa}</td>
                      <td>${lic.tipoDoc}</td>
                      <td class="text-center"><span class="badge ${lic.crlv === "Válido" ? "badge-success" : "badge-danger"}">${lic.crlv}</span></td>
                      <td class="text-center"><span class="badge ${lic.ipvaStatus === "Pago" ? "badge-success" : "badge-warning"}">${lic.ipvaStatus}</span></td>
                      <td class="text-center"><span class="badge ${lic.licenciamentoStatus === "Regular" ? "badge-success" : "badge-danger"}">${lic.licenciamentoStatus}</span></td>
                      <td class="text-center">${format(parseISO(lic.vencimento), "dd/MM/yyyy")}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              includeMultas && filteredMultas.length > 0
                ? `
            <div class="table-section">
              <h4><span class="icon" style="color: #dc2626;">⚠</span> Detalhamento de Multas e Infrações</h4>
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Veículo/Local</th>
                    <th>Motorista</th>
                    <th>Descrição</th>
                    <th class="text-right">Valor</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredMultas
                    .map(
                      (multa) => `
                    <tr>
                      <td>
                        ${format(parseISO(multa.data), "dd/MM/yyyy")}<br/>
                        <span class="text-small">${multa.hora}</span>
                      </td>
                      <td>
                        <strong class="font-mono">${multa.placa}</strong><br/>
                        <span class="text-small">${multa.local}</span>
                      </td>
                      <td>${multa.motorista}</td>
                      <td class="text-small">${multa.infracao}</td>
                      <td class="text-right font-bold">${multa.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td class="text-center"><span class="badge ${multa.status === "Paga" ? "badge-success" : "badge-danger"}">${multa.status}</span></td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              includeManutencoes && filteredManutencoes.length > 0
                ? `
            <div class="table-section">
              <h4><span class="icon" style="color: #d97706;">🔧</span> Histórico Detalhado de Manutenções</h4>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Placa/Tipo</th>
                    <th>Peças Utilizadas</th>
                    <th>Oficina</th>
                    <th class="text-right">Custo</th>
                    <th class="text-center">NF</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredManutencoes
                    .map(
                      (manut) => `
                    <tr>
                      <td>${format(parseISO(manut.data), "dd/MM/yyyy")}</td>
                      <td>
                        <strong class="font-mono">${manut.placa}</strong><br/>
                        <span class="badge ${manut.tipo === "Preventiva" ? "badge-info" : "badge-orange"}">${manut.tipo}</span>
                      </td>
                      <td class="text-small">${manut.pecas}</td>
                      <td>${manut.oficina}</td>
                      <td class="text-right font-bold">${manut.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                      <td class="text-center text-small">${manut.notaFiscal}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            ${
              includeSinistros && selectedSinistros.length > 0
                ? `
            <div class="table-section">
              <h4><span class="icon" style="color: #dc2626;">🚨</span> Registro de Sinistros e Acidentes</h4>
              <table>
                <thead>
                  <tr>
                    <th>Data/Veículo</th>
                    <th>Tipo</th>
                    <th>Motorista</th>
                    <th>Descrição</th>
                    <th class="text-right">Custo Est.</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredSinistros
                    .filter((s) => selectedSinistros.includes(s.id))
                    .map(
                      (sin) => `
                    <tr>
                      <td>
                        ${format(parseISO(sin.data), "dd/MM/yyyy")}<br/>
                        <strong class="font-mono">${sin.placa}</strong>
                      </td>
                      <td>${sin.tipo}</td>
                      <td>${sin.motorista}</td>
                      <td class="text-small">${sin.descricao}</td>
                      <td class="text-right font-bold">${sin.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }

            <div class="footer">
              <div class="footer-content">
                <div class="footer-company">
                  <p>${empresaData.nome}</p>
                  <p>${empresaData.endereco}</p>
                  <p>CNPJ: ${empresaData.cnpj} | ${empresaData.telefone}</p>
                  <p>${empresaData.email}</p>
                </div>
                <div class="signatures">
                  <p class="signatures-title">Assinaturas Digitais Autorizadas:</p>
                  <div class="signature-boxes">
                    <div class="signature-box">
                      <div class="signature-line"></div>
                      <p class="signature-name">Luiz Henrique</p>
                      <p class="signature-role">Diretor Operacional</p>
                    </div>
                    <div class="signature-box">
                      <div class="signature-line"></div>
                      <p class="signature-name">Franciele Silva</p>
                      <p class="signature-role">Gerente Administrativa</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="footer-meta">
                <div>
                  Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss")} | <a href="#">Sistema TRL Frota v2.0</a><br/>
                  Doc ID: ${docHash} | Classificação: CONFIDENCIAL - USO INTERNO
                </div>
                <div>
                  Página 1 de 1
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      // Imprimir o iframe
      iframe.contentWindow?.print();

      // Remover iframe após impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      console.error("[v0] Error generating PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Função para baixar relatório do histórico
  const handleDownloadHistoryPDF = async (report: ReportHistory) => {
    setDownloadingReportId(report.id);

    try {
      // Criar um iframe oculto para imprimir o documento do histórico
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Não foi possível criar iframe");
      }

      // Buscar dados dos veículos do relatório
      const reportVehicles = report.veiculos;
      const reportPlacas = reportVehicles.map((v) => v.placa);

      // Filtrar dados com base no período e veículos do relatório
      const periodoInicio = parseISO(report.periodoInicio);
      const periodoFim = parseISO(report.periodoFim);

      const filteredMultas = mockMultas.filter(
        (m) =>
          reportPlacas.includes(m.placa) &&
          isWithinInterval(parseISO(m.data), {
            start: periodoInicio,
            end: periodoFim,
          }),
      );

      const filteredManutencoes = mockManutencoes.filter(
        (m) =>
          reportPlacas.includes(m.placa) &&
          isWithinInterval(parseISO(m.data), {
            start: periodoInicio,
            end: periodoFim,
          }),
      );

      const filteredSinistros = mockSinistros.filter(
        (s) =>
          reportPlacas.includes(s.placa) &&
          isWithinInterval(parseISO(s.data), {
            start: periodoInicio,
            end: periodoFim,
          }),
      );

      const filteredLicenciamento = mockLicenciamentos.filter((l) =>
        reportPlacas.includes(l.placa),
      );

      // Gerar HTML do relatório com os dados do histórico
      const generateMultasTable = () => {
        if (!report.conteudo.multas || filteredMultas.length === 0) return "";
        return `
          <div class="section">
            <h4>DETALHAMENTO DE MULTAS E INFRAÇÕES</h4>
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Local</th>
                  <th>Motorista</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredMultas
                  .map(
                    (m) => `
                    <tr>
                      <td>${format(parseISO(m.data), "dd/MM/yyyy")}<br/><span class="time">${m.hora}</span></td>
                      <td><strong>${m.placa}</strong><br/>${m.local}</td>
                      <td>${m.motorista}</td>
                      <td>${m.infracao}</td>
                      <td class="currency">R$ ${m.valor.toFixed(2)}</td>
                      <td><span class="badge ${m.status === "Paga" ? "badge-success" : "badge-warning"}">${m.status}</span></td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      const generateLicenciamentoTable = () => {
        if (
          !report.conteudo.licenciamento ||
          filteredLicenciamento.length === 0
        )
          return "";
        return `
          <div class="section">
            <h4>STATUS DE DOCUMENTAÇÃO DOS VEÍCULOS</h4>
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Tipo Doc.</th>
                  <th>CRLV</th>
                  <th>IPVA</th>
                  <th>Licenciamento</th>
                  <th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLicenciamento
                  .map(
                    (l) => `
                    <tr>
                      <td><strong>${l.placa}</strong></td>
                      <td>${l.tipoDoc}</td>
                      <td><span class="badge ${l.crlv === "Válido" ? "badge-success" : "badge-warning"}">${l.crlv}</span></td>
                      <td><span class="badge ${l.ipvaStatus === "Pago" ? "badge-success" : "badge-warning"}">${l.ipvaStatus}</span></td>
                      <td><span class="badge ${l.licenciamentoStatus === "Regular" ? "badge-success" : "badge-danger"}">${l.licenciamentoStatus}</span></td>
                      <td>${format(parseISO(l.vencimento), "dd/MM/yyyy")}</td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      const generateManutencoesTable = () => {
        if (!report.conteudo.manutencoes || filteredManutencoes.length === 0)
          return "";
        return `
          <div class="section">
            <h4>HISTÓRICO DETALHADO DE MANUTENÇÕES</h4>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Placa/Tipo</th>
                  <th>Peças Utilizadas</th>
                  <th>Oficina</th>
                  <th>NF</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                ${filteredManutencoes
                  .map(
                    (m) => `
                    <tr>
                      <td>${format(parseISO(m.data), "dd/MM/yyyy")}</td>
                      <td><strong>${m.placa}</strong><br/><span class="badge ${m.tipo === "Preventiva" ? "badge-success" : "badge-warning"}">${m.tipo}</span></td>
                      <td>${m.pecas}</td>
                      <td>${m.oficina}</td>
                      <td>${m.notaFiscal}</td>
                      <td class="currency">R$ ${m.custo.toFixed(2)}</td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      const generateSinistrosTable = () => {
        if (!report.conteudo.sinistros || filteredSinistros.length === 0)
          return "";
        return `
          <div class="section">
            <h4>REGISTRO DE SINISTROS E ACIDENTES</h4>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Motorista</th>
                  <th>Descrição</th>
                  <th>Custo Est.</th>
                  <th>Seguro</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSinistros
                  .map(
                    (s) => `
                    <tr>
                      <td>${format(parseISO(s.data), "dd/MM/yyyy")}<br/><strong>${s.placa}</strong></td>
                      <td>${s.tipo}</td>
                      <td>${s.motorista}</td>
                      <td>${s.descricao}</td>
                      <td class="currency">R$ ${s.custo.toFixed(2)}</td>
                      <td><span class="badge ${s.statusSeguro === "Aprovado" ? "badge-success" : s.statusSeguro === "Negado" ? "badge-danger" : "badge-warning"}">${s.statusSeguro}</span></td>
                    </tr>
                  `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      // Gerar análise executiva
      const generateAnalysis = () => {
        const parts = [];
        if (report.conteudo.multas && report.quantidadeMultas > 0) {
          parts.push(
            `${report.quantidadeMultas} multa(s) registrada(s) totalizando ${report.totalMultas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          );
        }
        if (report.conteudo.manutencoes && report.quantidadeManutencoes > 0) {
          parts.push(
            `${report.quantidadeManutencoes} serviço(s) de manutenção no valor total de ${report.totalManutencoes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          );
        }
        if (report.conteudo.sinistros && report.quantidadeSinistros > 0) {
          parts.push(
            `${report.quantidadeSinistros} sinistro(s) com custo estimado de ${report.totalSinistros.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          );
        }
        const total =
          report.totalMultas + report.totalManutencoes + report.totalSinistros;
        return `Durante o período analisado, a frota registrou: ${parts.join("; ")}. Custo total do período: ${total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`;
      };

      // Montar HTML completo
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório TRL Transporte - ${report.docHash}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 11px;
              line-height: 1.5;
              color: #1a1a1a;
              background: white;
            }

            .document {
              width: 100%;
              max-width: 100%;
              padding: 0;
              background: white;
              position: relative;
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-35deg);
              font-size: 48px;
              font-weight: bold;
              color: rgba(30, 58, 95, 0.04);
              white-space: nowrap;
              pointer-events: none;
              z-index: 0;
              text-align: center;
              line-height: 1.5;
            }

            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #cbd5e1;
              position: relative;
              z-index: 1;
            }

            .header-logo {
              display: flex;
              align-items: center;
              gap: 15px;
            }

            .header-logo img {
              width: 60px;
              height: 60px;
              border-radius: 6px;
            }

            .header-logo h1 {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin: 0;
            }

            .header-logo p {
              font-size: 11px;
              color: #64748b;
              margin: 0;
            }

            .header-info {
              text-align: right;
              font-size: 10px;
              color: #64748b;
            }

            .header-info p {
              margin: 2px 0;
            }

            .title-section {
              text-align: center;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .title-section h2 {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 5px 0;
            }

            .title-section p {
              font-size: 11px;
              color: #64748b;
              margin: 0;
            }

            .info-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }

            .info-item label {
              display: block;
              font-size: 9px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 3px;
            }

            .info-item p {
              font-size: 11px;
              font-weight: 500;
              color: #1e293b;
              margin: 0;
            }

            .info-item p.success {
              color: #059669;
            }

            .info-item p.mono {
              font-family: 'Courier New', monospace;
            }

            .ai-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .ai-header {
              font-size: 13px;
              font-weight: bold;
              color: #1e3a8a;
              margin: 0 0 8px 0;
            }

            .ai-badge {
              background: #2563eb;
              color: white;
              font-size: 9px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              margin-left: 8px;
            }

            .ai-content {
              font-size: 11px;
              color: #334155;
              margin: 0;
              line-height: 1.6;
            }

            .financial-section {
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
            }

            .financial-section h4 {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              margin: 0 0 15px 0;
            }

            .financial-cards {
              display: flex;
              gap: 15px;
            }

            .financial-card {
              flex: 1;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid;
            }

            .financial-card.red {
              background: #fef2f2;
              border-color: #fecaca;
            }

            .financial-card.amber {
              background: #fffbeb;
              border-color: #fed7aa;
            }

            .financial-card.slate {
              background: #f8fafc;
              border-color: #e2e8f0;
            }

            .financial-card label {
              display: block;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 5px;
            }

            .financial-card.red label { color: #dc2626; }
            .financial-card.amber label { color: #d97706; }
            .financial-card.slate label { color: #64748b; }

            .financial-card .value {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }

            .financial-card.red .value { color: #dc2626; }
            .financial-card.amber .value { color: #d97706; }
            .financial-card.slate .value { color: #334155; }

            .financial-card .count {
              font-size: 10px;
              color: #64748b;
              margin: 3px 0 0 0;
            }

            .section {
              margin-bottom: 25px;
              position: relative;
              z-index: 1;
              page-break-inside: avoid;
            }

            .section h4 {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              text-transform: uppercase;
              margin: 0 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th, td {
              padding: 8px 10px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }

            th {
              background: #f1f5f9;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              font-size: 9px;
            }

            td {
              color: #334155;
            }

            .time {
              font-size: 9px;
              color: #64748b;
            }

            .currency {
              font-weight: 600;
              color: #1e293b;
            }

            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
            }

            .badge-success {
              background: #dcfce7;
              color: #166534;
            }

            .badge-warning {
              background: #fef3c7;
              color: #92400e;
            }

            .badge-danger {
              background: #fee2e2;
              color: #991b1b;
            }

            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              position: relative;
              z-index: 1;
              page-break-inside: avoid;
            }

            .footer-content {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }

            .footer-left {
              font-size: 10px;
            }

            .footer-left h3 {
              font-size: 12px;
              font-weight: bold;
              color: #1e293b;
              margin: 0 0 5px 0;
            }

            .footer-left p {
              color: #64748b;
              margin: 2px 0;
            }

            .footer-right {
              text-align: right;
            }

            .footer-right p {
              font-size: 10px;
              color: #64748b;
              margin: 0 0 15px 0;
            }

            .signatures {
              display: flex;
              gap: 40px;
            }

            .signature {
              text-align: center;
            }

            .signature-line {
              width: 120px;
              border-bottom: 1px solid #1e293b;
              margin-bottom: 5px;
            }

            .signature-name {
              font-size: 11px;
              font-weight: bold;
              color: #1e293b;
              margin: 0;
            }

            .signature-role {
              font-size: 9px;
              color: #64748b;
              margin: 0;
            }

            .footer-meta {
              margin-top: 25px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              color: #64748b;
              font-family: 'Courier New', monospace;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="watermark">TRL TRANSPORTE<br/>CONFIDENCIAL</div>
            
            <div class="header">
              <div class="header-logo">
                <div style="width: 60px; height: 60px; background: #1e3a5f; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">TRL</div>
                <div>
                  <h1>${empresaData.nome}</h1>
                  <p>Transporte Rodoviário de Cargas</p>
                </div>
              </div>
              <div class="header-info">
                <p>${empresaData.endereco}</p>
                <p>CNPJ: ${empresaData.cnpj} | ${empresaData.telefone}</p>
                <p>${empresaData.email}</p>
              </div>
            </div>

            <div class="title-section">
              <h2>Relatório Oficial da Frota</h2>
              <p>Período: ${format(periodoInicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} a ${format(periodoFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>

            <div class="info-box">
              <div class="info-grid">
                <div class="info-item">
                  <label>Veículos Analisados:</label>
                  <p>${reportVehicles.map((v) => `${v.placa} (${v.modelo})`).join(", ")}</p>
                </div>
                <div class="info-item">
                  <label>Gerado em:</label>
                  <p>${format(parseISO(report.dataGeracao), "dd/MM/yyyy")} às ${report.horaGeracao}</p>
                </div>
                <div class="info-item">
                  <label>Status do Documento:</label>
                  <p class="success">✓ Documento Oficial</p>
                </div>
                <div class="info-item">
                  <label>ID do Documento:</label>
                  <p class="mono">${report.docHash}</p>
                </div>
              </div>
            </div>

            <div class="ai-box">
              <p class="ai-header">Análise Executiva Inteligente <span class="ai-badge">AI</span></p>
              <p class="ai-content">${generateAnalysis()}</p>
            </div>

            <div class="financial-section">
              <h4>Resumo Financeiro do Período</h4>
              <div class="financial-cards">
                ${
                  report.conteudo.multas
                    ? `
                  <div class="financial-card red">
                    <label>Total em Multas</label>
                    <p class="value">R$ ${report.totalMultas.toFixed(2).replace(".", ",")}</p>
                    <p class="count">${report.quantidadeMultas} ocorrência(s)</p>
                  </div>
                `
                    : ""
                }
                ${
                  report.conteudo.manutencoes
                    ? `
                  <div class="financial-card amber">
                    <label>Total em Manutenções</label>
                    <p class="value">R$ ${report.totalManutencoes.toFixed(2).replace(".", ",")}</p>
                    <p class="count">${report.quantidadeManutencoes} serviço(s)</p>
                  </div>
                `
                    : ""
                }
                ${
                  report.conteudo.sinistros
                    ? `
                  <div class="financial-card slate">
                    <label>Total em Sinistros</label>
                    <p class="value">R$ ${report.totalSinistros.toFixed(2).replace(".", ",")}</p>
                    <p class="count">${report.quantidadeSinistros} sinistro(s)</p>
                  </div>
                `
                    : ""
                }
              </div>
            </div>

            ${generateMultasTable()}
            ${generateLicenciamentoTable()}
            ${generateManutencoesTable()}
            ${generateSinistrosTable()}

            <div class="footer">
              <div class="footer-content">
                <div class="footer-left">
                  <h3>${empresaData.nome}</h3>
                  <p>${empresaData.endereco}</p>
                  <p>CNPJ: ${empresaData.cnpj} | ${empresaData.telefone}</p>
                  <p>${empresaData.email}</p>
                </div>
                <div class="footer-right">
                  <p>Assinaturas Digitais Autorizadas:</p>
                  <div class="signatures">
                    <div class="signature">
                      <div class="signature-line"></div>
                      <p class="signature-name">Luiz Henrique</p>
                      <p class="signature-role">Diretor Operacional</p>
                    </div>
                    <div class="signature">
                      <div class="signature-line"></div>
                      <p class="signature-name">Franciele Silva</p>
                      <p class="signature-role">Gerente Administrativa</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="footer-meta">
                <span>Documento gerado em ${format(parseISO(report.dataGeracao), "dd/MM/yyyy")} às ${report.horaGeracao} | Sistema TRL Frota v2.0</span>
                <span>Doc ID: ${report.docHash} | Classificação: CONFIDENCIAL - USO INTERNO</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();

      // Aguardar carregamento e imprimir
      await new Promise((resolve) => setTimeout(resolve, 500));
      iframe.contentWindow?.print();

      // Remover iframe após impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (error) {
      console.error("[v0] Error downloading history PDF:", error);
      alert("Erro ao baixar relatório. Por favor, tente novamente.");
    } finally {
      setDownloadingReportId(null);
    }
  };

  // Dados da empresa
  const empresaData = {
    nome: "TRL Transporte e Logística LTDA",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Brasil, 1500 - Galpão 3, São Paulo - SP, CEP 01310-100",
    telefone: "(11) 3456-7890",
    site: "www.trltransporte.com.br",
    email: "contato@trltransporte.com.br",
  };

  // Cálculos para resumo
  const totalMultasValor = reportData.summary?.totalCost || 0;
  const totalManutencoesValor = reportData.summary?.totalMaintenances || 0;
  const totalSinistrosValor = reportData.summary?.totalIncidents || 0;

  return (
    <>
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
                        selected={dateRange}
                        onSelect={setDateRange}
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

            {/* SEÇÃO 3: REFINAMENTO DE SINISTROS (CONDICIONAL) */}
            {includeSinistros && filteredSinistros.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5" />
                    Refinamento de Sinistros
                  </CardTitle>
                  <CardDescription>
                    Selecione quais sinistros do período serão incluídos no
                    relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedSinistros.length ===
                                filteredSinistros.length &&
                              filteredSinistros.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSinistros(
                                  filteredSinistros.map((s) => s.id),
                                );
                              } else {
                                setSelectedSinistros([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Motorista</TableHead>
                        <TableHead className="text-right">Custo Est.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSinistros.map((sinistro) => (
                        <TableRow
                          key={sinistro.id}
                          className={cn(
                            "cursor-pointer",
                            selectedSinistros.includes(sinistro.id) &&
                              "bg-amber-100/50 dark:bg-amber-900/20",
                          )}
                          onClick={() => toggleSinistro(sinistro.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedSinistros.includes(sinistro.id)}
                              onCheckedChange={() =>
                                toggleSinistro(sinistro.id)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {format(parseISO(sinistro.data), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{sinistro.tipo}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {sinistro.placa}
                            </Badge>
                          </TableCell>
                          <TableCell>{sinistro.motorista}</TableCell>
                          <TableCell className="text-right font-medium">
                            {sinistro.custo.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {selectedSinistros.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {selectedSinistros.length} sinistro(s) selecionado(s) para
                      o relatório
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {includeSinistros && filteredSinistros.length === 0 && (
              <Card className="border-muted">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    Nenhum sinistro encontrado no período e veículos
                    selecionados.
                  </p>
                </CardContent>
              </Card>
            )}
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

      {/* SEÇÃO DE HISTÓRICO DE RELATÓRIOS */}
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
            {mockReportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum relatório foi gerado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mockReportHistory.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Linha Clicável */}
                    <button
                      onClick={() =>
                        setExpandedReportId(
                          expandedReportId === report.id ? null : report.id,
                        )
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Relatório da Frota
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {report.docHash}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(
                                parseISO(report.dataGeracao),
                                "dd/MM/yyyy",
                              )}{" "}
                              às {report.horaGeracao.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              {report.veiculos.length} veículo(s)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-1.5">
                          {report.conteudo.multas && (
                            <Badge variant="secondary" className="text-xs">
                              Multas
                            </Badge>
                          )}
                          {report.conteudo.licenciamento && (
                            <Badge variant="secondary" className="text-xs">
                              Docs
                            </Badge>
                          )}
                          {report.conteudo.manutencoes && (
                            <Badge variant="secondary" className="text-xs">
                              Manutenções
                            </Badge>
                          )}
                          {report.conteudo.sinistros && (
                            <Badge variant="secondary" className="text-xs">
                              Sinistros
                            </Badge>
                          )}
                        </div>
                        {expandedReportId === report.id ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Conteúdo Expandido */}
                    {expandedReportId === report.id && (
                      <div className="border-t bg-muted/30 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Informações do Período */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Período do Relatório
                              </p>
                              <p className="font-medium">
                                {format(
                                  parseISO(report.periodoInicio),
                                  "dd 'de' MMMM 'de' yyyy",
                                  { locale: ptBR },
                                )}
                                {" até "}
                                {format(
                                  parseISO(report.periodoFim),
                                  "dd 'de' MMMM 'de' yyyy",
                                  { locale: ptBR },
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Veículos Incluídos
                              </p>
                              <div className="space-y-1.5">
                                {report.veiculos.map((v) => (
                                  <div
                                    key={v.placa}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="font-mono font-bold"
                                    >
                                      {v.placa}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      {v.modelo}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Gerado Por
                              </p>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{report.geradoPor}</span>
                              </div>
                            </div>
                          </div>

                          {/* Conteúdo e Valores */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                Conteúdo do Relatório
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {report.conteudo.multas && (
                                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-100 dark:border-red-900">
                                    <FileWarning className="h-4 w-4 text-red-600" />
                                    <div>
                                      <p className="text-xs font-medium">
                                        Multas
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {report.quantidadeMultas} registro(s)
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {report.conteudo.licenciamento && (
                                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-100 dark:border-green-900">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="text-xs font-medium">
                                        Documentação
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Status incluído
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {report.conteudo.manutencoes && (
                                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-100 dark:border-amber-900">
                                    <Wrench className="h-4 w-4 text-amber-600" />
                                    <div>
                                      <p className="text-xs font-medium">
                                        Manutenções
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {report.quantidadeManutencoes}{" "}
                                        serviço(s)
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {report.conteudo.sinistros && (
                                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950/30 rounded border border-slate-200 dark:border-slate-800">
                                    <AlertOctagon className="h-4 w-4 text-slate-600" />
                                    <div>
                                      <p className="text-xs font-medium">
                                        Sinistros
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {report.quantidadeSinistros}{" "}
                                        ocorrência(s)
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Resumo Financeiro */}
                            {(report.totalMultas > 0 ||
                              report.totalManutencoes > 0 ||
                              report.totalSinistros > 0) && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                  Resumo Financeiro
                                </p>
                                <div className="space-y-1.5 text-sm">
                                  {report.totalMultas > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Total em Multas:
                                      </span>
                                      <span className="font-medium text-red-600">
                                        {report.totalMultas.toLocaleString(
                                          "pt-BR",
                                          {
                                            style: "currency",
                                            currency: "BRL",
                                          },
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {report.totalManutencoes > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Total em Manutenções:
                                      </span>
                                      <span className="font-medium text-amber-600">
                                        {report.totalManutencoes.toLocaleString(
                                          "pt-BR",
                                          {
                                            style: "currency",
                                            currency: "BRL",
                                          },
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {report.totalSinistros > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Total em Sinistros:
                                      </span>
                                      <span className="font-medium text-slate-600">
                                        {report.totalSinistros.toLocaleString(
                                          "pt-BR",
                                          {
                                            style: "currency",
                                            currency: "BRL",
                                          },
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-medium">
                                    <span>Total Geral:</span>
                                    <span>
                                      {(
                                        report.totalMultas +
                                        report.totalManutencoes +
                                        report.totalSinistros
                                      ).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Botão de Download */}
                            <Button
                              className="w-full gap-2"
                              variant="default"
                              onClick={() => handleDownloadHistoryPDF(report)}
                              disabled={downloadingReportId === report.id}
                            >
                              {downloadingReportId === report.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Preparando...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4" />
                                  Baixar Relatório PDF
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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
                      ? `${format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} a ${format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
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
                        {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss")}
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
                            {totalMultasValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
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
                            {totalManutencoesValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {filteredManutencoes.length} serviço(s)
                          </p>
                        </div>
                      )}
                      {includeSinistros && selectedSinistros.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <p className="text-xs text-slate-600 font-medium">
                            Total em Sinistros
                          </p>
                          <p className="text-base font-bold text-slate-700">
                            {totalSinistrosValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedSinistros.length} sinistro(s)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MULTAS TABLE */}
                {includeMultas && filteredMultas.length > 0 && (
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                      <FileWarning className="h-4 w-4 text-red-600" />
                      Detalhamento de Multas e Infrações
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Data/Hora
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Local
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Motorista
                          </th>
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Descrição
                          </th>
                          <th className="p-2 text-right border border-slate-300 font-semibold">
                            Valor
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMultas.map((multa) => (
                          <tr key={multa.id}>
                            <td className="p-2 border border-slate-200">
                              {format(parseISO(multa.data), "dd/MM/yyyy")}
                              <br />
                              <span className="text-slate-500">
                                {multa.hora}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200">
                              <span className="font-mono text-xs font-bold">
                                {multa.placa}
                              </span>
                              <br />
                              {multa.local}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {multa.motorista}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {multa.infracao}
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {multa.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-semibold",
                                  multa.status === "Paga"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {multa.status}
                              </span>
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
                            {totalMultasValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td className="p-2 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* LICENCIAMENTO TABLE */}
                {includeLicenciamento && filteredLicenciamentos.length > 0 && (
                  <div className="relative z-10 mb-8">
                    <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b pb-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      Status de Documentação dos Veículos
                    </h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300 font-semibold">
                            Placa
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            Tipo Doc.
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            CRLV
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            IPVA
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            Licenciamento
                          </th>
                          <th className="p-2 text-center border border-slate-300 font-semibold">
                            Vencimento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLicenciamentos.map((lic) => (
                          <tr key={lic.placa}>
                            <td className="p-2 border border-slate-200 font-mono font-bold">
                              {lic.placa}
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              {lic.tipoDoc}
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-semibold",
                                  lic.crlv === "Válido"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.crlv}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-semibold",
                                  lic.ipvaStatus === "Pago"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {lic.ipvaStatus}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-semibold",
                                  lic.licenciamentoStatus === "Regular"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {lic.licenciamentoStatus}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-center">
                              {format(parseISO(lic.vencimento), "dd/MM/yyyy")}
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
                            Peças Utilizadas
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
                        {filteredManutencoes.map((manut) => (
                          <tr key={manut.id}>
                            <td className="p-2 border border-slate-200">
                              {format(parseISO(manut.data), "dd/MM/yyyy")}
                            </td>
                            <td className="p-2 border border-slate-200">
                              <span className="font-mono text-xs font-bold">
                                {manut.placa}
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
                                {manut.tipo}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-xs">
                              {manut.pecas}
                            </td>
                            <td className="p-2 border border-slate-200">
                              {manut.oficina}
                            </td>
                            <td className="p-2 border border-slate-200 text-right font-medium">
                              {manut.custo.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="p-2 border border-slate-200 text-center font-mono text-xs">
                              {manut.notaFiscal}
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
                            {totalManutencoesValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td className="p-2 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* SINISTROS TABLE */}
                {includeSinistros && selectedSinistros.length > 0 && (
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
                        {filteredSinistros
                          .filter((s) => selectedSinistros.includes(s.id))
                          .map((sinistro) => (
                            <tr key={sinistro.id}>
                              <td className="p-2 border border-slate-200">
                                {format(parseISO(sinistro.data), "dd/MM/yyyy")}
                                <br />
                                <strong className="font-mono">
                                  {sinistro.placa}
                                </strong>
                              </td>
                              <td className="p-2 border border-slate-200">
                                {sinistro.tipo}
                              </td>
                              <td className="p-2 border border-slate-200">
                                {sinistro.motorista}
                              </td>
                              <td className="p-2 border border-slate-200">
                                {sinistro.descricao}
                              </td>
                              <td className="p-2 border border-slate-200 text-right font-medium">
                                {sinistro.custo.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
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
                            {totalSinistrosValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                        </tr>
                      </tfoot>
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
                        {format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss")} |
                        Sistema TRL Frota v2.0
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