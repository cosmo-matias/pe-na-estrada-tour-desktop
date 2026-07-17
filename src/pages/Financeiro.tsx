import { useState, useMemo, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Transacao } from '../types'

export function Financeiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'transacoes'), (snapshot) => {
      const ts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transacao))
      setTransacoes(ts)
    })
    return () => unsub()
  }, [])

  // Filtro
  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      let passa = true
      if (dataInicial && t.data < dataInicial) passa = false
      if (dataFinal && t.data > dataFinal) passa = false
      return passa
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Mais recentes primeiro
  }, [dataInicial, dataFinal, transacoes])

  // Consolidados
  const { totalRecebido, aReceber, totalSaidas } = useMemo(() => {
    let recebido = 0
    let pendente = 0
    let saidas = 0
    transacoesFiltradas.forEach(t => {
      if (t.tipo === 'entrada') {
        recebido += t.valorPago || 0
        pendente += Math.max(0, (t.valorTotal || 0) - (t.valorPago || 0))
      } else {
        // Para saídas, consideramos que valorTotal ou valorPago é a saída. Vamos usar valorTotal por padrão se valorPago não for definido, ou assumir valorPago se já pago
        saidas += t.valorTotal || 0 
      }
    })
    return {
      totalRecebido: recebido,
      aReceber: pendente,
      totalSaidas: saidas
    }
  }, [transacoesFiltradas])

  // Dados Gráfico
  const chartData = useMemo(() => {
    const map = new Map<string, { data: string; entradas: number; saidas: number }>()
    transacoesFiltradas.forEach(t => {
      // Agrupa pelo dia ISO
      const d = t.data.split('T')[0]
      const existing = map.get(d) || { data: d, entradas: 0, saidas: 0 }
      if (t.tipo === 'entrada') existing.entradas += t.valorPago || 0
      else existing.saidas += t.valorTotal || 0
      map.set(d, existing)
    })
    return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data))
  }, [transacoesFiltradas])

  const handleGerarPDF = () => {
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFontSize(20)
    doc.text('Pé Na Estrada Tour', 14, 22)
    doc.setFontSize(12)
    doc.text('Relatório Financeiro', 14, 30)
    
    const periodoInfo = dataInicial || dataFinal 
      ? `Período: ${dataInicial ? new Date(dataInicial).toLocaleDateString('pt-BR') : 'Sempre'} a ${dataFinal ? new Date(dataFinal).toLocaleDateString('pt-BR') : 'Sempre'}` 
      : 'Período: Todo o histórico'
    doc.setFontSize(10)
    doc.text(periodoInfo, 14, 38)

    // Tabela
    const tableColumn = ["Data", "Descrição", "Tipo", "Status", "Total", "Pago/Saída"]
    const tableRows = transacoesFiltradas.map(t => [
      new Date(t.data).toLocaleDateString('pt-BR'),
      t.descricao,
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      t.status.toUpperCase(),
      `R$ ${t.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${(t.tipo === 'entrada' ? t.valorPago : t.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ])

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [4, 59, 92] },
      foot: [
        ['', '', '', 'Totais:', `Rec: R$ ${totalRecebido.toLocaleString('pt-BR')}`, `Saídas: R$ ${totalSaidas.toLocaleString('pt-BR')}`],
      ],
      footStyles: { fillColor: [240, 240, 240], textColor: [0,0,0], fontStyle: 'bold' }
    })

    doc.save('relatorio-financeiro.pdf')
  }

  const formatarValor = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-secondary/20 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Dashboard Financeiro</h2>
          <p className="text-sm text-brand-dark/60">Controle de caixa e relatórios</p>
        </div>
        <button 
          onClick={handleGerarPDF}
          className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-colors flex items-center gap-2"
        >
          📄 Gerar Relatório PDF
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
          <p className="text-emerald-100 text-sm font-semibold mb-1 uppercase tracking-wider">Total Recebido</p>
          <p className="text-3xl font-bold">{formatarValor(totalRecebido)}</p>
        </div>
        <div className="bg-brand-secondary rounded-2xl p-6 text-white shadow-lg shadow-brand-secondary/20">
          <p className="text-white/80 text-sm font-semibold mb-1 uppercase tracking-wider">A Receber</p>
          <p className="text-3xl font-bold">{formatarValor(aReceber)}</p>
        </div>
        <div className="bg-brand-alert rounded-2xl p-6 text-white shadow-lg shadow-brand-alert/20">
          <p className="text-red-200 text-sm font-semibold mb-1 uppercase tracking-wider">Saídas Totais</p>
          <p className="text-3xl font-bold">{formatarValor(totalSaidas)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-2xl border border-brand-secondary/20 shadow-sm">
        <h3 className="text-lg font-bold text-brand-dark mb-6">Desempenho (Recebido vs Saídas)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="data" 
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
                }} 
                stroke="#64748b"
                fontSize={12}
                tickMargin={10}
              />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `R$ ${val}`} />
              <Tooltip 
                formatter={(value: number) => [formatarValor(value), '']}
                labelFormatter={(label) => {
                  const d = new Date(label)
                  return isNaN(d.getTime()) ? label : d.toLocaleDateString('pt-BR')
                }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="entradas" name="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela e Filtros */}
      <div className="bg-white rounded-2xl border border-brand-secondary/20 shadow-sm overflow-hidden flex flex-col">
        {/* Barra de Filtros */}
        <div className="p-5 border-b border-brand-secondary/20 bg-brand-light/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-brand-dark">Histórico de Transações</h3>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/70">Data Inicial</label>
              <input 
                type="date" 
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-brand-secondary/50 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/70">Data Final</label>
              <input 
                type="date" 
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-brand-secondary/50 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-light border-b border-brand-secondary/20 text-xs uppercase tracking-wider text-brand-dark/70">
                <th className="p-4 font-bold">Data</th>
                <th className="p-4 font-bold">Descrição</th>
                <th className="p-4 font-bold">Tipo</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Valor Total</th>
                <th className="p-4 font-bold text-right">Valor Pago/Saída</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-secondary/10">
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-brand-dark/60">
                    Nenhuma transação encontrada no período.
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} className="hover:bg-brand-light/50 transition-colors">
                    <td className="p-4 text-brand-dark/80 whitespace-nowrap">
                      {new Date(t.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 font-medium text-brand-dark">{t.descricao}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        t.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        t.status === 'efetivada' ? 'bg-emerald-100 text-emerald-700' : 
                        t.status === 'parcial' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold`}>
                      {formatarValor(t.valorTotal)}
                    </td>
                    <td className={`p-4 text-right font-bold ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.tipo === 'entrada' ? '+' : '-'} {formatarValor(t.tipo === 'entrada' ? t.valorPago : t.valorTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
