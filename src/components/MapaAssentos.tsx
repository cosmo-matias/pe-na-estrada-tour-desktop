import type { Assento, TipoTransporte } from '../types'

interface MapaAssentosProps {
  tipoTransporte: TipoTransporte
  assentos: Assento[]
  onSelecionarAssento?: (assento: Assento) => void
  assentoSelecionado?: string | number | null
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Gera array de assentos para um dado tipo de transporte */
export function gerarAssentos(tipo: TipoTransporte, alocados: Assento[] = []): Assento[] {
  const total =
    tipo === 'Onibus 50' ? 50
    : tipo === 'Onibus 40' ? 40
    : tipo === 'Van 14' ? 14
    : 12

  return Array.from({ length: total }, (_, i) => {
    const numero = i + 1
    const existente = alocados.find((a) => String(a.numero) === String(numero))
    return existente ?? { numero, ocupado: false }
  })
}

// ── Sub-componente: Poltrona ──────────────────────────────────────────
function Poltrona({
  assento,
  selecionado,
  onClick,
}: {
  assento: Assento
  selecionado: boolean
  onClick: () => void
}) {
  const { numero, ocupado } = assento

  const base = 'relative flex flex-col items-center justify-center w-10 h-11 rounded-t-xl border-2 text-xs font-bold transition-all duration-150 select-none'

  const estilo = ocupado
    ? `${base} bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed`
    : selecionado
      ? `${base} bg-brand-accent border-brand-alert text-brand-dark cursor-pointer scale-105 shadow-md`
      : `${base} bg-green-600 border-green-700 text-white cursor-pointer hover:bg-green-500 hover:scale-105 hover:shadow-md`

  return (
    <button
      className={estilo}
      onClick={ocupado ? undefined : onClick}
      disabled={ocupado}
      title={ocupado ? `Assento ${numero} — Ocupado` : `Assento ${numero} — Livre`}
      id={`assento-${numero}`}
    >
      {/* Encosto visual */}
      <div className={`absolute top-0 left-1 right-1 h-2 rounded-t-lg ${ocupado ? 'bg-gray-400' : selecionado ? 'bg-brand-alert' : 'bg-green-700'}`} />
      <span className="mt-1 z-10">{numero}</span>
    </button>
  )
}

// ── Sub-componente: Célula vazia (corredor) ───────────────────────────
function Corredor() {
  return <div className="w-4" aria-hidden="true" />
}

// ── Sub-componente: Etiqueta decorativa ──────────────────────────────
function Etiqueta({ texto, cor = 'bg-brand-dark/10 text-brand-dark/60' }: { texto: string; cor?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${cor}`}>
      {texto}
    </div>
  )
}

// ── Layout: Ônibus (40 ou 50 lugares) ────────────────────────────────
function LayoutOnibus({
  assentos,
  onSelect,
  selecionado,
}: {
  assentos: Assento[]
  onSelect: (a: Assento) => void
  selecionado: string | number | null
}) {
  const total = assentos.length
  // Ônibus: 4 colunas (A B | C D), corredor no meio
  // Fileiras de 4, com corredor central
  const fileiras: Assento[][] = []
  for (let i = 0; i < total; i += 4) {
    fileiras.push(assentos.slice(i, i + 4))
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Frente do ônibus */}
      <div className="flex items-center gap-2 mb-2">
        <Etiqueta texto="🚪 Porta" cor="bg-blue-100 text-blue-700" />
        <div className="flex-1 h-px bg-brand-dark/10" />
        <Etiqueta texto="🧭 Motorista" cor="bg-yellow-100 text-yellow-700" />
      </div>

      {/* Legenda de colunas */}
      <div className="flex gap-2 items-center mb-1 pl-1">
        <span className="w-10 text-center text-[10px] text-brand-dark/40 font-semibold">A</span>
        <span className="w-10 text-center text-[10px] text-brand-dark/40 font-semibold">B</span>
        <Corredor />
        <span className="w-10 text-center text-[10px] text-brand-dark/40 font-semibold">C</span>
        <span className="w-10 text-center text-[10px] text-brand-dark/40 font-semibold">D</span>
      </div>

      {/* Fileiras */}
      {fileiras.map((fileira, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          {/* Lado esquerdo: A e B */}
          {fileira[0] && (
            <Poltrona
              assento={fileira[0]}
              selecionado={selecionado === fileira[0].numero}
              onClick={() => onSelect(fileira[0])}
            />
          )}
          {fileira[1] && (
            <Poltrona
              assento={fileira[1]}
              selecionado={selecionado === fileira[1].numero}
              onClick={() => onSelect(fileira[1])}
            />
          )}

          <Corredor />

          {/* Lado direito: C e D */}
          {fileira[2] && (
            <Poltrona
              assento={fileira[2]}
              selecionado={selecionado === fileira[2].numero}
              onClick={() => onSelect(fileira[2])}
            />
          )}
          {fileira[3] && (
            <Poltrona
              assento={fileira[3]}
              selecionado={selecionado === fileira[3].numero}
              onClick={() => onSelect(fileira[3])}
            />
          )}

          {/* Número da fileira */}
          <span className="text-[10px] text-brand-dark/30 ml-1 w-4">{idx + 1}</span>
        </div>
      ))}

      {/* Fundo do ônibus: WC */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <div className="flex-1 h-px bg-brand-dark/10" />
        <Etiqueta texto="🚻 WC" cor="bg-purple-100 text-purple-700" />
      </div>
    </div>
  )
}

// ── Layout: Van (12 ou 14 lugares) ───────────────────────────────────
function LayoutVan({
  assentos,
  onSelect,
  selecionado,
}: {
  assentos: Assento[]
  onSelect: (a: Assento) => void
  selecionado: string | number | null
}) {
  // Van padrão: Motorista + 1 (1ª fila), depois fileiras de 3
  // Van 14: 1+1 | 3 | 3 | 3 | 3  →  total 14
  // Van 12: 1+1 | 3 | 3 | 3 | 1  →  total 12 (última fileira menor)
  const total = assentos.length

  // Fileira 1: assento 1 (motorista) — exibimos como célula especial
  // Assentos passageiros: restantes
  const passageiros = assentos // todos numerados a partir de 1

  // Agrupar em fileiras:  [0] = 2 assentos (banco da frente com motorista), resto = 3 por fileira
  const fileiras: Assento[][] = []

  if (total <= 14) {
    // Fileira 1: 2 (poltrona 1 = copiloto, motorista é fixo)
    fileiras.push(passageiros.slice(0, 2))
    // Demais fileiras de 3
    for (let i = 2; i < total; i += 3) {
      fileiras.push(passageiros.slice(i, i + 3))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Frente da Van */}
      <div className="flex items-center gap-2 mb-2">
        <Etiqueta texto="🚐 Frente" cor="bg-blue-100 text-blue-700" />
        <div className="flex-1 h-px bg-brand-dark/10" />
      </div>

      {fileiras.map((fileira, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          {idx === 0 ? (
            // Primeira fileira: motorista (fixo) + copiloto
            <>
              <div className="flex items-center justify-center w-10 h-11 rounded-t-xl border-2 border-dashed border-brand-dark/20 bg-brand-dark/5 text-[10px] text-brand-dark/40 font-bold">
                🧑‍✈️
              </div>
              <Corredor />
              {fileira[0] && (
                <Poltrona
                  assento={fileira[0]}
                  selecionado={selecionado === fileira[0].numero}
                  onClick={() => onSelect(fileira[0])}
                />
              )}
              {fileira[1] && (
                <Poltrona
                  assento={fileira[1]}
                  selecionado={selecionado === fileira[1].numero}
                  onClick={() => onSelect(fileira[1])}
                />
              )}
            </>
          ) : (
            // Demais fileiras: 3 assentos lado a lado
            <>
              {fileira.map((assento) => (
                <Poltrona
                  key={assento.numero}
                  assento={assento}
                  selecionado={selecionado === assento.numero}
                  onClick={() => onSelect(assento)}
                />
              ))}
            </>
          )}
          <span className="text-[10px] text-brand-dark/30 ml-1 w-4">{idx + 1}</span>
        </div>
      ))}

      {/* Fundo da Van */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-px bg-brand-dark/10" />
        <Etiqueta texto="🚪 Porta Traseira" cor="bg-blue-100 text-blue-700" />
      </div>
    </div>
  )
}

// ── Componente Principal: MapaAssentos ────────────────────────────────
export function MapaAssentos({
  tipoTransporte,
  assentos,
  onSelecionarAssento,
  assentoSelecionado = null,
}: MapaAssentosProps) {
  const isOnibus = tipoTransporte.startsWith('Onibus')
  const total = assentos.length
  const livres = assentos.filter((a) => !a.ocupado).length
  const ocupados = total - livres

  function handleSelect(assento: Assento) {
    onSelecionarAssento?.(assento)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legenda */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-xs text-brand-dark/70">Livre ({livres})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gray-300" />
          <span className="text-xs text-brand-dark/70">Ocupado ({ocupados})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-brand-accent border border-brand-alert" />
          <span className="text-xs text-brand-dark/70">Selecionado</span>
        </div>
      </div>

      {/* Veículo */}
      <div className="bg-white border-2 border-brand-dark/10 rounded-2xl p-4 shadow-inner overflow-auto max-h-[480px]">
        {isOnibus ? (
          <LayoutOnibus
            assentos={assentos}
            onSelect={handleSelect}
            selecionado={assentoSelecionado}
          />
        ) : (
          <LayoutVan
            assentos={assentos}
            onSelect={handleSelect}
            selecionado={assentoSelecionado}
          />
        )}
      </div>

      {/* Tipo do veículo */}
      <p className="text-center text-xs text-brand-dark/40 font-medium tracking-wider uppercase">
        {tipoTransporte} · {total} lugares
      </p>
    </div>
  )
}

export default MapaAssentos
