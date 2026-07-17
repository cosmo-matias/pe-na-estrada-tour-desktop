import { useState } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'

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

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      alert('Erro ao fazer login com o Google.')
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

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">ou</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full py-3 rounded-xl bg-white text-gray-700 border border-gray-300 font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
