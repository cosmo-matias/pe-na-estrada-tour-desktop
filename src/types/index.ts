// ── Status ────────────────────────────────────────────────────────────
export type PasseioStatus = 'a_realizar' | 'realizado' | 'cancelado'

export const PASSEIO_STATUS = {
  A_REALIZAR: 'a_realizar' as PasseioStatus,
  REALIZADO: 'realizado' as PasseioStatus,
  CANCELADO: 'cancelado' as PasseioStatus,
} as const

// ── Assento ───────────────────────────────────────────────────────────
export interface Assento {
  numero: string | number
  ocupado: boolean
  passageiroId?: string
  passageiroNome?: string
  statusFinanceiro?: 'pago' | 'pendente'
}

// ── Layout do Transporte ──────────────────────────────────────────────
export type TipoTransporte = 'Onibus 50' | 'Onibus 40' | 'Van 14' | 'Van 12'

export interface LayoutTransporte {
  tipo: TipoTransporte
  assentos: Assento[]
}

export interface TransporteFrota {
  id: string
  nome: string
  tipo: TipoTransporte
  capacidade: number
}

// ── Passeio ───────────────────────────────────────────────────────────
export interface Passeio {
  id: string
  destino: string
  local: string
  data: string
  horarioSaida: string
  horarioRetorno: string
  valor: number
  locaisEmbarque: string[]
  transportes?: TransporteFrota[]
  capacidade?: number
  // Legacy fields (optional so old records don't break TS)
  transporte?: string
  quantidadeTransporte?: number
  status: PasseioStatus
  passageirosAlocados: number
  imagem: string
  layoutTransporte?: LayoutTransporte
  despesas?: { descricao: string; valor: number }[]
  agenteResponsavel?: 'Cosmo' | 'Noêmia' | 'Ambos'
}

// ── Passageiro ────────────────────────────────────────────────────────
export interface Passageiro {
  id: string
  passeioId: string
  nomeCompleto: string
  dataNascimento: string
  cpf: string
  whatsapp: string
  contatoEmergencia: string
  endereco: {
    logradouro: string
    bairro: string
    cidade: string
    estado: string
  }
  pontoEmbarque: string
  formaPagamento: 'dinheiro' | 'pix' | 'cartao_credito'
  statusAlocacao: 'alocado' | 'nao_alocado'
  numeroPoltrona: number | null
  veiculoAlocado?: string // Adicionado para suportar frotas
  desconto?: {
    tipo: 'porcentagem' | 'fixo'
    valor: number
  }
  historicoPagamentos?: Array<{
    id: string
    data: string
    valor: number
    metodo: string
  }>
}

// ── Financeiro ─────────────────────────────────────────────────────────
export interface Transacao {
  id: string
  tipo: 'entrada' | 'saida'
  status: 'pendente' | 'parcial' | 'efetivada'
  valorTotal: number
  valorPago: number
  descricao: string
  data: string
  dataVencimento?: string
  passageiroId?: string
  passeioId?: string
}
