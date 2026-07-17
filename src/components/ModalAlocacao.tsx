import { useState, useEffect } from 'react'
import type { Passeio, Assento, Passageiro, TipoTransporte } from '../types'
import { MapaAssentos, gerarAssentos } from './MapaAssentos'

// ── Mock de passageiros alocados (será integrado ao Firestore) ────────
const mockPassageiros: Record<string, Passageiro[]> = {
  '1': [
    { id: 'p1', nome: 'Ana Clara Souza', telefone: '(83) 99101-2233', assentoNumero: 3 },
    { id: 'p2', nome: 'Carlos Mendes', telefone: '(83) 98877-5544', assentoNumero: 5 },
    { id: 'p3', nome: 'Fernanda Lima', telefone: '(83) 99234-6677', assentoNumero: 8 },
    { id: 'p4', nome: 'João Pedro Alves', telefone: '(83) 99321-8899', assentoNumero: 12 },
    { id: 'p5', nome: 'Maria das Dores', telefone: '(83) 98811-0022', assentoNumero: 15 },
  ],
  '2': [
    { id: 'p6', nome: 'Lucas Ferreira', telefone: '(83) 99400-1122', assentoNumero: 2 },
    { id: 'p7', nome: 'Beatriz Costa', telefone: '(83) 99500-3344', assentoNumero: 4 },
  ],
}

// ── Helper: detecta o TipoTransporte a partir da string do passeio ────
function detectarTipo(transporte: string): TipoTransporte {
  const t = transporte.toLowerCase()
  if (t.includes('van') && t.includes('14')) return 'Van 14'
  if (t.includes('van') && t.includes('12')) return 'Van 12'
  if (t.includes('50')) return 'Onibus 50'
  return 'Onibus 40'
}

// ── Props do Modal ─────────────────────────────────────────────────────
interface ModalAlocacaoProps {
  passeio: Passeio | null
  aberto: boolean
  onFechar: () => void
}

// ── Componente Principal ───────────────────────────────────────────────
export function ModalAlocacao({ passeio, aberto, onFechar }: ModalAlocacaoProps) {
  const [assentos, setAssentos] = useState<Assento[]>([])
  const [assentoSelecionado, setAssentoSelecionado] = useState<string | number | null>(null)
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'lista'>('mapa')

  // Inicializa os assentos quando o passeio muda
  useEffect(() => {
    if (!passeio) return

    const tipo = detectarTipo(passeio.transporte)
    const passageirosDoPasseio = mockPassageiros[passeio.id] ?? []
    setPassageiros(passageirosDoPasseio)

    // Gera assentos base e marca os ocupados pelos passageiros mockados
    const base = gerarAssentos(tipo, [])
    const comOcupados: Assento[] = base.map((a) => {
      const pax = passageirosDoPasseio.find((p) => String(p.assentoNumero) === String(a.numero))
      return pax ? { ...a, ocupado: true, passageiroId: pax.id } : a
    })
    setAssentos(comOcupados)
    setAssentoSelecionado(null)
  }, [passeio])

  if (!aberto || !passeio) return null

  const tipo = detectarTipo(passeio.transporte)
  const total = assentos.length
  const livres = assentos.filter((a) => !a.ocupado).length

  // ── Handlers ──────────────────────────────────────────────────────
  function handleSelecionarAssento(assento: Assento) {
    setAssentoSelecionado((prev) =>
      prev === assento.numero ? null : assento.numero
    )
  }

  function handleGerarResumoPDF() {
    console.log('[PDF] Gerando Resumo do Passeio:', passeio.destino, { passeio, passageiros })
    alert('📄 Resumo PDF gerado no console! (integração com jsPDF em breve)')
  }

  function handleListaDetalhadaPDF() {
    console.log('[PDF] Gerando Lista Detalhada:', passeio.destino, { passageiros })
    alert('📋 Lista Detalhada PDF gerada no console! (integração com jsPDF em breve)')
  }

  function handleFinanceiro() {
    console.log('[NAV] Navegar para Financeiro do Passeio:', passeio.id)
    alert('💰 Em breve: painel financeiro deste passeio!')
  }

  function handleConfirmarAlocacao() {
    if (!assentoSelecionado) return
    alert(`✅ Assento ${assentoSelecionado} selecionado!\n\nEm breve: formulário de cadastro do passageiro.`)
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Alocação de Passageiros — ${passeio.destino}`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Container do Modal */}
      <div className="relative z-10 bg-brand-light rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Cabeçalho ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-brand-dark text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">Alocação de Passageiros</h2>
              <p className="text-brand-secondary text-xs">
                {passeio.destino} · {passeio.data.split('-').reverse().join('/')} · {passeio.horarioSaida}h saída
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicadores rápidos */}
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">
                {livres} livres
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-600/20 text-gray-300 text-xs font-semibold">
                {total - livres} ocupados
              </span>
              <span className="px-2 py-1 rounded-full bg-brand-primary/30 text-brand-secondary text-xs font-semibold">
                {total} total
              </span>
            </div>
            <button
              onClick={onFechar}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-lg"
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* ── Corpo: Duas Colunas ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── COLUNA ESQUERDA: Mapa de Assentos ── */}
          <div className="flex flex-col w-[55%] border-r border-brand-secondary/20 overflow-y-auto p-5 gap-4 flex-shrink-0">

            <div className="flex items-center justify-between">
              <h3 className="text-brand-dark font-bold text-sm flex items-center gap-2">
                <span>🚌</span> Mapa de Assentos — {tipo}
              </h3>
              {assentoSelecionado && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-dark/60">
                    Assento <strong className="text-brand-primary">{assentoSelecionado}</strong> selecionado
                  </span>
                  <button
                    onClick={handleConfirmarAlocacao}
                    className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/85 transition-colors"
                  >
                    ➕ Alocar aqui
                  </button>
                </div>
              )}
            </div>

            <MapaAssentos
              tipoTransporte={tipo}
              assentos={assentos}
              onSelecionarAssento={handleSelecionarAssento}
              assentoSelecionado={assentoSelecionado}
            />
          </div>

          {/* ── COLUNA DIREITA: Passageiros + Ações ── */}
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Botões de PDF no topo */}
            <div className="flex gap-2 p-4 border-b border-brand-secondary/20 flex-shrink-0 flex-wrap">
              <button
                id="btn-resumo-pdf"
                onClick={handleGerarResumoPDF}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 transition-colors"
              >
                <span>📄</span> Gerar Resumo (PDF)
              </button>
              <button
                id="btn-lista-pdf"
                onClick={handleListaDetalhadaPDF}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-secondary/10 border border-brand-secondary/30 text-brand-dark text-xs font-semibold hover:bg-brand-secondary/20 transition-colors"
              >
                <span>📋</span> Lista Detalhada (PDF)
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-brand-secondary/20 flex-shrink-0">
              {(['mapa', 'lista'] as const).map((aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    abaAtiva === aba
                      ? 'border-b-2 border-brand-primary text-brand-primary bg-brand-primary/5'
                      : 'text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5'
                  }`}
                >
                  {aba === 'mapa' ? '👥 Passageiros Alocados' : '📊 Detalhes do Passeio'}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 overflow-y-auto p-4">

              {abaAtiva === 'mapa' && (
                <div className="space-y-2">
                  {passageiros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <span className="text-4xl mb-3">👤</span>
                      <p className="text-brand-dark/40 text-sm">Nenhum passageiro alocado ainda.</p>
                      <p className="text-brand-dark/30 text-xs mt-1">
                        Selecione um assento no mapa e clique em "Alocar aqui".
                      </p>
                    </div>
                  ) : (
                    passageiros.map((pax, idx) => (
                      <div
                        key={pax.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-brand-secondary/20 hover:border-brand-primary/30 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0">
                          {idx + 1}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-dark font-semibold text-xs truncate">{pax.nome}</p>
                          <p className="text-brand-dark/50 text-xs">{pax.telefone}</p>
                        </div>
                        {/* Assento */}
                        <div className="flex-shrink-0 flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                          <span className="text-xs">💺</span>
                          <span className="text-green-700 text-xs font-bold">{pax.assentoNumero}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {abaAtiva === 'lista' && (
                <div className="space-y-3">
                  {[
                    { label: 'Destino', value: passeio.destino, icon: '🗺️' },
                    { label: 'Local', value: passeio.local, icon: '📍' },
                    { label: 'Data', value: passeio.data.split('-').reverse().join('/'), icon: '📅' },
                    { label: 'Saída', value: passeio.horarioSaida, icon: '🕐' },
                    { label: 'Retorno', value: passeio.horarioRetorno, icon: '🕐' },
                    { label: 'Valor', value: `R$ ${passeio.valor.toFixed(2)}`, icon: '💰' },
                    { label: 'Transporte', value: passeio.transporte, icon: '🚌' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-brand-secondary/20">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-brand-dark/50 text-[10px] uppercase tracking-wider font-semibold">{item.label}</p>
                        <p className="text-brand-dark font-medium text-xs">{item.value}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-white rounded-xl border border-brand-secondary/20">
                    <p className="text-brand-dark/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5">📍 Embarques</p>
                    <ul className="space-y-1">
                      {passeio.locaisEmbarque.map((local, i) => (
                        <li key={i} className="text-brand-dark text-xs flex items-start gap-1">
                          <span className="text-brand-accent">•</span> {local}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── Rodapé: Botão Financeiro ── */}
            <div className="p-4 border-t border-brand-secondary/20 flex-shrink-0">
              <button
                id="btn-financeiro-passeio"
                onClick={handleFinanceiro}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-accent text-brand-dark font-bold text-sm hover:bg-brand-accent/85 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
              >
                <span>💰</span> Financeiro deste Passeio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAlocacao
