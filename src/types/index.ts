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
}

// ── Layout do Transporte ──────────────────────────────────────────────
export type TipoTransporte = 'Onibus 50' | 'Onibus 40' | 'Van 14' | 'Van 12'

export interface LayoutTransporte {
  tipo: TipoTransporte
  assentos: Assento[]
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
  transporte: string
  quantidadeTransporte: number
  status: PasseioStatus
  passageirosAlocados: number
  imageUrl: string
  layoutTransporte?: LayoutTransporte
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
}
