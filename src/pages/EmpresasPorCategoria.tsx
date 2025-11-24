import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Search, MapPin, Star, Clock, Phone, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockBusinesses, businessCategories } from '@/data/mockData'
import { BusinessCategory } from '@/types'

// Gallery images based on category and business ID
const getGalleryImages = (category: string, businessId: string) => {
  const categoryImages: Record<string, string[][]> = {
    barbearia: [
      // BarberPro Premium (biz-1)
      [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop',
      ],
      // Barbearia Clássica (biz-2)
      [
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511511450040-677116ff389e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1528920304568-7aa06b3dda8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1612637612912-aab973f0f939?w=800&h=600&fit=crop',
      ],
      // The Barber Shop (biz-3)
      [
        'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1521490878887-76e391a7b9b2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=800&h=600&fit=crop',
      ],
    ],
    salao: [
      // Salão Estilo & Charme (biz-4)
      [
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=600&fit=crop',
      ],
      // Beleza Pura (biz-5)
      [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop',
      ],
    ],
    estetica: [
      // Estética Renove (biz-6)
      [
        'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop',
      ],
    ],
    spa: [
      // Spa Serenity (biz-7)
      [
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&h=600&fit=crop',
      ],
    ],
    manicure: [
      // Nails Art Studio (biz-8)
      [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop',
      ],
    ],
    massagem: [
      // Massagem & Terapia (biz-9)
      [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600&fit=crop',
      ],
    ],
    depilacao: [
      // Depil Laser Center (biz-10)
      [
        'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop',
      ],
    ],
    maquiagem: [
      // Makeup Pro Studio (biz-11)
      [
        'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1583241800698-7f0c50c43810?w=800&h=600&fit=crop',
      ],
    ],
  }

  // Get images based on business ID index within category
  const businessIndex = mockBusinesses
    .filter(b => b.category === category)
    .findIndex(b => b.id === businessId)

  const categoryGalleries = categoryImages[category]
  if (categoryGalleries && businessIndex >= 0 && businessIndex < categoryGalleries.length) {
    return categoryGalleries[businessIndex]
  }

  return []
}

// Business Card Carousel Component
function BusinessCardCarousel({ businessId, businessName, category }: { businessId: string; businessName: string; category: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const galleryImages = getGalleryImages(category, businessId)

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    if (galleryImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [galleryImages.length])

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const previousImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  if (galleryImages.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Sem imagem</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group/carousel">
      {/* Images with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${businessId}-${currentImageIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <img
            src={galleryImages[currentImageIndex]}
            alt={`${businessName} - Foto ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {galleryImages.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100 z-20"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </>
      )}

      {/* Pagination Dots */}
      {galleryImages.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {galleryImages.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(index)
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-gold w-6'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EmpresasPorCategoria() {
  const { categoryId } = useParams<{ categoryId: BusinessCategory }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews'>('rating')

  const category = businessCategories.find((cat) => cat.id === categoryId)
  const businesses = mockBusinesses.filter((business) => business.category === categoryId)

  const filteredBusinesses = businesses
    .filter((business) =>
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating
      }
      return b.totalReviews - a.totalReviews
    })

  const getTodayHours = (businessId: string) => {
    const business = businesses.find((b) => b.id === businessId)
    if (!business) return null

    const today = new Date().getDay()
    const todayHours = business.businessHours.find((h) => h.dayOfWeek === today)

    if (!todayHours || todayHours.isClosed) {
      return { isOpen: false, hours: 'Fechado hoje' }
    }

    return { isOpen: true, hours: `${todayHours.open} - ${todayHours.close}` }
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Categoria não encontrada</h2>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gold to-yellow-600 text-black hover:shadow-xl hover:shadow-gold/50"
          >
            Voltar para início
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Premium */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img
                    src="/Connecta-ServicosPro/assets/images/Logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg scale-110"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white tracking-tight truncate">
                    {category.name}
                  </h1>
                  <p className="text-xs text-gray-400 truncate">{category.description}</p>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-white text-black rounded-full hover:bg-gray-100 transition-all font-medium text-sm flex-shrink-0"
            >
              Entrar
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Category Info */}
      <div className="relative pt-32 pb-16 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Os Melhores em
              <br />
              <span className="bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                {category.name}
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Profissionais selecionados com excelência e qualidade garantida
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <MapPin className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">{businesses.length}</p>
              <p className="text-sm text-gray-400">Estabelecimentos</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <Star className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">
                {businesses.length > 0
                  ? (businesses.reduce((acc, b) => acc + b.rating, 0) / businesses.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-sm text-gray-400">Média de Avaliação</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center col-span-2 md:col-span-1">
              <Award className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-white mb-1">
                {businesses.reduce((acc, b) => acc + b.totalReviews, 0)}
              </p>
              <p className="text-sm text-gray-400">Avaliações Totais</p>
            </div>
          </motion.div>

          {/* Search and Filters - Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Bar */}
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/5 border border-white/20 rounded-xl flex items-center px-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <Input
                    type="text"
                    placeholder="Buscar estabelecimentos, bairros..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Sort Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('rating')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    sortBy === 'rating'
                      ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-lg shadow-gold/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Melhor Avaliados</span>
                  <span className="sm:hidden">Avaliação</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('reviews')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    sortBy === 'reviews'
                      ? 'bg-gradient-to-r from-gold to-yellow-600 text-black shadow-lg shadow-gold/20'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Mais Avaliações</span>
                  <span className="sm:hidden">Popular</span>
                </motion.button>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-400">
                <span className="text-white font-semibold">{filteredBusinesses.length}</span> estabelecimento{filteredBusinesses.length !== 1 ? 's' : ''} encontrado{filteredBusinesses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Business Grid - Premium */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filteredBusinesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 max-w-md mx-auto">
              <Search className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum estabelecimento encontrado
              </h3>
              <p className="text-sm text-gray-400">
                Tente buscar por outro termo ou filtro
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business, index) => {
              const todayHours = getTodayHours(business.id)

              return (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card
                    className="h-full cursor-pointer bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/10 transition-all duration-500 overflow-hidden"
                    onClick={() => navigate(`/empresas/${business.id}`)}
                  >
                    {/* Image Carousel */}
                    <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                      <BusinessCardCarousel
                        businessId={business.id}
                        businessName={business.name}
                        category={business.category}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-30">
                        <Badge className="bg-gradient-to-r from-gold to-yellow-600 text-black border-0 shadow-lg">
                          <Star className="w-3 h-3 mr-1 fill-black" />
                          {business.rating.toFixed(1)}
                        </Badge>
                        {todayHours && (
                          <Badge
                            className={
                              todayHours.isOpen
                                ? 'bg-green-500/90 backdrop-blur-sm hover:bg-green-600 text-white border-0 shadow-lg'
                                : 'bg-gray-500/90 backdrop-blur-sm hover:bg-gray-600 text-white border-0 shadow-lg'
                            }
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {todayHours.isOpen ? 'Aberto' : 'Fechado'}
                          </Badge>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>

                    <CardContent className="p-6 relative">
                      {/* Gradient Orb */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />

                      {/* Business Name */}
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors relative z-10">
                        {business.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 relative z-10">
                        {business.description}
                      </p>

                      {/* Address */}
                      <div className="flex items-start gap-2 text-sm text-gray-400 mb-3 relative z-10">
                        <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-2">
                          {business.address.street}, {business.address.number} - {business.address.neighborhood}
                        </p>
                      </div>

                      {/* Hours */}
                      {todayHours && (
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3 relative z-10">
                          <Clock className="w-4 h-4 text-gold" />
                          <p>{todayHours.hours}</p>
                        </div>
                      )}

                      {/* Reviews */}
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 relative z-10">
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        <p>
                          {business.totalReviews} avalia{business.totalReviews !== 1 ? 'ções' : 'ção'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-3 relative z-10">
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={`tel:${business.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm text-white font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          Ligar
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/empresas/${business.id}`)
                          }}
                          className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-gold/50 transition-all"
                        >
                          Ver Mais
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
