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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { formatCurrency } from '@/lib/utils'
import { getBusinessById, type Business } from '@/services/businessService'
import { getServicos, getCombos, type ServicoData, type ComboData } from '@/services/gerenciarServicosService'
import { getAllBusinessConfigs, type AllBusinessConfigs } from '@/services/businessConfigService'
import { getLinksByBusiness, type ProfessionalLink } from '@/services/professionalLinkService'
import { getProfissionalInfoPessoais } from '@/services/professionalProfileService'
import { Package } from 'lucide-react'

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

    // Se o estabelecimento tem galeria de fotos, usar ela
    if (mergedBusiness.gallery && mergedBusiness.gallery.length > 0) {
      return mergedBusiness.gallery
    }

    // Se tem imagem principal, usar como única imagem na galeria
    if (mergedBusiness.image) {
      return [mergedBusiness.image]
    }

    // Fallback para uma imagem placeholder
    return ['https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=600&fit=crop']
  }

  const galleryImages = getGalleryImages()

  // Pré-carregar todas as imagens ao montar o componente
  useEffect(() => {
    galleryImages.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [galleryImages])

  // Pré-carregar a próxima imagem antes da transição
  useEffect(() => {
    if (galleryImages.length <= 1) return

    const nextIndex = (currentImageIndex + 1) % galleryImages.length
    const img = new Image()
    img.src = galleryImages[nextIndex]
  }, [currentImageIndex, galleryImages])

  // Auto-advance carousel every 7 seconds
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!mergedBusiness) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Estabelecimento não encontrado</h2>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
          >
            Voltar para início
          </Button>
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
    if (!selectedProfessional || selectedProfessional === 'any') return null
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

    // "Qualquer profissional" → usa horários do estabelecimento
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
    if (!selectedService || !selectedDate || !selectedTime) {
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

    // Redirecionar para checkout com os dados da pré-reserva
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
        professionalName: selectedProfessional === 'any'
          ? 'Qualquer profissional disponível'
          : (professionalSocialNames[selectedProfessional] || businessProfessionals.find(p => p.professionalId === selectedProfessional)?.professionalName || ''),
        professionalRole: businessProfessionals.find(p => p.professionalId === selectedProfessional)?.role || '',
        date: formattedDate,
        time: selectedTime,
      },
    })
  }

  // Calcula a duração do combo a partir dos serviços (fallback quando o campo duration não existe no Firestore)
  const getComboDuration = (combo: ComboData) => {
    if (combo.duration && combo.duration > 0) return combo.duration
    // Calcular a partir dos serviços
    return (combo.serviceIds || []).reduce((total, id) => {
      const service = businessServices.find(s => s.id === id)
      return total + (service?.duration || 0)
    }, 0)
  }

  // Dados do item selecionado (serviço ou combo) para o resumo
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

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl h-80 overflow-hidden group"
            >
              {/* Images with AnimatePresence for smooth transitions */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.0,
                    ease: [0.43, 0.13, 0.23, 0.96]
                  }}
                  className="absolute inset-0"
                >
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`${mergedBusiness.name} - Foto ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              {galleryImages.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </motion.button>
                </>
              )}

              {/* Pagination Dots */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {galleryImages.map((_, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-gold w-8'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Image Counter */}
              {galleryImages.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full z-10">
                  <p className="text-white text-sm font-medium">
                    {currentImageIndex + 1} / {galleryImages.length}
                  </p>
                </div>
              )}
            </motion.div>

            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Sobre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 leading-relaxed">{mergedBusiness.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services & Combos (unified) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                  {businessServices.length === 0 && businessCombos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhum serviço disponível no momento
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {businessServices.map((service, index) => (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, x: 10 }}
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-gold/50 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-lg flex items-center justify-center group-hover:from-gold/30 group-hover:to-yellow-600/30 transition-all">
                              <Scissors className="w-5 h-5 text-gold" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{service.name}</h4>
                              <p className="text-sm text-gray-400">{service.description}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {service.duration} min
                                </span>
                                <span className="text-sm font-semibold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
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
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-gold/50 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                              <Package className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">{combo.name}</h4>
                              <p className="text-sm text-gray-400">{combo.serviceNames.join(' + ')}</p>
                              <div className="flex items-center gap-3 mt-1">
                                {getComboDuration(combo) > 0 && (
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {getComboDuration(combo)} min
                                  </span>
                                )}
                                {combo.originalPrice > combo.comboPrice && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatCurrency(combo.originalPrice)}
                                  </span>
                                )}
                                <span className="text-sm font-semibold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">
                                  {formatCurrency(combo.comboPrice)}
                                </span>
                                {combo.originalPrice > combo.comboPrice && (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                    -{Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Professionals - será integrado futuramente */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-2 border-gold/50 shadow-2xl shadow-gold/10">
                <CardHeader>
                  <CardTitle className="text-center text-white">Agendar Horário</CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold shadow-lg shadow-gold/20"
                      onClick={() => setIsBookingDialogOpen(true)}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Fazer Agendamento
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-400">
                      <p>{mergedBusiness.address.street}, {mergedBusiness.address.number}</p>
                      <p>{mergedBusiness.address.neighborhood}</p>
                      <p>{mergedBusiness.address.city} - {mergedBusiness.address.state}</p>
                      <p>{mergedBusiness.address.zipCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gold" />
                    <a
                      href={`tel:${mergedBusiness.phone}`}
                      className="text-sm text-gray-400 hover:text-gold transition-colors"
                    >
                      {mergedBusiness.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gold" />
                    <a
                      href={`mailto:${mergedBusiness.email}`}
                      className="text-sm text-gray-400 hover:text-gold transition-colors"
                    >
                      {mergedBusiness.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Business Hours */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Horário de Funcionamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mergedBusiness.businessHours.map((hours) => (
                      <div
                        key={hours.day}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-400 font-medium">
                          {getDayName(hours.day)}
                        </span>
                        <span className={!hours.isOpen ? 'text-red-400' : 'text-white'}>
                          {!hours.isOpen ? 'Fechado' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 py-6"
            >
              {/* Instagram */}
              <motion.a
                href={`https://instagram.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-xl hover:shadow-purple-500/50 transition-all"
              >
                <Instagram className="w-6 h-6 text-white" />
              </motion.a>

              {/* Facebook */}
              <motion.a
                href={`https://facebook.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/50 transition-all"
              >
                <Facebook className="w-6 h-6 text-white" />
              </motion.a>

              {/* WhatsApp */}
              <motion.a
                href={`https://wa.me/55${mergedBusiness.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:shadow-xl hover:shadow-green-500/50 transition-all"
              >
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </motion.a>

              {/* X (Twitter) */}
              <motion.a
                href={`https://x.com/${mergedBusiness.name.toLowerCase().replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-gray-700 hover:shadow-xl hover:shadow-gray-500/50 transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Agendar Horário</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service" className="text-sm font-medium text-gray-300">Serviço ou Combo</Label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 text-white transition-all cursor-pointer text-left"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <span className={selectedService ? 'text-white' : 'text-gray-400'}>
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
                  <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl shadow-black/50 max-h-64 overflow-y-auto">
                    {businessServices.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#cb8e09' }}>Serviços</span>
                          <div className="mt-1 h-px w-full" style={{ backgroundColor: '#cb8e09' }} />
                        </div>
                        {businessServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => {
                              setSelectedService(service.id)
                              setIsServiceDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/10 ${
                              selectedService === service.id ? 'bg-white/10 text-gold' : 'text-white'
                            }`}
                          >
                            {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                          </button>
                        ))}
                      </>
                    )}
                    {businessCombos.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-1">
                          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#cb8e09' }}>Combos</span>
                          <div className="mt-1 h-px w-full" style={{ backgroundColor: '#cb8e09' }} />
                        </div>
                        {businessCombos.map((combo) => (
                          <button
                            key={`combo_${combo.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedService(`combo_${combo.id}`)
                              setIsServiceDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/10 ${
                              selectedService === `combo_${combo.id}` ? 'bg-white/10 text-gold' : 'text-white'
                            }`}
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
            <div className="space-y-2">
              <Label htmlFor="professional" className="text-sm font-medium text-gray-300">Profissional</Label>
              <select
                id="professional"
                className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 text-white transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                value={selectedProfessional}
                onChange={(e) => {
                  setSelectedProfessional(e.target.value)
                  setSelectedDate(undefined)
                  setSelectedTime('')
                }}
              >
                <option value="" className="bg-gray-900">Selecione um profissional</option>
                <option value="any" className="bg-gray-900">Qualquer profissional disponível</option>
                {businessProfessionals.map((link) => (
                  <option key={link.professionalId} value={link.professionalId} className="bg-gray-900">
                    {professionalSocialNames[link.professionalId] || link.professionalName}{link.role ? ` - ${link.role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-300">Data</Label>
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
                    className={`w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all text-left ${!selectedProfessional ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    <span className={selectedDate ? 'text-white' : 'text-gray-400'}>
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
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium text-gray-300">Horário</Label>
                <select
                  id="time"
                  className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 text-white transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate}
                >
                  <option value="" className="bg-gray-900">Selecione</option>
                  {getAvailableTimes().map((time) => (
                    <option key={time} value={time} className="bg-gray-900">
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            {selectedService && selectedItemData && (
              <div className="bg-gradient-to-br from-gold/10 to-yellow-600/5 rounded-xl p-4 border border-gold/20">
                <h4 className="font-semibold text-gold mb-3 text-sm">Resumo do Agendamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{selectedItemData.isCombo ? 'Combo' : 'Serviço'}</span>
                    <span className="text-white font-medium">{selectedItemData.name}</span>
                  </div>
                  {selectedItemData.isCombo && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-400">Inclui</span>
                      <span className="text-white font-medium text-right max-w-[60%]">{selectedItemData.serviceNames.join(', ')}</span>
                    </div>
                  )}
                  {selectedItemData.duration > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Duração</span>
                      <span className="text-white font-medium">{selectedItemData.duration} min</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  {selectedItemData.isCombo && selectedItemData.originalPrice > selectedItemData.price && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Preço original</span>
                      <span className="text-gray-500 line-through">{formatCurrency(selectedItemData.originalPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gold font-bold text-base">{formatCurrency(selectedItemData.price)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 rounded-xl font-medium transition-all"
              onClick={() => setIsBookingDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              className="flex-1 h-11 bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all"
              onClick={handleBooking}
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
