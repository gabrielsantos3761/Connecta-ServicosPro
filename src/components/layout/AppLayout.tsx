import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/UserMenu'

export function AppLayout() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-black">
      {/* Global Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center">
                <img
                  src="/Connecta-ServicosPro/assets/images/Logo.png"
                  alt="Logo"
                  className="w-full h-full object-cover rounded-lg scale-110"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Connecta
                </h1>
                <p className="text-xs text-gray-400">ServiçosPro</p>
              </div>
            </button>

            {user ? (
              <UserMenu />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-gray-100 transition-all font-medium text-sm"
              >
                Entrar
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Page Content */}
      <div className="pt-24">
        <Outlet />
      </div>
    </div>
  )
}
