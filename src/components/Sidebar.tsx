import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  Calendar,
  User,
  Settings,
  LogOut,
  X,
  Bell,
  Heart,
  Clock,
  Wallet,
  ChevronRight,
  Building2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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

  // Bloquear scroll quando sidebar estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    {
      icon: Home,
      label: 'Início',
      path: '/',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Calendar,
      label: 'Agendamentos',
      path: '/agendamentos',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Heart,
      label: 'Favoritos',
      path: '/favoritos',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      icon: Clock,
      label: 'Histórico',
      path: '/historico',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Wallet,
      label: 'Carteira',
      path: '/carteira',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Bell,
      label: 'Notificações',
      path: '/notificacoes',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: User,
      label: 'Perfil',
      path: '/perfil',
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '/configuracoes',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
    },
  ];

  // Item adicional apenas para profissionais
  const professionalItem = {
    icon: Building2,
    label: 'Locais de trabalho',
    path: '/profissional/associar-barbearia',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  };

  // Item adicional apenas para proprietários
  const ownerItem = {
    icon: Building2,
    label: 'Meus Estabelecimentos',
    path: '/selecionar-empresa',
    color: 'text-gold',
    bgColor: 'bg-gold/10',
  };

  // Combinar itens do menu com item profissional ou proprietário se aplicável
  const allMenuItems =
    user?.activeRole === 'professional'
      ? [...menuItems.slice(0, 2), professionalItem, ...menuItems.slice(2)]
      : user?.activeRole === 'owner'
      ? [menuItems[0], ownerItem, ...menuItems.slice(1)]
      : menuItems;

  const handleNavigate = (path: string) => {
    console.log('Navegando para:', path);
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-full w-80 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-r border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
                    <img
                      src="/assets/images/Logo.png"
                      alt="Connecta ServiçosPro"
                      className="w-full h-full object-cover rounded-xl scale-110"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Connecta</h2>
                    <p className="text-xs text-gray-400">ServiçosPro</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
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
                        // Se erro ao carregar, mostra as iniciais
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {user.activeRole === 'client' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                          Cliente
                        </span>
                      )}
                      {user.activeRole === 'professional' && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          Profissional
                        </span>
                      )}
                      {user.activeRole === 'owner' && (
                        <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full">
                          Proprietário
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Menu
              </p>
              <nav className="space-y-1">
                {allMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${active
                          ? `${item.bgColor} ${item.color} border border-current/20`
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
                      {active && (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Logout Button */}
            <div className="p-4 mt-auto border-t border-white/10">
              <motion.button
                onClick={handleLogout}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Sair</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
