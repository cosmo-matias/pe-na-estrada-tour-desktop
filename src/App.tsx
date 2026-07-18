import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth, EMAILS_AUTORIZADOS } from './config/firebase'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Passeios } from './pages/Passeios'
import { FormularioReserva } from './pages/FormularioReserva'
import { Passageiros } from './pages/Passageiros'
import { Financeiro } from './pages/Financeiro'

// ── Tipos ─────────────────────────────────────────────────────────────
type MenuId = 'home' | 'passeios' | 'passageiros' | 'financeiro'

interface MenuItem {
  id: MenuId
  label: string
  icon: string
}

const menuItems: MenuItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'passeios', label: 'Passeios', icon: '🚌' },
  { id: 'passageiros', label: 'Passageiros', icon: '👥' },
  { id: 'financeiro', label: 'Financeiro', icon: '💰' },
]

// ── Componente de Layout do Dashboard ───────────────────────────────
function DashboardLayout() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('home')

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-brand-light">

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="flex flex-row md:flex-col w-full md:w-64 md:min-w-64 h-auto md:min-h-screen bg-brand-dark shadow-2xl order-last md:order-first z-50">

        {/* Logo */}
        <div className="hidden md:flex flex-col items-center justify-center px-6 py-8 border-b border-white/10">
          <img src="/logo.png" alt="Pé Na Estrada" className="w-32 mx-auto mb-6" />
        </div>

        {/* Navegação */}
        <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start px-2 md:px-4 py-2 md:py-6 space-y-0 md:space-y-1 overflow-x-auto">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveMenu(item.id)}
                className={`
                  flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-xl
                  text-center md:text-left font-medium text-[10px] md:text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 md:translate-x-1'
                    : 'text-white/70 hover:bg-white/10 hover:text-white md:hover:translate-x-1'
                  }
                `}
              >
                <span className="text-xl md:text-lg">{item.icon}</span>
                <span className="tracking-wide hidden sm:block">{item.label}</span>
                {isActive && (
                  <span className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="hidden md:block px-6 py-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-dark font-bold text-sm">
                A
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Admin</p>
                <p className="text-white/40 text-xs">Gerenciador</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="text-white/40 hover:text-white transition-colors"
              title="Sair"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ───────────────────────────────────────── */}
      <main className="flex flex-col flex-1 w-full">

        {/* Topbar */}
        <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-white/80 backdrop-blur-sm border-b border-brand-secondary/20 shadow-sm flex-shrink-0">
          <div>
            <h2 className="text-brand-dark font-bold text-lg md:text-xl capitalize">
              {menuItems.find((m) => m.id === activeMenu)?.label}
            </h2>
            <p className="hidden md:block text-brand-primary text-xs mt-0.5">
              Pé Na Estrada Tour · Sistema de Gerenciamento
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => signOut(auth)} className="md:hidden text-brand-dark/50 hover:text-brand-dark text-xl mr-2">🚪</button>
            <div className="hidden md:block px-3 py-1.5 rounded-full bg-brand-light border border-brand-secondary/40 text-brand-primary text-xs font-medium">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 w-full p-4 md:p-8 pb-20">
          {activeMenu === 'home' && <Home />}
          {activeMenu === 'passeios' && <Passeios />}
          {activeMenu === 'passageiros' && <Passageiros />}
          {activeMenu === 'financeiro' && <Financeiro />}
        </div>
      </main>
    </div>
  )
}

// ── Roteador Principal ──────────────────────────────────────────────────
function AppWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (!u.email || !EMAILS_AUTORIZADOS.includes(u.email)) {
          await signOut(auth)
          setUser(null)
          alert("Acesso restrito a administradores.")
        } else {
          setUser(u)
        }
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })
    return unsub
  }, [])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-brand-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  // Wrapper para a rota de formulário de reserva que captura o ID da URL via hook do react-router
  const FormularioReservaWrapper = () => {
    const { passeioId } = useParams()
    return <FormularioReserva passeioId={passeioId || ''} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reserva/:passeioId" element={<FormularioReservaWrapper />} />
        
        {/* Rota de Login que redireciona pro dashboard se já estiver logado */}
        <Route path="/login" element={user && EMAILS_AUTORIZADOS.includes(user.email || '') ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Rotas protegidas (Dashboard) */}
        <Route path="/*" element={
          user && EMAILS_AUTORIZADOS.includes(user.email || '') 
            ? <DashboardLayout /> 
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default AppWrapper
