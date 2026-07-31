import { useEffect, useState } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

interface Lead {
  id: string
  nome: string
  whatsapp: string
  origem: string
  dataCadastro: string // assumindo formato ISO ou similar
}

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'leads'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Lead[] = []
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Lead)
      })
      
      data.sort((a, b) => {
        const getMillis = (val: any) => {
          if (!val) return 0
          if (typeof val.toDate === 'function') return val.toDate().getTime()
          if (val.seconds) return val.seconds * 1000
          return new Date(val).getTime()
        }
        return getMillis(b.dataCadastro) - getMillis(a.dataCadastro)
      })
      
      setLeads(data)
      setLoading(false)
    }, (error) => {
      console.error('Erro ao buscar leads:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const formatarData = (dataStr: any) => {
    if (!dataStr) return '-'
    try {
      const data = typeof dataStr.toDate === 'function' ? dataStr.toDate() : 
                   (dataStr.seconds ? new Date(dataStr.seconds * 1000) : new Date(dataStr))
      return data.toLocaleString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return dataStr
    }
  }

  const limparNumeroWhatsApp = (numero: string) => {
    return numero.replace(/\D/g, '')
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-3">
            <span className="text-3xl">🌟</span> Lista VIP / Leads
          </h1>
          <p className="text-brand-secondary text-sm mt-1">
            Contatos capturados através da vitrine pública.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-brand-secondary/20 flex items-center gap-3">
          <span className="text-brand-dark font-medium text-sm">Total de Cadastros:</span>
          <span className="bg-brand-primary text-white font-bold px-3 py-1 rounded-lg text-sm">
            {leads.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-brand-secondary/20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <span className="text-5xl mb-4 opacity-30">📭</span>
            <p className="text-brand-dark/50 text-lg font-medium">Nenhum lead encontrado.</p>
            <p className="text-brand-dark/30 text-sm mt-1">Os contatos capturados no site aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-light/50 border-b border-brand-secondary/20 text-brand-dark/70 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Data de Cadastro</th>
                  <th className="p-4 font-bold">Nome</th>
                  <th className="p-4 font-bold">WhatsApp</th>
                  <th className="p-4 font-bold">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-secondary/10">
                {leads.map((lead) => {
                  const numeroLimpo = limparNumeroWhatsApp(lead.whatsapp)
                  const waLink = `https://wa.me/55${numeroLimpo}`
                  
                  return (
                    <tr key={lead.id} className="hover:bg-brand-light/30 transition-colors">
                      <td className="p-4 text-sm text-brand-dark/70 whitespace-nowrap">
                        {formatarData(lead.dataCadastro)}
                      </td>
                      <td className="p-4 text-sm font-semibold text-brand-dark">
                        {lead.nome || '-'}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-brand-dark/80">{lead.whatsapp || '-'}</span>
                          {lead.whatsapp && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-colors text-xs font-semibold"
                              title="Conversar no WhatsApp"
                            >
                              <span>📱</span> Chamar
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium capitalize">
                          {lead.origem || 'Site Público'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
