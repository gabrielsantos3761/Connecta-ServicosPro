import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Building2, MapPin, Star, TrendingUp, Plus,
  ArrowRight, Loader2, Menu,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getBusinessesByOwner, type Business } from '@/services/businessService'
import { useToast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/Sidebar'

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '256px 256px',
}

export function SelecionarEmpresa() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user?.id) return
      try {
        setIsLoading(true)
        const businesses = await getBusinessesByOwner(user.id)
        setUserBusinesses(businesses)
      } catch (error: any) {
        console.error('Erro ao buscar estabelecimentos:', error)
        toast({ title: 'Erro', description: 'Erro ao carregar estabelecimentos', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchBusinesses()
  }, [user?.id, toast])

  const handleSelectBusiness = (businessId: string) => {
    localStorage.setItem('selected_business_id', businessId)
    navigate(`/${businessId}/dashboard`)
  }

  const avgRating = userBusinesses.length > 0
    ? (userBusinesses.reduce((a, b) => a + b.rating, 0) / userBusinesses.length).toFixed(1)
    : '0.0'
  const totalReviews = userBusinesses.reduce((a, b) => a + b.totalReviews, 0)

  return (
    <div className="min-h-screen relative" style={{ background: '#050400' }}>
      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={grainStyle} />

      {/* Ambient glows */}
      <div
        className="fixed top-0 left-0 w-[700px] h-[700px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 10% 10%, rgba(212,175,55,0.07) 0%, transparent 60%)' }}
      />
      <div
        className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 90% 90%, rgba(212,175,55,0.04) 0%, transparent 60%)' }}
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Menu button */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)', boxShadow: '0 4px 24px rgba(212,175,55,0.3)' }}
          >
            <Menu className="w-5 h-5 text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
              color: '#D4AF37',
            }}
          >
            <Building2 className="w-3.5 h-3.5" />
            Área do Proprietário
          </div>

          <h1
            className="text-5xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}
          >
            Seus{' '}
            <span style={{ color: '#D4AF37' }}>Estabelecimentos</span>
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Selecione um estabelecimento para acessar o dashboard
          </p>
        </motion.div>

        {/* ── STATS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="grid grid-cols-3 gap-0 mb-14 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            {
              icon: Building2,
              value: userBusinesses.length,
              label: userBusinesses.length === 1 ? 'Estabelecimento' : 'Estabelecimentos',
            },
            {
              icon: Star,
              value: avgRating,
              label: 'Avaliação Média',
            },
            {
              icon: TrendingUp,
              value: totalReviews,
              label: 'Total de Avaliações',
            },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-8 px-6"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <Icon className="w-5 h-5 mb-3" style={{ color: 'rgba(212,175,55,0.6)' }} />
                <p
                  className="text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
              </div>
            )
          })}
        </motion.div>

        {/* ── CARDS ── */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D4AF37' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Carregando estabelecimentos…
            </p>
          </motion.div>
        ) : userBusinesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
            >
              <Building2 className="w-9 h-9" style={{ color: 'rgba(212,175,55,0.5)' }} />
            </div>
            <h3
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Nenhuma empresa cadastrada
            </h3>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cadastre seu primeiro estabelecimento para começar
            </p>
            <button
              onClick={() => navigate('/cadastrar-estabelecimento')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
            >
              <Plus className="w-4 h-4" />
              Cadastrar Estabelecimento
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userBusinesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                whileHover={{ y: -6 }}
                onClick={() => handleSelectBusiness(business.id)}
                className="cursor-pointer group"
              >
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 0 0 0 rgba(212,175,55,0)',
                    transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(212,175,55,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.boxShadow = '0 0 0 0 rgba(212,175,55,0)'
                  }}
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    {business.image ? (
                      <img
                        src={business.image}
                        alt={business.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(10,8,0,0.8) 100%)',
                        }}
                      />
                    )}
                    {/* Gradient bottom overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(5,4,0,0.85) 100%)' }}
                    />

                    {/* Rating badge */}
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-black"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                    >
                      <Star className="w-3 h-3 fill-black" />
                      {business.rating.toFixed(1)}
                    </div>

                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {business.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3
                      className="text-lg font-bold text-white mb-1.5 transition-colors group-hover:text-[#D4AF37]"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {business.name}
                    </h3>

                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {business.description}
                    </p>

                    {/* Meta */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(212,175,55,0.5)' }} />
                        <span className="truncate">
                          {business.address.neighborhood}, {business.address.city} — {business.address.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        <Star className="w-3.5 h-3.5 flex-shrink-0 fill-current" style={{ color: 'rgba(212,175,55,0.5)' }} />
                        <span>
                          {business.totalReviews} avalia{business.totalReviews !== 1 ? 'ções' : 'ção'}
                        </span>
                      </div>
                    </div>

                    {/* Thin divider */}
                    <div className="mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

                    {/* CTA */}
                    <div
                      className="flex items-center justify-between text-sm font-semibold"
                      style={{ color: '#D4AF37' }}
                    >
                      <span>Acessar Dashboard</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add new business */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + userBusinesses.length * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => navigate('/cadastrar-estabelecimento')}
              className="cursor-pointer group"
            >
              <div
                className="rounded-2xl flex flex-col items-center justify-center min-h-[320px] transition-all duration-300"
                style={{
                  border: '1px dashed rgba(212,175,55,0.2)',
                  background: 'rgba(212,175,55,0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)'
                  e.currentTarget.style.background = 'rgba(212,175,55,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'
                  e.currentTarget.style.background = 'rgba(212,175,55,0.02)'
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <Plus className="w-7 h-7" style={{ color: '#D4AF37' }} />
                </div>
                <h3
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Novo Estabelecimento
                </h3>
                <p className="text-xs text-center px-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Cadastre um novo estabelecimento para gerenciar
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
