// API Service para consulta de veículos no DETRAN
// Esta função simula uma chamada à API do DETRAN para buscar dados do veículo pela placa

const API_BASE_URL = "http://localhost:3001"

export interface VeiculoAPIResponse {
  placa: string
  marca_modelo: string
  ano_fabricacao: number
  ano_modelo: number
  cor: string
  renavam: string
  chassi: string
  combustivel: string
  potencia: string
  cilindradas: string
  tipo_veiculo: string
  especie: string
  categoria: string
  municipio: string
  uf: string
}

export interface VeiculoDetran {
  placa: string
  renavam: string
  marca_modelo: string
  ano_fabricacao: number
  multas_vencidas: number
  status_licenciamento: string
  restricoes: string[]
}

export async function consultarDetranAPI(placa: string, renavam: string): Promise<VeiculoDetran> {
  try {
    const response = await fetch(`${API_BASE_URL}/detran/consultar?placa=${placa}&renavam=${renavam}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao comunicar com o servidor")
    }

    return await response.json()
  } catch (error) {
    console.error("Erro na API:", error)
    throw error
  }
}

// Função que simula a consulta à API do DETRAN (mock local)
// Em produção, substituir pela chamada real à API
export async function consultarVeiculoAPI(placa: string, cpfCnpj?: string): Promise<VeiculoAPIResponse> {
  // Simula delay de rede (1-2 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

  // Remove caracteres especiais da placa
  const placaLimpa = placa.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  // Valida formato da placa (3 letras + 4 números ou formato Mercosul)
  const placaAntigaRegex = /^[A-Z]{3}[0-9]{4}$/
  const placaMercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

  if (!placaAntigaRegex.test(placaLimpa) && !placaMercosulRegex.test(placaLimpa)) {
    throw new Error("Formato de placa inválido. Use ABC-1234 ou ABC1D23.")
  }

  // Simula algumas placas conhecidas para teste
  const veiculosMock: Record<string, VeiculoAPIResponse> = {
    ABC1234: {
      placa: "ABC-1234",
      marca_modelo: "VOLVO/FH 540",
      ano_fabricacao: 2022,
      ano_modelo: 2023,
      cor: "BRANCA",
      renavam: "12345678901",
      chassi: "9BWHE21JX24060001",
      combustivel: "DIESEL",
      potencia: "540cv",
      cilindradas: "12800",
      tipo_veiculo: "CAMINHAO TRATOR",
      especie: "CARGA",
      categoria: "PARTICULAR",
      municipio: "SAO PAULO",
      uf: "SP",
    },
    DEF5678: {
      placa: "DEF-5678",
      marca_modelo: "SCANIA/R450",
      ano_fabricacao: 2021,
      ano_modelo: 2021,
      cor: "AZUL",
      renavam: "98765432101",
      chassi: "9BSR4X2Z0H4000002",
      combustivel: "DIESEL",
      potencia: "450cv",
      cilindradas: "12700",
      tipo_veiculo: "CAMINHAO TRATOR",
      especie: "CARGA",
      categoria: "PARTICULAR",
      municipio: "SAO PAULO",
      uf: "SP",
    },
    GHI9012: {
      placa: "GHI-9012",
      marca_modelo: "MERCEDES-BENZ/ACTROS 2651",
      ano_fabricacao: 2023,
      ano_modelo: 2024,
      cor: "PRATA",
      renavam: "11223344556",
      chassi: "WDB96340310000003",
      combustivel: "DIESEL",
      potencia: "510cv",
      cilindradas: "12800",
      tipo_veiculo: "CAMINHAO TRATOR",
      especie: "CARGA",
      categoria: "PARTICULAR",
      municipio: "CAMPINAS",
      uf: "SP",
    },
  }

  // Verifica se a placa está nos mocks
  if (veiculosMock[placaLimpa]) {
    return veiculosMock[placaLimpa]
  }

  // Para placas não conhecidas, gera dados simulados
  // Em produção, aqui seria feita a chamada real à API
  const marcas = ["VOLVO", "SCANIA", "MERCEDES-BENZ", "DAF", "IVECO", "MAN"]
  const modelos = ["FH 540", "R450", "ACTROS 2651", "XF 480", "S-WAY 480", "TGX 29.480"]
  const cores = ["BRANCA", "AZUL", "PRATA", "VERMELHA", "PRETA"]

  const marcaIndex = Math.floor(Math.random() * marcas.length)

  return {
    placa: `${placaLimpa.slice(0, 3)}-${placaLimpa.slice(3)}`,
    marca_modelo: `${marcas[marcaIndex]}/${modelos[marcaIndex]}`,
    ano_fabricacao: 2020 + Math.floor(Math.random() * 5),
    ano_modelo: 2021 + Math.floor(Math.random() * 4),
    cor: cores[Math.floor(Math.random() * cores.length)],
    renavam: String(Math.floor(10000000000 + Math.random() * 90000000000)),
    chassi: `9BW${placaLimpa}${String(Math.floor(100000 + Math.random() * 900000))}`,
    combustivel: "DIESEL",
    potencia: `${400 + Math.floor(Math.random() * 150)}cv`,
    cilindradas: "12800",
    tipo_veiculo: "CAMINHAO TRATOR",
    especie: "CARGA",
    categoria: "PARTICULAR",
    municipio: "SAO PAULO",
    uf: "SP",
  }
}
