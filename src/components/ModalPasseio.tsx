import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio, TransporteFrota, TipoTransporte } from '../types'
import { uploadToImgBB } from '../services/imgbb'

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
    locaisEmbarque: [] as string[],
    imagem: '',
    descricao: '',
    ativo: true,
  })
  
  const [inclusos, setInclusos] = useState<string[]>([])
  const [novoIncluso, setNovoIncluso] = useState('')
  const [naoInclusos, setNaoInclusos] = useState<string[]>([])
  const [novoNaoIncluso, setNovoNaoIncluso] = useState('')
  const [roteiro, setRoteiro] = useState<{ horario: string; evento: string }[]>([])
  const [novoRoteiro, setNovoRoteiro] = useState({ horario: '', evento: '' })
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [linhasFrota, setLinhasFrota] = useState<{ tipo: TipoTransporte, quantidade: number }[]>([{ tipo: 'Onibus 50', quantidade: 1 }])
  const [despesas, setDespesas] = useState<{ descricao: string; valor: string }[]>([])

  useEffect(() => {
    if (passeioEdicao) {
      setFormData({
        destino: passeioEdicao.destino,
        local: passeioEdicao.local,
        data: passeioEdicao.data,
        horarioSaida: passeioEdicao.horarioSaida,
        horarioRetorno: passeioEdicao.horarioRetorno,
        valorFormatado: passeioEdicao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        locaisEmbarque: passeioEdicao.locaisEmbarque || [],
        imagem: passeioEdicao.imagem || '',
        descricao: passeioEdicao.descricao || '',
        ativo: passeioEdicao.ativo !== false, // default true
      })
      setInclusos(passeioEdicao.inclusos || [])
      setNaoInclusos(passeioEdicao.naoInclusos || [])
      setRoteiro(passeioEdicao.roteiro || [])
      if (passeioEdicao.transportes && passeioEdicao.transportes.length > 0) {
        const contagem: Record<string, number> = {}
        passeioEdicao.transportes.forEach(t => {
          contagem[t.tipo] = (contagem[t.tipo] || 0) + 1
        })
        setLinhasFrota(Object.entries(contagem).map(([tipo, qtd]) => ({ tipo: tipo as TipoTransporte, quantidade: qtd })))
      } else if (passeioEdicao.transporte) {
        setLinhasFrota([{ tipo: passeioEdicao.transporte as TipoTransporte, quantidade: passeioEdicao.quantidadeTransporte || 1 }])
      } else {
        setLinhasFrota([{ tipo: 'Onibus 50', quantidade: 1 }])
      }
      if (passeioEdicao.despesas) {
        setDespesas(passeioEdicao.despesas.map(d => ({
          descricao: d.descricao,
          valor: d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        })))
      } else {
        setDespesas([])
      }
    } else {
      setFormData({
        destino: '',
        local: '',
        data: '',
        horarioSaida: '',
        horarioRetorno: '',
        valorFormatado: '',
        locaisEmbarque: [],
        imagem: '',
        descricao: '',
        ativo: true,
      })
      setLinhasFrota([{ tipo: 'Onibus 50', quantidade: 1 }])
      setDespesas([])
      setInclusos([])
      setNaoInclusos([])
      setRoteiro([])
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

    const frotaFinal: TransporteFrota[] = []
    let contadorVeiculo = 1
    linhasFrota.forEach(linha => {
      for (let i = 0; i < linha.quantidade; i++) {
        let capacidade = 50
        if (linha.tipo === 'Onibus 40') capacidade = 40
        if (linha.tipo === 'Van 14') capacidade = 14
        if (linha.tipo === 'Van 12') capacidade = 12

        frotaFinal.push({
          id: Date.now().toString() + contadorVeiculo,
          nome: `Veículo ${contadorVeiculo} (${linha.tipo})`,
          tipo: linha.tipo,
          capacidade
        })
        contadorVeiculo++
      }
    })

    const payload = {
      destino: formData.destino,
      local: formData.local,
      data: formData.data,
      horarioSaida: formData.horarioSaida,
      horarioRetorno: formData.horarioRetorno,
      valor: Number(formData.valorFormatado.replace(/\./g, '').replace(',', '.')),
      locaisEmbarque: formData.locaisEmbarque,
      transportes: frotaFinal,
      capacidade: frotaFinal.reduce((acc, v) => acc + v.capacidade, 0),
      imagem: formData.imagem,
      despesas: despesas.map(d => ({
        descricao: d.descricao,
        valor: Number(d.valor.replace(/\./g, '').replace(',', '.')) || 0
      })),
      status: passeioEdicao ? passeioEdicao.status : 'a_realizar',
      passageirosAlocados: passeioEdicao ? passeioEdicao.passageirosAlocados : 0,
      descricao: formData.descricao,
      inclusos,
      naoInclusos,
      roteiro,
      ativo: formData.ativo
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
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Imagem de Capa (Vitrine)</label>
              <div className="flex items-center gap-3">
                <label className={`flex-1 px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus-within:border-brand-primary cursor-pointer text-sm transition-all ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="text-brand-dark/70 truncate block">
                    {uploadingImage ? 'Enviando...' : (formData.imagem ? 'Imagem Selecionada (Trocar)' : 'Selecionar Imagem')}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploadingImage(true)
                      try {
                        const url = await uploadToImgBB(file)
                        setFormData({ ...formData, imagem: url })
                      } catch (err) {
                        alert('Erro ao fazer upload da imagem.')
                      } finally {
                        setUploadingImage(false)
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
                {formData.imagem && (
                  <img src={formData.imagem} alt="Capa" className="w-12 h-12 object-cover rounded-lg border border-brand-secondary/30" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-secondary/20">
            <h4 className="font-bold text-brand-dark text-sm mb-3">Configurações da Vitrine Pública</h4>
            
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-5 h-5 rounded border-brand-secondary/50 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm font-bold text-brand-dark">Passeio Ativo (Aparecer no site público)</span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Descrição Completa (Vitrine)</label>
              <textarea 
                rows={3} 
                value={formData.descricao} 
                onChange={e => setFormData({ ...formData, descricao: e.target.value })} 
                className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm resize-none" 
                placeholder="Descreva os detalhes do passeio, roteiro, etc..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Inclusos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">O que está incluso</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={novoIncluso} onChange={e => setNovoIncluso(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novoIncluso.trim()) { setInclusos([...inclusos, novoIncluso.trim()]); setNovoIncluso(''); } } }} className="flex-1 px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg outline-none text-sm" placeholder="Ex: Transporte" />
                  <button type="button" onClick={() => { if (novoIncluso.trim()) { setInclusos([...inclusos, novoIncluso.trim()]); setNovoIncluso(''); } }} className="px-3 bg-brand-primary/10 text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/20">Add</button>
                </div>
                <ul className="space-y-1">
                  {inclusos.map((item, i) => (
                    <li key={i} className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs">
                      <span>✓ {item}</span>
                      <button type="button" onClick={() => setInclusos(inclusos.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nao Inclusos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">O que NÃO está incluso</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={novoNaoIncluso} onChange={e => setNovoNaoIncluso(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novoNaoIncluso.trim()) { setNaoInclusos([...naoInclusos, novoNaoIncluso.trim()]); setNovoNaoIncluso(''); } } }} className="flex-1 px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg outline-none text-sm" placeholder="Ex: Alimentação" />
                  <button type="button" onClick={() => { if (novoNaoIncluso.trim()) { setNaoInclusos([...naoInclusos, novoNaoIncluso.trim()]); setNovoNaoIncluso(''); } }} className="px-3 bg-brand-primary/10 text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/20">Add</button>
                </div>
                <ul className="space-y-1">
                  {naoInclusos.map((item, i) => (
                    <li key={i} className="flex items-center justify-between bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                      <span>✕ {item}</span>
                      <button type="button" onClick={() => setNaoInclusos(naoInclusos.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Roteiro */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Roteiro (Timeline)</label>
              <div className="flex gap-2 mb-3 items-end">
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-brand-dark/50 mb-1">Horário</label>
                  <input type="time" value={novoRoteiro.horario} onChange={e => setNovoRoteiro({ ...novoRoteiro, horario: e.target.value })} className="w-full px-2 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg outline-none text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-brand-dark/50 mb-1">Evento</label>
                  <input type="text" value={novoRoteiro.evento} onChange={e => setNovoRoteiro({ ...novoRoteiro, evento: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novoRoteiro.horario && novoRoteiro.evento) { setRoteiro([...roteiro, { ...novoRoteiro }].sort((a,b)=>a.horario.localeCompare(b.horario))); setNovoRoteiro({ horario: '', evento: '' }); } } }} className="w-full px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg outline-none text-sm" placeholder="Ex: Embarque Principal" />
                </div>
                <button type="button" onClick={() => { if (novoRoteiro.horario && novoRoteiro.evento) { setRoteiro([...roteiro, { ...novoRoteiro }].sort((a,b)=>a.horario.localeCompare(b.horario))); setNovoRoteiro({ horario: '', evento: '' }); } }} className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/20 h-[38px]">Add</button>
              </div>
              <ul className="space-y-2">
                {roteiro.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-white border border-brand-secondary/20 px-3 py-2 rounded-lg text-sm">
                    <span className="font-bold text-brand-primary">{item.horario}</span>
                    <span className="flex-1 text-brand-dark/80">{item.evento}</span>
                    <button type="button" onClick={() => setRoteiro(roteiro.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 rounded p-1">🗑️</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Locais de Embarque</label>
            <div className="flex flex-wrap gap-2">
              {['Capim', 'Mamanguape', 'Cuité de Mamanguape', 'Sapé', 'João Pessoa', 'Itapororoca', 'Rio Tinto', "Olho D'água"].map(local => (
                <label key={local} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-brand-secondary/30 hover:border-brand-primary/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.locaisEmbarque.includes(local)} 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, locaisEmbarque: [...formData.locaisEmbarque, local] })
                      } else {
                        setFormData({ ...formData, locaisEmbarque: formData.locaisEmbarque.filter(l => l !== local) })
                      }
                    }}
                    className="w-4 h-4 rounded border-brand-secondary text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-dark font-medium">{local}</span>
                </label>
              ))}
            </div>
            {formData.locaisEmbarque.length === 0 && (
              <p className="text-xs text-red-500 mt-2">* Selecione ao menos um local de embarque</p>
            )}
          </div>

          <div className="pt-4 border-t border-brand-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60">Frota do Passeio (Mista)</label>
            </div>
            
            <div className="space-y-3">
              {linhasFrota.map((linha, index) => (
                <div key={index} className="flex gap-3 items-end bg-brand-light/50 p-3 rounded-xl border border-brand-secondary/20">
                  <div className="flex-[2]">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Tipo de Transporte</label>
                    <select 
                      value={linha.tipo} 
                      onChange={e => {
                        const novasLinhas = [...linhasFrota]
                        novasLinhas[index].tipo = e.target.value as TipoTransporte
                        setLinhasFrota(novasLinhas)
                      }} 
                      className="w-full px-3 py-2 bg-white border border-brand-secondary/30 rounded-lg focus:border-brand-primary outline-none text-sm"
                    >
                      <option value="Onibus 50">Ônibus (50 lugares)</option>
                      <option value="Onibus 40">Ônibus (40 lugares)</option>
                      <option value="Van 14">Van (14 lugares)</option>
                      <option value="Van 12">Van (12 lugares)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Quantidade</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={linha.quantidade} 
                      onChange={e => {
                        const novasLinhas = [...linhasFrota]
                        novasLinhas[index].quantidade = Number(e.target.value)
                        setLinhasFrota(novasLinhas)
                      }} 
                      className="w-full px-3 py-2 bg-white border border-brand-secondary/30 rounded-lg focus:border-brand-primary outline-none text-sm" 
                    />
                  </div>
                  {linhasFrota.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const novasLinhas = linhasFrota.filter((_, i) => i !== index)
                        setLinhasFrota(novasLinhas)
                      }}
                      className="h-[38px] px-3 bg-red-50 text-red-500 rounded-lg font-bold hover:bg-red-100 transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => {
                setLinhasFrota(prev => [...prev, { tipo: 'Onibus 50', quantidade: 1 }])
              }}
              className="mt-3 text-xs bg-brand-primary/10 text-brand-primary px-3 py-2 rounded-lg font-bold hover:bg-brand-primary/20 transition-colors w-full"
            >
              + Adicionar Outro Transporte
            </button>
          </div>

          <div className="pt-4 border-t border-brand-secondary/20">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60">Custos Variáveis (Despesas)</label>
            </div>
            
            <div className="space-y-3">
              {despesas.map((despesa, index) => (
                <div key={index} className="flex gap-3 items-end bg-brand-light/50 p-3 rounded-xl border border-brand-secondary/20">
                  <div className="flex-[2]">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Descrição</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ex: Combustível"
                      value={despesa.descricao} 
                      onChange={e => {
                        const novas = [...despesas]
                        novas[index].descricao = e.target.value
                        setDespesas(novas)
                      }} 
                      className="w-full px-3 py-2 bg-white border border-brand-secondary/30 rounded-lg focus:border-brand-primary outline-none text-sm" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/50 mb-1">Valor (R$)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="0,00"
                      value={despesa.valor} 
                      onChange={e => {
                        let value = e.target.value.replace(/\D/g, '')
                        if (value === '') {
                          const novas = [...despesas]
                          novas[index].valor = ''
                          setDespesas(novas)
                          return
                        }
                        const floatValue = parseInt(value, 10) / 100
                        const formated = floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        
                        const novas = [...despesas]
                        novas[index].valor = formated
                        setDespesas(novas)
                      }} 
                      className="w-full px-3 py-2 bg-white border border-brand-secondary/30 rounded-lg focus:border-brand-primary outline-none text-sm" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const novas = despesas.filter((_, i) => i !== index)
                      setDespesas(novas)
                    }}
                    className="h-[38px] px-3 bg-red-50 text-red-500 rounded-lg font-bold hover:bg-red-100 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => {
                setDespesas(prev => [...prev, { descricao: '', valor: '' }])
              }}
              className="mt-3 text-xs bg-brand-primary/10 text-brand-primary px-3 py-2 rounded-lg font-bold hover:bg-brand-primary/20 transition-colors w-full"
            >
              + Adicionar Despesa
            </button>
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
