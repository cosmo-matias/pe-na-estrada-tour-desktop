import { useState } from 'react'
import type { Passeio } from '../types'
import { passeiosMock } from '../mocks/passeios'
import { PasseioCard } from '../components/PasseioCard'

// ── Configuração das colunas do Kanban ───────────────────────────────
type StatusKanban = Passeio['status']

interface KanbanColuna {
  id: StatusKanban
  label: string
  icon: string
  headerColor: string
  borderColor: string
  badgeColor: string
  emptyText: string
}

const COLUNAS: KanbanColuna[] = [
  {
    id: 'a_realizar',
    label: 'A Realizar',
    icon: '🗓️',
    headerColor: 'bg-brand-primary',
    borderColor: 'border-brand-primary/30',
    badgeColor: 'bg-brand-primary text-white',
    emptyText: 'Nenhum passeio agendado.',
  },
  {
    id: 'realizado',
    label: 'Realizado',
    icon: '✅',
    headerColor: 'bg-emerald-500',
    borderColor: 'border-emerald-300/40',
    badgeColor: 'bg-emerald-500 text-white',
    emptyText: 'Nenhum passeio concluído ainda.',
  },
  {
    id: 'cancelado',
    label: 'Cancelado',
    icon: '🚫',
    headerColor: 'bg-brand-alert',
    borderColor: 'border-brand-alert/30',
    badgeColor: 'bg-brand-alert text-white',
    emptyText: 'Nenhum passeio cancelado.',
  },
]

// ── Componente Principal ─────────────────────────────────────────────
export function Passeios() {
  const [passeios, setPasseios] = useState<Passeio[]>(passeiosMock)

  // ── Handlers (stubs — serão integrados ao Firestore) ──────────────
  const handleGerarLink = (id: string) => {
    alert(`🔗 Gerar link de inscrição para o passeio #${id}\n(Em breve: link compartilhável)`)
  }

  const handleAlocar = (id: string) => {
    alert(`➕ Alocar passageiro no passeio #${id}\n(Em breve: modal de alocação)`)
  }

  const handleEditar = (id: string) => {
    alert(`✏️ Editar passeio #${id}\n(Em breve: formulário de edição)`)
  }

  const handleCancelar = (id: string) => {
    const passeio = passeios.find((p) => p.id === id)
    if (!passeio) return
    if (
      window.confirm(
        `⚠️ Cancelar "${passeio.destino}"?\n\nEste passeio possui ${passeio.passageirosAlocados} passageiro(s) alocado(s). O cancelamento notificará os passageiros.`
      )
    ) {
      setPasseios((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'cancelado' as const } : p))
      )
    }
  }

  const handleExcluir = (id: string) => {
    const passeio = passeios.find((p) => p.id === id)
    if (!passeio) return
    if (
      window.confirm(`🗑️ Excluir permanentemente o passeio "${passeio.destino}"?`)
    ) {
      setPasseios((prev) => prev.filter((p) => p.id !== id))
    }
  }

  // ── Estatísticas rápidas ──────────────────────────────────────────
  const totalPassageiros = passeios.reduce((acc, p) => acc + p.passageirosAlocados, 0)
  const totalReceita = passeios
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + p.valor * p.passageirosAlocados, 0)

  return (
    <div className="flex flex-col h-full gap-6">

      {/* ── Cabeçalho do Módulo ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚌</span>
            <h2 className="text-brand-dark font-bold text-2xl">Módulo de Passeios</h2>
          </div>
          <p className="text-brand-primary/70 text-sm pl-9">
            Gerencie todos os passeios em um quadro visual
          </p>
        </div>

        <button
          id="btn-adicionar-passeio"
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-primary/30 hover:bg-brand-primary/85 hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => alert('Em breve: formulário de novo passeio')}
        >
          <span className="text-base">＋</span>
          Adicionar Novo Passeio
        </button>
      </div>

      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-3 gap-4">
        <ResumoCard
          label="Total de Passeios"
          value={String(passeios.length)}
          icon="🗺️"
          cor="text-brand-primary"
        />
        <ResumoCard
          label="Passageiros Alocados"
          value={String(totalPassageiros)}
          icon="👥"
          cor="text-emerald-600"
        />
        <ResumoCard
          label="Receita Estimada"
          value={totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon="💰"
          cor="text-brand-accent"
        />
      </div>

      {/* ── Board Kanban ── */}
      <div className="flex gap-5 flex-1 overflow-x-auto pb-2">
        {COLUNAS.map((coluna) => {
          const cards = passeios.filter((p) => p.status === coluna.id)

          return (
            <section
              key={coluna.id}
              className={`flex flex-col min-w-[300px] flex-1 rounded-2xl border-2 ${coluna.borderColor} bg-white/50 backdrop-blur-sm overflow-hidden`}
            >
              {/* Cabeçalho da Coluna */}
              <div className={`${coluna.headerColor} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{coluna.icon}</span>
                  <h3 className="text-white font-bold text-sm tracking-wide">
                    {coluna.label}
                  </h3>
                </div>
                <span
                  className={`${coluna.badgeColor} bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full`}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-4xl mb-3 opacity-30">📭</span>
                    <p className="text-brand-dark/40 text-sm">{coluna.emptyText}</p>
                  </div>
                ) : (
                  cards.map((passeio) => (
                    <PasseioCard
                      key={passeio.id}
                      passeio={passeio}
                      onGerarLink={handleGerarLink}
                      onAlocar={handleAlocar}
                      onEditar={handleEditar}
                      onCancelar={handleCancelar}
                      onExcluir={handleExcluir}
                    />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-componente de Resumo ─────────────────────────────────────────
function ResumoCard({
  label,
  value,
  icon,
  cor,
}: {
  label: string
  value: string
  icon: string
  cor: string
}) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-brand-secondary/20 shadow-sm flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-brand-dark/50 text-xs font-medium">{label}</p>
        <p className={`font-bold text-lg ${cor}`}>{value}</p>
      </div>
    </div>
  )
}

export default Passeios
