const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("trl_auth_token");
};

const buildHeaders = (headers?: HeadersInit) => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };
};

// --- INTERFACES DE TIPAGEM ---

export interface VeiculoDetran {
  placa: string;
  renavam: string;
  marca_modelo: string;
  ano_fabricacao: number;
  multas_vencidas: number;
  status_licenciamento: string;
  restricoes: string[];
  uf?: string;
  municipio?: string;
}

export interface Veiculo {
  id?: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  status: string;
}

// --- ADAPTERS (Tradutores de Dados) ---
// Converte snake_case (banco) para camelCase (front)
const adapterIncidente = (dbData: any) => {
  return {
    id: dbData.id,
    type: dbData.tipo,
    date: dbData.data_ocorrencia,
    time: dbData.hora_ocorrencia,
    vehiclePlate: dbData.veiculo_placa,
    vehicleModel: dbData.veiculo_modelo || "Não informado",
    driverName: dbData.motorista_nome,
    location: dbData.localizacao,
    description: dbData.descricao,
    estimatedCost: Number(dbData.custo_estimado),
    insuranceClaim: dbData.acionamento_seguro,
    status: dbData.status,
    // CORREÇÃO: Mapeia o array de fotos do banco para o front
    fotos: dbData.fotos || [],
    invoiceUrl: dbData.nota_fiscal_url || null, // <--- NOVO CAMPO
  };
};

// --- FUNÇÕES AUXILIARES ---

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro na API: ${response.statusText}`);
  }
  // Algumas rotas (como DELETE) podem não retornar corpo
  if (response.status === 204) return null;
  return response.json();
}

// --- MÓDULO: DETRAN ---

export async function consultarDetranAPI(
  placa: string,
  renavam: string,
): Promise<VeiculoDetran> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/detran/consultar?placa=${placa}&renavam=${renavam}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao consultar DETRAN:", error);
    throw error;
  }
}

export async function consultarVeiculoAPI(placa: string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vehicles/consultar?placa=${placa}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      },
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao consultar veículo:", error);
    throw error;
  }
}

// --- MÓDULO: FROTA / VEÍCULOS ---

export async function buscarFrotaAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      cache: "no-store",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao buscar frota:", error);
    return [];
  }
}

export async function salvarVeiculoAPI(dadosVeiculo: any) {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dadosVeiculo),
  });
  return handleResponse(response);
}

export async function excluirVeiculoAPI(id: number | string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}

// --- MÓDULO: MANUTENÇÕES ---

export async function buscarManutencoesAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/maintenances`, {
      cache: "no-store",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao buscar manutenções:", error);
    return [];
  }
}

export async function salvarManutencaoAPI(dados: any) {
  const response = await fetch(`${API_BASE_URL}/maintenances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function concluirManutencaoAPI(id: number) {
  const response = await fetch(`${API_BASE_URL}/maintenances/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(response);
}

// Atualiza uma manutencao existente (usado para finalizar vistorias com custo/fornecedor)
export async function atualizarManutencaoAPI(id: number, dados: {
  status?: string;
  cost?: number;
  provider?: string;
  invoice_url?: string;
  completed_date?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/maintenances/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

// --- MÓDULO: RELATÓRIOS (INTEGRAÇÃO REAL) ---

export interface ReportFilter {
  startDate: string;
  endDate: string;
  vehiclePlate: string;
}

// Adaptador para converter dados do Banco (snake_case) para o Frontend (camelCase)
// Em lib/api-service.ts

function adapterRelatorio(data: any) {
  return {
    // 1. Incidentes / Sinistros
    incidents: (data.incidents || []).map((i: any) => ({
      id: String(i.id),
      date: i.data_ocorrencia || i.created_at,
      type: i.tipo || "Sinistro",
      plate: i.veiculo_placa || i.vehicle?.placa || "Placa N/A",
      driver: i.motorista_nome || "Não informado",
      description: i.descricao || "Sem descrição",
      cost: Number(i.custo_estimado || 0),
    })),

    // 2. Multas
    fines: (data.fines || []).map((f: any) => ({
      id: String(f.id),
      date: f.data_infracao || f.created_at,
      time: f.hora_infracao || "00:00",
      plate: f.veiculo_placa || f.vehicle?.placa || "Placa N/A",
      driver: f.motorista_nome || "Não identificado",
      location: f.local_infracao || "Local não informado",
      description: f.descricao_infracao || f.infracao || "Infração",
      cost: Number(f.valor || f.amount || 0),
      status: f.status || "Pendente",
    })),

    // 3. Manutenções
    maintenances: (data.maintenances || []).map((m: any) => ({
      id: String(m.id),
      date: m.scheduled_date || m.data_agendada,
      type: m.type || "Manutenção",
      plate: m.vehicle_plate || m.vehicle?.placa || "Placa N/A",
      cost: Number(m.cost || 0),
      items: m.description || "Itens diversos",
      notaFiscal: m.nota_fiscal || "-",
      oficina: m.oficina || "Oficina Credenciada",
    })),

    // 4. Documentos / Licenciamento (NOVO CORRIGIDO)
    documents: (data.documents || []).map((d: any) => ({
      id: String(d.id),
      // Tenta pegar a placa de várias formas para evitar o erro de "carro não encontrado"
      plate: d.placa || d.veiculo_placa || d.vehicle?.placa || "Placa Pendente",
      tipoDoc: d.tipo || d.document_type || "Documento",
      crlv: d.status === "Válido" ? "Válido" : "Pendente", // Lógica simples baseada no status
      ipvaStatus: d.ipva_status || "Em dia",
      licenciamentoStatus: d.status || "Regular",
      vencimento: d.vencimento || d.expiry_date || d.validade || null,
    })),

    summary: {
      totalCost: data.summary?.totalCost || 0,
      totalIncidents: data.summary?.totalIncidents || 0,
      totalMaintenances: data.summary?.totalMaintenances || 0,
      analysisText: data.summary?.analysisText || "Dados insuficientes.",
    },
  };
}

export async function buscarDadosRelatorioAPI(filtros: ReportFilter) {
  const query = new URLSearchParams({
    startDate: filtros.startDate,
    endDate: filtros.endDate,
    vehiclePlate: filtros.vehiclePlate,
  }).toString();

  const response = await fetch(`${API_BASE_URL}/reports/data?${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Erro ao carregar dados do relatório");

  const rawData = await response.json();
  return adapterRelatorio(rawData);
}

export async function salvarRelatorioGeradoAPI(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/reports/upload`, {
    method: "POST",
    body: formData, // Envia arquivo + metadados
  });

  if (!response.ok) throw new Error("Erro ao arquivar relatório no sistema");
  return response.json();
}

// FUNÇÃO: Salvar Histórico (Metadata)
export async function salvarRelatorioHistoricoAPI(dadosRelatorio: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      // Endpoint POST para salvar no banco
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosRelatorio),
    });
    return await response.json();
  } catch (error) {
    console.error("Erro ao salvar histórico:", error);
    return null;
  }
}

// Adicione esta função para buscar a lista de relatórios do banco
export async function buscarHistoricoRelatoriosAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = await response.json();

    // Adaptador simples para garantir que os campos batam com a interface do Front
    return data.map((r: any) => ({
      id: r.id,
      dataGeracao: r.created_at || r.data_geracao, // Ajuste conforme seu banco
      horaGeracao:
        r.hora_geracao ||
        new Date(r.created_at).toLocaleTimeString() ||
        "00:00",
      periodoInicio: r.periodo_inicio,
      periodoFim: r.periodo_fim,
      veiculos: r.veiculos_ids || [], // Pode precisar de ajuste se o banco retornar apenas IDs
      conteudo: {
        multas: true, // Ou mapear de r.tipo se houver essa info detalhada
        licenciamento: true,
        manutencoes: true,
        sinistros: true,
      },
      // Se o backend salvar o resumo financeiro, mapear aqui:
      totalMultas: r.resumo_financeiro?.multas || 0,
      totalManutencoes: r.resumo_financeiro?.manutencoes || 0,
      totalSinistros: r.resumo_financeiro?.sinistros || 0,
      quantidadeMultas: 0, // Campos opcionais para visualização rápida
      quantidadeManutencoes: 0,
      quantidadeSinistros: 0,
      docHash: r.id.toString().substring(0, 8).toUpperCase(), // Gera um hash visual se não tiver
      geradoPor: r.criado_por || "Sistema",
    }));
  } catch (error) {
    console.error("Erro ao buscar histórico de relatórios:", error);
    return [];
  }
}

// --- MÓDULO: MULTAS ---

export async function buscarMultasAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/fines`, {
      cache: "no-store",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao buscar multas:", error);
    return [];
  }
}

export async function salvarMultaAPI(multa: any) {
  const response = await fetch(`${API_BASE_URL}/fines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(multa),
  });
  return handleResponse(response);
}

export async function atualizarStatusMultaAPI(id: number, status: string) {
  const response = await fetch(`${API_BASE_URL}/fines/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

// --- MÓDULO: DOCUMENTOS ---

export async function buscarDocumentosAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      cache: "no-store",
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);
    return [];
  }
}

// --- MÓDULO DE INCIDENTES (SINISTROS) ---

export async function buscarIncidentesAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents`, {
      cache: "no-store",
    });
    if (!response.ok) return [];

    const dadosBrutos = await response.json();

    // Aplica o adaptador para cada item da lista
    if (Array.isArray(dadosBrutos)) {
      return dadosBrutos.map(adapterIncidente);
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar incidentes:", error);
    return [];
  }
}

// Nota: Agora recebe FormData para upload de fotos
export async function salvarIncidenteAPI(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    body: formData, // Envia o FormData diretamente (sem JSON.stringify)
  });

  if (!response.ok) throw new Error("Erro ao salvar incidente");

  const novoRegistro = await response.json();
  // Retorna o dado adaptado (incluindo fotos) para aparecer na tela imediatamente
  return adapterIncidente(novoRegistro);
}

// Adicione esta função logo abaixo de salvarIncidenteAPI
export async function atualizarStatusIncidenteAPI(id: number, status: string) {
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) throw new Error("Erro ao atualizar status do incidente");
  return response.json(); // Retorna o dado atualizado do backend
}

// função para concluir incidente com upload opcional de nota fiscal
export async function concluirIncidenteAPI(id: number, formData: FormData) {
  // O FormData aqui deve conter o arquivo 'invoice' (opcional)
  const response = await fetch(`${API_BASE_URL}/incidents/${id}/conclude`, {
    method: "PATCH",
    body: formData,
  });

  if (!response.ok) throw new Error("Erro ao concluir incidente");
  const novoRegistro = await response.json();
  return adapterIncidente(novoRegistro);
}

// --- MÓDULO: TACÓGRAFOS (Mock LocalStorage) ---

export const buscarTacografosAPI = async () => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("trl_tachographs");
  return stored ? JSON.parse(stored) : [];
};

export const salvarTacografoAPI = async (dados: any) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const currentData = await buscarTacografosAPI();
  const novoRegistro = {
    id: Date.now(),
    ...dados,
    status: "Enviado",
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(
    "trl_tachographs",
    JSON.stringify([novoRegistro, ...currentData]),
  );
  return novoRegistro;
};

// --- MÓDULO: JORNADA (Mock LocalStorage) ---

export async function buscarJornadaAtualAPI(motoristaId: string) {
  if (typeof window === "undefined") return null;
  const jornadas = JSON.parse(localStorage.getItem("trl_journey") || "[]");
  return (
    jornadas.find((j: any) => j.motoristaId === motoristaId && !j.dataFim) ||
    null
  );
}

export async function registrarPontoJornadaAPI(dados: any) {
  return { success: true };
}

// CAMPO DE CONFIGURAÇÕES GERAIS

// --- MÓDULO: FUNCIONÁRIOS / LOGIN ---
export async function cadastrarFuncionarioAPI(driverForm: any) {
  // Converter campos camelCase do formulário para snake_case do banco/DTO
  const payload = {
    name: driverForm.name,
    cpf: driverForm.cpf,
    rg: driverForm.rg,
    birth_date: driverForm.birthDate || null,
    phone: driverForm.phone,
    email: driverForm.email,
    address: driverForm.address,
    city: driverForm.city,
    state: driverForm.state,
    zip_code: driverForm.zipCode,
    cnh: driverForm.cnh,
    cnh_category: driverForm.cnhCategory,
    cnh_expiry: driverForm.cnhExpiry || null,
    mopp: driverForm.mopp,
    mopp_expiry: driverForm.moppExpiry || null,
    admission_date: driverForm.admissionDate || null,
    branch: driverForm.branch,
    password: driverForm.password,
    role: "Motorista", // Define padrão como Motorista pelo formulário
  };

  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao cadastrar funcionário");
  }
  return response.json();
}

export async function loginAPI(credentials: any) {
  const response = await fetch(`${API_BASE_URL}/employees/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) throw new Error("Credenciais inválidas");
  return response.json();
}

// Função para atualizar dados do funcionário
export async function atualizarFuncionarioAPI(id: string | number, dados: any) {
  // Mapear dados do form (camelCase) para o banco (snake_case)
  const payload = {
    name: dados.name,
    cpf: dados.cpf,
    rg: dados.rg,
    birth_date: dados.birthDate || null,
    phone: dados.phone,
    email: dados.email,
    address: dados.address,
    city: dados.city,
    state: dados.state,
    zip_code: dados.zipCode,
    cnh: dados.cnh,
    cnh_category: dados.cnhCategory,
    cnh_expiry: dados.cnhExpiry || null,
    mopp: dados.mopp,
    mopp_expiry: dados.moppExpiry || null,
    admission_date: dados.admissionDate || null,
    branch: dados.branch,
    role: dados.role || "Motorista",
  };

  // Só envia senha se o usuário digitou uma nova
  if (dados.password && dados.password.length > 0) {
    Object.assign(payload, { password: dados.password });
  }

  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = "Erro ao atualizar funcionário";
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export async function excluirFuncionarioAPI(id: string | number) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Erro ao excluir: ${response.statusText}`);
  }

  return response.json();
}

export async function listarFuncionariosAPI() {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Erro ao listar: ${response.statusText}`);
  }

  return response.json();
}

// --- MÓDULO: JORNADA ---

export async function iniciarJornadaAPI(dados: {
  driverId: number;
  vehicleId: number;
  startLocation: string;
  startOdometer: number;
  checklist: any;
}) {
  const response = await fetch(`${API_BASE_URL}/journeys`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function buscarJornadaAtivaAPI(motoristaId: number | string) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/journeys/active/${motoristaId}`,
      {
        cache: "no-store",
        headers: buildHeaders(),
      },
    );

    // Se não encontrar jornada ativa (retorno vazio ou 404), retornamos null
    if (!response.ok) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Erro ao buscar jornada ativa:", error);
    return null;
  }
}

export async function registrarEventoJornadaAPI(dados: {
  journeyId: number;
  type: string;
  location?: string;
}) {
  // types: 'start_rest', 'end_rest', 'start_meal', 'end_meal', etc.
  const response = await fetch(`${API_BASE_URL}/journeys/events`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

export async function finalizarJornadaAPI(
  journeyId: number,
  dados: {
    endLocation: string;
    endOdometer: number;
    checklist: any;
  },
) {
  const response = await fetch(`${API_BASE_URL}/journeys/${journeyId}/finish`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify(dados),
  });
  return handleResponse(response);
}

// Função utilitária para retornar mensagem padrão quando não houver dados
export function naoTiver(dado: any, mensagem = "NÃO TIVER") {
  if (
    dado === undefined ||
    dado === null ||
    (Array.isArray(dado) && dado.length === 0) ||
    (typeof dado === "string" && dado.trim() === "")
  ) {
    return mensagem;
  }
  return dado;
}

// --- MÓDULO: MONITORAMENTO DE JORNADAS (ADMIN) ---

export interface JornadaMonitoramento {
  id: number;
  driverId: number;
  driverName: string;
  driverPhoto?: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleModel: string;
  status:
    | "pending_approval"
    | "active"
    | "resting"
    | "meal"
    | "finished"
    | "cancelled";
  startTime: string;
  startLocation: string;
  currentLocation?: string;
  checklistItems?: Record<string, boolean>;
  checklistNotes?: string;
  rejectedItems?: string[];
}

// Adaptador para converter dados do banco para o frontend
function adapterJornadaMonitoramento(data: any): JornadaMonitoramento {
  // Processa itens rejeitados do checklist
  let rejectedItems: string[] = [];
  if (data.checklist?.items) {
    rejectedItems = Object.entries(data.checklist.items)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
  }

  return {
    id: data.id,
    driverId: data.driver_id || data.driverId,
    driverName: data.driver?.name || data.driverName || "Motorista",
    driverPhoto: data.driver?.photo || data.driverPhoto,
    vehicleId: data.vehicle_id || data.vehicleId,
    vehiclePlate: data.vehicle?.placa || data.vehiclePlate || "N/A",
    vehicleModel: data.vehicle?.modelo
      ? `${data.vehicle.marca} ${data.vehicle.modelo}`
      : data.vehicleModel || "N/A",
    status: data.status,
    startTime: data.start_time || data.startTime || data.created_at,
    startLocation: data.start_location || data.startLocation || "N/A",
    currentLocation: data.current_location || data.currentLocation,
    checklistItems: data.checklist?.items,
    checklistNotes: data.checklist?.notes,
    rejectedItems,
  };
}

// Buscar todas as jornadas ativas para o painel de monitoramento
export async function buscarJornadasMonitoramentoAPI(): Promise<
  JornadaMonitoramento[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}/journeys/monitoring`, {
      method: "GET",
      headers: buildHeaders(),
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data.map(adapterJornadaMonitoramento) : [];
  } catch (error) {
    console.error("Erro ao buscar jornadas para monitoramento:", error);
    return [];
  }
}

// Buscar historico de jornadas finalizadas do dia
export async function buscarHistoricoJornadasDiaAPI(): Promise<
  JornadaMonitoramento[]
> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(
      `${API_BASE_URL}/journeys/history?date=${today}`,
      {
        method: "GET",
        headers: buildHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data.map(adapterJornadaMonitoramento) : [];
  } catch (error) {
    console.error("Erro ao buscar historico de jornadas:", error);
    return [];
  }
}

// Autorizar jornada com risco (libera motorista com checklist reprovado)
export async function autorizarJornadaComRiscoAPI(
  journeyId: number,
  adminNotes?: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/journeys/${journeyId}/authorize`,
    {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify({
        status: "active",
        adminNotes,
        authorizedWithRisk: true,
      }),
    },
  );
  return handleResponse(response);
}

// Bloquear jornada e solicitar manutencao
export async function bloquearJornadaAPI(journeyId: number, reason: string) {
  const response = await fetch(`${API_BASE_URL}/journeys/${journeyId}/block`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify({
      status: "cancelled",
      blockReason: reason,
      createMaintenance: true,
    }),
  });
  return handleResponse(response);
}

// Buscar status da jornada do motorista (para polling)
export async function buscarStatusJornadaAPI(
  journeyId: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/journeys/${journeyId}/status`,
      {
        method: "GET",
        headers: buildHeaders(),
        cache: "no-store",
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error("Erro ao buscar status da jornada:", error);
    return null;
  }
}

// API Service - Conexão Real com Backend NestJS e Adapters
