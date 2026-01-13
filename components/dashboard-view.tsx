"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  AlertTriangle,
  Wrench,
  FileWarning,
  Ban,
  TrendingUp,
  Clock,
  DollarSign,
  Loader2,
  FileText,
  Calendar,
  CreditCard,
  MapPin,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/app-context";
import { getPlateRestriction } from "@/lib/mock-data";
import {
  buscarFrotaAPI,
  buscarManutencoesAPI,
  buscarMultasAPI,
  buscarDocumentosAPI,
} from "@/lib/api-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// --- INTERFACE PARA TIPAGEM DOS ALERTAS ---
interface DashboardAlert {
  type: "document" | "maintenance" | "fine";
  status: string;
  message: string;
  date: Date | string;
  data: any; // Armazena o objeto original (multa, manutenção ou documento)
}

export function DashboardView() {
  const { selectedBranch } = useApp();
  const [loading, setLoading] = useState(true);

  // Estados para dados reais
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Estado do Modal de Detalhes
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- 1. CARREGAR DADOS REAIS ---
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [frotaRes, manutsRes, multasRes, docsRes] = await Promise.all([
          buscarFrotaAPI(),
          buscarManutencoesAPI(),
          buscarMultasAPI(),
          buscarDocumentosAPI(),
        ]);

        setVehicles(Array.isArray(frotaRes) ? frotaRes : []);
        setMaintenances(Array.isArray(manutsRes) ? manutsRes : []);
        setFines(Array.isArray(multasRes) ? multasRes : []);
        setDocuments(Array.isArray(docsRes) ? docsRes : []);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // --- 2. CÁLCULOS DE KPI ---
  const activeVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const status = v.status || "Ativo";
      return (
        status !== "Em Manutenção" &&
        status !== "Em Oficina" &&
        status !== "Inativo"
      );
    }).length;
  }, [vehicles]);

  const availabilityPercentage =
    vehicles.length > 0
      ? Math.round((activeVehicles / vehicles.length) * 100)
      : 0;

  const currentMonthCost = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const maintenanceCost = maintenances
      .filter((m) => {
        const d = new Date(m.scheduled_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, m) => sum + Number(m.cost || 0), 0);

    const finesCost = fines
      .filter((f) => {
        const d = new Date(f.date || f.due_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, f) => sum + Number(f.amount || f.valor || 0), 0);

    return maintenanceCost + finesCost;
  }, [maintenances, fines]);

  // --- 3. GRÁFICO ---
  const monthlyChartData = useMemo(() => {
    const data: Record<string, number> = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = months[d.getMonth()];
      data[key] = 0;
    }

    maintenances.forEach((m) => {
      const d = new Date(m.scheduled_date);
      const key = months[d.getMonth()];
      if (data[key] !== undefined) data[key] += Number(m.cost || 0);
    });

    fines.forEach((f) => {
      const d = new Date(f.date || f.due_date);
      const key = months[d.getMonth()];
      if (data[key] !== undefined)
        data[key] += Number(f.amount || f.valor || 0);
    });

    return Object.entries(data).map(([month, total]) => ({ month, total }));
  }, [maintenances, fines]);

  // --- 4. ALERTAS INTELIGENTES ---
  const alerts = useMemo(() => {
    const list: DashboardAlert[] = [];

    // Alerta de Documentos
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 30);

    documents.forEach((doc) => {
      const expDate = new Date(doc.expiration_date || doc.validade);
      if (expDate < today) {
        list.push({
          type: "document",
          status: "Vencido",
          message: `${doc.type || "Doc"} vencido - ${doc.vehicle_plate}`,
          date: expDate,
          data: doc,
        });
      } else if (expDate <= warningDate) {
        list.push({
          type: "document",
          status: "Vencendo",
          message: `${doc.type || "Doc"} vence em breve - ${doc.vehicle_plate}`,
          date: expDate,
          data: doc,
        });
      }
    });

    // Alerta de Manutenções
    maintenances.forEach((m) => {
      if (m.status === "Urgente" || m.status === "Atrasada") {
        list.push({
          type: "maintenance",
          status: "Urgente",
          message: `${m.type} - ${m.vehicle_plate}`,
          date: new Date(m.scheduled_date),
          data: m,
        });
      }
    });

    // Alerta de Multas
    fines.forEach((f) => {
      if (f.status === "Pendente" || f.status === "Não Paga") {
        list.push({
          type: "fine",
          status: "Pendente",
          message: `Multa pendente - ${f.vehicle_plate}`,
          date: new Date(f.due_date || f.date),
          data: f,
        });
      }
    });

    return list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [documents, maintenances, fines]);

  // --- 5. RODÍZIO ---
  const { blockedEndings, dayName } = getPlateRestriction();
  const vehiclesInRotation = useMemo(() => {
    if (blockedEndings.length === 0) return [];
    return vehicles.filter((v) => {
      const placa = v.placa || "";
      const final = placa.slice(-1);
      return blockedEndings.includes(parseInt(final));
    });
  }, [vehicles, blockedEndings]);

  // Função para abrir detalhes
  const handleAlertClick = (alert: DashboardAlert) => {
    setSelectedAlert(alert);
    setIsDetailsOpen(true);
  };

  // --- RENDERIZAR CONTEÚDO DO MODAL ---
  const renderAlertDetails = () => {
    if (!selectedAlert) return null;
    const { type, data } = selectedAlert;

    // Detalhes de MULTAS
    if (type === "fine") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">
                Infração de Trânsito
              </p>
              <p className="text-2xl font-bold text-red-700">
                {Number(data.amount || data.valor || 0).toLocaleString(
                  "pt-BR",
                  { style: "currency", currency: "BRL" }
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> Veículo
              </span>
              <p className="font-medium">{data.vehicle_plate}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Vencimento
              </span>
              <p className="font-medium">
                {new Date(data.due_date || data.date).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Local / Descrição
              </span>
              <p className="font-medium">
                {data.description || data.local || "Sem descrição"}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Código da Infração
              </span>
              <p className="font-medium text-sm font-mono bg-muted p-1 rounded w-fit">
                {data.code || "N/A"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Detalhes de MANUTENÇÃO
    if (type === "maintenance") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Manutenção Urgente
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {Number(data.cost || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> Veículo
              </span>
              <p className="font-medium">{data.vehicle_plate}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Agendado para
              </span>
              <p className="font-medium">
                {new Date(data.scheduled_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Wrench className="h-3 w-3" /> Tipo
              </span>
              <p className="font-medium">{data.type}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Descrição
              </span>
              <p className="text-sm bg-muted p-2 rounded">{data.description}</p>
            </div>
          </div>
        </div>
      );
    }

    // Detalhes de DOCUMENTO
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <FileWarning className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Alerta de Documento
            </p>
            <p className="text-lg font-bold text-blue-700">
              {data.type || "Documento"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Car className="h-3 w-3" /> Veículo
            </span>
            <p className="font-medium">{data.vehicle_plate}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Validade
            </span>
            <p className="font-medium text-red-600 font-bold">
              {new Date(
                data.expiration_date || data.validade
              ).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da frota em tempo real - {dayName}
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Veículos
            </CardTitle>
            <Car className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vehicles.length}</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="flex items-center text-green-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                {activeVehicles} disponíveis
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Este Mês
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentMonthCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              multas + manutenções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibilidade
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {availabilityPercentage}%
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {vehicles.length - activeVehicles} indisponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rodízio Hoje (SP)
            </CardTitle>
            <Ban className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {vehiclesInRotation.length}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {blockedEndings.length > 0
                ? `Finais ${blockedEndings.join(" e ")}`
                : "Sem restrição"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alertas Críticos */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas da Frota ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <div className="rounded-full bg-green-100 p-3 mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p>Tudo certo! Nenhuma pendência encontrada.</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAlertClick(alert)}
                    className="group flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {alert.type === "document" ? (
                        <FileWarning className="h-5 w-5 text-destructive" />
                      ) : alert.type === "fine" ? (
                        <FileText className="h-5 w-5 text-destructive" />
                      ) : (
                        <Wrench className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium group-hover:underline">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {new Date(alert.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        alert.status === "Vencido" ||
                        alert.status === "Pendente"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Evolução de Custos (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    className="text-xs"
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Gasto"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Veículos no Rodízio */}
      {vehiclesInRotation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-amber-500" />
              Veículos no Rodízio Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Hoje ({dayName}), veículos com placa final{" "}
                <strong>{blockedEndings.join(" e ")}</strong> não devem circular
                no centro expandido de SP.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {vehiclesInRotation.map((vehicle: any) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{vehicle.modelo}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.placa}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-amber-600"
                  >
                    Restrito
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL DE DETALHES DO ALERTA */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre a pendência selecionada.
            </DialogDescription>
          </DialogHeader>

          {renderAlertDetails()}

          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
