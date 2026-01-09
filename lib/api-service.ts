// Define o endereço do seu Back-end (NestJS)
const API_BASE_URL = 'http://localhost:3001';

export interface VeiculoDetran {
  placa: string;
  renavam: string;
  marca_modelo: string;
  ano_fabricacao: number;
  multas_vencidas: number;
  status_licenciamento: string;
  restricoes: string[];
}

// Função para buscar dados do Detran via nossa API
export async function consultarVeiculoAPI(placa: string, renavam: string): Promise<VeiculoDetran> {
  try {
    const response = await fetch(`${API_BASE_URL}/detran/consultar?placa=${placa}&renavam=${renavam}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao comunicar com o servidor');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na API:', error);
    throw error;
  }
}