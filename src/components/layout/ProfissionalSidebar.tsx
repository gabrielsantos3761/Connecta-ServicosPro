import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Home,
  LogOut,
  X,
  Scissors,
  UserCog,
  AlertTriangle,
  Save,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

const ACCENT_COLOR = '#1a333a'

interface NavItem {
  to: string
  icon: any
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/profissional', icon: UserCog, label: 'Configurar Perfil' },
  { to: '/profissional/associar-barbearia', icon: Building2, label: 'Estabelecimentos' },
]

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

  // Bloquear scroll quando sidebar estiver aberto
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
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
    if (isDirty) {
      setPendingPath('__logout__')
      setIsMobileOpen(false)
      return
    }
    setIsMobileOpen(false)
    await logout()
    navigate('/login')
  }

  const handleProceed = async () => {
    if (!pendingPath) return
    setIsDirty(false)
    setPendingPath(null)
    if (pendingPath === '__logout__') {
      await logout()
      navigate('/login')
    } else {
      navigate(pendingPath)
    }
  }

  const handleCancelNavigation = () => {
    setPendingPath(null)
  }

  // Função para pegar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Melhorar qualidade da imagem do Google
  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c')) {
      return url.replace('=s96-c', '=s400-c')
    }
    return url
  }

  const displayAvatar = user?.avatar ? getHighQualityImageUrl(user.avatar) : undefined

  return (
    <>
      {/* Modal de mudanças não salvas */}
      <AnimatePresence>
        {pendingPath !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #0f1f24, #1a333a)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#f59e0b22', border: '1px solid #f59e0b44' }}
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Alterações não salvas</h3>
              </div>

              <p className="text-gray-300 text-sm mb-2">
                Você fez alterações no seu perfil que ainda não foram salvas.
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Volte e clique no botão{' '}
                <span className="inline-flex items-center gap-1 text-white font-semibold">
                  <Save className="w-3 h-3" /> Salvar Perfil
                </span>{' '}
                para não perder suas mudanças.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCancelNavigation}
                  className="flex-1 text-white font-semibold"
                  style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
                >
                  Continuar editando
                </Button>
                <Button
                  onClick={handleProceed}
                  variant="ghost"
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Sair sem salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{
          x: isMobileOpen ? 0 : -320
        }}
        exit={{ x: -320 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR }}>
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Profissional</h2>
                <p className="text-xs text-gray-400">Painel de Gestão</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}, #2a4f58)` }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                  style={{ backgroundColor: `${ACCENT_COLOR}33`, color: '#4db8c7' }}
                >
                  Profissional
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <NavLink
                    to={item.to}
                    end
                    onClick={(e) => handleLinkClick(e, item.to)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        isActive
                          ? "border"
                          : "hover:bg-white/5 text-gray-400 hover:text-white"
                      )
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            backgroundColor: `${ACCENT_COLOR}1A`,
                            color: '#4db8c7',
                            borderColor: `${ACCENT_COLOR}33`,
                          }
                        : undefined
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm flex-1 text-left">
                      {item.label}
                    </span>
                  </NavLink>
                </motion.div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 mt-auto border-t border-white/10">
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  )
}
