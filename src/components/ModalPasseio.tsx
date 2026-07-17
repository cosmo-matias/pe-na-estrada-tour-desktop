import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio } from '../types'

interface ModalPasseioProps {
  aberto: boolean
  onFechar: () => void
  passeioEdicao?: Passeio
}

export function ModalPasseio({ aberto, onFechar, passeioEdicao }: ModalPasseioProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    destino: '',
    local: '',
    data: '',
    horarioSaida: '',
    horarioRetorno: '',
    valorFormatado: '',
    locaisEmbarque: '',
    transporte: 'Onibus 40',
    quantidadeTransporte: 1,
    imagem: ''
  })

  useEffect(() => {
    if (passeioEdicao) {
      setFormData({
        destino: passeioEdicao.destino,
        local: passeioEdicao.local,
        data: passeioEdicao.data,
        horarioSaida: passeioEdicao.horarioSaida,
        horarioRetorno: passeioEdicao.horarioRetorno,
        valorFormatado: passeioEdicao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        locaisEmbarque: passeioEdicao.locaisEmbarque.join(', '),
        transporte: passeioEdicao.transporte,
        quantidadeTransporte: passeioEdicao.quantidadeTransporte,
        imagem: passeioEdicao.imagem || ''
      })
    } else {
      setFormData({
        destino: '',
        local: '',
        data: '',
        horarioSaida: '',
        horarioRetorno: '',
        valorFormatado: '',
        locaisEmbarque: '',
        transporte: 'Onibus 40',
        quantidadeTransporte: 1,
        imagem: ''
      })
    }
  }, [passeioEdicao, aberto])

  if (!aberto) return null

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value === '') {
      setFormData({ ...formData, valorFormatado: '' })
      return
    }
    const floatValue = parseInt(value, 10) / 100
    setFormData({ ...formData, valorFormatado: floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      destino: formData.destino,
      local: formData.local,
      data: formData.data,
      horarioSaida: formData.horarioSaida,
      horarioRetorno: formData.horarioRetorno,
      valor: Number(formData.valorFormatado.replace(/\./g, '').replace(',', '.')),
      locaisEmbarque: formData.locaisEmbarque.split(',').map(s => s.trim()).filter(Boolean),
      transporte: formData.transporte,
      quantidadeTransporte: Number(formData.quantidadeTransporte),
      imagem: formData.imagem || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      status: passeioEdicao ? passeioEdicao.status : 'a_realizar',
      passageirosAlocados: passeioEdicao ? passeioEdicao.passageirosAlocados : 0
    }

    try {
      if (passeioEdicao) {
        await updateDoc(doc(db, 'passeios', passeioEdicao.id), payload)
      } else {
        await addDoc(collection(db, 'passeios'), payload)
      }
      onFechar()
    } catch (error) {
      console.error('Erro ao salvar passeio', error)
      alert('Ocorreu um erro ao salvar o passeio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-brand-secondary/20">
          <div>
            <h2 className="text-xl font-bold text-brand-dark">
              {passeioEdicao ? 'Editar Passeio' : 'Novo Passeio'}
            </h2>
            <p className="text-brand-dark/60 text-sm">Preencha as informações do destino.</p>
          </div>
          <button
            onClick={onFechar}
            className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-dark/60 hover:bg-brand-secondary/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Destino (Título)</label>
              <input type="text" required value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" placeholder="Ex: Arraial do Cabo" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Local/Estado</label>
              <input type="text" required value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all" placeholder="Ex: Rio de Janeiro - RJ" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Data</label>
              <input type="date" required value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Horário de Saída</label>
              <input type="time" required value={formData.horarioSaida} onChange={e => setFormData({ ...formData, horarioSaida: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Horário de Retorno</label>
              <input type="time" required value={formData.horarioRetorno} onChange={e => setFormData({ ...formData, horarioRetorno: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Valor (R$)</label>
              <input type="text" required value={formData.valorFormatado} onChange={handleValorChange} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" placeholder="Ex: 250,00" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">URL da Imagem</label>
              <input type="url" value={formData.imagem} onChange={e => setFormData({ ...formData, imagem: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Locais de Embarque (separados por vírgula)</label>
            <input type="text" required value={formData.locaisEmbarque} onChange={e => setFormData({ ...formData, locaisEmbarque: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" placeholder="Ex: Posto Ipiranga, Rodoviária, Praça Matriz" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Transporte</label>
              <select value={formData.transporte} onChange={e => setFormData({ ...formData, transporte: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm">
                <option value="Onibus 50">Ônibus (50 lugares)</option>
                <option value="Onibus 40">Ônibus (40 lugares)</option>
                <option value="Van 14">Van (14 lugares)</option>
                <option value="Van 12">Van (12 lugares)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Quantidade de Veículos</label>
              <input type="number" required min="1" value={formData.quantidadeTransporte} onChange={e => setFormData({ ...formData, quantidadeTransporte: Number(e.target.value) })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
          </div>

          <div className="pt-6 border-t border-brand-secondary/20 flex gap-3">
            <button type="button" onClick={onFechar} className="flex-1 py-3 px-4 rounded-xl bg-brand-light text-brand-dark font-semibold text-sm hover:bg-brand-secondary/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Passeio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
