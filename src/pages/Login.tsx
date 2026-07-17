import { useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../config/firebase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isReset, setIsReset] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      alert('Erro ao fazer login. Verifique as credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return alert('Por favor, informe seu e-mail no campo de E-mail.')
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Se o e-mail existir na nossa base, você receberá as instruções de redefinição de senha.')
      setIsReset(false)
    } catch (error) {
      alert('Erro ao enviar e-mail de redefinição.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-light p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-fade-in border border-brand-secondary/20">
        <img src="/logo.png" alt="Pé Na Estrada Tour" className="w-40 mx-auto mb-6" />
        
        {isReset ? (
          <form onSubmit={handleReset} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-brand-dark mb-4">Recuperar Senha</h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>
            <button type="button" onClick={() => setIsReset(false)} className="w-full py-2 text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">
              Voltar para o login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-brand-dark mb-4">Acesso Administrativo</h2>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark/60 mb-2">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-brand-light border border-brand-secondary/30 rounded-xl focus:border-brand-primary outline-none text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
            <button type="button" onClick={() => setIsReset(true)} className="w-full py-2 text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">
              Esqueci minha senha
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
