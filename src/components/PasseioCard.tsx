import type { Passeio } from '../types'

interface PasseioCardProps {
  passeio: Passeio
  onGerarLink?: (id: string) => void
  onAlocar?: (passeio: Passeio) => void
  onEditar?: (id: string) => void
  onCancelar?: (id: string) => void
  onExcluir?: (id: string) => void
}

// ── Helpers ──────────────────────────────────────────────────────────
function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Componente ───────────────────────────────────────────────────────
export function PasseioCard({
  passeio,
  onGerarLink,
  onAlocar,
  onEditar,
  onCancelar,
  onExcluir,
}: PasseioCardProps) {
  const {
    id,
    destino,
    local,
    data,
    horarioSaida,
    horarioRetorno,
    valor,
    locaisEmbarque,
    transporte,
    quantidadeTransporte,
    passageirosAlocados,
    imageUrl,
  } = passeio

  // Regra de negócio visual: Cancelar vs Excluir
  const podeCancelar = passageirosAlocados > 0

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-brand-secondary/20 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* ── Imagem do Destino ── */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={imageUrl}
          alt={`Praia destino ${destino}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80'
          }}
        />
        {/* Overlay com destino */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent flex items-end p-3">
          <div>
            <p className="text-white font-bold text-base leading-tight">{destino}</p>
            <p className="text-brand-light/80 text-xs truncate">{local}</p>
          </div>
        </div>
        {/* Badge de ocupação */}
        <div className="absolute top-2.5 right-2.5 bg-brand-dark/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
          <span className="text-xs">👥</span>
          <span className="text-white text-xs font-semibold">{passageirosAlocados}</span>
        </div>
      </div>

      {/* ── Informações Vitais ── */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Data e Horários */}
        <div className="grid grid-cols-3 gap-2">
          <InfoChip icon="📅" label="Data" value={formatarData(data)} />
          <InfoChip icon="🕐" label="Saída" value={horarioSaida} />
          <InfoChip icon="🕐" label="Retorno" value={horarioRetorno} />
        </div>

        {/* Valor */}
        <div className="flex items-center justify-between">
          <span className="text-brand-dark/60 text-xs font-medium">Valor por pessoa</span>
          <span className="text-brand-primary font-bold text-base">{formatarValor(valor)}</span>
        </div>

        {/* Transporte */}
        <div className="flex items-center gap-2 bg-brand-light rounded-lg px-3 py-2">
          <span className="text-sm">🚌</span>
          <div className="min-w-0">
            <p className="text-brand-dark text-xs font-semibold truncate">{transporte}</p>
            <p className="text-brand-primary/70 text-xs">{quantidadeTransporte}x unidade(s)</p>
          </div>
        </div>

        {/* Locais de Embarque */}
        <div>
          <p className="text-brand-dark/50 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Embarques
          </p>
          <ul className="space-y-1">
            {locaisEmbarque.map((local, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-brand-accent mt-0.5 text-xs">📍</span>
                <span className="text-brand-dark text-xs leading-snug">{local}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Botões de Ação ── */}
      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        {/* Linha 1: Gerar Link + Alocar */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id={`btn-gerarlink-${id}`}
            onClick={() => onGerarLink?.(id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-light border border-brand-secondary/40 text-brand-primary text-xs font-semibold hover:bg-brand-secondary/20 transition-colors"
          >
            <span>🔗</span> Gerar Link
          </button>
          <button
            id={`btn-alocar-${id}`}
            onClick={() => onAlocar?.(passeio)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/85 transition-colors shadow-sm shadow-brand-primary/30"
          >
            <span>➕</span> Alocar
          </button>
        </div>

        {/* Linha 2: Editar + Cancelar/Excluir */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id={`btn-editar-${id}`}
            onClick={() => onEditar?.(id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-dark/5 border border-brand-dark/10 text-brand-dark text-xs font-semibold hover:bg-brand-dark/10 transition-colors"
          >
            <span>✏️</span> Editar
          </button>

          {/* Regra de negócio: Cancelar (tem passageiros) vs Excluir (vazio) */}
          {podeCancelar ? (
            <button
              id={`btn-cancelar-${id}`}
              onClick={() => onCancelar?.(id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-alert/10 border border-brand-alert/30 text-brand-alert text-xs font-semibold hover:bg-brand-alert/20 transition-colors"
            >
              <span>⚠️</span> Cancelar
            </button>
          ) : (
            <button
              id={`btn-excluir-${id}`}
              onClick={() => onExcluir?.(id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
            >
              <span>🗑️</span> Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Sub-componente auxiliar ──────────────────────────────────────────
function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-brand-light rounded-lg px-2 py-1.5 text-center">
      <p className="text-brand-dark/50 text-[10px] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-brand-dark font-bold text-xs mt-0.5 flex items-center justify-center gap-1">
        <span>{icon}</span> {value}
      </p>
    </div>
  )
}

export default PasseioCard
