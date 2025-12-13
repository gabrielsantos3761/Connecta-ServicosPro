import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Star, TrendingUp, Plus, ArrowRight, Loader2, Menu } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { getBusinessesByOwner, type Business } from '@/services/businessService'
import { useToast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/Sidebar'

export function SelecionarEmpresa() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Buscar empresas do proprietário logado
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const businesses = await getBusinessesByOwner(user.id)
        setUserBusinesses(businesses)
      } catch (error: any) {
        console.error('Erro ao buscar estabelecimentos:', error)
        toast({
          title: 'Erro',
          description: 'Erro ao carregar estabelecimentos',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [user?.id, toast])

  const handleSelectBusiness = (businessId: string) => {
    // Salvar a empresa selecionada no contexto/localStorage
    localStorage.setItem('selected_business_id', businessId)
    navigate(`/${businessId}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Menu Button - Fixed Position */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 md:top-6 md:left-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-gold to-yellow-600 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl hover:shadow-gold/50"
          >
            <Menu className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Animated Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mb-4">
            Selecione uma Empresa
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Escolha qual estabelecimento você deseja gerenciar
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-gold/50 transition-all"
          >
            <Building2 className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{userBusinesses.length}</p>
            <p className="text-sm text-gray-400">
              {userBusinesses.length === 1 ? 'Estabelecimento' : 'Estabelecimentos'}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-gold/50 transition-all"
          >
            <Star className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">
              {userBusinesses.length > 0
                ? (
                    userBusinesses.reduce((acc, b) => acc + b.rating, 0) / userBusinesses.length
                  ).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-sm text-gray-400">Avaliação Média</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-gold/50 transition-all"
          >
            <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">
              {userBusinesses.reduce((acc, b) => acc + b.totalReviews, 0)}
            </p>
            <p className="text-sm text-gray-400">Total de Avaliações</p>
          </motion.div>
        </motion.div>

        {/* Business Cards */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
            <p className="text-white text-lg">Carregando estabelecimentos...</p>
          </motion.div>
        ) : userBusinesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16"
          >
            <Building2 className="w-20 h-20 mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Nenhuma empresa cadastrada
            </h3>
            <p className="text-gray-400 mb-8">
              Cadastre seu primeiro estabelecimento para começar
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
                onClick={() => navigate('/cadastrar-estabelecimento')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Estabelecimento
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {userBusinesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                onClick={() => handleSelectBusiness(business.id)}
              >
                <Card className="h-full cursor-pointer hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 border-2 border-white/10 hover:border-gold/50 group overflow-hidden bg-white/5 backdrop-blur-sm">
                  {/* Image/Banner */}
                  <div className="relative h-40 bg-gradient-to-br from-gold/20 to-gold/5 overflow-hidden">
                    {business.image && (
                      <img
                        src={business.image}
                        alt={business.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-gold to-yellow-600 text-black border-0">
                        <Star className="w-3 h-3 mr-1 fill-black" />
                        {business.rating.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm text-white border-white/20"
                      >
                        {business.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Business Name */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-gold group-hover:to-yellow-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {business.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {business.description}
                    </p>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-gray-400 mb-4">
                      <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <p className="line-clamp-2">
                        {business.address.neighborhood}, {business.address.city} - {business.address.state}
                      </p>
                    </div>

                    {/* Reviews */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                      <Star className="w-4 h-4 text-gold fill-gold" />
                      <p>
                        {business.totalReviews} avalia{business.totalReviews !== 1 ? 'ções' : 'ção'}
                      </p>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex items-center justify-center gap-2 text-gold font-semibold">
                      <span>Acessar Dashboard</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Add New Business Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: userBusinesses.length * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card
                className="h-full cursor-pointer hover:shadow-2xl hover:shadow-gold/10 transition-all duration-300 border-2 border-dashed border-white/20 hover:border-gold/50 group bg-white/5 backdrop-blur-sm"
                onClick={() => navigate('/cadastrar-estabelecimento')}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-20 h-20 bg-white/5 group-hover:bg-gold/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                    <Plus className="w-10 h-10 text-gray-400 group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-gold group-hover:to-yellow-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    Adicionar Estabelecimento
                  </h3>
                  <p className="text-sm text-gray-400 text-center">
                    Cadastre um novo estabelecimento para gerenciar
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
