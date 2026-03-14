import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Search, MapPin, Star, Clock, Phone, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { businessCategories } from '@/data/mockData'
import { BusinessCategory } from '@/types'
import { getBusinessesByCategory, type Business } from '@/services/businessService'

const GOLD = '#D4AF37'
const BG = '#050400'
const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}
const DIVIDER: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.06)' }
const SPRING = { type: 'spring' as const, stiffness: 320, damping: 36 }
const BTN_GOLD: React.CSSProperties = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: BG,
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: 'none',
  cursor: 'pointer',
}
const BADGE_GOLD: React.CSSProperties = {
  background: 'rgba(212,175,55,0.15)',
  color: GOLD,
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
}

// Business Card Carousel Component
function BusinessCardCarousel({ business }: { business: Business }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const realImages: string[] = []

  if (business.image) {
    realImages.push(business.image)
  }

  if (business.coverImage && business.coverImage !== business.image) {
    realImages.push(business.coverImage)
  }

  if (business.gallery && business.gallery.length > 0) {
    business.gallery.forEach(img => {
      if (img && !realImages.includes(img)) {
        realImages.push(img)
      }
    })
  }

  const galleryImages = realImages

  useEffect(() => {
    galleryImages.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [galleryImages])

  useEffect(() => {
    if (galleryImages.length <= 1) return
    const nextIndex = (currentImageIndex + 1) % galleryImages.length
    const img = new Image()
    img.src = galleryImages[nextIndex]
  }, [currentImageIndex, galleryImages])

  useEffect(() => {
    if (galleryImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 7000)
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
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem' }}>Sem imagem</span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} className="group/carousel">
      <AnimatePresence initial={false}>
        <motion.div
          key={`${business.id}-${currentImageIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: [0.43, 0.13, 0.23, 0.96] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <img
            src={galleryImages[currentImageIndex]}
            alt={`${business.name} - Foto ${currentImageIndex + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </motion.div>
      </AnimatePresence>

      {galleryImages.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={previousImage}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
          >
            <ChevronLeft style={{ width: 20, height: 20, color: 'white' }} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextImage}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}
          >
            <ChevronRight style={{ width: 20, height: 20, color: 'white' }} />
          </motion.button>
        </>
      )}

      {galleryImages.length > 1 && (
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 20 }}>
          {galleryImages.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentImageIndex(index)
              }}
              style={{
                width: index === currentImageIndex ? 24 : 6,
                height: 6,
                borderRadius: 9999,
                border: 'none',
                cursor: 'pointer',
                background: index === currentImageIndex ? GOLD : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s',
                padding: 0,
              }}
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
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const category = businessCategories.find((cat) => cat.id === categoryId)

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!categoryId) return

      setIsLoading(true)
      try {
        const categoryMap: Record<string, string> = {
          'barbearia': 'Barbearia',
          'salao': 'Salão de Beleza',
          'estetica': 'Clínica Estética',
          'spa': 'Spa',
          'manicure': 'Manicure e Pedicure',
          'massagem': 'Massagem',
          'depilacao': 'Depilação',
          'maquiagem': 'Maquiagem'
        }

        const businessCategory = categoryMap[categoryId]
        if (businessCategory) {
          const realBusinesses = await getBusinessesByCategory(businessCategory)
          setBusinesses(realBusinesses)
        } else {
          setBusinesses([])
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error)
        setBusinesses([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBusinesses()
  }, [categoryId])

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
    if (!business || !business.businessHours) return null

    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const today = new Date().getDay()
    const todayString = dayMap[today]

    const todayHours = business.businessHours.find((h) => h.day === todayString)

    if (!todayHours || !todayHours.isOpen) {
      return { isOpen: false, hours: 'Fechado hoje' }
    }

    return { isOpen: true, hours: `${todayHours.open} - ${todayHours.close}` }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64,
            border: `4px solid ${GOLD}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'white', fontSize: '1.125rem' }}>Carregando estabelecimentos...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Categoria não encontrada
          </h2>
          <button style={BTN_GOLD} onClick={() => navigate('/')}>
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', paddingTop: 32, paddingBottom: 64, overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${BG}, #0a0900, ${BG})` }} />

        {/* Animated Orb */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, right: 0, width: 384, height: 384, background: `radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)`, borderRadius: '50%', filter: 'blur(60px)' }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.2 }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
              Os Melhores em
              <br />
              <span style={{ background: `linear-gradient(90deg, ${GOLD}, #f0d060, ${GOLD})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {category.name}
              </span>
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.5)', maxWidth: 512, margin: '0 auto' }}>
              Profissionais selecionados com excelência e qualidade garantida
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 768, margin: '0 auto 48px' }}
          >
            {[
              { icon: <MapPin style={{ width: 32, height: 32, color: GOLD }} />, value: businesses.length, label: 'Estabelecimentos' },
              {
                icon: <Star style={{ width: 32, height: 32, color: GOLD }} />,
                value: businesses.length > 0
                  ? (businesses.reduce((acc, b) => acc + b.rating, 0) / businesses.length).toFixed(1)
                  : '0.0',
                label: 'Média de Avaliação'
              },
              { icon: <Award style={{ width: 32, height: 32, color: GOLD }} />, value: businesses.reduce((acc, b) => acc + b.totalReviews, 0), label: 'Avaliações Totais' },
            ].map((stat, i) => (
              <div key={i} style={{ ...CARD_STYLE, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{stat.icon}</div>
                <p style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{stat.value}</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.4 }}
            style={{ ...CARD_STYLE, padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.875rem', padding: '0 1rem' }}>
                <Search style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginRight: 12 }} />
                <input
                  type="text"
                  placeholder="Buscar estabelecimentos, bairros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '0.9375rem', padding: '0.75rem 0' }}
                />
              </div>

              {/* Sort Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('rating')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.75rem 1.25rem', borderRadius: '0.875rem',
                    fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', border: 'none',
                    background: sortBy === 'rating'
                      ? 'linear-gradient(135deg,#D4AF37,#B8941E)'
                      : 'rgba(255,255,255,0.04)',
                    color: sortBy === 'rating' ? BG : 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <Star style={{ width: 16, height: 16 }} />
                  <span>Melhor Avaliados</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy('reviews')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.75rem 1.25rem', borderRadius: '0.875rem',
                    fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', border: 'none',
                    background: sortBy === 'reviews'
                      ? 'linear-gradient(135deg,#D4AF37,#B8941E)'
                      : 'rgba(255,255,255,0.04)',
                    color: sortBy === 'reviews' ? BG : 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <TrendingUp style={{ width: 16, height: 16 }} />
                  <span>Mais Avaliações</span>
                </motion.button>
              </div>
            </div>

            {/* Results Count */}
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              <span style={{ color: 'white', fontWeight: 600 }}>{filteredBusinesses.length}</span>{' '}
              estabelecimento{filteredBusinesses.length !== 1 ? 's' : ''} encontrado{filteredBusinesses.length !== 1 ? 's' : ''}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Business Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        {filteredBusinesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '4rem 0' }}
          >
            <div style={{ ...CARD_STYLE, padding: '3rem', maxWidth: 420, margin: '0 auto' }}>
              <Search style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem', display: 'block' }} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>
                Nenhum estabelecimento encontrado
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0 }}>
                Tente buscar por outro termo ou filtro
              </p>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
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
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/empresas/${business.id}`)}
                >
                  <div style={{ ...CARD_STYLE, overflow: 'hidden', height: '100%', transition: 'border-color 0.3s' }}>
                    {/* Image Carousel */}
                    <div style={{ position: 'relative', height: 224, background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                      <BusinessCardCarousel business={business} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,4,0,0.9) 0%, rgba(5,4,0,0.4) 40%, transparent 100%)', pointerEvents: 'none', zIndex: 10 }} />

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', zIndex: 30 }}>
                        <span style={{ ...BADGE_GOLD, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star style={{ width: 12, height: 12, fill: GOLD }} />
                          {business.rating.toFixed(1)}
                        </span>
                        {todayHours && (
                          <span style={{
                            background: todayHours.isOpen ? 'rgba(34,197,94,0.85)' : 'rgba(107,114,128,0.85)',
                            color: 'white',
                            borderRadius: 9999,
                            padding: '2px 10px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            backdropFilter: 'blur(8px)',
                          }}>
                            <Clock style={{ width: 12, height: 12 }} />
                            {todayHours.isOpen ? 'Aberto' : 'Fechado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
                        {business.name}
                      </h3>

                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {business.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                        <MapPin style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {business.address.street}, {business.address.number} - {business.address.neighborhood}
                        </p>
                      </div>

                      {todayHours && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                          <Clock style={{ width: 16, height: 16, color: GOLD }} />
                          <p style={{ margin: 0 }}>{todayHours.hours}</p>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                        <Star style={{ width: 16, height: 16, color: GOLD, fill: GOLD }} />
                        <p style={{ margin: 0 }}>
                          {business.totalReviews} avalia{business.totalReviews !== 1 ? 'ções' : 'ção'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={`tel:${business.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}
                        >
                          <Phone style={{ width: 16, height: 16 }} />
                          Ligar
                        </motion.a>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/empresas/${business.id}`)
                          }}
                          style={{ ...BTN_GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem 1rem', fontSize: '0.875rem' }}
                        >
                          Ver Mais
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
