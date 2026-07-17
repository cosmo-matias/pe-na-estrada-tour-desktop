import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export function FormularioReserva({ passeioId }: { passeioId: string }) {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    cpf: '',
    whatsapp: '',
    contatoEmergencia: '',
    endereco: '',
    pontoEmbarque: '',
    formaPagamento: 'pix', // default
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addDoc(collection(db, 'passageiros'), {
        passeioId,
        nomeCompleto: formData.nomeCompleto,
        dataNascimento: formData.dataNascimento,
        cpf: formData.cpf,
        whatsapp: formData.whatsapp,
        contatoEmergencia: formData.contatoEmergencia,
        endereco: formData.endereco,
        pontoEmbarque: formData.pontoEmbarque,
        formaPagamento: formData.formaPagamento,
        statusAlocacao: 'nao_alocado',
        numeroPoltrona: null,
      })

      alert('✅ Reserva solicitada com sucesso! Entraremos em contato.')
      
      // Limpa formulário
      setFormData({
        nomeCompleto: '',
        dataNascimento: '',
        cpf: '',
        whatsapp: '',
        contatoEmergencia: '',
        endereco: '',
        pontoEmbarque: '',
        formaPagamento: 'pix',
      })
    } catch (error) {
      console.error('Erro ao salvar reserva:', error)
      alert('❌ Ocorreu um erro ao enviar a reserva. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center p-6 sm:p-12 font-sans text-brand-dark">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-primary shadow-lg mb-4 text-3xl">
          🚌
        </div>
        <h1 className="font-bold text-2xl uppercase tracking-widest text-center">
          Pé Na Estrada Tour
        </h1>
        <p className="text-brand-primary font-medium text-sm mt-1">Formulário de Reserva</p>
      </div>

      {/* ── Formulário Card ── */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-8 border border-brand-secondary/30">
        <h2 className="text-xl font-bold mb-6 border-b border-brand-secondary/20 pb-4">
          Dados do Passageiro
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome e Nascimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Nome Completo</label>
              <input
                required
                type="text"
                name="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={handleChange}
                placeholder="Ex: João da Silva"
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Data de Nascimento</label>
              <input
                required
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* CPF e WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">CPF</label>
              <input
                required
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">WhatsApp</label>
              <input
                required
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="(00) 90000-0000"
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Endereço e Emergência */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Endereço Completo</label>
            <input
              required
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              placeholder="Rua, Número, Bairro, Cidade"
              className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Contato de Emergência</label>
            <input
              required
              type="text"
              name="contatoEmergencia"
              value={formData.contatoEmergencia}
              onChange={handleChange}
              placeholder="Nome e Telefone de um familiar"
              className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <h2 className="text-xl font-bold mb-6 mt-8 border-b border-brand-secondary/20 pb-4">
            Detalhes do Embarque
          </h2>

          {/* Embarque e Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Ponto de Embarque</label>
              <select
                required
                name="pontoEmbarque"
                value={formData.pontoEmbarque}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all appearance-none"
              >
                <option value="" disabled>Selecione um local</option>
                <option value="Centro">Centro</option>
                <option value="Terminal Rodoviário">Terminal Rodoviário</option>
                <option value="Shopping Mangabeira">Shopping Mangabeira</option>
                <option value="UFPB">UFPB</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Forma de Pagamento</label>
              <select
                required
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-brand-light/30 border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all appearance-none"
              >
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <div className="pt-6 mt-4">
            <button
              type="submit"
              className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/30"
            >
              Confirmar Reserva
            </button>
            <p className="text-center text-xs text-brand-dark/40 mt-4">
              Seus dados estão seguros conosco. ID do Passeio: {passeioId}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioReserva
