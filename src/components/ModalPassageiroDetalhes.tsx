import type { Passageiro, Passeio } from '../types'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

interface ModalPassageiroDetalhesProps {
  aberto: boolean
  onFechar: () => void
  passageiro?: Passageiro
  todosPassageiros: Passageiro[]
  passeios: Passeio[]
  onEditar?: (passageiro: Passageiro) => void
}

export function ModalPassageiroDetalhes({ aberto, onFechar, passageiro, todosPassageiros, passeios, onEditar }: ModalPassageiroDetalhesProps) {
  const [mostrarCpf, setMostrarCpf] = useState(false)
  const [ltv, setLtv] = useState<number>(0)
  const [loadingLtv, setLoadingLtv] = useState(true)

  useEffect(() => {
    if (!aberto || !passageiro) return

    const fetchLtv = async () => {
      setLoadingLtv(true)
      try {
        const q = query(
          collection(db, 'transacoes'),
          where('passageiroId', '==', passageiro.id)
        )
        const querySnapshot = await getDocs(q)
        let total = 0
        querySnapshot.forEach(doc => {
          const data = doc.data()
          total += Number(data.valorPago || 0)
        })
        setLtv(total)
      } catch (error) {
        console.error('Erro ao buscar LTV:', error)
      } finally {
        setLoadingLtv(false)
      }
    }

    fetchLtv()
  }, [aberto, passageiro])

  if (!aberto || !passageiro) return null

  // Identifica o histórico de passeios desse CPF
  const mesmoCliente = todosPassageiros.filter(p => p.cpf === passageiro.cpf)
  const historicoPasseios = mesmoCliente.map(pax => {
    const passeioRef = passeios.find(pts => pts.id === pax.passeioId)
    return {
      passageiroLocal: pax,
      passeio: passeioRef
    }
  }).filter(item => item.passeio)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-brand-secondary/20 bg-brand-light">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
              {passageiro.nomeCompleto.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark leading-none">
                {passageiro.nomeCompleto}
              </h2>
              <p className="text-brand-dark/50 text-sm mt-1 flex items-center gap-2">
                <span>📱 {passageiro.whatsapp}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onFechar()
                onEditar?.(passageiro)
              }}
              className="px-4 py-2 bg-brand-dark/5 text-brand-dark rounded-xl text-sm font-semibold hover:bg-brand-dark/10"
            >
              Editar
            </button>
            <button
              onClick={onFechar}
              className="w-10 h-10 rounded-full bg-white border border-brand-secondary/30 flex items-center justify-center text-brand-dark/60 hover:bg-brand-secondary/20 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Dados Pessoais Seguros */}
          <section>
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🛡️</span> Dados Pessoais (Admin)
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-brand-light/50 p-4 rounded-2xl border border-brand-secondary/20">
              <div>
                <p className="text-xs font-bold text-brand-dark/50 uppercase">CPF</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-medium text-brand-dark">{mostrarCpf ? passageiro.cpf : '***.***.***-**'}</p>
                  <button onClick={() => setMostrarCpf(!mostrarCpf)} className="text-xs bg-brand-secondary/20 px-2 py-0.5 rounded-md hover:bg-brand-secondary/40">
                    {mostrarCpf ? 'Esconder' : 'Revelar'}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark/50 uppercase">Data Nasc.</p>
                <p className="font-medium text-brand-dark mt-0.5">{new Date(passageiro.dataNascimento).toLocaleDateString('pt-BR')} (Aniversário)</p>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark/50 uppercase">Emergência</p>
                <p className="font-medium text-brand-dark mt-0.5">{passageiro.contatoEmergencia || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-dark/50 uppercase">Endereço</p>
                <p className="font-medium text-brand-dark mt-0.5 truncate" title={`${passageiro.endereco.logradouro}, ${passageiro.endereco.bairro} - ${passageiro.endereco.cidade}/${passageiro.endereco.estado}`}>
                  {passageiro.endereco.cidade} / {passageiro.endereco.estado}
                </p>
              </div>
            </div>
          </section>

          {/* LTV - Lifetime Value */}
          <section>
            <div className="bg-brand-light border-2 border-brand-primary/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-0.5">Total Investido em Viagens</h3>
                  <p className="text-brand-dark/60 text-xs">Lifetime Value (LTV) acumulado do cliente</p>
                </div>
              </div>
              <div className="md:text-right">
                {loadingLtv ? (
                  <div className="animate-pulse h-8 w-32 bg-brand-secondary/30 rounded-lg"></div>
                ) : (
                  <span className="text-2xl font-black text-brand-primary">
                    {ltv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Histórico de Passeios */}
          <section>
            <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🚌</span> Histórico de Viagens ({historicoPasseios.length})
            </h3>
            <div className="space-y-3">
              {historicoPasseios.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-brand-secondary/30 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={item.passeio?.imageUrl} alt={item.passeio?.destino} className="w-12 h-12 rounded-lg object-cover" onError={e => (e.currentTarget.src = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80')} />
                    <div>
                      <h4 className="font-bold text-brand-dark">{item.passeio?.destino}</h4>
                      <p className="text-xs text-brand-dark/60 mt-0.5">{item.passeio?.data ? new Date(item.passeio.data).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-brand-primary mb-1 tracking-wider">Status Alocação</p>
                    {item.passageiroLocal.statusAlocacao === 'alocado' ? (
                      <span className="inline-flex px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">Poltrona {item.passageiroLocal.numeroPoltrona}</span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-md bg-brand-alert/10 text-brand-alert text-xs font-bold">Não alocado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
