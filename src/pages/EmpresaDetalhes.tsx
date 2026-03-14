import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Calendar,
  Scissors,
  Check,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { formatCurrency } from '@/lib/utils'
import { getBusinessById, type Business } from '@/services/businessService'
import { getServicos, getCombos, type ServicoData, type ComboData } from '@/services/gerenciarServicosService'
import { getAllBusinessConfigs, type AllBusinessConfigs } from '@/services/businessConfigService'
import { getLinksByBusiness, type ProfessionalLink } from '@/services/professionalLinkService'
import { getProfissionalInfoPessoais } from '@/services/professionalProfileService'
import { Package } from 'lucide-react'

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

export function EmpresaDetalhes() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [business, setBusiness] = useState<Business | null>(null)
  const [configs, setConfigs] = useState<AllBusinessConfigs | null>(null)
  const [businessServices, setBusinessServices] = useState<ServicoData[]>([])
  const [businessCombos, setBusinessCombos] = useState<ComboData[]>([])
  const [businessProfessionals, setBusinessProfessionals] = useState<ProfessionalLink[]>([])
  const [professionalSocialNames, setProfessionalSocialNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Mesclar dados do doc principal com subcoleções (subcoleção tem prioridade)
  const mergedBusiness = business ? {
    ...business,
    name: configs?.informacoes?.name || business.name,
    description: configs?.informacoes?.description || business.description,
    phone: configs?.contato?.phone || business.phone,
    email: configs?.contato?.email || business.email,
    image: configs?.fotos?.image || business.image,
    gallery: (configs?.fotos?.gallery && configs.fotos.gallery.length > 0)
      ? configs.fotos.gallery
      : business.gallery,
    businessHours: configs?.horarios?.businessHours || business.businessHours,
    address: {
      street: configs?.endereco?.street || business.address?.street || '',
      number: configs?.endereco?.number || business.address?.number || '',
      complement: configs?.endereco?.complement ?? business.address?.complement,
      neighborhood: configs?.endereco?.neighborhood || business.address?.neighborhood || '',
      city: configs?.endereco?.city || business.address?.city || '',
      state: configs?.endereco?.state || business.address?.state || '',
      zipCode: configs?.endereco?.zipCode || business.address?.zipCode || '',
    },
  } : null

  // Carregar estabelecimento e serviços do Firestore
  useEffect(() => {
    const loadData = async () => {
      if (!businessId) return

      setIsLoading(true)
      try {
        const businessData = await getBusinessById(businessId)
        if (businessData) {
          setBusiness(businessData)
        }
        const [servicosData, combosData, configsData, profissionaisData] = await Promise.all([
          getServicos(businessId),
          getCombos(businessId),
          getAllBusinessConfigs(businessId),
          getLinksByBusiness(businessId),
        ])
        setBusinessServices(servicosData)
        setBusinessCombos(combosData)
        setConfigs(configsData)
        const activeProfs = profissionaisData.filter(p => p.status === 'active')
        setBusinessProfessionals(activeProfs)

        // Carregar nomes sociais do Firestore
        const socialNames: Record<string, string> = {}
        await Promise.all(
          activeProfs.map(async (link) => {
            try {
              const info = await getProfissionalInfoPessoais(link.professionalId)
              if (info?.name) socialNames[link.professionalId] = info.name
            } catch { /* mantém fallback para professionalName */ }
          })
        )
        setProfessionalSocialNames(socialNames)
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [businessId])

  // Get gallery images from business data or fallback to main image
  const getGalleryImages = () => {
    if (!mergedBusiness) return []

    if (mergedBusiness.gallery && mergedBusiness.gallery.length > 0) {
      return mergedBusiness.gallery
    }

    if (mergedBusiness.image) {
      return [mergedBusiness.image]
    }

    return ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=600&fit=crop']
  }

  const galleryImages = getGalleryImages()

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
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [galleryImages.length])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
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
          <p style={{ color: 'white', fontSize: '1.125rem' }}>Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!mergedBusiness) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Estabelecimento não encontrado
          </h2>
          <button style={BTN_GOLD} onClick={() => navigate('/')}>
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  const getDayName = (day: string) => {
    const dayMap: Record<string, string> = {
      'sunday': 'Domingo',
      'monday': 'Segunda',
      'tuesday': 'Terça',
      'wednesday': 'Quarta',
      'thursday': 'Quinta',
      'friday': 'Sexta',
      'saturday': 'Sábado'
    }
    return dayMap[day] || day
  }

  const DAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const getSelectedProfLink = () => {
    if (!selectedProfessional) return null
    return businessProfessionals.find(p => p.professionalId === selectedProfessional) ?? null
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return true

    const dayKey = DAY_MAP[date.getDay()]
    const profLink = getSelectedProfLink()

    if (profLink) {
      const schedDay = profLink.workSchedule?.find(s => s.day === dayKey)
      return !schedDay?.isActive
    }

    const hours = mergedBusiness!.businessHours.find(h => h.day === dayKey)
    return !hours?.isOpen
  }

  const getAvailableTimes = () => {
    if (!selectedDate) return []

    const dayKey = DAY_MAP[selectedDate.getDay()]
    const profLink = getSelectedProfLink()

    let openTime: string
    let closeTime: string

    if (profLink) {
      const schedDay = profLink.workSchedule?.find(s => s.day === dayKey)
      if (!schedDay?.isActive) return []
      openTime = schedDay.start
      closeTime = schedDay.end
    } else {
      const hours = mergedBusiness!.businessHours.find(h => h.day === dayKey)
      if (!hours?.isOpen) return []
      openTime = hours.open
      closeTime = hours.close
    }

    const times: string[] = []
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    let current = openHour * 60 + (openMin || 0)
    const end = closeHour * 60 + (closeMin || 0)

    while (current < end) {
      const h = Math.floor(current / 60)
      const m = current % 60
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
      current += 30
    }

    return times
  }

  const handleBooking = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      alert('Por favor, preencha todos os campos')
      return
    }

    const isCombo = selectedService.startsWith('combo_')
    const actualId = isCombo ? selectedService.replace('combo_', '') : selectedService

    let serviceName = ''
    let servicePrice = 0
    let serviceDuration = 0
    let serviceDescription = ''

    if (isCombo) {
      const combo = businessCombos.find((c) => c.id === actualId)
      if (combo) {
        serviceName = combo.name
        servicePrice = combo.comboPrice
        serviceDuration = getComboDuration(combo)
        serviceDescription = `Combo: ${combo.serviceNames.join(', ')}`
      }
    } else {
      const serviceData = businessServices.find((s) => s.id === actualId)
      if (serviceData) {
        serviceName = serviceData.name
        servicePrice = serviceData.price
        serviceDuration = serviceData.duration
        serviceDescription = serviceData.description
      }
    }

    setIsBookingDialogOpen(false)
    const formattedDate = selectedDate.toISOString().split('T')[0]
    navigate('/checkout', {
      state: {
        businessId: mergedBusiness!.id,
        businessName: mergedBusiness!.name,
        businessPhone: mergedBusiness!.phone,
        businessEmail: mergedBusiness!.email,
        businessAddress: mergedBusiness!.address,
        serviceId: actualId,
        serviceName,
        servicePrice,
        serviceDuration,
        serviceDescription,
        professionalId: selectedProfessional,
        professionalName: professionalSocialNames[selectedProfessional] || businessProfessionals.find(p => p.professionalId === selectedProfessional)?.professionalName || '',
        professionalRole: businessProfessionals.find(p => p.professionalId === selectedProfessional)?.role || '',
        date: formattedDate,
        time: selectedTime,
      },
    })
  }

  const getComboDuration = (combo: ComboData) => {
    if (combo.duration && combo.duration > 0) return combo.duration
    return (combo.serviceIds || []).reduce((total, id) => {
      const service = businessServices.find(s => s.id === id)
      return total + (service?.duration || 0)
    }, 0)
  }

  const getSelectedItemData = () => {
    if (!selectedService) return null
    const isCombo = selectedService.startsWith('combo_')
    const actualId = isCombo ? selectedService.replace('combo_', '') : selectedService

    if (isCombo) {
      const combo = businessCombos.find((c) => c.id === actualId)
      if (!combo) return null
      return {
        name: combo.name,
        price: combo.comboPrice,
        originalPrice: combo.originalPrice,
        duration: getComboDuration(combo),
        isCombo: true,
        serviceNames: combo.serviceNames,
      }
    }

    const service = businessServices.find((s) => s.id === actualId)
    if (!service) return null
    return {
      name: service.name,
      price: service.price,
      originalPrice: 0,
      duration: service.duration,
      isCombo: false,
      serviceNames: [] as string[],
    }
  }

  const selectedItemData = getSelectedItemData()

  const inputSelectStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 2.5rem 0 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.75rem',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg:grid-cols-3-custom">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>

            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Photo Carousel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                style={{ position: 'relative', borderRadius: '1.125rem', height: 320, overflow: 'hidden' }}
                className="group"
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, ease: [0.43, 0.13, 0.23, 0.96] }}
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <img
                      src={galleryImages[currentImageIndex]}
                      alt={`${mergedBusiness.name} - Foto ${currentImageIndex + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050400 0%, rgba(5,4,0,0.2) 50%, transparent 100%)' }} />
                  </motion.div>
                </AnimatePresence>

                {galleryImages.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={previousImage}
                      style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                    >
                      <ChevronLeft style={{ width: 24, height: 24, color: 'white' }} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={nextImage}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                    >
                      <ChevronRight style={{ width: 24, height: 24, color: 'white' }} />
                    </motion.button>
                  </>
                )}

                {galleryImages.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
                    {galleryImages.map((_, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: index === currentImageIndex ? 32 : 8,
                          height: 8,
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

                {galleryImages.length > 1 && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 9999, zIndex: 10 }}>
                    <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>
                      {currentImageIndex + 1} / {galleryImages.length}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* About */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.1 }}
                style={CARD_STYLE}
              >
                <div style={{ padding: '1.25rem 1.5rem', ...DIVIDER }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Sobre</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{mergedBusiness.description}</p>
                </div>
              </motion.div>

              {/* Services & Combos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.2 }}
                style={CARD_STYLE}
              >
                <div style={{ padding: '1.25rem 1.5rem', ...DIVIDER }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Serviços</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {businessServices.length === 0 && businessCombos.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
                      Nenhum serviço disponível no momento
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {businessServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 10 }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <div style={{ width: 40, height: 40, background: `rgba(212,175,55,0.15)`, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Scissors style={{ width: 20, height: 20, color: GOLD }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ color: 'white', fontWeight: 600, margin: 0, marginBottom: 2 }}>{service.name}</h4>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0, marginBottom: 4 }}>{service.description}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock style={{ width: 12, height: 12 }} />
                                  {service.duration} min
                                </span>
                                <span style={{ color: GOLD, fontSize: '0.875rem', fontWeight: 600 }}>
                                  {formatCurrency(service.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {businessCombos.map((combo, index) => (
                        <motion.div
                          key={combo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (businessServices.length + index) * 0.05 }}
                          whileHover={{ scale: 1.02, x: 10 }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem',
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <div style={{ width: 40, height: 40, background: 'rgba(168,85,247,0.15)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package style={{ width: 20, height: 20, color: '#a855f7' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ color: 'white', fontWeight: 600, margin: 0, marginBottom: 2 }}>{combo.name}</h4>
                              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0, marginBottom: 4 }}>{combo.serviceNames.join(' + ')}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {getComboDuration(combo) > 0 && (
                                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock style={{ width: 12, height: 12 }} />
                                    {getComboDuration(combo)} min
                                  </span>
                                )}
                                {combo.originalPrice > combo.comboPrice && (
                                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem', textDecoration: 'line-through' }}>
                                    {formatCurrency(combo.originalPrice)}
                                  </span>
                                )}
                                <span style={{ color: GOLD, fontSize: '0.875rem', fontWeight: 600 }}>
                                  {formatCurrency(combo.comboPrice)}
                                </span>
                                {combo.originalPrice > combo.comboPrice && (
                                  <span style={{ ...BADGE_GOLD, background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                                    -{Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Booking Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={SPRING}
                style={{ ...CARD_STYLE, border: `2px solid rgba(212,175,55,0.4)`, boxShadow: '0 20px 60px rgba(212,175,55,0.08)' }}
              >
                <div style={{ padding: '1.25rem 1.5rem', ...DIVIDER, textAlign: 'center' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Agendar Horário</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ ...BTN_GOLD, width: '100%', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '1rem' }}
                    onClick={() => setIsBookingDialogOpen(true)}
                  >
                    <Calendar style={{ width: 20, height: 20 }} />
                    Fazer Agendamento
                  </motion.button>
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.1 }}
                style={CARD_STYLE}
              >
                <div style={{ padding: '1.25rem 1.5rem', ...DIVIDER }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Informações de Contato</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <MapPin style={{ width: 20, height: 20, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                      <p style={{ margin: 0 }}>{mergedBusiness.address.street}, {mergedBusiness.address.number}</p>
                      <p style={{ margin: 0 }}>{mergedBusiness.address.neighborhood}</p>
                      <p style={{ margin: 0 }}>{mergedBusiness.address.city} - {mergedBusiness.address.state}</p>
                      <p style={{ margin: 0 }}>{mergedBusiness.address.zipCode}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Phone style={{ width: 20, height: 20, color: GOLD }} />
                    <a href={`tel:${mergedBusiness.phone}`} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                      {mergedBusiness.phone}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Mail style={{ width: 20, height: 20, color: GOLD }} />
                    <a href={`mailto:${mergedBusiness.email}`} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                      {mergedBusiness.email}
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Business Hours */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.2 }}
                style={CARD_STYLE}
              >
                <div style={{ padding: '1.25rem 1.5rem', ...DIVIDER }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'white', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Horário de Funcionamento</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {mergedBusiness.businessHours.map((hours) => (
                    <div key={hours.day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', ...DIVIDER, paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{getDayName(hours.day)}</span>
                      <span style={{ color: !hours.isOpen ? '#f87171' : 'white' }}>
                        {!hours.isOpen ? 'Fechado' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Social Media */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...SPRING, delay: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '1.5rem 0' }}
              >
                <motion.a
                  href={`https://instagram.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Instagram style={{ width: 24, height: 24, color: 'white' }} />
                </motion.a>

                <motion.a
                  href={`https://facebook.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: 48, height: 48, background: '#1877f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Facebook style={{ width: 24, height: 24, color: 'white' }} />
                </motion.a>

                <motion.a
                  href={`https://wa.me/55${mergedBusiness.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: 48, height: 48, background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg style={{ width: 28, height: 28, color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </motion.a>

                <motion.a
                  href={`https://x.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ width: 48, height: 48, background: '#000', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg style={{ width: 20, height: 20, color: 'white' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent style={{ maxWidth: 500, background: '#0d0c09', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem', color: 'white' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", color: 'white' }}>Agendar Horário</DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 0' }}>
            {/* Service Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Serviço ou Combo</label>
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  style={{ ...inputSelectStyle, textAlign: 'left', boxSizing: 'border-box' }}
                >
                  <span style={{ color: selectedService ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    {selectedService
                      ? (() => {
                          const isCombo = selectedService.startsWith('combo_')
                          const actualId = isCombo ? selectedService.replace('combo_', '') : selectedService
                          if (isCombo) {
                            const combo = businessCombos.find(c => c.id === actualId)
                            return combo ? `${combo.name} - ${formatCurrency(combo.comboPrice)}` : 'Selecione'
                          }
                          const svc = businessServices.find(s => s.id === actualId)
                          return svc ? `${svc.name} - ${formatCurrency(svc.price)}` : 'Selecione'
                        })()
                      : 'Selecione um serviço ou combo'}
                  </span>
                </button>

                {isServiceDropdownOpen && (
                  <div style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: 4, background: '#0d0c09', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: 256, overflowY: 'auto' }}>
                    {businessServices.length > 0 && (
                      <>
                        <div style={{ padding: '12px 16px 4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD }}>Serviços</span>
                          <div style={{ marginTop: 4, height: 1, background: `rgba(212,175,55,0.3)` }} />
                        </div>
                        {businessServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => { setSelectedService(service.id); setIsServiceDropdownOpen(false) }}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.875rem', background: selectedService === service.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: selectedService === service.id ? GOLD : 'white', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                          >
                            {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                          </button>
                        ))}
                      </>
                    )}
                    {businessCombos.length > 0 && (
                      <>
                        <div style={{ padding: '12px 16px 4px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD }}>Combos</span>
                          <div style={{ marginTop: 4, height: 1, background: `rgba(212,175,55,0.3)` }} />
                        </div>
                        {businessCombos.map((combo) => (
                          <button
                            key={`combo_${combo.id}`}
                            type="button"
                            onClick={() => { setSelectedService(`combo_${combo.id}`); setIsServiceDropdownOpen(false) }}
                            style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '0.875rem', background: selectedService === `combo_${combo.id}` ? 'rgba(255,255,255,0.08)' : 'transparent', color: selectedService === `combo_${combo.id}` ? GOLD : 'white', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                          >
                            {combo.name} - {formatCurrency(combo.comboPrice)}{getComboDuration(combo) > 0 ? ` (${getComboDuration(combo)} min)` : ''}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Professional Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Profissional</label>
              <select
                style={{ ...inputSelectStyle, boxSizing: 'border-box' }}
                value={selectedProfessional}
                onChange={(e) => {
                  setSelectedProfessional(e.target.value)
                  setSelectedDate(undefined)
                  setSelectedTime('')
                }}
              >
                <option value="" style={{ background: '#0d0c09' }}>Selecione um profissional</option>
                {businessProfessionals.map((link) => (
                  <option key={link.professionalId} value={link.professionalId} style={{ background: '#0d0c09' }}>
                    {professionalSocialNames[link.professionalId] || link.professionalName}{link.role ? ` - ${link.role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Date Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Data</label>
                <Popover
                  open={isCalendarOpen && !!selectedProfessional}
                  onOpenChange={(open) => selectedProfessional && setIsCalendarOpen(open)}
                  align="start"
                  className="w-full block"
                  content={
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date as Date | undefined)
                        setSelectedTime('')
                        setIsCalendarOpen(false)
                      }}
                      disabled={isDateDisabled}
                    />
                  }
                >
                  <button
                    type="button"
                    disabled={!selectedProfessional}
                    onClick={() => selectedProfessional && setIsCalendarOpen(!isCalendarOpen)}
                    style={{ ...inputSelectStyle, boxSizing: 'border-box', opacity: !selectedProfessional ? 0.4 : 1, cursor: !selectedProfessional ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ color: selectedDate ? 'white' : 'rgba(255,255,255,0.3)' }}>
                      {!selectedProfessional
                        ? 'Selecione um profissional'
                        : selectedDate
                          ? selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                          : 'Selecione'}
                    </span>
                  </button>
                </Popover>
              </div>

              {/* Time Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Horário</label>
                <select
                  style={{ ...inputSelectStyle, boxSizing: 'border-box', opacity: !selectedDate ? 0.5 : 1, cursor: !selectedDate ? 'not-allowed' : 'pointer' }}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate}
                >
                  <option value="" style={{ background: '#0d0c09' }}>Selecione</option>
                  {getAvailableTimes().map((time) => (
                    <option key={time} value={time} style={{ background: '#0d0c09' }}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            {selectedService && selectedItemData && (
              <div style={{ background: 'rgba(212,175,55,0.06)', borderRadius: '0.875rem', padding: '1rem', border: '1px solid rgba(212,175,55,0.2)' }}>
                <h4 style={{ color: GOLD, fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.75rem' }}>Resumo do Agendamento</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedItemData.isCombo ? 'Combo' : 'Serviço'}</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{selectedItemData.name}</span>
                  </div>
                  {selectedItemData.isCombo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Inclui</span>
                      <span style={{ color: 'white', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{selectedItemData.serviceNames.join(', ')}</span>
                    </div>
                  )}
                  {selectedItemData.duration > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Duração</span>
                      <span style={{ color: 'white', fontWeight: 500 }}>{selectedItemData.duration} min</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />
                  {selectedItemData.isCombo && selectedItemData.originalPrice > selectedItemData.price && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Preço original</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatCurrency(selectedItemData.originalPrice)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                    <span style={{ color: GOLD, fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(selectedItemData.price)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Buttons */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              type="button"
              style={{ flex: 1, height: 44, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: '0.75rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.9375rem', transition: 'all 0.2s' }}
              onClick={() => setIsBookingDialogOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              style={{ flex: 1, height: 44, ...BTN_GOLD, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9375rem', padding: 0 }}
              onClick={handleBooking}
            >
              <Check style={{ width: 16, height: 16 }} />
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
