import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passageiro, Passeio } from '../types'
import { ModalPassageiroForm } from '../components/ModalPassageiroForm'
import { ModalPassageiroDetalhes } from '../components/ModalPassageiroDetalhes'

// Helper: Calcula idade exata

function formatarAniversario(data?: string): string {
  if (!data) return '-'
  const partes = data.split('-')
  if (partes.length === 3) return `${partes[2]}/${partes[1]}`
  return data
}

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '-'
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--
  }
  return `${idade} anos`
}

export function Passageiros() {
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])
  const [passeios, setPasseios] = useState<Passeio[]>([])
  const [filtroPasseioId, setFiltroPasseioId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [modalFormAberto, setModalFormAberto] = useState(false)
  const [passageiroEdicao, setPassageiroEdicao] = useState<Passageiro | undefined>(undefined)

  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)
  const [passageiroDetalhe, setPassageiroDetalhe] = useState<Passageiro | undefined>(undefined)

  useEffect(() => {
    // Busca os passageiros em tempo real
    const unsubPassageiros = onSnapshot(collection(db, 'passageiros'), (snapshot) => {
      const paxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passageiro))
      setPassageiros(paxs)
    })

    // Busca os passeios em tempo real (para podermos cruzar dados e aplicar a regra de segurança no Delete)
    const unsubPasseios = onSnapshot(collection(db, 'passeios'), (snapshot) => {
      const pts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passeio))
      setPasseios(pts)
      setLoading(false)
    })

    return () => {
      unsubPassageiros()
      unsubPasseios()
    }
  }, [])

  const handleDelete = async (passageiro: Passageiro) => {
    // Encontra o passeio vinculado
    const passeioVinculado = passeios.find(p => p.id === passageiro.passeioId)
    
    // Regra de Negócio de Segurança
    if (passeioVinculado && passeioVinculado.status === 'a_realizar') {
      alert('Ação bloqueada: Este passageiro está vinculado a um passeio futuro.')
      return
    }

    if (window.confirm(`Tem certeza que deseja excluir o passageiro ${passageiro.nomeCompleto}?`)) {
      try {
        await deleteDoc(doc(db, 'passageiros', passageiro.id))
      } catch (error) {
        console.error("Erro ao deletar passageiro:", error)
        alert('Ocorreu um erro ao excluir o passageiro.')
      }
    }
  }

  // Filtragem e Ordenação
  const passageirosFiltrados = passageiros
    .filter(p => (filtroPasseioId ? p.passeioId === filtroPasseioId : true))
    .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <ModalPassageiroForm
        aberto={modalFormAberto}
        onFechar={() => setModalFormAberto(false)}
        passageiroEdicao={passageiroEdicao}
        passeios={passeios}
      />

      <ModalPassageiroDetalhes
        aberto={modalDetalhesAberto}
        onFechar={() => setModalDetalhesAberto(false)}
        passageiro={passageiroDetalhe}
        todosPassageiros={passageiros}
        passeios={passeios}
        onEditar={(pax) => {
          setPassageiroEdicao(pax)
          setModalFormAberto(true)
        }}
      />

      {/* Header e Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-secondary/20 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Gestão de Passageiros</h2>
          <p className="text-sm text-brand-dark/60">Visualize e filtre seus clientes</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-brand-dark">Filtrar por Passeio:</label>
            <select
              value={filtroPasseioId}
              onChange={(e) => setFiltroPasseioId(e.target.value)}
              className="px-4 py-2 bg-brand-light border border-brand-secondary/50 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
            >
              <option value="">Todos os Passageiros</option>
              {passeios.map(p => (
                <option key={p.id} value={p.id}>
                  {p.destino} - {new Date(p.data).toLocaleDateString('pt-BR')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setPassageiroEdicao(undefined)
              setModalFormAberto(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white font-semibold text-sm rounded-xl shadow-sm hover:bg-brand-primary/85 transition-all"
          >
            <span>＋</span>
            Novo Passageiro
          </button>
        </div>
      </div>

      {/* Tabela de Passageiros */}
      <div className="bg-white rounded-2xl border border-brand-secondary/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-light border-b border-brand-secondary/20 text-xs uppercase tracking-wider text-brand-dark/70">
                <th className="p-4 font-bold">Nome</th>
                <th className="p-4 font-bold">Idade</th>
                <th className="p-4 font-bold">Aniversário</th>
                <th className="p-4 font-bold">WhatsApp</th>
                <th className="p-4 font-bold">Passeio Vinculado</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-secondary/10">
              {passageirosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-dark/60">
                    Nenhum passageiro encontrado.
                  </td>
                </tr>
              ) : (
                passageirosFiltrados.map((pax) => {
                  const passeio = passeios.find(p => p.id === pax.passeioId)
                  return (
                    <tr 
                      key={pax.id} 
                      className="hover:bg-brand-light/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setPassageiroDetalhe(pax)
                        setModalDetalhesAberto(true)
                      }}
                    >
                      <td className="p-4 font-medium text-brand-dark">{pax.nomeCompleto}</td>
                      <td className="p-4 text-brand-dark/80">{calcularIdade(pax.dataNascimento)}</td>
                      <td className="p-4 text-brand-dark/80">{formatarAniversario(pax.dataNascimento)}</td>
                      <td className="p-4 text-brand-dark/80">{pax.whatsapp || '-'}</td>
                      <td className="p-4">
                        {passeio ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-primary/10 text-brand-primary">
                            {passeio.destino}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-alert">Passeio excluído</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(pax)
                          }}
                          title="Excluir Passageiro"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-brand-alert/10 text-brand-alert transition-colors"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
