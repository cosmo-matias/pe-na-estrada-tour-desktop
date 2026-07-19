import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio, TransporteFrota, TipoTransporte } from '../types'

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
    agenteResponsavel: 'Ambos' as 'Cosmo' | 'Noêmia' | 'Ambos'
  })
  
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
        agenteResponsavel: passeioEdicao.agenteResponsavel || 'Ambos'
      })
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
        agenteResponsavel: 'Ambos'
      })
      setLinhasFrota([{ tipo: 'Onibus 50', quantidade: 1 }])
      setDespesas([])
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
      agenteResponsavel: formData.agenteResponsavel,
      despesas: despesas.map(d => ({
        descricao: d.descricao,
        valor: Number(d.valor.replace(/\./g, '').replace(',', '.')) || 0
      })),
      status: passeioEdicao ? passeioEdicao.status : 'a_realizar',
      passageirosAlocados: passeioEdicao ? passeioEdicao.passageirosAlocados : 0
    }

    try {
      if (passeioEdicao) {
        await updateDoc(doc(db, 'passeios', passeioEdicao.id), payload)
      } else {
        const docRef = await addDoc(collection(db, 'passeios'), payload)
        
        // Criar Agentes Fictícios
        const agentesParaCriar = []
        if (formData.agenteResponsavel === 'Cosmo' || formData.agenteResponsavel === 'Ambos') {
          agentesParaCriar.push('Agente Cosmo')
        }
        if (formData.agenteResponsavel === 'Noêmia' || formData.agenteResponsavel === 'Ambos') {
          agentesParaCriar.push('Agente Noêmia')
        }

        for (const nomeAgente of agentesParaCriar) {
          await addDoc(collection(db, 'passageiros'), {
            passeioId: docRef.id,
            nomeCompleto: nomeAgente,
            dataNascimento: '',
            cpf: '',
            whatsapp: '',
            contatoEmergencia: '',
            endereco: { logradouro: '', bairro: '', cidade: '', estado: '' },
            pontoEmbarque: '',
            formaPagamento: 'pix',
            statusAlocacao: 'nao_alocado',
            numeroPoltrona: null,
            veiculoAlocado: null
          })
        }
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
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Agente Responsável</label>
            <select 
              value={formData.agenteResponsavel} 
              onChange={e => setFormData({ ...formData, agenteResponsavel: e.target.value as 'Cosmo' | 'Noêmia' | 'Ambos' })}
              className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm"
            >
              <option value="Cosmo">Cosmo</option>
              <option value="Noêmia">Noêmia</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Locais de Embarque</label>
            <div className="flex flex-wrap gap-2">
              {['Capim', 'Mamanguape', 'Cuité de Mamanguape', 'Sapé', 'João Pessoa', 'Itapororoca', 'Rio Tinto'].map(local => (
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
