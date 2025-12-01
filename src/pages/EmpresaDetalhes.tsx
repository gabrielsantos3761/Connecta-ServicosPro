import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Phone,
  Mail,
  Calendar,
  User,
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
import { mockBusinesses, mockServices, mockProfessionals } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

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

  const business = mockBusinesses.find((b) => b.id === businessId)
  const businessServices = mockServices.filter((s) => s.businessId === businessId)
  const businessProfessionals = mockProfessionals.filter((p) => p.businessId === businessId)

  // Generate gallery images based on business category and ID
  const getGalleryImages = () => {
    if (!business) return []

    const categoryImages: Record<string, string[][]> = {
      barbearia: [
        // BarberPro Premium (biz-1)
        [
          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&h=600&fit=crop',
        ],
        // Barbearia Clássica (biz-2)
        [
          'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1511511450040-677116ff389e?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1528920304568-7aa06b3dda8b?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1612637612912-aab973f0f939?w=1200&h=600&fit=crop',
        ],
        // The Barber Shop (biz-3)
        [
          'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1521490878887-76e391a7b9b2?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=1200&h=600&fit=crop',
        ],
      ],
      salao: [
        // Salão Estilo & Charme (biz-4)
        [
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&h=600&fit=crop',
        ],
        // Beleza Pura (biz-5)
        [
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&h=600&fit=crop',
        ],
      ],
      estetica: [
        // Estética Renove (biz-6)
        [
          'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&h=600&fit=crop',
        ],
      ],
      spa: [
        // Spa Serenity (biz-7)
        [
          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1552693673-1bf958298935?w=1200&h=600&fit=crop',
        ],
      ],
      manicure: [
        // Nails Art Studio (biz-8)
        [
          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1200&h=600&fit=crop',
        ],
      ],
      massagem: [
        // Massagem & Terapia (biz-9)
        [
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&h=600&fit=crop',
        ],
      ],
      depilacao: [
        // Depil Laser Center (biz-10)
        [
          'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&h=600&fit=crop',
        ],
      ],
      maquiagem: [
        // Makeup Pro Studio (biz-11)
        [
          'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522337094846-8a818192de1f?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=1200&h=600&fit=crop',
          'https://images.unsplash.com/photo-1583241800698-7f0c50c43810?w=1200&h=600&fit=crop',
        ],
      ],
    }

    // Get images based on business ID index within category
    const businessIndex = mockBusinesses
      .filter(b => b.category === business.category)
      .findIndex(b => b.id === business.id)

    const categoryGalleries = categoryImages[business.category]
    if (categoryGalleries && businessIndex >= 0 && businessIndex < categoryGalleries.length) {
      return categoryGalleries[businessIndex]
    }

    return [business.image]
  }

  const galleryImages = getGalleryImages()

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [galleryImages.length])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  if (!business) {
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

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    return days[dayOfWeek]
  }

  const getAvailableTimes = () => {
    if (!selectedDate) return []

    const dayOfWeek = selectedDate.getDay()
    const hours = business.businessHours.find((h) => h.dayOfWeek === dayOfWeek)

    if (!hours || hours.isClosed) return []

    const times: string[] = []
    const [openHour] = hours.open.split(':').map(Number)
    const [closeHour, closeMinute] = hours.close.split(':').map(Number)

    for (let hour = openHour; hour < closeHour; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour !== closeHour - 1 || closeMinute >= 30) {
        times.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }

    return times
  }

  const handleBooking = () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      alert('Por favor, preencha todos os campos')
      return
    }

    // Redirecionar para checkout com os dados da pré-reserva
    setIsBookingDialogOpen(false)
    const formattedDate = selectedDate.toISOString().split('T')[0]
    navigate('/checkout', {
      state: {
        businessId: business.id,
        serviceId: selectedService,
        professionalId: selectedProfessional,
        date: formattedDate,
        time: selectedTime,
      },
    })
  }

  const selectedServiceData = businessServices.find((s) => s.id === selectedService)

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
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`${business.name} - Foto ${currentImageIndex + 1}`}
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
                  <p className="text-gray-400 leading-relaxed">{business.description}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Services */}
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
                  {businessServices.length === 0 ? (
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Professionals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Profissionais</CardTitle>
                </CardHeader>
                <CardContent>
                  {businessProfessionals.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhum profissional cadastrado no momento
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {businessProfessionals.map((professional, index) => (
                        <motion.div
                          key={professional.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:border-gold/50 hover:bg-white/10 transition-all"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-gold/30 to-yellow-600/30 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gold" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{professional.name}</h4>
                            <p className="text-sm text-gray-400">{professional.role}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-gold text-gold" />
                              <span className="text-sm text-gray-400">{professional.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <Badge
                            className={
                              professional.available
                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                            }
                          >
                            {professional.available ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
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
                      <p>{business.address.street}, {business.address.number}</p>
                      <p>{business.address.neighborhood}</p>
                      <p>{business.address.city} - {business.address.state}</p>
                      <p>{business.address.zipCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gold" />
                    <a
                      href={`tel:${business.phone}`}
                      className="text-sm text-gray-400 hover:text-gold transition-colors"
                    >
                      {business.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gold" />
                    <a
                      href={`mailto:${business.email}`}
                      className="text-sm text-gray-400 hover:text-gold transition-colors"
                    >
                      {business.email}
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
                    {business.businessHours.map((hours) => (
                      <div
                        key={hours.dayOfWeek}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-400 font-medium">
                          {getDayName(hours.dayOfWeek)}
                        </span>
                        <span className={hours.isClosed ? 'text-red-400' : 'text-white'}>
                          {hours.isClosed ? 'Fechado' : `${hours.open} - ${hours.close}`}
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
                href={`https://instagram.com/${business.name.toLowerCase().replace(/\s+/g, '')}`}
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
                href={`https://facebook.com/${business.name.toLowerCase().replace(/\s+/g, '')}`}
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
                href={`https://wa.me/55${business.phone.replace(/\D/g, '')}`}
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
                href={`https://x.com/${business.name.toLowerCase().replace(/\s+/g, '')}`}
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
              <Label htmlFor="service" className="text-sm font-medium text-gray-300">Serviço</Label>
              <select
                id="service"
                className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 text-white transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                <option value="" className="bg-gray-900">Selecione um serviço</option>
                {businessServices.map((service) => (
                  <option key={service.id} value={service.id} className="bg-gray-900">
                    {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Professional Selection */}
            <div className="space-y-2">
              <Label htmlFor="professional" className="text-sm font-medium text-gray-300">Profissional</Label>
              <select
                id="professional"
                className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 text-white transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
              >
                <option value="" className="bg-gray-900">Selecione um profissional</option>
                {businessProfessionals
                  .filter((p) => p.available)
                  .map((professional) => (
                    <option key={professional.id} value={professional.id} className="bg-gray-900">
                      {professional.name} - {professional.role}
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
                  open={isCalendarOpen}
                  onOpenChange={setIsCalendarOpen}
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
                    />
                  }
                >
                  <button
                    type="button"
                    className="w-full h-11 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all cursor-pointer hover:bg-white/10 text-left"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    <span className={selectedDate ? 'text-white' : 'text-gray-400'}>
                      {selectedDate ? (
                        selectedDate.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short'
                        })
                      ) : (
                        'Selecione'
                      )}
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
            {selectedService && selectedServiceData && (
              <div className="bg-gradient-to-br from-gold/10 to-yellow-600/5 rounded-xl p-4 border border-gold/20">
                <h4 className="font-semibold text-gold mb-3 text-sm">Resumo do Agendamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Serviço</span>
                    <span className="text-white font-medium">{selectedServiceData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duração</span>
                    <span className="text-white font-medium">{selectedServiceData.duration} min</span>
                  </div>
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-gold font-bold text-base">{formatCurrency(selectedServiceData.price)}</span>
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
