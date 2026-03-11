import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Smartphone,
  Banknote,
  Download,
  Share2,
  Home,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface ConfirmationData {
  businessId: string
  businessName: string
  businessPhone?: string
  businessEmail?: string
  businessAddress?: { street?: string; number?: string; neighborhood?: string; city?: string; state?: string }
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  serviceDescription?: string
  professionalId: string
  professionalName?: string
  professionalRole?: string
  date: string
  time: string
  paymentMethod: string
  appointmentId?: string
}

export function ConfirmacaoAgendamento() {
  const navigate = useNavigate()
  const location = useLocation()
  const confirmationData = location.state as ConfirmationData
  const bookingId = confirmationData?.appointmentId ?? `AG${Date.now().toString().slice(-8)}`

  useEffect(() => {
    // Disparar confetti ao carregar a página
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Dados não encontrados</h2>
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

  const {
    businessName, businessPhone, businessEmail, businessAddress,
    serviceName, servicePrice, serviceDuration, serviceDescription,
    professionalName, professionalRole,
    date, time, paymentMethod,
  } = confirmationData

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString + 'T00:00:00')
    return dateObj.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getPaymentMethodInfo = () => {
    const methods = {
      credit: { name: 'Cartão de Crédito', icon: CreditCard },
      debit: { name: 'Cartão de Débito', icon: CreditCard },
      pix: { name: 'PIX', icon: Smartphone },
      cash: { name: 'Dinheiro', icon: Banknote },
    }
    return methods[paymentMethod as keyof typeof methods] || methods.cash
  }

  const paymentInfo = getPaymentMethodInfo()
  const PaymentIcon = paymentInfo.icon

  const handleDownloadReceipt = () => {
    alert('Funcionalidade de download em desenvolvimento')
  }

  const handleShareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Meu Agendamento',
        text: `Agendamento confirmado em ${businessName} para ${formatDate(date)} às ${time}`,
      })
    } else {
      alert('Compartilhamento não suportado neste navegador')
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full mb-6 border-2 border-green-500/50">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-green-300 to-green-400 bg-clip-text text-transparent mb-2">
            Agendamento Confirmado!
          </h1>
          <p className="text-lg text-gray-400">
            Seu horário foi reservado com sucesso
          </p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 backdrop-blur-sm border-2 border-green-500/30 shadow-2xl shadow-green-500/10">
            <CardContent className="p-8">
              {/* Booking ID */}
              <div className="text-center mb-8 pb-6 border-b border-white/10">
                <p className="text-sm text-gray-400 mb-2">Número do Agendamento</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">{bookingId}</p>
              </div>

              {/* Details Grid */}
              <div className="space-y-6">
                {/* Business */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Estabelecimento</p>
                    <p className="font-bold text-lg text-white">{businessName}</p>
                    {businessAddress && (
                      <p className="text-sm text-gray-400 mt-1">
                        {businessAddress.street}{businessAddress.number ? `, ${businessAddress.number}` : ''}{businessAddress.neighborhood ? ` - ${businessAddress.neighborhood}` : ''}
                        {(businessAddress.city || businessAddress.state) && (
                          <><br />{businessAddress.city}{businessAddress.state ? ` - ${businessAddress.state}` : ''}</>
                        )}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2">
                      {businessPhone && (
                        <a
                          href={`tel:${businessPhone}`}
                          className="text-sm text-gold hover:text-yellow-600 flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          {businessPhone}
                        </a>
                      )}
                      {businessEmail && (
                        <a
                          href={`mailto:${businessEmail}`}
                          className="text-sm text-gold hover:text-yellow-600 flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Service */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Serviço</p>
                    <p className="font-bold text-lg text-white">{serviceName}</p>
                    {serviceDescription && <p className="text-sm text-gray-400 mt-1">{serviceDescription}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="outline" className="border-white/20 text-gray-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {serviceDuration} minutos
                      </Badge>
                      <Badge variant="outline" className="bg-gold/10 border-gold text-gold">
                        {formatCurrency(servicePrice)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Professional */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Profissional</p>
                    <p className="font-bold text-lg text-white">{professionalName || 'Qualquer profissional disponível'}</p>
                    {professionalRole && <p className="text-sm text-gray-400">{professionalRole}</p>}
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Data e Horário</p>
                    <p className="font-bold text-lg text-white capitalize">{formatDate(date)}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {time}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10" />

                {/* Payment */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <PaymentIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Forma de Pagamento</p>
                    <p className="font-bold text-lg text-white">{paymentInfo.name}</p>
                    {paymentMethod === 'cash' && (
                      <p className="text-sm text-amber-400 mt-1">
                        Pagamento a ser realizado no local
                      </p>
                    )}
                    {paymentMethod === 'pix' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-2">Pagamento Confirmado</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Info */}
              <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-2">Informações Importantes</h3>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Chegue com 10 minutos de antecedência</li>
                  <li>• Em caso de atraso, o horário poderá ser reagendado</li>
                  <li>• Para cancelamentos, avisar com no mínimo 24h de antecedência</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleDownloadReceipt}
                    className="w-full border-white/10 hover:bg-white/5 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Comprovante
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={handleShareBooking}
                    className="w-full border-white/10 hover:bg-white/5 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="default"
                    onClick={() => navigate('/')}
                    className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <Card className="bg-white/5 backdrop-blur-sm border-gold/30">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg text-white mb-2">
                Próximos Passos
              </h3>
              <p className="text-gray-400 mb-4">
                Um email de confirmação foi enviado com todos os detalhes do seu agendamento.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="border-gold text-gold hover:bg-gold hover:text-black transition-all"
                >
                  Fazer Login para Ver Meus Agendamentos
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
