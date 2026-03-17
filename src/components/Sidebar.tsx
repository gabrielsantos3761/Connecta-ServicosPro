import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Calendar,
  User,
  LogOut,
  X,
  Heart,
  Wallet,
  ChevronRight,
  Building2,
  Scissors,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url;
    if (url.includes('googleusercontent.com') && url.includes('=s96-c')) {
      return url.replace('=s96-c', '=s400-c');
    }
    return url;
  };

  const displayAvatar = user?.avatar
    ? getHighQualityImageUrl(user.avatar)
    : undefined;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const baseItems = [
    { icon: Home, label: 'Início', path: '/' },
  ];

  const ownerItem = {
    icon: Building2,
    label: 'Meus Estabelecimentos',
    path: '/selecionar-empresa',
  };

  const professionalItem = {
    icon: Scissors,
    label: 'Área do Profissional',
    path: '/profissional',
  };

  // Agendamentos pessoais (como cliente) — válido para qualquer role
  const agendamentosPath = user ? '/cliente/agendamentos' : '/login'

  const commonItems = [
    { icon: Calendar, label: 'Agendamentos', path: agendamentosPath },
    { icon: Heart, label: 'Favoritos', path: '/favoritos' },
    { icon: Wallet, label: 'Carteira', path: '/carteira' },
    { icon: User, label: 'Perfil', path: '/perfil' },
  ];

  const allMenuItems = (() => {
    if (user?.activeRole === 'owner')
      return [...baseItems, ownerItem, professionalItem, ...commonItems];
    if (user?.activeRole === 'professional')
      return [...baseItems, professionalItem, ...commonItems];
    return [...baseItems, ...commonItems];
  })();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const roleLabel = {
    client: 'Cliente',
    professional: 'Profissional',
    owner: 'Proprietário',
  }[user?.activeRole ?? 'client'] ?? 'Cliente';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: -360 }}
            animate={{ x: 0 }}
            exit={{ x: -360 }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="fixed left-0 top-0 h-full w-[320px] z-50 flex flex-col overflow-hidden"
            style={{
              background: '#060503',
              borderRight: '1px solid rgba(212,175,55,0.18)',
              boxShadow: '8px 0 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Grain overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '256px 256px',
              }}
            />

            {/* Gold ambient glow */}
            <div
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
              }}
            />

            {/* ── HEADER ── */}
            <div
              className="relative z-10 px-6 pt-6 pb-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-6">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                  >
                    <img
                      src="/assets/images/Logo.png"
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p
                      className="text-white font-bold text-sm leading-none"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Connecta
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(212,175,55,0.6)' }}>
                      ServiçosPro
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* User card */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer group"
                  style={{
                    background: 'rgba(212,175,55,0.05)',
                    border: '1px solid rgba(212,175,55,0.15)',
                  }}
                  onClick={() => handleNavigate('/perfil')}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover"
                        style={{ border: '2px solid rgba(212,175,55,0.4)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold text-base"
                        style={{
                          background: 'linear-gradient(135deg, #D4AF37, #B8941E)',
                        }}
                      >
                        {getInitials(user.name)}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{
                        background: '#22c55e',
                        borderColor: '#060503',
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-none mb-1">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>

                  {/* Role badge */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{
                      background: 'rgba(212,175,55,0.12)',
                      color: '#D4AF37',
                      border: '1px solid rgba(212,175,55,0.25)',
                    }}
                  >
                    {roleLabel}
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleNavigate('/login')}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-black transition-all"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                >
                  Entrar na conta
                </motion.button>
              )}
            </div>

            {/* ── NAV ITEMS ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
              <p
                className="text-xs font-semibold uppercase mb-3 px-2"
                style={{
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                Navegação
              </p>

              <nav className="space-y-0.5">
                {allMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + index * 0.04 }}
                      onClick={() => handleNavigate(item.path)}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative group"
                      style={{
                        background: active
                          ? 'rgba(212,175,55,0.08)'
                          : 'transparent',
                        border: active
                          ? '1px solid rgba(212,175,55,0.2)'
                          : '1px solid transparent',
                      }}
                    >
                      {/* Active left bar */}
                      {active && (
                        <motion.div
                          layoutId="activeBar"
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                          style={{ background: '#D4AF37' }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          background: active
                            ? 'rgba(212,175,55,0.15)'
                            : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Icon
                          className="w-4 h-4 transition-colors"
                          style={{
                            color: active ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                          }}
                        />
                      </div>

                      <span
                        className="text-sm font-medium flex-1 text-left transition-colors"
                        style={{
                          color: active
                            ? '#D4AF37'
                            : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {item.label}
                      </span>

                      {active ? (
                        <ChevronRight
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: 'rgba(212,175,55,0.6)' }}
                        />
                      ) : (
                        <ChevronRight
                          className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* ── FOOTER ── */}
            <div
              className="relative z-10 px-4 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              {user && (
                <motion.button
                  onClick={handleLogout}
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
                    Sair da conta
                  </span>
                </motion.button>
              )}

              <p
                className="text-center mt-4 text-xs"
                style={{ color: 'rgba(255,255,255,0.1)' }}
              >
                Connecta ServiçosPro © 2025
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
