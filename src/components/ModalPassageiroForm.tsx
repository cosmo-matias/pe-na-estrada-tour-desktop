import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passageiro, Passeio } from '../types'

interface ModalPassageiroFormProps {
  aberto: boolean
  onFechar: () => void
  passageiroEdicao?: Passageiro
  passeios: Passeio[]
}

export function ModalPassageiroForm({ aberto, onFechar, passageiroEdicao, passeios }: ModalPassageiroFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    dataNascimento: '',
    whatsapp: '',
    contatoEmergencia: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: '',
    pontoEmbarque: '',
    passeioId: '',
  })

  useEffect(() => {
    if (passageiroEdicao) {
      setFormData({
        nomeCompleto: passageiroEdicao.nomeCompleto,
        cpf: passageiroEdicao.cpf,
        dataNascimento: passageiroEdicao.dataNascimento,
        whatsapp: passageiroEdicao.whatsapp,
        contatoEmergencia: passageiroEdicao.contatoEmergencia,
        logradouro: passageiroEdicao.endereco.logradouro,
        bairro: passageiroEdicao.endereco.bairro,
        cidade: passageiroEdicao.endereco.cidade,
        estado: passageiroEdicao.endereco.estado,
        pontoEmbarque: passageiroEdicao.pontoEmbarque,
        passeioId: passageiroEdicao.passeioId,
      })
    } else {
      setFormData({
        nomeCompleto: '', cpf: '', dataNascimento: '', whatsapp: '', contatoEmergencia: '',
        logradouro: '', bairro: '', cidade: '', estado: '', pontoEmbarque: '', passeioId: ''
      })
    }
  }, [passageiroEdicao, aberto])

  if (!aberto) return null

  const passeiosAtivos = passeios.filter(p => p.status === 'a_realizar')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      nomeCompleto: formData.nomeCompleto,
      cpf: formData.cpf,
      dataNascimento: formData.dataNascimento,
      whatsapp: formData.whatsapp,
      contatoEmergencia: formData.contatoEmergencia,
      endereco: {
        logradouro: formData.logradouro,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      },
      pontoEmbarque: formData.pontoEmbarque,
      passeioId: formData.passeioId,
      formaPagamento: passageiroEdicao ? passageiroEdicao.formaPagamento : 'dinheiro',
      statusAlocacao: passageiroEdicao ? passageiroEdicao.statusAlocacao : 'nao_alocado',
      numeroPoltrona: passageiroEdicao ? passageiroEdicao.numeroPoltrona : null
    }

    try {
      if (passageiroEdicao) {
        await updateDoc(doc(db, 'passageiros', passageiroEdicao.id), payload)
      } else {
        await addDoc(collection(db, 'passageiros'), payload)
      }
      onFechar()
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar passageiro.')
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
              {passageiroEdicao ? 'Editar Passageiro' : 'Adicionar Passageiro Manualmente'}
            </h2>
            <p className="text-brand-dark/60 text-sm">Preencha os dados do cliente.</p>
          </div>
          <button
            onClick={onFechar}
            className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-dark/60 hover:bg-brand-secondary/20 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Vincular a qual Passeio?</label>
            <select required value={formData.passeioId} onChange={e => setFormData({ ...formData, passeioId: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm">
              <option value="">-- Selecione o passeio --</option>
              {passeiosAtivos.map(p => (
                <option key={p.id} value={p.id}>{p.destino} - {new Date(p.data).toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Nome Completo</label>
              <input type="text" required value={formData.nomeCompleto} onChange={e => setFormData({ ...formData, nomeCompleto: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">CPF</label>
              <input type="text" required value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Data Nascimento</label>
              <input type="date" required value={formData.dataNascimento} onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">WhatsApp</label>
              <input type="tel" required value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Emergência (Telefone)</label>
              <input type="tel" value={formData.contatoEmergencia} onChange={e => setFormData({ ...formData, contatoEmergencia: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Ponto de Embarque Desejado</label>
            <select required value={formData.pontoEmbarque} onChange={e => setFormData({ ...formData, pontoEmbarque: e.target.value })} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm">
              <option value="">-- Selecione o local --</option>
              <option value="Capim">Capim</option>
              <option value="Mamanguape">Mamanguape</option>
              <option value="Cuité de Mamanguape">Cuité de Mamanguape</option>
              <option value="Sapé">Sapé</option>
              <option value="João Pessoa">João Pessoa</option>
              <option value="Itapororoca">Itapororoca</option>
              <option value="Rio Tinto">Rio Tinto</option>
            </select>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-sm text-brand-dark mb-3">Endereço</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-[10px] uppercase text-brand-dark/50 mb-1">Rua/Logradouro</label>
                <input type="text" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} className="w-full px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-brand-dark/50 mb-1">Bairro</label>
                <input type="text" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} className="w-full px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-brand-dark/50 mb-1">Cidade</label>
                <input type="text" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} className="w-full px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-brand-dark/50 mb-1">Estado</label>
                <input type="text" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} className="w-full px-3 py-2 bg-brand-light border border-brand-secondary/30 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-secondary/20 flex gap-3">
            <button type="button" onClick={onFechar} className="flex-1 py-3 px-4 rounded-xl bg-brand-light text-brand-dark font-semibold text-sm hover:bg-brand-secondary/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Passageiro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
