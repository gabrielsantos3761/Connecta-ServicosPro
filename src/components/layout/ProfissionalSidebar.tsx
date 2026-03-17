import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2, Home, LogOut, X, Scissors, UserCog,
  AlertTriangle, Save, CalendarDays, Calendar, Heart, Wallet,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

const TEAL = '#4db8c7'
const TEAL_BG = 'rgba(77,184,199,0.08)'
const TEAL_BORDER = 'rgba(77,184,199,0.2)'

interface NavItem {
  to: string
  icon: any
  label: string
}

interface ProfissionalSidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (value: boolean) => void
  isDirty: boolean
  setIsDirty: (value: boolean) => void
}

export function ProfissionalSidebar({
  isMobileOpen,
  setIsMobileOpen,
  isDirty,
  setIsDirty,
}: ProfissionalSidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  // Extract businessId from current path e.g. /profissional/:businessId/painel
  const agendaBusinessId = (() => {
    const match = location.pathname.match(/^\/profissional\/([^/]+)\//)
    return match ? match[1] : null
  })()

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/profissional', icon: UserCog, label: 'Configurar Perfil' },
    { to: '/profissional/associar-barbearia', icon: Building2, label: 'Estabelecimentos' },
    { to: '/cliente/agendamentos', icon: Calendar, label: 'Agendamentos' },
    { to: '/favoritos', icon: Heart, label: 'Favoritos' },
    { to: '/carteira', icon: Wallet, label: 'Carteira' },
  ]

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  const handleLinkClick = (e: React.MouseEvent, to: string) => {
    if (isDirty && location.pathname !== to) {
      e.preventDefault()
      setPendingPath(to)
      setIsMobileOpen(false)
      return
    }
    setIsMobileOpen(false)
  }

  const handleLogout = async () => {
    if (isDirty) { setPendingPath('__logout__'); setIsMobileOpen(false); return }
    setIsMobileOpen(false)
    await logout()
    navigate('/login')
  }

  const handleProceed = async () => {
    if (!pendingPath) return
    setIsDirty(false)
    setPendingPath(null)
    if (pendingPath === '__logout__') { await logout(); navigate('/login') }
    else navigate(pendingPath)
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c'))
      return url.replace('=s96-c', '=s400-c')
    return url
  }

  const displayAvatar = user?.avatar ? getHighQualityImageUrl(user.avatar) : undefined

  return (
    <>
      {/* Unsaved changes modal */}
      <AnimatePresence>
        {pendingPath !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 420, background: '#0a0a08', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.125rem', padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>Alterações não salvas</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem' }}>
                Você fez alterações no seu perfil que ainda não foram salvas.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                Volte e clique em <span style={{ color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Save size={11} /> Salvar Perfil</span> para não perder suas mudanças.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setPendingPath(null)} style={{ flex: 1, padding: '0.625rem', background: TEAL_BG, border: `1px solid ${TEAL_BORDER}`, borderRadius: '0.625rem', color: TEAL, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Continuar editando
                </button>
                <button onClick={handleProceed} style={{ flex: 1, padding: '0.625rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.625rem', color: '#f87171', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Sair sem salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <motion.aside
        animate={{ x: isMobileOpen ? 0 : -340 }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        className="fixed left-0 top-0 h-full w-[300px] z-50 flex flex-col overflow-hidden"
        style={{ background: '#060503', borderRight: `1px solid ${TEAL_BORDER}`, boxShadow: isMobileOpen ? '8px 0 60px rgba(0,0,0,0.8)' : 'none' }}
      >
        {/* Grain */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.03 }} />
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, rgba(77,184,199,0.12) 0%, transparent 70%)` }} />

        {/* ── HEADER ── */}
        <div className="relative z-10 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: TEAL_BG, border: `1px solid ${TEAL_BORDER}` }}>
                <Scissors size={18} color={TEAL} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>Profissional</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(77,184,199,0.55)' }}>Painel de Gestão</p>
              </div>
            </div>
            <button onClick={() => setIsMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* User card */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: TEAL_BG, border: `1px solid ${TEAL_BORDER}` }}>
              {displayAvatar ? (
                <img src={displayAvatar} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid rgba(77,184,199,0.35)` }} onError={e => { e.currentTarget.style.display = 'none' }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4db8c7, #1a333a)' }}>
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-none mb-1">{user.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: TEAL_BG, color: TEAL, border: `1px solid ${TEAL_BORDER}` }}>
                  Profissional
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── NAV ── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
          <p className="text-xs font-semibold uppercase mb-3 px-2" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>Menu</p>

          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                  <NavLink to={item.to} end onClick={e => handleLinkClick(e, item.to)}>
                    {({ isActive }) => (
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative" style={{ background: isActive ? TEAL_BG : 'transparent', border: isActive ? `1px solid ${TEAL_BORDER}` : '1px solid transparent' }}>
                        {isActive && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: TEAL }} />}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isActive ? 'rgba(77,184,199,0.15)' : 'rgba(255,255,255,0.04)' }}>
                          <item.icon className="w-4 h-4" style={{ color: isActive ? TEAL : 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <span className="text-sm font-medium flex-1 text-left" style={{ color: isActive ? TEAL : 'rgba(255,255,255,0.5)' }}>
                          {item.label}
                        </span>
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              </li>
            ))}

            {/* Minha Agenda — só aparece quando há businessId na URL */}
            {agendaBusinessId && (
              <li>
                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                  <NavLink to={`/profissional/${agendaBusinessId}/agenda`} onClick={e => handleLinkClick(e, `/profissional/${agendaBusinessId}/agenda`)}>
                    {({ isActive }) => (
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative" style={{ background: isActive ? TEAL_BG : 'transparent', border: isActive ? `1px solid ${TEAL_BORDER}` : '1px solid transparent' }}>
                        {isActive && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: TEAL }} />}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isActive ? 'rgba(77,184,199,0.15)' : 'rgba(255,255,255,0.04)' }}>
                          <CalendarDays className="w-4 h-4" style={{ color: isActive ? TEAL : 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <span className="text-sm font-medium flex-1 text-left" style={{ color: isActive ? TEAL : 'rgba(255,255,255,0.5)' }}>
                          Minha Agenda
                        </span>
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              </li>
            )}
          </ul>
        </div>

        {/* ── FOOTER ── */}
        <div className="relative z-10 px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <motion.button
            onClick={handleLogout} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group"
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400/70 group-hover:text-red-400 transition-colors">Sair do painel</span>
          </motion.button>
          <p className="text-center mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.1)' }}>Connecta ServiçosPro © 2025</p>
        </div>
      </motion.aside>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
    </>
  )
}
