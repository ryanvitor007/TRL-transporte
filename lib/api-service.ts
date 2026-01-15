// API Service - Conexão Real com Backend NestJS e Adapters

const API_BASE_URL = "http://localhost:3001";

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
  renavam: string
): Promise<VeiculoDetran> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/detran/consultar?placa=${placa}&renavam=${renavam}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Erro ao consultar DETRAN:", error);
    throw error;
  }
}

export async function consultarVeiculoAPI(placa: string, cpfCnpj?: string) {
  console.warn(
    "Atenção: Consulta direta por placa requer RENAVAM na API real."
  );
  return { placa, marca_modelo: "Consulte via Detran para detalhes" };
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
    JSON.stringify([novoRegistro, ...currentData])
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
