// Mock data para simular resposta do backend
export interface Vehicle {
  id: string
  model: string
  plate: string
  year: number
  mileage: number
  status: "Ativo" | "Em Oficina" | "Problema Documental"
  lastMaintenance: string
  nextMaintenance: string
  nextMaintenanceMileage: number
}

export interface Document {
  id: string
  vehicleId: string
  vehiclePlate: string
  type: "IPVA" | "Licenciamento" | "Seguro" | "CRLV"
  expirationDate: string
  status: "Válido" | "Vencendo" | "Vencido"
}

export interface Maintenance {
  id: string
  vehicleId: string
  vehiclePlate: string
  vehicleModel: string
  type: string
  scheduledDate: string
  scheduledMileage: number
  status: "Urgente" | "Agendada" | "Concluída"
  description: string
}

export interface Fine {
  id: string
  vehicleId: string
  vehiclePlate: string
  date: string
  description: string
  value: number
  status: "Pendente" | "Paga" | "Recurso"
}

export const mockVehicles: Vehicle[] = [
  {
    id: "1",
    model: "Volvo FH 540",
    plate: "ABC-1234",
    year: 2022,
    mileage: 125000,
    status: "Ativo",
    lastMaintenance: "2025-12-15",
    nextMaintenance: "2026-02-15",
    nextMaintenanceMileage: 135000,
  },
  {
    id: "2",
    model: "Scania R450",
    plate: "DEF-5678",
    year: 2021,
    mileage: 180000,
    status: "Em Oficina",
    lastMaintenance: "2025-11-20",
    nextMaintenance: "2026-01-20",
    nextMaintenanceMileage: 190000,
  },
  {
    id: "3",
    model: "Mercedes Actros",
    plate: "GHI-9012",
    year: 2023,
    mileage: 45000,
    status: "Ativo",
    lastMaintenance: "2026-01-05",
    nextMaintenance: "2026-03-05",
    nextMaintenanceMileage: 55000,
  },
  {
    id: "4",
    model: "DAF XF",
    plate: "JKL-3456",
    year: 2020,
    mileage: 220000,
    status: "Problema Documental",
    lastMaintenance: "2025-10-10",
    nextMaintenance: "2025-12-10",
    nextMaintenanceMileage: 230000,
  },
  {
    id: "5",
    model: "Iveco S-Way",
    plate: "MNO-7891",
    year: 2022,
    mileage: 98000,
    status: "Ativo",
    lastMaintenance: "2025-12-28",
    nextMaintenance: "2026-02-28",
    nextMaintenanceMileage: 108000,
  },
  {
    id: "6",
    model: "Volvo FH 460",
    plate: "PQR-2345",
    year: 2021,
    mileage: 156000,
    status: "Ativo",
    lastMaintenance: "2025-11-30",
    nextMaintenance: "2026-01-30",
    nextMaintenanceMileage: 166000,
  },
]

export const mockDocuments: Document[] = [
  {
    id: "1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    type: "IPVA",
    expirationDate: "2026-01-15",
    status: "Vencendo",
  },
  {
    id: "2",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    type: "Licenciamento",
    expirationDate: "2026-03-20",
    status: "Válido",
  },
  {
    id: "3",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    type: "Seguro",
    expirationDate: "2026-01-10",
    status: "Vencendo",
  },
  {
    id: "4",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    type: "CRLV",
    expirationDate: "2025-12-20",
    status: "Vencido",
  },
  {
    id: "5",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    type: "Licenciamento",
    expirationDate: "2025-12-25",
    status: "Vencido",
  },
  {
    id: "6",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    type: "IPVA",
    expirationDate: "2026-02-15",
    status: "Válido",
  },
]

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
  },
]

export const mockFines: Fine[] = [
  {
    id: "1",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    date: "2025-11-15",
    description: "Excesso de velocidade - 20% acima",
    value: 195.23,
    status: "Pendente",
  },
  {
    id: "2",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    date: "2025-10-28",
    description: "Estacionamento irregular",
    value: 88.38,
    status: "Paga",
  },
  {
    id: "3",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-12-05",
    description: "Avanço de sinal vermelho",
    value: 293.47,
    status: "Recurso",
  },
]

// Função para calcular o rodízio de SP
export function getPlateRestriction(): { blockedEndings: number[]; dayName: string } {
  const today = new Date()
  const dayOfWeek = today.getDay()

  const restrictions: Record<number, number[]> = {
    1: [1, 2], // Segunda-feira
    2: [3, 4], // Terça-feira
    3: [5, 6], // Quarta-feira
    4: [7, 8], // Quinta-feira
    5: [9, 0], // Sexta-feira
    0: [], // Domingo
    6: [], // Sábado
  }

  const dayNames: Record<number, string> = {
    0: "Domingo",
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
    6: "Sábado",
  }

  return {
    blockedEndings: restrictions[dayOfWeek],
    dayName: dayNames[dayOfWeek],
  }
}

export function getVehiclesInRotation(vehicles: Vehicle[]): Vehicle[] {
  const { blockedEndings } = getPlateRestriction()

  return vehicles.filter((vehicle) => {
    const lastDigit = Number.parseInt(vehicle.plate.slice(-1))
    return blockedEndings.includes(lastDigit)
  })
}

// ========== FINANCIALS & TCO ==========
export interface FuelEntry {
  id: string
  vehicleId: string
  vehiclePlate: string
  date: string
  liters: number
  cost: number
  odometer: number
  efficiency: number // Km/L
  hasAnomaly: boolean
}

export interface MonthlyCost {
  month: string
  fuel: number
  maintenance: number
  tires: number
  insurance: number
  total: number
}

export interface VehicleTCO {
  vehicleId: string
  vehiclePlate: string
  vehicleModel: string
  purchaseValue: number
  currentFipeValue: number
  cumulativeMaintenanceCost: number
  cumulativeFuelCost: number
  depreciationPercent: number
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
    hasAnomaly: true, // Consumo anômalo
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
  },
]

export const mockMonthlyCosts: MonthlyCost[] = [
  { month: "Ago/25", fuel: 45000, maintenance: 12000, tires: 8000, insurance: 5000, total: 70000 },
  { month: "Set/25", fuel: 48000, maintenance: 8500, tires: 3000, insurance: 5000, total: 64500 },
  { month: "Out/25", fuel: 52000, maintenance: 15000, tires: 12000, insurance: 5000, total: 84000 },
  { month: "Nov/25", fuel: 49000, maintenance: 9800, tires: 4500, insurance: 5000, total: 68300 },
  { month: "Dez/25", fuel: 55000, maintenance: 18000, tires: 6000, insurance: 5000, total: 84000 },
  { month: "Jan/26", fuel: 42000, maintenance: 7500, tires: 2000, insurance: 5000, total: 56500 },
]

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
  },
]

// ========== TIRE MANAGEMENT ==========
export interface Tire {
  id: string
  position: "FL" | "FR" | "RL" | "RR" // Front Left, Front Right, Rear Left, Rear Right
  brand: string
  model: string
  treadDepth: number // em mm
  installDate: string
  mileageAtInstall: number
}

export interface VehicleTires {
  vehicleId: string
  vehiclePlate: string
  vehicleModel: string
  tires: Tire[]
}

export interface TireRotation {
  id: string
  vehicleId: string
  vehiclePlate: string
  date: string
  description: string
  mileage: number
}

export interface SpareTire {
  id: string
  brand: string
  model: string
  size: string
  quantity: number
  condition: "Novo" | "Usado - Bom" | "Usado - Regular"
}

export const mockVehicleTires: VehicleTires[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
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
]

export const mockTireRotations: TireRotation[] = [
  {
    id: "r1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-10-20",
    description: "Rodízio dianteiros para traseiros",
    mileage: 115000,
  },
  {
    id: "r2",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    date: "2025-08-15",
    description: "Troca dos pneus dianteiros (novos)",
    mileage: 100000,
  },
  {
    id: "r3",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    date: "2025-06-05",
    description: "Rodízio cruzado completo",
    mileage: 155000,
  },
  {
    id: "r4",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    date: "2025-11-01",
    description: "Troca de todos os pneus (novos)",
    mileage: 40000,
  },
]

export const mockSpareTires: SpareTire[] = [
  { id: "s1", brand: "Michelin", model: "X Line Energy", size: "295/80 R22.5", quantity: 4, condition: "Novo" },
  { id: "s2", brand: "Continental", model: "HSR2", size: "295/80 R22.5", quantity: 2, condition: "Usado - Bom" },
  { id: "s3", brand: "Bridgestone", model: "R249", size: "315/80 R22.5", quantity: 3, condition: "Novo" },
  { id: "s4", brand: "Pirelli", model: "FR01", size: "295/80 R22.5", quantity: 1, condition: "Usado - Regular" },
]

// Função para obter cor do status do pneu
export function getTireHealthColor(treadDepth: number): "green" | "yellow" | "red" {
  if (treadDepth > 5) return "green"
  if (treadDepth >= 1.6) return "yellow"
  return "red"
}

export function getTireHealthLabel(treadDepth: number): string {
  if (treadDepth > 5) return "Bom"
  if (treadDepth >= 1.6) return "Atenção"
  return "Crítico"
}

// ========== INCIDENTS & CLAIMS ==========
export interface Incident {
  id: string
  vehicleId: string
  vehiclePlate: string
  vehicleModel: string
  driverName: string
  date: string
  time: string
  type: "Acidente" | "Avaria" | "Roubo/Furto" | "Colisão Leve"
  description: string
  location: string
  status: "Aberto" | "Em Reparo" | "Aguardando Seguro" | "Fechado"
  estimatedCost: number
  insuranceClaim: boolean
  photos: string[]
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
    description: "Para-brisa trincado por pedra na rodovia. Necessita substituição completa.",
    location: "BR-116, km 220 - Registro/SP",
    status: "Fechado",
    estimatedCost: 2200,
    insuranceClaim: false,
    photos: [],
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
    description: "Arranhões na traseira durante manobra de ré no pátio de descarga.",
    location: "Centro de Distribuição - Guarulhos/SP",
    status: "Aberto",
    estimatedCost: 1800,
    insuranceClaim: false,
    photos: [],
  },
]

// Função para calcular estatísticas de incidentes
export function getIncidentStats() {
  const open = mockIncidents.filter((i) => i.status === "Aberto").length
  const inRepair = mockIncidents.filter((i) => i.status === "Em Reparo").length
  const waitingInsurance = mockIncidents.filter((i) => i.status === "Aguardando Seguro").length
  const closed = mockIncidents.filter((i) => i.status === "Fechado").length
  const totalCost = mockIncidents.reduce((acc, i) => acc + i.estimatedCost, 0)

  return { open, inRepair, waitingInsurance, closed, totalCost }
}

// ========== DOCUMENTS ==========
export interface VehicleDocuments {
  vehicleId: string
  vehiclePlate: string
  renavam: string
  chassi: string
  ipva: {
    year: number
    value: number
    status: "Pago" | "Pendente" | "Vencido"
    dueDate: string
    paymentDate?: string
  }
  licensing: {
    year: number
    status: "Válido" | "Vencendo" | "Vencido"
    expirationDate: string
    crlvNumber: string
  }
  insurance: {
    company: string
    policyNumber: string
    startDate: string
    endDate: string
    coverageValue: number
    status: "Ativo" | "Vencendo" | "Vencido"
  }
  semParar: {
    active: boolean
    tagNumber: string
    lastUsage: string
    monthlyAverage: number
    balance: number
  }
}

export const mockVehicleDocuments: VehicleDocuments[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    renavam: "01234567890",
    chassi: "9BWZZZ377VT004251",
    ipva: {
      year: 2026,
      value: 12500,
      status: "Pendente",
      dueDate: "2026-01-15",
    },
    licensing: {
      year: 2026,
      status: "Válido",
      expirationDate: "2026-03-20",
      crlvNumber: "00123456789",
    },
    insurance: {
      company: "Porto Seguro",
      policyNumber: "PSG-2025-78945",
      startDate: "2025-06-01",
      endDate: "2026-06-01",
      coverageValue: 950000,
      status: "Ativo",
    },
    semParar: {
      active: true,
      tagNumber: "SP-789456123",
      lastUsage: "2026-01-07",
      monthlyAverage: 1250.0,
      balance: 520.5,
    },
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    renavam: "09876543210",
    chassi: "9BWZZZ377VT004252",
    ipva: {
      year: 2026,
      value: 11800,
      status: "Pendente",
      dueDate: "2026-01-10",
    },
    licensing: {
      year: 2025,
      status: "Vencendo",
      expirationDate: "2026-01-15",
      crlvNumber: "00987654321",
    },
    insurance: {
      company: "Bradesco Seguros",
      policyNumber: "BRD-2025-45678",
      startDate: "2025-04-15",
      endDate: "2026-04-15",
      coverageValue: 880000,
      status: "Ativo",
    },
    semParar: {
      active: true,
      tagNumber: "SP-456789012",
      lastUsage: "2026-01-05",
      monthlyAverage: 980.0,
      balance: 340.2,
    },
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    renavam: "11223344556",
    chassi: "9BWZZZ377VT004253",
    ipva: {
      year: 2026,
      value: 15200,
      status: "Pago",
      dueDate: "2026-02-15",
      paymentDate: "2026-01-05",
    },
    licensing: {
      year: 2026,
      status: "Válido",
      expirationDate: "2026-04-10",
      crlvNumber: "00112233445",
    },
    insurance: {
      company: "Allianz",
      policyNumber: "ALZ-2025-12345",
      startDate: "2025-08-01",
      endDate: "2026-08-01",
      coverageValue: 1100000,
      status: "Ativo",
    },
    semParar: {
      active: true,
      tagNumber: "SP-123456789",
      lastUsage: "2026-01-08",
      monthlyAverage: 1450.0,
      balance: 890.3,
    },
  },
  {
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    renavam: "66778899001",
    chassi: "9BWZZZ377VT004254",
    ipva: {
      year: 2025,
      value: 9800,
      status: "Vencido",
      dueDate: "2025-12-20",
    },
    licensing: {
      year: 2025,
      status: "Vencido",
      expirationDate: "2025-12-25",
      crlvNumber: "00667788990",
    },
    insurance: {
      company: "HDI Seguros",
      policyNumber: "HDI-2025-98765",
      startDate: "2025-03-01",
      endDate: "2026-03-01",
      coverageValue: 750000,
      status: "Ativo",
    },
    semParar: {
      active: false,
      tagNumber: "SP-987654321",
      lastUsage: "2025-11-15",
      monthlyAverage: 0,
      balance: 0,
    },
  },
  {
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    renavam: "22334455667",
    chassi: "9BWZZZ377VT004255",
    ipva: {
      year: 2026,
      value: 13500,
      status: "Pago",
      dueDate: "2026-01-28",
      paymentDate: "2025-12-20",
    },
    licensing: {
      year: 2026,
      status: "Válido",
      expirationDate: "2026-05-15",
      crlvNumber: "00223344556",
    },
    insurance: {
      company: "Mapfre",
      policyNumber: "MPF-2025-55667",
      startDate: "2025-07-01",
      endDate: "2026-07-01",
      coverageValue: 920000,
      status: "Ativo",
    },
    semParar: {
      active: true,
      tagNumber: "SP-112233445",
      lastUsage: "2026-01-07",
      monthlyAverage: 1100.0,
      balance: 675.8,
    },
  },
  {
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    renavam: "44556677889",
    chassi: "9BWZZZ377VT004256",
    ipva: {
      year: 2026,
      value: 11200,
      status: "Pendente",
      dueDate: "2026-01-29",
    },
    licensing: {
      year: 2026,
      status: "Válido",
      expirationDate: "2026-03-30",
      crlvNumber: "00445566778",
    },
    insurance: {
      company: "SulAmérica",
      policyNumber: "SAM-2025-33445",
      startDate: "2025-09-01",
      endDate: "2026-09-01",
      coverageValue: 860000,
      status: "Ativo",
    },
    semParar: {
      active: true,
      tagNumber: "SP-556677889",
      lastUsage: "2026-01-06",
      monthlyAverage: 890.0,
      balance: 445.6,
    },
  },
]

// Função para obter documentos de um veículo específico
export function getVehicleDocuments(vehicleId: string): VehicleDocuments | undefined {
  return mockVehicleDocuments.find((doc) => doc.vehicleId === vehicleId)
}

// ========== TACHOGRAPH MANAGEMENT (TACÓGRAFO) ==========
export interface TachographCalibration {
  vehicleId: string
  vehiclePlate: string
  vehicleModel: string
  inmetroNumber: string
  lastCalibrationDate: string
  nextCalibrationDate: string
  status: "Válido" | "Vencendo" | "Vencido"
  technicianName: string
  workshopName: string
}

export interface TachographReading {
  id: string
  vehicleId: string
  vehiclePlate: string
  driverName: string
  date: string
  startKm: number
  endKm: number
  distance: number
  maxSpeed: number
  drivingTime: number // em horas
  hasViolation: boolean
  diskPhotoUrl?: string
  notes?: string
}

export const mockTachographCalibrations: TachographCalibration[] = [
  {
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    vehicleModel: "Volvo FH 540",
    inmetroNumber: "INMETRO-2024-789456",
    lastCalibrationDate: "2025-06-15",
    nextCalibrationDate: "2026-06-15",
    status: "Válido",
    technicianName: "José Ferreira",
    workshopName: "Tacógrafo Center SP",
  },
  {
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    vehicleModel: "Scania R450",
    inmetroNumber: "INMETRO-2024-321654",
    lastCalibrationDate: "2025-01-20",
    nextCalibrationDate: "2026-01-20",
    status: "Vencendo", // menos de 30 dias
    technicianName: "Carlos Mendes",
    workshopName: "Tacógrafo Center SP",
  },
  {
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    vehicleModel: "Mercedes Actros",
    inmetroNumber: "INMETRO-2025-654987",
    lastCalibrationDate: "2025-10-01",
    nextCalibrationDate: "2026-10-01",
    status: "Válido",
    technicianName: "Roberto Silva",
    workshopName: "Calibra Tacógrafos Ltda",
  },
  {
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    vehicleModel: "DAF XF",
    inmetroNumber: "INMETRO-2023-147258",
    lastCalibrationDate: "2024-12-10",
    nextCalibrationDate: "2025-12-10",
    status: "Vencido",
    technicianName: "Antonio Costa",
    workshopName: "Tacógrafo Express",
  },
  {
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    vehicleModel: "Iveco S-Way",
    inmetroNumber: "INMETRO-2025-369852",
    lastCalibrationDate: "2025-08-25",
    nextCalibrationDate: "2026-08-25",
    status: "Válido",
    technicianName: "José Ferreira",
    workshopName: "Tacógrafo Center SP",
  },
  {
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    vehicleModel: "Volvo FH 460",
    inmetroNumber: "INMETRO-2024-951753",
    lastCalibrationDate: "2025-02-05",
    nextCalibrationDate: "2026-02-05",
    status: "Vencendo",
    technicianName: "Carlos Mendes",
    workshopName: "Calibra Tacógrafos Ltda",
  },
]

export const mockTachographReadings: TachographReading[] = [
  {
    id: "tr1",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    driverName: "João Pereira",
    date: "2026-01-07",
    startKm: 124500,
    endKm: 125000,
    distance: 500,
    maxSpeed: 85,
    drivingTime: 6.5,
    hasViolation: false,
  },
  {
    id: "tr2",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    driverName: "Carlos Silva",
    date: "2026-01-07",
    startKm: 179200,
    endKm: 180000,
    distance: 800,
    maxSpeed: 98, // VIOLAÇÃO - acima de 90km/h
    drivingTime: 9.2,
    hasViolation: true,
  },
  {
    id: "tr3",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    driverName: "Pedro Santos",
    date: "2026-01-06",
    startKm: 44500,
    endKm: 45000,
    distance: 500,
    maxSpeed: 82,
    drivingTime: 5.8,
    hasViolation: false,
  },
  {
    id: "tr4",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    driverName: "João Pereira",
    date: "2026-01-06",
    startKm: 124000,
    endKm: 124500,
    distance: 500,
    maxSpeed: 88,
    drivingTime: 6.0,
    hasViolation: false,
  },
  {
    id: "tr5",
    vehicleId: "4",
    vehiclePlate: "JKL-3456",
    driverName: "Roberto Mendes",
    date: "2026-01-05",
    startKm: 219000,
    endKm: 220000,
    distance: 1000,
    maxSpeed: 105, // VIOLAÇÃO GRAVE
    drivingTime: 11.5,
    hasViolation: true,
    notes: "Motorista advertido sobre excesso de velocidade",
  },
  {
    id: "tr6",
    vehicleId: "5",
    vehiclePlate: "MNO-7891",
    driverName: "Antonio Costa",
    date: "2026-01-05",
    startKm: 97200,
    endKm: 98000,
    distance: 800,
    maxSpeed: 87,
    drivingTime: 8.5,
    hasViolation: false,
  },
  {
    id: "tr7",
    vehicleId: "2",
    vehiclePlate: "DEF-5678",
    driverName: "Carlos Silva",
    date: "2026-01-04",
    startKm: 178500,
    endKm: 179200,
    distance: 700,
    maxSpeed: 92, // VIOLAÇÃO
    drivingTime: 7.8,
    hasViolation: true,
  },
  {
    id: "tr8",
    vehicleId: "6",
    vehiclePlate: "PQR-2345",
    driverName: "Fernando Lima",
    date: "2026-01-04",
    startKm: 155200,
    endKm: 156000,
    distance: 800,
    maxSpeed: 89,
    drivingTime: 8.0,
    hasViolation: false,
  },
  {
    id: "tr9",
    vehicleId: "3",
    vehiclePlate: "GHI-9012",
    driverName: "Pedro Santos",
    date: "2026-01-03",
    startKm: 44000,
    endKm: 44500,
    distance: 500,
    maxSpeed: 78,
    drivingTime: 5.5,
    hasViolation: false,
  },
  {
    id: "tr10",
    vehicleId: "1",
    vehiclePlate: "ABC-1234",
    driverName: "Marcos Oliveira",
    date: "2026-01-03",
    startKm: 123400,
    endKm: 124000,
    distance: 600,
    maxSpeed: 91, // VIOLAÇÃO
    drivingTime: 6.8,
    hasViolation: true,
  },
]

// Função para calcular estatísticas do Tacógrafo
export function getTachographStats() {
  const calibrationsExpiring = mockTachographCalibrations.filter((c) => c.status === "Vencendo").length
  const calibrationsExpired = mockTachographCalibrations.filter((c) => c.status === "Vencido").length
  const totalViolations = mockTachographReadings.filter((r) => r.hasViolation).length
  const totalReadings = mockTachographReadings.length
  const violationRate = Math.round((totalViolations / totalReadings) * 100)

  return {
    calibrationsExpiring,
    calibrationsExpired,
    totalViolations,
    totalReadings,
    violationRate,
  }
}
