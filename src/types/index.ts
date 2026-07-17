export type PasseioStatus = 'a_realizar' | 'realizado' | 'cancelado'

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
}

// Valor exportado para que o módulo não fique vazio em runtime
export const PASSEIO_STATUS = {
  A_REALIZAR: 'a_realizar' as PasseioStatus,
  REALIZADO: 'realizado' as PasseioStatus,
  CANCELADO: 'cancelado' as PasseioStatus,
} as const
