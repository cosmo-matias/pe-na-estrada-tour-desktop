import type { Passeio } from '../types'

export const passeiosMock: Passeio[] = [
  {
    id: '1',
    destino: 'Natal',
    local: 'Praia de Ponta Negra',
    data: '2025-08-10',
    horarioSaida: '06:00',
    horarioRetorno: '22:00',
    valor: 120.0,
    locaisEmbarque: ['Terminal JK', 'Praça da Savassi'],
    transportes: [
      { id: 'v1', nome: 'Ônibus Principal', tipo: 'Onibus 50', capacidade: 50 }
    ],
    status: 'a_realizar',
    passageirosAlocados: 38,
    imagem: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  },
  {
    id: '2',
    destino: 'João Pessoa',
    local: 'Parque Estadual Marinho de Areia Vermelha',
    data: '2025-07-20',
    horarioSaida: '07:30',
    horarioRetorno: '19:00',
    valor: 85.0,
    locaisEmbarque: ['Rodoviária', 'Estação Pampulha'],
    transportes: [
      { id: 'v1', nome: 'Van 1', tipo: 'Van 14', capacidade: 14 },
      { id: 'v2', nome: 'Van 2', tipo: 'Van 14', capacidade: 14 }
    ],
    status: 'realizado',
    passageirosAlocados: 26,
    imagem: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=80',
  },
  {
    id: '3',
    destino: 'Lucena',
    local: 'Praia do Amor',
    data: '2025-07-05',
    horarioSaida: '07:00',
    horarioRetorno: '18:30',
    valor: 60.0,
    locaisEmbarque: ['Mamanguape - Terminal Rodoviário', 'Mataraca - Entrada da Cidade'],
    transporte: 'Van 14 lugares',
    quantidadeTransporte: 1,
    status: 'cancelado',
    passageirosAlocados: 0,
    imagem: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&q=80',
  },
]
