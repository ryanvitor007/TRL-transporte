"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  data: any;
}

export function DashboardView() {
  const { selectedBranch } = useApp();
  const [loading, setLoading] = useState(true);
  const isFetched = useRef(false); // Ref para evitar chamadas duplas (React 18 Strict Mode)

  // Estados para dados
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Estado do Modal
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- 1. CARREGAR DADOS REAIS (BLINDADO) ---
  useEffect(() => {
    // Se já buscou, não busca de novo
    if (isFetched.current) return;

    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        console.log("Iniciando carga do Dashboard..."); // Log para debug

        const [frotaRes, manutsRes, multasRes, docsRes] = await Promise.all([
          buscarFrotaAPI().catch((err) => {
            console.error("Erro frota:", err);
            return [];
          }),
          buscarManutencoesAPI().catch((err) => {
            console.error("Erro manuts:", err);
            return [];
          }),
          buscarMultasAPI().catch((err) => {
            console.error("Erro multas:", err);
            return [];
          }),
          buscarDocumentosAPI().catch((err) => {
            console.error("Erro docs:", err);
            return [];
          }),
        ]);

        if (isMounted) {
          setVehicles(Array.isArray(frotaRes) ? frotaRes : []);
          setMaintenances(Array.isArray(manutsRes) ? manutsRes : []);
          setFines(Array.isArray(multasRes) ? multasRes : []);
          setDocuments(Array.isArray(docsRes) ? docsRes : []);
          isFetched.current = true; // Marca como carregado
        }
      } catch (error) {
        console.error("Erro fatal ao carregar dashboard:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []); // Array de dependências vazio é crucial

  // --- 2. CÁLCULOS DE KPI (Memoizados) ---
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
        if (!m.scheduled_date) return false;
        const d = new Date(m.scheduled_date);
        return (
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, m) => sum + Number(m.cost || 0), 0);

    const finesCost = fines
      .filter((f) => {
        const dateStr = f.date || f.due_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (
          !isNaN(d.getTime()) &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, f) => sum + Number(f.amount || f.valor || 0), 0);

    return maintenanceCost + finesCost;
  }, [maintenances, fines]);

  // --- 3. GRÁFICO (Protegido contra NaN) ---
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
    // Inicializa últimos 6 meses com 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = months[d.getMonth()];
      data[key] = 0;
    }

    maintenances.forEach((m) => {
      if (!m.scheduled_date) return;
      const d = new Date(m.scheduled_date);
      if (isNaN(d.getTime())) return;

      const key = months[d.getMonth()];
      if (data[key] !== undefined) {
        const custo = Number(m.cost);
        data[key] += isNaN(custo) ? 0 : custo;
      }
    });

    fines.forEach((f) => {
      const dateStr = f.date || f.due_date;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const key = months[d.getMonth()];
      if (data[key] !== undefined) {
        const valor = Number(f.amount || f.valor);
        data[key] += isNaN(valor) ? 0 : valor;
      }
    });

    return Object.entries(data).map(([month, total]) => ({ month, total }));
  }, [maintenances, fines]);

  // --- 4. ALERTAS (Protegidos) ---
  const alerts = useMemo(() => {
    const list: DashboardAlert[] = [];
    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 30);

    // Documentos
    documents.forEach((doc) => {
      const dateStr = doc.expiration_date || doc.validade;
      if (!dateStr) return;
      const expDate = new Date(dateStr);
      if (isNaN(expDate.getTime())) return;

      if (expDate < today) {
        list.push({
          type: "document",
          status: "Vencido",
          message: `${doc.type || "Doc"} vencido - ${doc.vehicle_plate || "?"}`,
          date: expDate,
          data: doc,
        });
      } else if (expDate <= warningDate) {
        list.push({
          type: "document",
          status: "Vencendo",
          message: `${doc.type || "Doc"} vence em breve`,
          date: expDate,
          data: doc,
        });
      }
    });

    // Manutenções
    maintenances.forEach((m) => {
      if (
        (m.status === "Urgente" || m.status === "Atrasada") &&
        m.scheduled_date
      ) {
        list.push({
          type: "maintenance",
          status: "Urgente",
          message: `${m.type} - ${m.vehicle_plate || "?"}`,
          date: new Date(m.scheduled_date),
          data: m,
        });
      }
    });

    // Multas
    fines.forEach((f) => {
      if (
        (f.status === "Pendente" || f.status === "Não Paga") &&
        (f.due_date || f.date)
      ) {
        list.push({
          type: "fine",
          status: "Pendente",
          message: `Multa pendente - ${f.vehicle_plate || "?"}`,
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
      if (placa.length < 1) return false;
      const finalChar = placa.slice(-1);
      const finalInt = parseInt(finalChar);
      return !isNaN(finalInt) && blockedEndings.includes(finalInt);
    });
  }, [vehicles, blockedEndings]);

  // Render do Modal
  const renderAlertDetails = () => {
    if (!selectedAlert) return null;
    const { type, data } = selectedAlert;

    // Fallbacks para valores nulos/undefined
    const valorDisplay = (val: any) =>
      Number(val || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    const dataDisplay = (dateStr: string) =>
      dateStr ? new Date(dateStr).toLocaleDateString("pt-BR") : "Data inválida";

    if (type === "fine") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">Infração</p>
              <p className="text-2xl font-bold text-red-700">
                {valorDisplay(data.amount || data.valor)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Veículo</p>
              <p className="font-medium">{data.vehicle_plate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Vencimento</p>
              <p className="font-medium">
                {dataDisplay(data.due_date || data.date)}
              </p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Local</p>
              <p className="font-medium">
                {data.description || data.local || "-"}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (type === "maintenance") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Manutenção</p>
              <p className="text-2xl font-bold text-amber-700">
                {valorDisplay(data.cost)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Veículo</p>
              <p className="font-medium">{data.vehicle_plate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-medium">{dataDisplay(data.scheduled_date)}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="font-medium">{data.type}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <FileWarning className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Documento</p>
            <p className="text-lg font-bold text-blue-700">{data.type}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Veículo</p>
            <p className="font-medium">{data.vehicle_plate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Validade</p>
            <p className="font-medium text-red-600">
              {dataDisplay(data.expiration_date || data.validade)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Carregando dados da frota...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da frota em tempo real - {dayName}
        </p>
      </div>

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
            <div className="mt-1 flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" /> {activeVehicles} disponíveis
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
                ? `Finais ${blockedEndings.join(", ")}`
                : "Livre"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                <p>Nenhuma pendência.</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setIsDetailsOpen(true);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {alert.type === "document" ? (
                        <FileWarning className="h-4 w-4 text-blue-500" />
                      ) : alert.type === "fine" ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <Wrench className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução de Custos</CardTitle>
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
                    className="text-xs"
                    tickFormatter={(v) => `R$${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(v: number) =>
                      v.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes</DialogTitle>
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
