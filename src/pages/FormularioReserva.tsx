import { useState, useEffect } from 'react'
import { collection, addDoc, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { Passeio } from '../types'
import { passeiosMock } from '../mocks/passeios'

type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito'

interface PassengerFormData {
  nomeCompleto: string
  dataNascimento: string
  cpf: string
  whatsapp: string
  contatoEmergencia: string
  endereco: {
    logradouro: string
    bairro: string
    cidade: string
    estado: string
  }
  pontoEmbarque: string
  formaPagamento: FormaPagamento
}

const initialPassenger: PassengerFormData = {
  nomeCompleto: '',
  dataNascimento: '',
  cpf: '',
  whatsapp: '',
  contatoEmergencia: '',
  endereco: {
    logradouro: '',
    bairro: '',
    cidade: '',
    estado: '',
  },
  pontoEmbarque: '',
  formaPagamento: 'pix',
}

const formatCPF = (value: string) => {
  let v = value.replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  return v
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const formatWhatsApp = (value: string) => {
  let v = value.replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
  v = v.replace(/(\d)(\d{4})$/, '$1-$2')
  return v
}

export function FormularioReserva({ passeioId }: { passeioId: string }) {
  // Estados do Passeio
  const [passeio, setPasseio] = useState<Passeio | null>(null)
  const [loading, setLoading] = useState(true)
  const [erroPasseio, setErroPasseio] = useState(false)

  // Estados do Formulário
  const [quantidadeVagas, setQuantidadeVagas] = useState(1)
  const [passageiros, setPassageiros] = useState<PassengerFormData[]>([{ ...initialPassenger }])
  const [aceiteInfo, setAceiteInfo] = useState(false)
  const [aceiteLgpd, setAceiteLgpd] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Busca o passeio no Firebase
  useEffect(() => {
    async function fetchPasseio() {
      try {
        const docRef = doc(db, 'passeios', passeioId)
        
        // Timeout de 1.5s para não travar a tela caso o Firestore não esteja provisionado
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 1500)
        )
        
        // Tenta buscar no Firebase, mas aborta se demorar (indicando banco inexistente/sem permissão)
        const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]) as any
        
        if (docSnap && docSnap.exists()) {
          setPasseio({ id: docSnap.id, ...docSnap.data() } as Passeio)
          setLoading(false)
          return
        }
      } catch (error) {
        console.warn('Erro ao buscar do Firestore (pode estar desabilitado). Tentando fallback local.', error)
      }

      // Fallback para o mock local (se o firestore falhou ou documento não existe)
      const mock = passeiosMock.find(p => p.id === passeioId)
      if (mock) {
        setPasseio(mock)
      } else {
        setErroPasseio(true)
      }
      setLoading(false)
    }

    fetchPasseio()
  }, [passeioId])

  // Handlers
  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novaQtd = Number(e.target.value)
    setQuantidadeVagas(novaQtd)
    setPassageiros((prev) => {
      if (novaQtd > prev.length) {
        const novos = Array(novaQtd - prev.length).fill(null).map(() => ({ ...initialPassenger }))
        return [...prev, ...novos]
      } else {
        return prev.slice(0, novaQtd)
      }
    })
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target

    if (name === 'cpf') value = formatCPF(value)
    if (name === 'whatsapp') value = formatWhatsApp(value)

    setPassageiros((prev) => {
      const newArr = [...prev]
      newArr[index] = { ...newArr[index], [name]: value }
      return newArr
    })
  }

  const handleEnderecoChange = (index: number, field: string, value: string) => {
    setPassageiros((prev) => {
      const newArr = [...prev]
      newArr[index] = {
        ...newArr[index],
        endereco: {
          ...newArr[index].endereco,
          [field]: value,
        },
      }
      return newArr
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!aceiteInfo || !aceiteLgpd) {
      alert('É obrigatório aceitar os termos de veracidade e LGPD para finalizar a reserva.')
      return
    }

    setIsSubmitting(true)

    try {
      // Salva todos os passageiros em lote no Firestore usando Promise.all
      const promises = passageiros.map(async (pax) => {
        // Salva o passageiro
        const paxRef = await addDoc(collection(db, 'passageiros'), {
          passeioId,
          nomeCompleto: pax.nomeCompleto,
          dataNascimento: pax.dataNascimento,
          cpf: pax.cpf,
          whatsapp: pax.whatsapp,
          contatoEmergencia: pax.contatoEmergencia,
          endereco: pax.endereco,
          pontoEmbarque: pax.pontoEmbarque,
          formaPagamento: pax.formaPagamento,
          statusAlocacao: 'nao_alocado',
          numeroPoltrona: null,
          historicoPagamentos: [],
        })

        // Cria a transação (Entrada Pendente)
        await addDoc(collection(db, 'transacoes'), {
          tipo: 'entrada',
          status: 'pendente',
          valorTotal: passeio?.valor,
          valorPago: 0,
          descricao: `Reserva - ${pax.nomeCompleto} (${passeio?.destino})`,
          data: new Date().toISOString(),
          dataVencimento: new Date().toISOString().split('T')[0],
          passageiroId: paxRef.id,
          passeioId,
        })
      })

      await Promise.all(promises)

      alert('✅ Reserva solicitada com sucesso! Entraremos em contato.')
      
      // Limpa formulário
      setQuantidadeVagas(1)
      setPassageiros([{ ...initialPassenger }])
      setAceiteInfo(false)
      setAceiteLgpd(false)
      
    } catch (error) {
      console.error('Erro ao salvar reserva em lote:', error)
      alert('❌ Ocorreu um erro ao enviar a reserva. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-6 text-brand-dark">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="font-bold animate-pulse text-brand-primary">Carregando informações do passeio...</p>
      </div>
    )
  }

  if (erroPasseio || !passeio) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-6 text-brand-dark">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="font-bold text-xl mb-2">Passeio não encontrado</h2>
        <p className="text-brand-dark/60 text-sm">Verifique se o link está correto.</p>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto w-full bg-brand-light flex flex-col items-center p-6 sm:p-12 font-sans text-brand-dark">
      {/* ── Cabeçalho Principal ── */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-primary shadow-lg mb-4 text-3xl">
          🚌
        </div>
        <h1 className="font-bold text-2xl uppercase tracking-widest text-center">
          Pé Na Estrada Tour
        </h1>
        <p className="text-brand-primary font-medium text-sm mt-1">Formulário de Reserva</p>
      </div>

      <div className="w-full max-w-3xl space-y-6">
        
        {/* ── Card de Informações do Passeio ── */}
        <div className="bg-white rounded-3xl shadow-md p-6 border-l-8 border-brand-primary flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <span>📍</span> {passeio.destino}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-brand-dark/70">
              <p><strong>Data:</strong> {passeio.data.split('-').reverse().join('/')}</p>
              <p><strong>Saída:</strong> {passeio.horarioSaida}</p>
              <p><strong>Retorno:</strong> {passeio.horarioRetorno}</p>
              <p><strong>Transporte:</strong> {passeio.transporte}</p>
            </div>
          </div>
          <div className="bg-brand-light py-3 px-6 rounded-2xl border border-brand-primary/20 text-center flex-shrink-0">
            <p className="text-xs uppercase tracking-widest font-bold text-brand-primary mb-1">Valor por vaga</p>
            <p className="text-2xl font-black text-brand-dark">
              {passeio.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* ── Formulário Card Principal ── */}
        <div className="bg-white rounded-3xl shadow-xl w-full p-8 border border-brand-secondary/30">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-brand-secondary/20 gap-4">
            <h2 className="text-xl font-bold text-brand-dark">
              Dados dos Passageiros
            </h2>
            <div className="flex items-center gap-3 bg-brand-light/50 px-4 py-2 rounded-xl border border-brand-secondary/30">
              <label htmlFor="qtdVagas" className="text-sm font-bold text-brand-dark/80">
                Quantidade de Vagas:
              </label>
              <select
                id="qtdVagas"
                value={quantidadeVagas}
                onChange={handleQuantidadeChange}
                className="bg-white border border-brand-secondary/50 rounded-lg px-3 py-1.5 font-bold text-brand-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Renderiza blocos dinamicamente */}
            {passageiros.map((pax, idx) => {
              const isTitular = idx === 0
              const tituloBloco = isTitular ? 'Passageiro Principal (Titular da Reserva)' : `Acompanhante ${idx}`
              
              return (
                <div 
                  key={idx} 
                  className={`relative p-6 rounded-2xl border-2 transition-colors ${
                    isTitular 
                      ? 'bg-brand-light/20 border-brand-primary/40 shadow-sm' 
                      : 'bg-white border-brand-secondary/30'
                  }`}
                >
                  {/* Badge de título */}
                  <div className={`absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                    isTitular ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-secondary/20 text-brand-dark/70 border-brand-secondary/30'
                  }`}>
                    {tituloBloco}
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* Nome e Nascimento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Nome Completo</label>
                        <input
                          required
                          type="text"
                          name="nomeCompleto"
                          value={pax.nomeCompleto}
                          onChange={(e) => handleChange(idx, e)}
                          placeholder="Ex: João da Silva"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Data de Nascimento</label>
                        <input
                          required
                          type="date"
                          name="dataNascimento"
                          value={pax.dataNascimento}
                          onChange={(e) => handleChange(idx, e)}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
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
                          value={pax.cpf}
                          onChange={(e) => handleChange(idx, e)}
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">WhatsApp</label>
                        <input
                          required
                          type="text"
                          name="whatsapp"
                          value={pax.whatsapp}
                          onChange={(e) => handleChange(idx, e)}
                          inputMode="numeric"
                          placeholder="(00) 90000-0000"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Endereço Estruturado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Logradouro (Rua, Número, Complemento)</label>
                        <input
                          required
                          type="text"
                          value={pax.endereco.logradouro}
                          onChange={(e) => handleEnderecoChange(idx, 'logradouro', e.target.value)}
                          placeholder="Ex: Rua das Flores, 123, Apto 4"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Bairro</label>
                        <input
                          required
                          type="text"
                          value={pax.endereco.bairro}
                          onChange={(e) => handleEnderecoChange(idx, 'bairro', e.target.value)}
                          placeholder="Ex: Centro"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Cidade</label>
                          <input
                            required
                            type="text"
                            value={pax.endereco.cidade}
                            onChange={(e) => handleEnderecoChange(idx, 'cidade', e.target.value)}
                            placeholder="Ex: João Pessoa"
                            className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Estado</label>
                          <input
                            required
                            type="text"
                            value={pax.endereco.estado}
                            onChange={(e) => handleEnderecoChange(idx, 'estado', e.target.value)}
                            placeholder="Ex: PB"
                            maxLength={2}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Contato de Emergência</label>
                      <input
                        required
                        type="text"
                        name="contatoEmergencia"
                        value={pax.contatoEmergencia}
                        onChange={(e) => handleChange(idx, e)}
                        placeholder="Nome e Telefone de um familiar"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      />
                    </div>

                    {/* Embarque e Pagamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Ponto de Embarque</label>
                        <select
                          required
                          name="pontoEmbarque"
                          value={pax.pontoEmbarque}
                          onChange={(e) => handleChange(idx, e)}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all appearance-none"
                        >
                          <option value="" disabled>Selecione um local</option>
                          {passeio.locaisEmbarque.length > 0 ? (
                            passeio.locaisEmbarque.map((local, i) => (
                              <option key={i} value={local}>{local}</option>
                            ))
                          ) : (
                            // Fallback caso o passeio não tenha locais cadastrados
                            <>
                              <option value="Centro">Centro</option>
                              <option value="Terminal Rodoviário">Terminal Rodoviário</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">Forma de Pagamento</label>
                        <select
                          required
                          name="formaPagamento"
                          value={pax.formaPagamento}
                          onChange={(e) => handleChange(idx, e)}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-brand-secondary/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all appearance-none"
                        >
                          <option value="pix">PIX</option>
                          <option value="cartao_credito">Cartão de Crédito</option>
                          <option value="dinheiro">Dinheiro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── Termos e LGPD ── */}
            <div className="bg-brand-light/30 p-5 rounded-2xl border border-brand-secondary/30 mt-8 space-y-4">
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider mb-2">Termos e Condições</h3>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={aceiteInfo}
                    onChange={(e) => setAceiteInfo(e.target.checked)}
                    className="w-5 h-5 rounded border-brand-secondary text-brand-primary focus:ring-brand-primary"
                  />
                </div>
                <span className="text-sm text-brand-dark/80 group-hover:text-brand-dark transition-colors leading-snug">
                  Declaro que as informações preenchidas para mim e meus acompanhantes são verdadeiras.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={aceiteLgpd}
                    onChange={(e) => setAceiteLgpd(e.target.checked)}
                    className="w-5 h-5 rounded border-brand-secondary text-brand-primary focus:ring-brand-primary"
                  />
                </div>
                <span className="text-sm text-brand-dark/80 group-hover:text-brand-dark transition-colors leading-snug">
                  Concordo com o tratamento dos meus dados pessoais conforme a LGPD (Lei nº 13.709/2018) para a finalidade exclusiva de gestão da viagem e seguro.
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span> Processando...
                  </>
                ) : (
                  'Confirmar e Enviar Reservas'
                )}
              </button>
              <p className="text-center text-xs text-brand-dark/40 mt-4">
                Seus dados estão protegidos ponta-a-ponta. ID: {passeioId}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormularioReserva
