import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio, Assento, Passageiro, TipoTransporte, Transacao } from '../types'
import { MapaAssentos, gerarAssentos } from './MapaAssentos'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const [selecionandoPassageiro, setSelecionandoPassageiro] = useState(false)
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'lista'>('mapa')
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<string | null>(null)

  // Estado do Sub-modal Financeiro
  const [paxFinanceiro, setPaxFinanceiro] = useState<Passageiro | null>(null)
  const [transacaoPax, setTransacaoPax] = useState<Transacao | null>(null)

  // Campos do Form Financeiro
  const [novoDescontoTipo, setNovoDescontoTipo] = useState<'fixo' | 'porcentagem'>('fixo')
  const [novoDescontoValor, setNovoDescontoValor] = useState<number>(0)
  const [novoPagamentoValor, setNovoPagamentoValor] = useState<number>(0)
  const [novoPagamentoMetodo, setNovoPagamentoMetodo] = useState<string>('pix')

  // Inicializa os passageiros do Firebase
  useEffect(() => {
    if (!passeio) return

    const q = query(collection(db, 'passageiros'), where('passeioId', '==', passeio.id))
    const unsub = onSnapshot(q, (snapshot) => {
      const paxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passageiro))
      setPassageiros(paxs)
      
      // Atualiza pax no modal se tiver aberto
      if (paxFinanceiro) {
        const atualizado = paxs.find(p => p.id === paxFinanceiro.id)
        if (atualizado) setPaxFinanceiro(atualizado)
      }
    })
    return () => unsub()
  }, [passeio, paxFinanceiro?.id])

  // Define veículo inicial se houver frota
  useEffect(() => {
    if (!passeio) return
    if (!veiculoSelecionado && passeio.transportes && passeio.transportes.length > 0) {
      setVeiculoSelecionado(passeio.transportes[0].id)
    }
  }, [passeio, veiculoSelecionado])

  // Inicializa os assentos quando os passageiros ou o veiculoSelecionado mudam
  useEffect(() => {
    if (!passeio) return

    const veiculo = passeio.transportes?.find(v => v.id === veiculoSelecionado)
    const tipoString = veiculo ? veiculo.tipo : (passeio.transporte || 'Onibus 40')
    const tipo = detectarTipo(tipoString)

    const base = gerarAssentos(tipo, [])
    const comOcupados: Assento[] = base.map((a) => {
      const pax = passageiros.find((p) => {
        const mesmoAssento = String(p.numeroPoltrona) === String(a.numero)
        // Se houver veiculoSelecionado, o passageiro também precisa bater com o veículo
        // (A menos que estejamos no modo legado sem veiculoSelecionado)
        const mesmoVeiculo = veiculoSelecionado ? p.veiculoAlocado === veiculoSelecionado : true
        return mesmoAssento && mesmoVeiculo
      })
      return pax ? { ...a, ocupado: true, passageiroId: pax.id } : a
    })
    setAssentos(comOcupados)
  }, [passeio, passageiros, veiculoSelecionado])

  // Carrega transação quando abre modal financeiro
  useEffect(() => {
    if (!paxFinanceiro) {
      setTransacaoPax(null)
      return
    }

    const q = query(collection(db, 'transacoes'), where('passageiroId', '==', paxFinanceiro.id))
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTransacaoPax({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Transacao)
      }
    })
    return () => unsub()
  }, [paxFinanceiro])

  if (!aberto || !passeio) return null

  const veiculo = passeio.transportes?.find(v => v.id === veiculoSelecionado)
  const tipoString = veiculo ? veiculo.tipo : (passeio.transporte || 'Onibus 40')
  const tipo = detectarTipo(tipoString)
  const total = assentos.length
  const livres = assentos.filter((a) => !a.ocupado).length

  // ── Helpers Financeiros ─────────────────────────────────────────────
  const calcularSaldoDevedor = () => {
    if (!paxFinanceiro || !transacaoPax) return 0
    let total = transacaoPax.valorTotal
    
    // Aplica desconto original ou o que está sendo digitado (se for salvar, salvamos o novo)
    // Para simplificar, o devedor visual sempre usa o desconto final que estará na transação.
    // Mas o cálculo do "Restante" usa o desconto do banco de dados (paxFinanceiro.desconto)
    
    // Desconto
    const descontoObj = paxFinanceiro.desconto
    if (descontoObj) {
      if (descontoObj.tipo === 'fixo') total -= descontoObj.valor
      if (descontoObj.tipo === 'porcentagem') total -= (total * descontoObj.valor) / 100
    }
    
    return Math.max(0, total - transacaoPax.valorPago)
  }

  // ── Handlers ──────────────────────────────────────────────────────
  function handleSelecionarAssento(assento: Assento) {
    setAssentoSelecionado((prev) =>
      prev === assento.numero ? null : assento.numero
    )
  }

  async function handleSalvarDesconto() {
    if (!paxFinanceiro || !transacaoPax) return
    if (novoDescontoValor <= 0) return

    try {
      await updateDoc(doc(db, 'passageiros', paxFinanceiro.id), {
        desconto: { tipo: novoDescontoTipo, valor: novoDescontoValor }
      })
      alert('Desconto aplicado com sucesso!')
      setNovoDescontoValor(0)
    } catch (err) {
      console.error(err)
      alert('Erro ao aplicar desconto.')
    }
  }

  async function handleSalvarPagamento() {
    if (!paxFinanceiro || !transacaoPax) return
    if (novoPagamentoValor <= 0) return

    const saldo = calcularSaldoDevedor()
    if (novoPagamentoValor > saldo) {
      alert(`Valor de pagamento (R$ ${novoPagamentoValor}) excede o saldo devedor (R$ ${saldo}).`)
      return
    }

    try {
      const novoHistorico = [...(paxFinanceiro.historicoPagamentos || [])]
      novoHistorico.push({
        id: Date.now().toString(),
        data: new Date().toISOString(),
        valor: novoPagamentoValor,
        metodo: novoPagamentoMetodo
      })

      // Atualiza Passageiro
      await updateDoc(doc(db, 'passageiros', paxFinanceiro.id), {
        historicoPagamentos: novoHistorico
      })

      // Recalcula Transacao
      let totalComDesconto = transacaoPax.valorTotal
      if (paxFinanceiro.desconto) {
        if (paxFinanceiro.desconto.tipo === 'fixo') totalComDesconto -= paxFinanceiro.desconto.valor
        if (paxFinanceiro.desconto.tipo === 'porcentagem') totalComDesconto -= (totalComDesconto * paxFinanceiro.desconto.valor) / 100
      }

      const novoValorPago = transacaoPax.valorPago + novoPagamentoValor
      const novoStatus = novoValorPago >= totalComDesconto ? 'efetivada' : 'parcial'

      // Atualiza Transacao
      await updateDoc(doc(db, 'transacoes', transacaoPax.id), {
        valorPago: novoValorPago,
        status: novoStatus
      })

      alert('Pagamento registrado com sucesso!')
      setNovoPagamentoValor(0)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar pagamento.')
    }
  }

  function handleGerarResumoPDF() {
    if (!passeio) return
    const doc = new jsPDF()
    const totalVagas = assentos.length
    const vagasLivres = assentos.filter(a => !a.ocupado).length
    const vagasOcupadas = totalVagas - vagasLivres

    doc.setFontSize(20)
    doc.text('Resumo do Passeio', 14, 22)
    doc.setFontSize(12)
    doc.text(`Destino: ${passeio.destino}`, 14, 32)
    doc.text(`Data: ${passeio.data.split('-').reverse().join('/')}`, 14, 40)
    doc.text(`Total de Vagas: ${totalVagas}`, 14, 48)
    doc.text(`Vagas Livres: ${vagasLivres}`, 14, 56)
    doc.text(`Vagas Ocupadas: ${vagasOcupadas}`, 14, 64)
    doc.save(`Resumo_${passeio.destino.replace(/\s+/g, '_')}.pdf`)
  }

  function handleListaDetalhadaPDF() {
    if (!passeio) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Lista de Passageiros - ${passeio.destino}`, 14, 20)
    
    const paxsAlocados = passageiros
      .filter(p => p.numeroPoltrona != null)
      .sort((a, b) => Number(a.numeroPoltrona) - Number(b.numeroPoltrona))

    const tableData = paxsAlocados.map(p => [
      p.numeroPoltrona,
      p.nomeCompleto,
      p.whatsapp,
      p.pontoEmbarque || '-'
    ])

    autoTable(doc, {
      startY: 30,
      head: [['Assento', 'Nome Completo', 'WhatsApp', 'Embarque']],
      body: tableData,
    })

    doc.save(`Lista_Detalhada_${passeio.destino.replace(/\s+/g, '_')}.pdf`)
  }

  function handleConfirmarAlocacao() {
    if (!assentoSelecionado) return
    setSelecionandoPassageiro(true)
  }

  async function handleAlocarPassageiro(paxId: string) {
    try {
      await updateDoc(doc(db, 'passageiros', paxId), {
        numeroPoltrona: assentoSelecionado,
        veiculoAlocado: veiculoSelecionado
      })
      setSelecionandoPassageiro(false)
      setAssentoSelecionado(null)
    } catch (err) {
      console.error(err)
      alert('Erro ao alocar passageiro.')
    }
  }

  async function handleDesalocarPassageiro(paxId: string) {
    if(!confirm('Deseja realmente remover este passageiro do assento?')) return
    try {
      await updateDoc(doc(db, 'passageiros', paxId), {
        numeroPoltrona: null
      })
      setAssentoSelecionado(null)
    } catch (err) {
      console.error(err)
      alert('Erro ao desalocar passageiro.')
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm" onClick={onFechar} />

      <div className="relative z-10 bg-brand-light rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Cabeçalho ── */}
        <header className="flex items-center justify-between px-6 py-4 bg-brand-dark text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="font-bold text-lg leading-tight">Gestão de Vendas & Alocação</h2>
              <p className="text-brand-secondary text-xs">
                {passeio.destino} · {passeio.data.split('-').reverse().join('/')} · {passeio.horarioSaida}h saída
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-full bg-green-600/20 text-green-400 text-xs font-semibold">{livres} livres</span>
              <span className="px-2 py-1 rounded-full bg-gray-600/20 text-gray-300 text-xs font-semibold">{total - livres} ocupados</span>
              <span className="px-2 py-1 rounded-full bg-brand-primary/30 text-brand-secondary text-xs font-semibold">{total} total</span>
            </div>
            <button onClick={onFechar} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-lg">
              ✕
            </button>
          </div>
        </header>

        {/* ── Corpo: Duas Colunas ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Overlay de Financeiro se paxFinanceiro existir */}
          {paxFinanceiro && transacaoPax && (
            <div className="absolute inset-0 z-20 bg-brand-light flex flex-col">
              <div className="p-4 bg-white border-b flex justify-between items-center">
                <h3 className="font-bold text-brand-dark">Painel Financeiro: {paxFinanceiro.nomeCompleto}</h3>
                <button onClick={() => setPaxFinanceiro(null)} className="text-brand-dark/50 hover:text-brand-dark">✕ Fechar</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Esquerda: Resumo */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h4 className="font-bold text-sm text-brand-dark mb-4">Resumo da Dívida</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-dark/60">Valor do Passeio:</span>
                        <span className="font-bold">R$ {transacaoPax.valorTotal.toFixed(2)}</span>
                      </div>
                      {paxFinanceiro.desconto && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto ({paxFinanceiro.desconto.tipo === 'porcentagem' ? `${paxFinanceiro.desconto.valor}%` : `R$ ${paxFinanceiro.desconto.valor}`}):</span>
                          <span className="font-bold">- R$ {
                            paxFinanceiro.desconto.tipo === 'porcentagem' 
                              ? (transacaoPax.valorTotal * paxFinanceiro.desconto.valor / 100).toFixed(2) 
                              : paxFinanceiro.desconto.valor.toFixed(2)
                          }</span>
                        </div>
                      )}
                      <div className="flex justify-between text-brand-primary">
                        <span>Valor Pago:</span>
                        <span className="font-bold">R$ {transacaoPax.valorPago.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between text-lg">
                        <span className="font-bold text-brand-dark">Saldo Devedor:</span>
                        <span className={`font-black ${calcularSaldoDevedor() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          R$ {calcularSaldoDevedor().toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs">
                        Status: <span className="uppercase font-bold">{transacaoPax.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h4 className="font-bold text-sm text-brand-dark mb-4">Aplicar Desconto</h4>
                    <div className="flex gap-2 mb-3">
                      <select 
                        value={novoDescontoTipo} 
                        onChange={e => setNovoDescontoTipo(e.target.value as 'fixo' | 'porcentagem')}
                        className="p-2 border rounded-lg text-sm"
                      >
                        <option value="fixo">R$ Fixo</option>
                        <option value="porcentagem">% Porcentagem</option>
                      </select>
                      <input 
                        type="number" 
                        value={novoDescontoValor}
                        onChange={e => setNovoDescontoValor(Number(e.target.value))}
                        className="flex-1 p-2 border rounded-lg text-sm" 
                        placeholder="Valor"
                      />
                    </div>
                    <button onClick={handleSalvarDesconto} className="w-full bg-brand-primary text-white py-2 rounded-lg font-bold text-sm">Aplicar Desconto</button>
                  </div>
                </div>

                {/* Direita: Pagamentos */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h4 className="font-bold text-sm text-brand-dark mb-4">Lançar Pagamento</h4>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="number" 
                        value={novoPagamentoValor}
                        onChange={e => setNovoPagamentoValor(Number(e.target.value))}
                        className="flex-1 p-2 border rounded-lg text-sm" 
                        placeholder="Valor a pagar (Ex: 50.00)"
                      />
                      <select 
                        value={novoPagamentoMetodo} 
                        onChange={e => setNovoPagamentoMetodo(e.target.value)}
                        className="p-2 border rounded-lg text-sm"
                      >
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                      </select>
                    </div>
                    <button onClick={handleSalvarPagamento} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-emerald-700">Lançar Pagamento</button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border shadow-sm h-48 overflow-y-auto">
                    <h4 className="font-bold text-sm text-brand-dark mb-4">Histórico de Pagamentos</h4>
                    {paxFinanceiro.historicoPagamentos && paxFinanceiro.historicoPagamentos.length > 0 ? (
                      <ul className="space-y-2">
                        {paxFinanceiro.historicoPagamentos.map(hp => (
                          <li key={hp.id} className="flex justify-between text-sm border-b pb-1">
                            <span className="text-brand-dark/70">{new Date(hp.data).toLocaleDateString()} - {hp.metodo}</span>
                            <span className="font-bold text-emerald-600">R$ {hp.valor.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-brand-dark/50">Nenhum pagamento registrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COLUNA ESQUERDA: Mapa de Assentos ── */}
          <div className="flex flex-col w-[55%] border-r border-brand-secondary/20 overflow-y-auto p-5 gap-4 flex-shrink-0">
            {/* Abas de Frota */}
            {passeio.transportes && passeio.transportes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-secondary/20">
                {passeio.transportes.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVeiculoSelecionado(v.id)
                      setAssentoSelecionado(null)
                      setSelecionandoPassageiro(false)
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                      veiculoSelecionado === v.id
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-light text-brand-dark hover:bg-brand-secondary/20'
                    }`}
                  >
                    {v.nome}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between relative">
              <h3 className="text-brand-dark font-bold text-sm flex items-center gap-2"><span>🚌</span> Mapa de Assentos — {tipo}</h3>
              {assentoSelecionado && !selecionandoPassageiro && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-dark/60">Assento <strong className="text-brand-primary">{assentoSelecionado}</strong></span>
                  {assentos.find(a => a.numero === assentoSelecionado)?.ocupado ? (
                     <button onClick={() => handleDesalocarPassageiro(assentos.find(a => a.numero === assentoSelecionado)!.passageiroId!)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">✖ Desalocar</button>
                  ) : (
                    <button onClick={handleConfirmarAlocacao} className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/90">➕ Alocar aqui</button>
                  )}
                </div>
              )}
              {selecionandoPassageiro && (
                <div className="absolute right-0 top-10 bg-white shadow-xl border border-brand-secondary/20 rounded-xl z-30 w-80 max-h-80 flex flex-col overflow-hidden">
                   <div className="flex justify-between items-center p-3 border-b bg-brand-light">
                     <h4 className="font-bold text-brand-dark text-xs">Alocar no Assento {assentoSelecionado}</h4>
                     <button onClick={() => setSelecionandoPassageiro(false)} className="text-brand-dark/50 hover:text-brand-dark text-lg leading-none">✕</button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-white">
                      {passageiros.filter(p => !p.numeroPoltrona).map(pax => (
                         <div key={pax.id} className="flex justify-between items-center p-2 border rounded-lg hover:border-brand-primary/50 cursor-pointer bg-brand-light/30" onClick={() => handleAlocarPassageiro(pax.id)}>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-xs truncate text-brand-dark">{pax.nomeCompleto}</p>
                               <p className="text-[10px] text-brand-dark/60 truncate">{pax.whatsapp}</p>
                            </div>
                            <span className="text-[10px] bg-brand-primary text-white px-2 py-1 rounded font-bold ml-2">Selecionar</span>
                         </div>
                      ))}
                      {passageiros.filter(p => !p.numeroPoltrona).length === 0 && (
                         <div className="text-center py-6 text-brand-dark/40 text-xs">
                            Nenhum passageiro sem assento.
                         </div>
                      )}
                   </div>
                </div>
              )}
            </div>
            <MapaAssentos
              key={veiculoSelecionado || 'default'}
              tipoTransporte={tipo}
              assentos={assentos}
              onSelecionarAssento={handleSelecionarAssento}
              assentoSelecionado={assentoSelecionado}
            />
          </div>

          {/* ── COLUNA DIREITA: Passageiros + Ações ── */}
          <div className="flex flex-col flex-1 overflow-hidden bg-white/50">
            <div className="flex gap-2 p-4 border-b border-brand-secondary/20 flex-shrink-0 flex-wrap">
              <button onClick={handleGerarResumoPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20"><span>📄</span> Gerar Resumo</button>
              <button onClick={handleListaDetalhadaPDF} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-secondary/10 border border-brand-secondary/30 text-brand-dark text-xs font-semibold hover:bg-brand-secondary/20"><span>📋</span> Lista Detalhada</button>
            </div>

            <div className="flex border-b border-brand-secondary/20 flex-shrink-0">
              {(['mapa', 'lista'] as const).map((aba) => (
                <button
                  key={aba}
                  onClick={() => setAbaAtiva(aba)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${abaAtiva === aba ? 'border-b-2 border-brand-primary text-brand-primary bg-brand-primary/5' : 'text-brand-dark/50 hover:text-brand-dark'}`}
                >
                  {aba === 'mapa' ? '👥 Passageiros Alocados' : '📊 Detalhes do Passeio'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {abaAtiva === 'mapa' && (
                <div className="space-y-2">
                  {passageiros.length === 0 ? (
                    <div className="text-center py-10 text-brand-dark/40 text-sm">Nenhum passageiro.</div>
                  ) : (
                    [...passageiros]
                      .filter(p => !veiculoSelecionado || p.veiculoAlocado === veiculoSelecionado || (!p.veiculoAlocado && !p.numeroPoltrona))
                      .sort((a, b) => Number(a.numeroPoltrona ?? 0) - Number(b.numeroPoltrona ?? 0))
                      .map((pax) => (
                        <div key={pax.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-brand-secondary/20 hover:border-brand-primary/30">
                          <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">{pax.numeroPoltrona ?? '—'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-brand-dark font-semibold text-xs truncate">{pax.nomeCompleto}</p>
                            <p className="text-brand-dark/50 text-xs">{pax.whatsapp}</p>
                          </div>
                          <button 
                            onClick={() => setPaxFinanceiro(pax)}
                            className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded hover:bg-green-200 transition-colors"
                          >
                            💰 Financeiro
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {abaAtiva === 'lista' && (
                <div className="space-y-3">
                  {[
                    { label: 'Destino', value: passeio.destino, icon: '🗺️' },
                    { label: 'Valor', value: `R$ ${passeio.valor.toFixed(2)}`, icon: '💰' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2 p-3 bg-white rounded-xl border border-brand-secondary/20">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-brand-dark/50 text-[10px] uppercase font-semibold">{item.label}</p>
                        <p className="text-brand-dark font-medium text-xs">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAlocacao
