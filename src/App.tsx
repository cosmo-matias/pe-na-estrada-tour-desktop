import { useState, useEffect } from 'react'
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

// ── Componente Principal ──────────────────────────────────────────────
function App() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('home')
  const [reservaPasseioId, setReservaPasseioId] = useState<string | null>(null)

  useEffect(() => {
    // Roteamento simples baseado na URL
    const path = window.location.pathname
    if (path.startsWith('/reserva/')) {
      let id = path.replace('/reserva/', '')
      id = id.replace(/['"%27]/g, '') // Remove aspas indesejadas se existirem na URL colada
      setReservaPasseioId(id)
    }
  }, [])

  // Se estiver na rota pública de reserva, renderiza apenas o formulário
  if (reservaPasseioId) {
    return <FormularioReserva passeioId={reservaPasseioId} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-light">

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="flex flex-col w-64 min-w-64 h-full bg-brand-dark shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center justify-center px-6 py-8 border-b border-white/10">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-primary shadow-lg mb-3">
            <span className="text-2xl">🚌</span>
          </div>
          <h1 className="text-white font-bold text-sm tracking-widest uppercase text-center leading-tight">
            Pé Na Estrada
          </h1>
          <p className="text-brand-secondary text-xs mt-1 tracking-wider">
            Tour & Viagens
          </p>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveMenu(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  text-left font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 translate-x-1'
                    : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rodapé */}
        <div className="px-6 py-5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-dark font-bold text-sm">
              A
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Admin</p>
              <p className="text-white/40 text-xs">Gerenciador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ───────────────────────────────────────── */}
      <main className="flex flex-col flex-1 h-full overflow-hidden">

        {/* Topbar */}
        <header className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-brand-secondary/20 shadow-sm flex-shrink-0">
          <div>
            <h2 className="text-brand-dark font-bold text-xl capitalize">
              {menuItems.find((m) => m.id === activeMenu)?.label}
            </h2>
            <p className="text-brand-primary text-xs mt-0.5">
              Pé Na Estrada Tour · Sistema de Gerenciamento
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-brand-light border border-brand-secondary/40 text-brand-primary text-xs font-medium">
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
        <div className="flex-1 overflow-auto p-8">
          {activeMenu === 'home' && <Home />}
          {activeMenu === 'passeios' && <Passeios />}
          {activeMenu === 'passageiros' && <Passageiros />}
          {activeMenu === 'financeiro' && <Financeiro />}
        </div>
      </main>
    </div>
  )
}

export default App
