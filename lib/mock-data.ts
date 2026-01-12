// Mock data para simular resposta do backend
// ATUALIZADO: Agora alinhado com o Banco de Dados (PostgreSQL/Supabase)

export type Branch = "São Paulo" | "Recife" | "Piauí";

export interface Vehicle {
  id: number | string;
  modelo: string;
  placa: string;
  ano: number;
  km_atual: number;
  status: "Ativo" | "Em Oficina" | "Problema Documental";
  renavam?: string;
  data_cadastro?: string | Date;

  // Novos campos obrigatórios para o novo modal
  chassi?: string;
  proxima_manutencao?: string; // Data ISO
  cor?: string;
  combustivel?: string;

  // Campos legados (opcionais para não quebrar outras partes)
  lastMaintenance?: string;
  nextMaintenance?: string;
  nextMaintenanceMileage?: number;
  branch?: Branch;
}

// Nova interface para suportar Múltiplas Tags (Sem Parar / Itaú)
// Em lib/mock-data.ts

// 1. Adicione a interface TollTag se não existir
// Em lib/mock-data.ts

export interface TollTag {
  provider: "Sem Parar" | "Tag Itaú" | "Veloe" | "Outro";
  tag: string;
  status: "Ativo" | "Inativo" | "Bloqueado";
  balance: number;
  monthlySpend: number;
  lastUpdate: string;
  updateMethod?: string; 
}

// 2. Substitua a interface Document inteira por esta:
export interface Document {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  type: "IPVA" | "Licenciamento" | "Seguro" | "CRLV";
  expirationDate: string;
  status: "Válido" | "Vencendo" | "Vencido";
  renavam?: string;
  valor?: number;
  parcelas?: number;
  parcelasPagas?: number;
  detranUrl?: string;
  branch: Branch;
  tollTag?: TollTag; // Novo campo para Tag de Pedágio
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  type: string;
  scheduledDate: string;
  scheduledMileage: number;
  status: "Urgente" | "Agendada" | "Concluída";
  description: string;
  branch: Branch;
}

export interface Fine {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  description: string;
  value: number;
  status: "Pendente" | "Paga" | "Recurso";
  autoInfracao?: string;
  local?: string;
  pontos?: number;
  prazoRecurso?: string;
  detranUrl?: string;
  branch: Branch;
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  cnh: string;
  cnhExpiry: string;
  branch: Branch;
}

export interface TrafficFine {
  id: string;
  vehiclePlate: string;
  driverName: string;
  infractionDate: string;
  description: string; // Ex: Excesso de velocidade
  amount: number;
  points: number;
  status: "Pendente" | "Pago" | "Em Recurso" | "Vencido";
  dueDate: string; // Vencimento do boleto
  location: string;
}

export const mockDrivers: Driver[] = [
  {
    id: "d1",
    name: "João Pereira",
    cpf: "123.456.789-00",
    cnh: "12345678901",
    cnhExpiry: "2027-05-15",
    branch: "São Paulo",
  },
  {
    id: "d2",
    name: "Carlos Silva",
    cpf: "234.567.890-11",
    cnh: "23456789012",
    cnhExpiry: "2026-08-20",
    branch: "São Paulo",
  },
  {
    id: "d3",
    name: "Roberto Mendes",
    cpf: "345.678.901-22",
    cnh: "34567890123",
    cnhExpiry: "2028-01-10",
    branch: "Recife",
  },
  {
    id: "d4",
    name: "Antonio Costa",
    cpf: "456.789.012-33",
    cnh: "45678901234",
    cnhExpiry: "2026-11-30",
    branch: "Recife",
  },
  {
    id: "d5",
    name: "Marcos Oliveira",
    cpf: "567.890.123-44",
    cnh: "56789012345",
    cnhExpiry: "2027-03-25",
    branch: "Piauí",
  },
  {
    id: "d6",
    name: "Paulo Santos",
    cpf: "678.901.234-55",
    cnh: "67890123456",
    cnhExpiry: "2028-06-18",
    branch: "Piauí",
  },
];

export const mockVehicles: Vehicle[] = [
  {
    id: 1,
    modelo: "Volvo FH 540",
    placa: "ABC-1234",
    ano: 2022,
    km_atual: 125000,
    status: "Ativo",
    renavam: "12345678900",
    chassi: "9BWZZZ377VT004251",
    proxima_manutencao: "2026-02-15",
    data_cadastro: "2024-01-01T10:00:00Z",
    branch: "São Paulo",
    lastMaintenance: "2025-12-15",
  },
  {
    id: 2,
    modelo: "Scania R450",
    placa: "DEF-5678",
    ano: 2021,
    km_atual: 180000,
    status: "Em Oficina",
    renavam: "09876543211",
    chassi: "9BWZZZ377VT004252",
    proxima_manutencao: "2026-01-20",
    data_cadastro: "2024-02-15T14:30:00Z",
    branch: "São Paulo",
    lastMaintenance: "2025-11-20",
  },
  {
    id: 3,
    modelo: "Mercedes Actros",
    placa: "GHI-9012",
    ano: 2023,
    km_atual: 45000,
    status: "Ativo",
    renavam: "11223344556",
    chassi: "9BWZZZ377VT004253",
    proxima_manutencao: "2026-03-05",
    data_cadastro: "2024-03-10T09:00:00Z",
    branch: "Recife",
    lastMaintenance: "2026-01-05",
  },
  {
    id: 4,
    modelo: "DAF XF",
    placa: "JKL-3456",
    ano: 2020,
    km_atual: 220000,
    status: "Problema Documental",
    renavam: "99887766554",
    chassi: "9BWZZZ377VT004254",
    proxima_manutencao: "2025-12-10",
    data_cadastro: "2023-11-05T16:20:00Z",
    branch: "Recife",
    lastMaintenance: "2025-10-10",
  },
  {
    id: 5,
    modelo: "Iveco S-Way",
    placa: "MNO-7891",
    ano: 2022,
    km_atual: 98000,
    status: "Ativo",
    renavam: "55443322110",
    chassi: "9BWZZZ377VT004255",
    proxima_manutencao: "2026-02-28",
    data_cadastro: "2024-05-20T11:00:00Z",
    branch: "Piauí",
    lastMaintenance: "2025-12-28",
  },
  {
    id: 6,
    modelo: "Volvo FH 460",
    placa: "PQR-2345",
    ano: 2021,
    km_atual: 156000,
    status: "Ativo",
    renavam: "66778899001",
    chassi: "9BWZZZ377VT004256",
    proxima_manutencao: "2026-01-30",
    data_cadastro: "2024-01-25T13:45:00Z",
    branch: "Piauí",
    lastMaintenance: "2025-11-30",
  },
];

export const mockDocuments: Document[] = [
  {
    id: "1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    type: "IPVA",
    expirationDate: "2026-01-15",
    status: "Vencendo",
    renavam: "00123456789",
    valor: 4850.0,
    parcelas: 3,
    parcelasPagas: 0,
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/pagamentoIPVA",
    branch: "São Paulo",
  },
  {
    id: "2",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    type: "Licenciamento",
    expirationDate: "2026-03-20",
    status: "Válido",
    renavam: "00123456789",
    valor: 181.35,
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/licenciamentoAnual",
    branch: "São Paulo",
  },
  {
    id: "3",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    type: "Seguro",
    expirationDate: "2026-01-10",
    status: "Vencendo",
    renavam: "00987654321",
    valor: 12500.0,
    detranUrl: "https://www.susep.gov.br/",
    branch: "São Paulo",
  },
  {
    id: "4",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    type: "CRLV",
    expirationDate: "2025-12-20",
    status: "Vencido",
    renavam: "00456789123",
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/crlve",
    branch: "Recife",
  },
  {
    id: "5",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    type: "Licenciamento",
    expirationDate: "2025-12-25",
    status: "Vencido",
    renavam: "00456789123",
    valor: 181.35,
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/licenciamentoAnual",
    branch: "Recife",
  },
  {
    id: "6",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    type: "IPVA",
    expirationDate: "2026-02-15",
    status: "Válido",
    renavam: "00321654987",
    valor: 5200.0,
    parcelas: 3,
    parcelasPagas: 3,
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/fichaservico/pagamentoIPVA",
    branch: "Recife",
  },
];

export const mockMaintenances: Maintenance[] = [
  {
    id: "1",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    vehicleModel: "DAF XF",
    type: "Troca de Óleo",
    scheduledDate: "2025-12-10",
    scheduledMileage: 230000,
    status: "Urgente",
    description: "Manutenção preventiva - troca de óleo e filtros",
    branch: "Recife",
  },
  {
    id: "2",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    type: "Revisão Geral",
    scheduledDate: "2026-01-20",
    scheduledMileage: 190000,
    status: "Agendada",
    description: "Revisão completa de 180.000km",
    branch: "São Paulo",
  },
  {
    id: "3",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    type: "Troca de Pneus",
    scheduledDate: "2026-02-15",
    scheduledMileage: 135000,
    status: "Agendada",
    description: "Substituição dos pneus dianteiros",
    branch: "São Paulo",
  },
  {
    id: "4",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    vehicleModel: "Mercedes Actros",
    type: "Alinhamento",
    scheduledDate: "2026-01-05",
    scheduledMileage: 55000,
    status: "Concluída",
    description: "Alinhamento e balanceamento",
    branch: "Recife",
  },
  {
    id: "5",
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    vehicleModel: "Iveco S-Way",
    type: "Freios",
    scheduledDate: "2026-01-18",
    scheduledMileage: 100000,
    status: "Agendada",
    description: "Revisão do sistema de freios",
    branch: "Piauí",
  },
];

export const mockFines: Fine[] = [
  {
    id: "1",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    date: "2025-11-14",
    description: "Excesso de velocidade - 20% acima",
    value: 195.23,
    status: "Pendente",
    autoInfracao: "AA00123456",
    local: "Rod. Anhanguera, km 45 - São Paulo/SP",
    pontos: 5,
    prazoRecurso: "2026-01-14",
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/infracoes",
    branch: "São Paulo",
  },
  {
    id: "2",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    date: "2025-10-27",
    description: "Estacionamento irregular",
    value: 88.38,
    status: "Paga",
    autoInfracao: "AA00789012",
    local: "Rua Augusta, 500 - São Paulo/SP",
    pontos: 3,
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/infracoes",
    branch: "Recife",
  },
  {
    id: "3",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-12-04",
    description: "Avanço de sinal vermelho",
    value: 293.47,
    status: "Recurso",
    autoInfracao: "AA00345678",
    local: "Av. Paulista, 1000 - São Paulo/SP",
    pontos: 7,
    prazoRecurso: "2026-02-04",
    detranUrl:
      "https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/infracoes",
    branch: "São Paulo",
  },
];

// Função para calcular o rodízio de SP
export function getPlateRestriction(): {
  blockedEndings: number[];
  dayName: string;
} {
  const today = new Date();
  const dayOfWeek = today.getDay();

  const restrictions: Record<number, number[]> = {
    1: [1, 2], // Segunda-feira
    2: [3, 4], // Terça-feira
    3: [5, 6], // Quarta-feira
    4: [7, 8], // Quinta-feira
    5: [9, 0], // Sexta-feira
    0: [], // Domingo
    6: [], // Sábado
  };

  const dayNames: Record<number, string> = {
    0: "Domingo",
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
    6: "Sábado",
  };

  return {
    blockedEndings: restrictions[dayOfWeek],
    dayName: dayNames[dayOfWeek],
  };
}

export function getVehiclesInRotation(vehicles: Vehicle[]): Vehicle[] {
  const { blockedEndings } = getPlateRestriction();

  return vehicles.filter((vehicle) => {
    // CORREÇÃO 2: Agora busca .placa em vez de .plate
    const lastDigit = Number.parseInt(vehicle.placa.slice(-1));
    return blockedEndings.includes(lastDigit);
  });
}

// ========== FINANCIALS & TCO ==========
export interface FuelEntry {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
  efficiency: number; // Km/L
  hasAnomaly: boolean;
  branch: Branch;
}

export interface MonthlyCost {
  month: string;
  fuel: number;
  maintenance: number;
  tires: number;
  insurance: number;
  total: number;
  branch: Branch;
}

export interface VehicleTCO {
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  purchaseValue: number;
  currentFipeValue: number;
  cumulativeMaintenanceCost: number;
  cumulativeFuelCost: number;
  depreciationPercent: number;
  branch: Branch;
}

export const mockFuelEntries: FuelEntry[] = [
  {
    id: "1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2026-01-05",
    liters: 320,
    cost: 1856.0,
    odometer: 125000,
    efficiency: 2.8,
    hasAnomaly: false,
    branch: "São Paulo",
  },
  {
    id: "2",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    date: "2026-01-04",
    liters: 280,
    cost: 1624.0,
    odometer: 180000,
    efficiency: 1.9,
    hasAnomaly: true,
    branch: "São Paulo",
  },
  {
    id: "3",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    date: "2026-01-06",
    liters: 150,
    cost: 870.0,
    odometer: 45000,
    efficiency: 3.2,
    hasAnomaly: false,
    branch: "Recife",
  },
  {
    id: "4",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-12-28",
    liters: 310,
    cost: 1798.0,
    odometer: 124100,
    efficiency: 2.9,
    hasAnomaly: false,
    branch: "São Paulo",
  },
  {
    id: "5",
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    date: "2026-01-03",
    liters: 200,
    cost: 1160.0,
    odometer: 98000,
    efficiency: 2.6,
    hasAnomaly: false,
    branch: "Piauí",
  },
  {
    id: "6",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    date: "2026-01-02",
    liters: 350,
    cost: 2030.0,
    odometer: 220000,
    efficiency: 2.1,
    hasAnomaly: true,
    branch: "Recife",
  },
];

export const mockMonthlyCosts: MonthlyCost[] = [
  // São Paulo
  {
    month: "Ago/25",
    fuel: 25000,
    maintenance: 8000,
    tires: 5000,
    insurance: 3000,
    total: 41000,
    branch: "São Paulo",
  },
  {
    month: "Set/25",
    fuel: 27000,
    maintenance: 5500,
    tires: 2000,
    insurance: 3000,
    total: 37500,
    branch: "São Paulo",
  },
  {
    month: "Out/25",
    fuel: 29000,
    maintenance: 9000,
    tires: 7000,
    insurance: 3000,
    total: 48000,
    branch: "São Paulo",
  },
  {
    month: "Nov/25",
    fuel: 26000,
    maintenance: 6000,
    tires: 2500,
    insurance: 3000,
    total: 37500,
    branch: "São Paulo",
  },
  {
    month: "Dez/25",
    fuel: 30000,
    maintenance: 11000,
    tires: 3500,
    insurance: 3000,
    total: 47500,
    branch: "São Paulo",
  },
  {
    month: "Jan/26",
    fuel: 23000,
    maintenance: 4500,
    tires: 1000,
    insurance: 3000,
    total: 31500,
    branch: "São Paulo",
  },
  // Recife
  {
    month: "Ago/25",
    fuel: 12000,
    maintenance: 2500,
    tires: 2000,
    insurance: 1200,
    total: 17700,
    branch: "Recife",
  },
  {
    month: "Set/25",
    fuel: 13000,
    maintenance: 1800,
    tires: 500,
    insurance: 1200,
    total: 16500,
    branch: "Recife",
  },
  {
    month: "Out/25",
    fuel: 14500,
    maintenance: 4000,
    tires: 3500,
    insurance: 1200,
    total: 23200,
    branch: "Recife",
  },
  {
    month: "Nov/25",
    fuel: 14000,
    maintenance: 2500,
    tires: 1200,
    insurance: 1200,
    total: 18900,
    branch: "Recife",
  },
  {
    month: "Dez/25",
    fuel: 15500,
    maintenance: 5000,
    tires: 1500,
    insurance: 1200,
    total: 23200,
    branch: "Recife",
  },
  {
    month: "Jan/26",
    fuel: 11500,
    maintenance: 2000,
    tires: 600,
    insurance: 1200,
    total: 15300,
    branch: "Recife",
  },
  // Piauí
  {
    month: "Ago/25",
    fuel: 8000,
    maintenance: 1500,
    tires: 1000,
    insurance: 800,
    total: 11300,
    branch: "Piauí",
  },
  {
    month: "Set/25",
    fuel: 8000,
    maintenance: 1200,
    tires: 500,
    insurance: 800,
    total: 10500,
    branch: "Piauí",
  },
  {
    month: "Out/25",
    fuel: 8500,
    maintenance: 2000,
    tires: 1500,
    insurance: 800,
    total: 12800,
    branch: "Piauí",
  },
  {
    month: "Nov/25",
    fuel: 9000,
    maintenance: 1300,
    tires: 800,
    insurance: 800,
    total: 11900,
    branch: "Piauí",
  },
  {
    month: "Dez/25",
    fuel: 9500,
    maintenance: 2000,
    tires: 1000,
    insurance: 800,
    total: 13300,
    branch: "Piauí",
  },
  {
    month: "Jan/26",
    fuel: 7500,
    maintenance: 1000,
    tires: 400,
    insurance: 800,
    total: 9700,
    branch: "Piauí",
  },
];

export const mockVehicleTCO: VehicleTCO[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    purchaseValue: 850000,
    currentFipeValue: 720000,
    cumulativeMaintenanceCost: 95000,
    cumulativeFuelCost: 180000,
    depreciationPercent: 15.3,
    branch: "São Paulo",
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    purchaseValue: 780000,
    currentFipeValue: 580000,
    cumulativeMaintenanceCost: 145000,
    cumulativeFuelCost: 220000,
    depreciationPercent: 25.6,
    branch: "São Paulo",
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    vehicleModel: "Mercedes Actros",
    purchaseValue: 920000,
    currentFipeValue: 850000,
    cumulativeMaintenanceCost: 35000,
    cumulativeFuelCost: 65000,
    depreciationPercent: 7.6,
    branch: "Recife",
  },
  {
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    vehicleModel: "DAF XF",
    purchaseValue: 650000,
    currentFipeValue: 420000,
    cumulativeMaintenanceCost: 180000,
    cumulativeFuelCost: 280000,
    depreciationPercent: 35.4,
    branch: "Recife",
  },
  {
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    vehicleModel: "Iveco S-Way",
    purchaseValue: 720000,
    currentFipeValue: 650000,
    cumulativeMaintenanceCost: 55000,
    cumulativeFuelCost: 95000,
    depreciationPercent: 9.7,
    branch: "Piauí",
  },
  {
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    vehicleModel: "Volvo FH 460",
    purchaseValue: 780000,
    currentFipeValue: 620000,
    cumulativeMaintenanceCost: 98000,
    cumulativeFuelCost: 165000,
    depreciationPercent: 20.5,
    branch: "Piauí",
  },
];

// ========== TIRE MANAGEMENT ==========
export interface Tire {
  id: string;
  position: "FL" | "FR" | "RL" | "RR";
  brand: string;
  model: string;
  treadDepth: number;
  installDate: string;
  mileageAtInstall: number;
}

export interface VehicleTires {
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  tires: Tire[];
  branch: Branch;
}

export interface TireRotation {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  description: string;
  mileage: number;
  branch: Branch;
}

export interface SpareTire {
  id: string;
  brand: string;
  model: string;
  size: string;
  quantity: number;
  condition: "Novo" | "Usado - Bom" | "Usado - Regular";
  branch: Branch;
}

export const mockVehicleTires: VehicleTires[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    branch: "São Paulo",
    tires: [
      {
        id: "t1",
        position: "FL",
        brand: "Michelin",
        model: "X Line Energy",
        treadDepth: 6.5,
        installDate: "2025-08-15",
        mileageAtInstall: 100000,
      },
      {
        id: "t2",
        position: "FR",
        brand: "Michelin",
        model: "X Line Energy",
        treadDepth: 6.2,
        installDate: "2025-08-15",
        mileageAtInstall: 100000,
      },
      {
        id: "t3",
        position: "RL",
        brand: "Michelin",
        model: "X Line Energy",
        treadDepth: 4.8,
        installDate: "2025-06-10",
        mileageAtInstall: 85000,
      },
      {
        id: "t4",
        position: "RR",
        brand: "Michelin",
        model: "X Line Energy",
        treadDepth: 4.5,
        installDate: "2025-06-10",
        mileageAtInstall: 85000,
      },
    ],
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    branch: "São Paulo",
    tires: [
      {
        id: "t5",
        position: "FL",
        brand: "Continental",
        model: "HSR2",
        treadDepth: 2.8,
        installDate: "2025-03-20",
        mileageAtInstall: 140000,
      },
      {
        id: "t6",
        position: "FR",
        brand: "Continental",
        model: "HSR2",
        treadDepth: 2.5,
        installDate: "2025-03-20",
        mileageAtInstall: 140000,
      },
      {
        id: "t7",
        position: "RL",
        brand: "Continental",
        model: "HDR2",
        treadDepth: 1.4,
        installDate: "2025-01-10",
        mileageAtInstall: 120000,
      },
      {
        id: "t8",
        position: "RR",
        brand: "Continental",
        model: "HDR2",
        treadDepth: 1.2,
        installDate: "2025-01-10",
        mileageAtInstall: 120000,
      },
    ],
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    vehicleModel: "Mercedes Actros",
    branch: "Recife",
    tires: [
      {
        id: "t9",
        position: "FL",
        brand: "Bridgestone",
        model: "R249",
        treadDepth: 8.2,
        installDate: "2025-11-01",
        mileageAtInstall: 40000,
      },
      {
        id: "t10",
        position: "FR",
        brand: "Bridgestone",
        model: "R249",
        treadDepth: 8.0,
        installDate: "2025-11-01",
        mileageAtInstall: 40000,
      },
      {
        id: "t11",
        position: "RL",
        brand: "Bridgestone",
        model: "R249",
        treadDepth: 7.5,
        installDate: "2025-11-01",
        mileageAtInstall: 40000,
      },
      {
        id: "t12",
        position: "RR",
        brand: "Bridgestone",
        model: "R249",
        treadDepth: 7.8,
        installDate: "2025-11-01",
        mileageAtInstall: 40000,
      },
    ],
  },
];

export const mockTireRotations: TireRotation[] = [
  {
    id: "r1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-10-20",
    description: "Rodízio dianteiros para traseiros",
    mileage: 115000,
    branch: "São Paulo",
  },
  {
    id: "r2",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-08-15",
    description: "Troca dos pneus dianteiros (novos)",
    mileage: 100000,
    branch: "São Paulo",
  },
  {
    id: "r3",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    date: "2025-06-05",
    description: "Rodízio cruzado completo",
    mileage: 155000,
    branch: "São Paulo",
  },
  {
    id: "r4",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    date: "2025-11-01",
    description: "Troca de todos os pneus (novos)",
    mileage: 40000,
    branch: "Recife",
  },
];

export const mockSpareTires: SpareTire[] = [
  {
    id: "s1",
    brand: "Michelin",
    model: "X Line Energy",
    size: "295/80 R22.5",
    quantity: 4,
    condition: "Novo",
    branch: "São Paulo",
  },
  {
    id: "s2",
    brand: "Continental",
    model: "HSR2",
    size: "295/80 R22.5",
    quantity: 2,
    condition: "Usado - Bom",
    branch: "São Paulo",
  },
  {
    id: "s3",
    brand: "Bridgestone",
    model: "R249",
    size: "315/80 R22.5",
    quantity: 3,
    condition: "Novo",
    branch: "Recife",
  },
  {
    id: "s4",
    brand: "Pirelli",
    model: "FR01",
    size: "295/80 R22.5",
    quantity: 1,
    condition: "Usado - Regular",
    branch: "Piauí",
  },
];

// Função para obter cor do status do pneu
export function getTireHealthColor(
  treadDepth: number
): "green" | "yellow" | "red" {
  if (treadDepth > 5) return "green";
  if (treadDepth >= 1.6) return "yellow";
  return "red";
}

export function getTireHealthLabel(treadDepth: number): string {
  if (treadDepth > 5) return "Bom";
  if (treadDepth >= 1.6) return "Atenção";
  return "Crítico";
}

// ========== INCIDENTS & CLAIMS ==========
export interface Incident {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  date: string;
  time: string;
  type: "Acidente" | "Avaria" | "Roubo/Furto" | "Colisão Leve";
  description: string;
  location: string;
  status: "Aberto" | "Em Reparo" | "Aguardando Seguro" | "Fechado";
  estimatedCost: number;
  insuranceClaim: boolean;
  photos: string[];
  branch: Branch;
}

export const mockIncidents: Incident[] = [
  {
    id: "i1",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    driverName: "Carlos Silva",
    date: "2025-12-18",
    time: "14:30",
    type: "Colisão Leve",
    description:
      "Colisão lateral com veículo de passeio no estacionamento de carga. Danos na lateral direita da cabine.",
    location: "Rod. Anhanguera, km 45 - Jundiaí/SP",
    status: "Em Reparo",
    estimatedCost: 8500,
    insuranceClaim: true,
    photos: [],
    branch: "São Paulo",
  },
  {
    id: "i2",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    vehicleModel: "DAF XF",
    driverName: "Roberto Mendes",
    date: "2025-11-05",
    time: "08:15",
    type: "Avaria",
    description:
      "Para-brisa trincado por pedra na rodovia. Necessita substituição completa.",
    location: "BR-116, km 220 - Registro/SP",
    status: "Fechado",
    estimatedCost: 2200,
    insuranceClaim: false,
    photos: [],
    branch: "Recife",
  },
  {
    id: "i3",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    driverName: "João Pereira",
    date: "2026-01-02",
    time: "22:45",
    type: "Acidente",
    description:
      "Tombamento parcial ao desviar de animal na pista. Carga parcialmente danificada e danos estruturais no semirreboque.",
    location: "SP-270, km 580 - Presidente Prudente/SP",
    status: "Aguardando Seguro",
    estimatedCost: 45000,
    insuranceClaim: true,
    photos: [],
    branch: "São Paulo",
  },
  {
    id: "i4",
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    vehicleModel: "Iveco S-Way",
    driverName: "Antonio Costa",
    date: "2026-01-06",
    time: "10:00",
    type: "Colisão Leve",
    description:
      "Arranhões na traseira durante manobra de ré no pátio de descarga.",
    location: "Centro de Distribuição - Guarulhos/SP",
    status: "Aberto",
    estimatedCost: 1800,
    insuranceClaim: false,
    photos: [],
    branch: "Piauí",
  },
];

// Função para calcular estatísticas de incidentes
export function getIncidentStats() {
  const open = mockIncidents.filter((i) => i.status === "Aberto").length;
  const inRepair = mockIncidents.filter((i) => i.status === "Em Reparo").length;
  const waitingInsurance = mockIncidents.filter(
    (i) => i.status === "Aguardando Seguro"
  ).length;
  const closed = mockIncidents.filter((i) => i.status === "Fechado").length;
  const totalCost = mockIncidents.reduce((acc, i) => acc + i.estimatedCost, 0);

  return { open, inRepair, waitingInsurance, closed, totalCost };
}

// ========== DOCUMENTS ==========
export interface VehicleDocuments {
  vehicleId: string
  vehiclePlate: string
  renavam: string
  chassi: string
  crlv: string
  crlvExpiry: string
  ipva: {
    valor: number
    parcelas: number
    parcelasPagas: number
    vencimento: string
    status: "Pago" | "Pendente" | "Parcelado"
  }
  licenciamento: { valor: number; vencimento: string; status: "Válido" | "Vencendo" | "Vencido" }
  seguro: {
    seguradora: string
    apolice: string
    cobertura: number
    vigenciaInicio: string
    vigenciaFim: string
    status: "Ativo" | "Vencendo" | "Vencido"
  }
  
  // AQUI ESTÁ A CORREÇÃO: O campo tollTag agora é declarado oficialmente
  tollTag?: TollTag; 

  // Mantemos o antigo como opcional (?) para compatibilidade
  semParar?: { tag: string; saldo: number; mediaGastoMensal: number; ultimoUso: string; ativo: boolean }
  
  branch: Branch 
  
  // Adicione estes campos opcionais também, caso seu código novo os utilize
  id?: string
  type?: string
  expirationDate?: string
  status?: string
}

// Observe que agora usamos 'tollTag' em vez de 'semParar' dentro do objeto document
export const mockVehicleDocuments: VehicleDocuments[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    renavam: "00123456789",
    chassi: "9BWZZZ377VT004251",
    crlv: "SP-2025-1234567",
    crlvExpiry: "2026-12-31",
    ipva: { valor: 4850, parcelas: 3, parcelasPagas: 2, vencimento: "2026-01-15", status: "Parcelado" },
    licenciamento: { valor: 181.35, vencimento: "2026-03-20", status: "Válido" },
    seguro: {
      seguradora: "Porto Seguro",
      apolice: "PS-2025-789456",
      cobertura: 850000,
      vigenciaInicio: "2025-06-01",
      vigenciaFim: "2026-06-01",
      status: "Ativo",
    },
    tollTag: {
      provider: "Sem Parar",
      tag: "SP-001234567",
      status: "Ativo",
      balance: 450.0,
      monthlySpend: 380.0,
      lastUpdate: "2026-01-07",
    },
    branch: "São Paulo",
    id: "1",
    type: "IPVA",
    expirationDate: "2026-01-15",
    status: "Vencendo",
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    renavam: "00987654321",
    chassi: "9BWZZZ377VT004252",
    crlv: "SP-2025-2345678",
    crlvExpiry: "2026-12-31",
    ipva: { valor: 4200, parcelas: 3, parcelasPagas: 3, vencimento: "2026-01-15", status: "Pago" },
    licenciamento: { valor: 181.35, vencimento: "2026-04-15", status: "Válido" },
    seguro: {
      seguradora: "Bradesco Seguros",
      apolice: "BD-2025-456123",
      cobertura: 780000,
      vigenciaInicio: "2025-07-01",
      vigenciaFim: "2026-01-10",
      status: "Vencendo",
    },
    tollTag: {
      provider: "Tag Itaú",
      tag: "IT-987654321",
      status: "Ativo",
      balance: 120.0,
      monthlySpend: 420.0,
      lastUpdate: "2026-01-05",
    },
    branch: "São Paulo",
    id: "2",
    type: "Seguro",
    expirationDate: "2026-01-10",
    status: "Vencendo",
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    renavam: "00321654987",
    chassi: "9BWZZZ377VT004253",
    crlv: "PE-2025-3456789",
    crlvExpiry: "2026-12-31",
    ipva: { valor: 5200, parcelas: 3, parcelasPagas: 3, vencimento: "2026-02-15", status: "Pago" },
    licenciamento: { valor: 181.35, vencimento: "2026-05-10", status: "Válido" },
    seguro: {
      seguradora: "Tokio Marine",
      apolice: "TM-2025-987321",
      cobertura: 920000,
      vigenciaInicio: "2025-11-01",
      vigenciaFim: "2026-11-01",
      status: "Ativo",
    },
    tollTag: {
      provider: "Sem Parar",
      tag: "PE-001234569",
      status: "Ativo",
      balance: 890.0,
      monthlySpend: 290.0,
      lastUpdate: "2026-01-06",
    },
    branch: "Recife",
    id: "3",
    type: "IPVA",
    expirationDate: "2026-02-15",
    status: "Válido",
  },
  {
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    renavam: "00456789123",
    chassi: "9BWZZZ377VT004254",
    crlv: "PE-2024-4567890",
    crlvExpiry: "2025-12-20",
    ipva: { valor: 3800, parcelas: 3, parcelasPagas: 0, vencimento: "2026-01-20", status: "Pendente" },
    licenciamento: { valor: 181.35, vencimento: "2025-12-25", status: "Vencido" },
    seguro: {
      seguradora: "SulAmérica",
      apolice: "SA-2025-654987",
      cobertura: 650000,
      vigenciaInicio: "2025-03-01",
      vigenciaFim: "2026-03-01",
      status: "Ativo",
    },
    tollTag: {
      provider: "Tag Itaú",
      tag: "PE-ITA-005",
      status: "Ativo",
      balance: 50.0,
      monthlySpend: 150.0,
      lastUpdate: "2026-01-05",
    },
    branch: "Recife",
    id: "4",
    type: "Licenciamento",
    expirationDate: "2025-12-25",
    status: "Vencido",
  },
  {
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    renavam: "00654987321",
    chassi: "9BWZZZ377VT004255",
    crlv: "PI-2025-5678901",
    crlvExpiry: "2026-12-31",
    ipva: { valor: 4100, parcelas: 3, parcelasPagas: 1, vencimento: "2026-02-10", status: "Parcelado" },
    licenciamento: { valor: 181.35, vencimento: "2026-06-05", status: "Válido" },
    seguro: {
      seguradora: "Mapfre",
      apolice: "MF-2025-321654",
      cobertura: 720000,
      vigenciaInicio: "2025-09-01",
      vigenciaFim: "2026-09-01",
      status: "Ativo",
    },
    tollTag: {
      provider: "Tag Itaú",
      tag: "PI-ITA-001",
      status: "Ativo",
      balance: 650.0,
      monthlySpend: 200.0,
      lastUpdate: "2026-01-07",
    },
    branch: "Piauí",
    id: "temp1",
    type: "Licenciamento",
    expirationDate: "2026-06-05",
    status: "Válido",
  },
  {
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    renavam: "00789321654",
    chassi: "9BWZZZ377VT004256",
    crlv: "PI-2025-6789012",
    crlvExpiry: "2026-12-31",
    ipva: { valor: 4500, parcelas: 3, parcelasPagas: 3, vencimento: "2026-01-15", status: "Pago" },
    licenciamento: { valor: 181.35, vencimento: "2026-07-20", status: "Válido" },
    seguro: {
      seguradora: "HDI Seguros",
      apolice: "HDI-2025-159753",
      cobertura: 780000,
      vigenciaInicio: "2025-08-15",
      vigenciaFim: "2026-08-15",
      status: "Ativo",
    },
    tollTag: {
      provider: "Sem Parar",
      tag: "PI-SP-002",
      status: "Ativo",
      balance: 320.0,
      monthlySpend: 180.0,
      lastUpdate: "2026-01-04",
    },
    branch: "Piauí",
    id: "6",
    type: "IPVA",
    expirationDate: "2026-01-15",
    status: "Pago",
  },
];

// Função para obter documentos de um veículo específico
export function getVehicleDocuments(
  vehicleId: string
): VehicleDocuments | undefined {
  return mockVehicleDocuments.find((doc) => doc.vehicleId === vehicleId);
}

// ========== TACHOGRAPH MANAGEMENT (TACÓGRAFO) ==========
export interface TachographCalibration {
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  inmetroNumber: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  certificateNumber: string;
  branch: Branch;
}

export interface TachographReading {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  date: string;
  startKm: number;
  endKm: number;
  distance: number;
  maxSpeed: number;
  drivingTime: number; // em horas
  hasViolation: boolean;
  diskPhoto?: string;
  branch: Branch;
}

export const mockTachographCalibrations: TachographCalibration[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    inmetroNumber: "INMETRO-SP-001234",
    lastCalibrationDate: "2025-06-15",
    nextCalibrationDate: "2026-06-15",
    certificateNumber: "CERT-2025-001234",
    branch: "São Paulo",
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    inmetroNumber: "INMETRO-SP-005678",
    lastCalibrationDate: "2025-08-20",
    nextCalibrationDate: "2026-01-20",
    certificateNumber: "CERT-2025-005678",
    branch: "São Paulo",
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    vehicleModel: "Mercedes Actros",
    inmetroNumber: "INMETRO-PE-009012",
    lastCalibrationDate: "2025-11-10",
    nextCalibrationDate: "2026-11-10",
    certificateNumber: "CERT-2025-009012",
    branch: "Recife",
  },
  {
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    vehicleModel: "DAF XF",
    inmetroNumber: "INMETRO-PE-003456",
    lastCalibrationDate: "2024-12-05",
    nextCalibrationDate: "2025-12-05",
    certificateNumber: "CERT-2024-003456",
    branch: "Recife",
  },
  {
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    vehicleModel: "Iveco S-Way",
    inmetroNumber: "INMETRO-PI-007891",
    lastCalibrationDate: "2025-09-25",
    nextCalibrationDate: "2026-09-25",
    certificateNumber: "CERT-2025-007891",
    branch: "Piauí",
  },
  {
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    vehicleModel: "Volvo FH 460",
    inmetroNumber: "INMETRO-PI-002345",
    lastCalibrationDate: "2025-07-18",
    nextCalibrationDate: "2026-01-18",
    certificateNumber: "CERT-2025-002345",
    branch: "Piauí",
  },
];

export const mockTachographReadings: TachographReading[] = [
  {
    id: "tr1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    driverId: "d1",
    driverName: "João Pereira",
    date: "2026-01-07",
    startKm: 124500,
    endKm: 125000,
    distance: 500,
    maxSpeed: 85,
    drivingTime: 6.5,
    hasViolation: false,
    branch: "São Paulo",
  },
  {
    id: "tr2",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    driverId: "d2",
    driverName: "Carlos Silva",
    date: "2026-01-07",
    startKm: 179500,
    endKm: 180000,
    distance: 500,
    maxSpeed: 98,
    drivingTime: 5.8,
    hasViolation: true,
    branch: "São Paulo",
  },
  {
    id: "tr3",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    driverId: "d3",
    driverName: "Roberto Mendes",
    date: "2026-01-06",
    startKm: 44500,
    endKm: 45000,
    distance: 500,
    maxSpeed: 82,
    drivingTime: 7.2,
    hasViolation: false,
    branch: "Recife",
  },
  {
    id: "tr4",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    driverId: "d1",
    driverName: "João Pereira",
    date: "2026-01-06",
    startKm: 124000,
    endKm: 124500,
    distance: 500,
    maxSpeed: 88,
    drivingTime: 6.0,
    hasViolation: false,
    branch: "São Paulo",
  },
  {
    id: "tr5",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    driverId: "d4",
    driverName: "Antonio Costa",
    date: "2026-01-05",
    startKm: 219500,
    endKm: 220000,
    distance: 500,
    maxSpeed: 95,
    drivingTime: 5.5,
    hasViolation: true,
    branch: "Recife",
  },
  {
    id: "tr6",
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    driverId: "d5",
    driverName: "Marcos Oliveira",
    date: "2026-01-07",
    startKm: 97500,
    endKm: 98000,
    distance: 500,
    maxSpeed: 78,
    drivingTime: 7.8,
    hasViolation: false,
    branch: "Piauí",
  },
  {
    id: "tr7",
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    driverId: "d6",
    driverName: "Paulo Santos",
    date: "2026-01-06",
    startKm: 155500,
    endKm: 156000,
    distance: 500,
    maxSpeed: 92,
    drivingTime: 6.2,
    hasViolation: true,
    branch: "Piauí",
  },
  {
    id: "tr8",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    driverId: "d2",
    driverName: "Carlos Silva",
    date: "2026-01-05",
    startKm: 179000,
    endKm: 179500,
    distance: 500,
    maxSpeed: 87,
    drivingTime: 6.8,
    hasViolation: false,
    branch: "São Paulo",
  },
];

// Função para verificar status de calibração
export function getCalibrationStatus(nextCalibrationDate: string): {
  status: "ok" | "warning" | "expired";
  daysRemaining: number;
} {
  const today = new Date();
  const calibrationDate = new Date(nextCalibrationDate);
  const diffTime = calibrationDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return { status: "expired", daysRemaining };
  if (daysRemaining <= 30) return { status: "warning", daysRemaining };
  return { status: "ok", daysRemaining };
}

// ========== FILTER HELPERS ==========
export function filterByBranch<T extends { branch: Branch }>(
  data: T[],
  branch: Branch | "Todas"
): T[] {
  if (branch === "Todas") return data;
  return data.filter((item) => item.branch === branch);
}

export const branches: (Branch | "Todas")[] = [
  "Todas",
  "São Paulo",
  "Recife",
  "Piauí",
];

// Função auxiliar para compatibilidade (Legacy Adapter)
export function adaptVehicleToLegacy(v: Vehicle): any {
  return {
    ...v,
    model: v.modelo,
    plate: v.placa,
    year: v.ano,
    mileage: v.km_atual,
  };
}
