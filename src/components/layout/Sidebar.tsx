import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  LogOut,
  X,
  ChevronDown,
  DollarSign,
  UserCheck,
  ShoppingBag,
  ClipboardList,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { grainStyle } from '@/styles/theme'
import { useNavigate } from 'react-router-dom'
import { getBusinessById, type Business } from '@/services/businessService'

interface NavItem {
  to?: string
  icon: any
  label: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Painéis de gestão',
    icon: LayoutDashboard,
    children: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral' },
      { to: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/dashboard/profissionais', icon: UserCheck, label: 'Profissionais' },
      { to: '/dashboard/servicos', icon: ShoppingBag, label: 'Serviços' },
      { to: '/dashboard/clientes', icon: Users, label: 'Clientes' },
      { to: '/dashboard/agendamentos', icon: ClipboardList, label: 'Agendamentos' },
    ],
  },
  { to: '/entrada-despesas', icon: TrendingUp, label: 'Entrada/Despesas' },
  { to: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
  { to: '/servicos', icon: Scissors, label: 'Serviços' },
  { to: '/profissionais', icon: Users, label: 'Profissionais' },
  { to: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (value: boolean) => void
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [business, setBusiness] = useState<Business | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    'Painéis de gestão': true,
  })

  useEffect(() => {
    const loadBusiness = async () => {
      const businessId = localStorage.getItem('selected_business_id')
      if (businessId) {
        try {
          const data = await getBusinessById(businessId)
          if (data) setBusiness(data)
        } catch (e) {
          console.error('Erro ao carregar estabelecimento:', e)
        }
      }
    }
    loadBusiness()
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  const handleLinkClick = () => setIsMobileOpen(false)

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const businessId = business?.id || localStorage.getItem('selected_business_id') || ''

  const getRoutePath = (basePath: string) => {
    if (!businessId) return basePath
    if (basePath.includes(businessId)) return basePath
    return `/${businessId}${basePath}`
  }

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false
    return item.children.some((child) => {
      const p = child.to ? getRoutePath(child.to) : ''
      return p === location.pathname
    })
  }

  const handleExit = () => {
    localStorage.removeItem('selected_business_id')
    navigate('/selecionar-empresa')
  }

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c'))
      return url.replace('=s96-c', '=s400-c')
    return url
  }

  const displayAvatar = user?.avatar ? getHighQualityImageUrl(user.avatar) : undefined

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
        style={{
          background: '#060503',
          borderRight: '1px solid rgba(212,175,55,0.18)',
          boxShadow: isMobileOpen ? '8px 0 60px rgba(0,0,0,0.8)' : 'none',
        }}
      >
        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={grainStyle}
        />
        {/* Ambient glow */}
        <div
          className="absolute -top-24 -left-24 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }}
        />

        {/* ── HEADER ── */}
        <div
          className="relative z-10 px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            {/* Business logo + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(212,175,55,0.3)' }}
              >
                {business?.image ? (
                  <img src={business.image} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                  >
                    <img
                      src="/assets/images/Logo.png"
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-bold text-white truncate leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {business?.name || 'Connecta'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.55)' }}>
                  Painel de Gestão
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* User card */}
          {user && (
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{
                background: 'rgba(212,175,55,0.05)',
                border: '1px solid rgba(212,175,55,0.14)',
              }}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  style={{ border: '2px solid rgba(212,175,55,0.35)' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                >
                  {getInitials(user.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                  {user.name}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(212,175,55,0.1)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  Proprietário
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── NAV ── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
          <p
            className="text-xs font-semibold uppercase mb-3 px-2"
            style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}
          >
            Menu
          </p>

          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to || item.label}>
                {item.children ? (
                  <div>
                    {/* Parent toggle */}
                    <motion.button
                      onClick={() => toggleSubmenu(item.label)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                      style={{
                        background: isParentActive(item) ? 'rgba(212,175,55,0.06)' : 'transparent',
                        border: isParentActive(item) ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <item.icon
                          className="w-4 h-4"
                          style={{ color: isParentActive(item) ? '#D4AF37' : 'rgba(255,255,255,0.3)' }}
                        />
                      </div>
                      <span
                        className="text-sm font-medium flex-1 text-left"
                        style={{ color: isParentActive(item) ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                        style={{
                          color: 'rgba(255,255,255,0.2)',
                          transform: expandedMenus[item.label] ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}
                      />
                    </motion.button>

                    {/* Submenu */}
                    <AnimatePresence>
                      {expandedMenus[item.label] && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-0.5 overflow-hidden"
                          style={{
                            borderLeft: '1px solid rgba(212,175,55,0.1)',
                            marginLeft: '1.25rem',
                            paddingLeft: '0.75rem',
                          }}
                        >
                          {item.children.map((child, idx) => (
                            <motion.li
                              key={child.to}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <NavLink
                                to={getRoutePath(child.to!)}
                                end
                                onClick={handleLinkClick}
                                className="group relative"
                              >
                                {({ isActive }) => (
                                  <div
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all relative"
                                    style={{
                                      background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                                      borderLeft: isActive ? '2px solid #D4AF37' : '2px solid transparent',
                                    }}
                                  >
                                    <child.icon
                                      className="w-3.5 h-3.5 flex-shrink-0"
                                      style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.25)' }}
                                    />
                                    <span
                                      className="text-xs font-medium whitespace-nowrap"
                                      style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.45)' }}
                                    >
                                      {child.label}
                                    </span>
                                  </div>
                                )}
                              </NavLink>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                    <NavLink
                      to={getRoutePath(item.to!)}
                      end
                      onClick={handleLinkClick}
                    >
                      {({ isActive }) => (
                        <div
                          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative"
                          style={{
                            background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                            border: isActive ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
                          }}
                        >
                          {isActive && (
                            <div
                              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                              style={{ background: '#D4AF37' }}
                            />
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)' }}
                          >
                            <item.icon
                              className="w-4 h-4"
                              style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.3)' }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium flex-1 text-left"
                            style={{ color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}
                          >
                            {item.label}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </motion.div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="relative z-10 px-4 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <motion.button
            onClick={handleExit}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group"
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.1)',
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400/70 group-hover:text-red-400 transition-colors">
              Sair do painel
            </span>
          </motion.button>

          <p className="text-center mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.1)' }}>
            Connecta ServiçosPro © 2025
          </p>
        </div>
      </motion.aside>
    </>
  )
}
