import { useState, useEffect } from 'react'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passageiro, Passeio } from '../types'

// Helper: Calcula idade exata
function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }
  return idade
}

export function Passageiros() {
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])
  const [passeios, setPasseios] = useState<Passeio[]>([])
  const [filtroPasseioId, setFiltroPasseioId] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="font-bold text-brand-primary">Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-secondary/20 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Gestão de Passageiros</h2>
          <p className="text-sm text-brand-dark/60">Visualize e filtre seus clientes</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-brand-dark">Filtrar por Passeio:</label>
          <select
            value={filtroPasseioId}
            onChange={(e) => setFiltroPasseioId(e.target.value)}
            className="px-4 py-2 bg-brand-light border border-brand-secondary/50 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          >
            <option value="">Todos os Passageiros</option>
            {passeios.map(p => (
              <option key={p.id} value={p.id}>
                {p.destino} - {p.dataData}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Passageiros */}
      <div className="bg-white rounded-2xl border border-brand-secondary/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-light border-b border-brand-secondary/20 text-xs uppercase tracking-wider text-brand-dark/70">
                <th className="p-4 font-bold">Nome Completo</th>
                <th className="p-4 font-bold">Idade</th>
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
                    <tr key={pax.id} className="hover:bg-brand-light/50 transition-colors">
                      <td className="p-4 font-medium text-brand-dark">{pax.nomeCompleto}</td>
                      <td className="p-4 text-brand-dark/80">{calcularIdade(pax.dataNascimento)} anos</td>
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
                          onClick={() => handleDelete(pax)}
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
