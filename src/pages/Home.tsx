import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio, Passageiro, TipoTransporte } from '../types'

function detectarTipo(transporte: string): TipoTransporte {
  const t = transporte.toLowerCase()
  if (t.includes('van') && t.includes('14')) return 'Van 14'
  if (t.includes('van') && t.includes('12')) return 'Van 12'
  if (t.includes('50')) return 'Onibus 50'
  return 'Onibus 40'
}

function getCapacidade(tipo: TipoTransporte): number {
  if (tipo === 'Onibus 50') return 50
  if (tipo === 'Onibus 40') return 40
  if (tipo === 'Van 14') return 14
  return 12
}

export function Home() {
  const [passeios, setPasseios] = useState<Passeio[]>([])
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])

  useEffect(() => {
    const unsubPasseios = onSnapshot(collection(db, 'passeios'), (snapshot) => {
      const ps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passeio))
      setPasseios(ps)
    })

    const unsubPassageiros = onSnapshot(collection(db, 'passageiros'), (snapshot) => {
      const paxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passageiro))
      setPassageiros(paxs)
    })

    return () => {
      unsubPasseios()
      unsubPassageiros()
    }
  }, [])

  const proximosPasseios = useMemo(() => {
    return passeios
      .filter((p) => p.status === 'a_realizar')
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }, [passeios])

  const totalPassageiros = passageiros.length

  const ocupacaoGlobal = useMemo(() => {
    if (proximosPasseios.length === 0) return 0
    let totalCapacidade = 0
    let totalAlocados = 0

    proximosPasseios.forEach((p) => {
      const capacidade = getCapacidade(detectarTipo(p.transporte))
      const alocados = passageiros.filter(pax => pax.passeioId === p.id).length
      totalCapacidade += capacidade
      totalAlocados += alocados
    })

    if (totalCapacidade === 0) return 0
    return Math.round((totalAlocados / totalCapacidade) * 100)
  }, [proximosPasseios, passageiros])

  return (
    <div className="space-y-8">
      {/* Banner de Boas-Vindas */}
      <div className="bg-gradient-to-br from-brand-dark to-brand-primary rounded-2xl p-8 text-white shadow-xl">
        <h3 className="text-2xl font-bold mb-2">Bem-vindo ao Gerenciador 👋</h3>
        <p className="text-brand-light/80 text-sm leading-relaxed max-w-lg">
          Gerencie passeios, passageiros e finanças da{' '}
          <strong>Pé Na Estrada Tour</strong> em um único lugar.
          Acompanhe abaixo os seus próximos destinos.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-secondary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand-primary bg-opacity-15 mb-4 text-brand-primary">
            <span className="text-xl">👥</span>
          </div>
          <p className="text-brand-dark font-bold text-3xl">{totalPassageiros}</p>
          <p className="text-brand-dark/50 text-xs mt-1 font-bold uppercase tracking-wider">Passageiros Cadastrados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-secondary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500 bg-opacity-15 mb-4 text-emerald-500">
            <span className="text-xl">🚌</span>
          </div>
          <p className="text-brand-dark font-bold text-3xl">{proximosPasseios.length}</p>
          <p className="text-brand-dark/50 text-xs mt-1 font-bold uppercase tracking-wider">Próximos Passeios</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-brand-secondary/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand-accent bg-opacity-15 mb-4 text-brand-accent">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-brand-dark font-bold text-3xl">{ocupacaoGlobal}%</p>
          <p className="text-brand-dark/50 text-xs mt-1 font-bold uppercase tracking-wider">Taxa de Ocupação Global</p>
        </div>
      </div>

      {/* Agenda de Passeios */}
      <div>
        <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
          <span>📅</span> Próximos Destinos
        </h3>
        {proximosPasseios.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-secondary/20 p-10 text-center shadow-sm">
            <span className="text-4xl">🏖️</span>
            <p className="text-brand-dark/60 font-medium mt-3">Nenhum passeio agendado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {proximosPasseios.map((passeio) => {
              const capacidade = getCapacidade(detectarTipo(passeio.transporte))
              const alocados = passageiros.filter((p) => p.passeioId === passeio.id).length
              const faltam = capacidade - alocados
              const porcentagem = Math.min(100, Math.round((alocados / capacidade) * 100))
              const quaseLotado = porcentagem >= 80

              return (
                <div key={passeio.id} className="bg-white rounded-2xl border border-brand-secondary/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header do Card */}
                  <div className="p-5 border-b border-brand-secondary/10">
                    <h4 className="font-bold text-lg text-brand-dark mb-1 truncate" title={passeio.destino}>
                      {passeio.destino}
                    </h4>
                    <div className="flex items-center gap-4 text-xs font-semibold text-brand-dark/60">
                      <span className="flex items-center gap-1"><span>📅</span> {new Date(passeio.data).toLocaleDateString('pt-BR')}</span>
                      <span className="flex items-center gap-1"><span>🕐</span> {passeio.horarioSaida}h</span>
                    </div>
                  </div>
                  
                  {/* Corpo do Card (Lotação) */}
                  <div className="p-5 bg-brand-light/20">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-brand-dark/50 mb-0.5">Lotação</p>
                        <p className="text-sm font-bold text-brand-dark">
                          {alocados} de {capacidade} vagas preenchidas
                        </p>
                      </div>
                      <p className={`text-xs font-bold ${faltam === 0 ? 'text-brand-primary' : quaseLotado ? 'text-brand-alert' : 'text-emerald-600'}`}>
                        {faltam === 0 ? 'Lotação Máxima!' : `Faltam ${faltam}`}
                      </p>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="h-2.5 w-full bg-brand-secondary/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${quaseLotado ? 'bg-brand-alert' : 'bg-brand-primary'}`}
                        style={{ width: `${porcentagem}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
