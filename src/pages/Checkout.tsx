import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Check,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { mockBusinesses, mockServices, mockProfessionals } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

interface BookingData {
  businessId: string
  serviceId: string
  professionalId: string
  date: string
  time: string
}

type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash'

export function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const bookingData = location.state as BookingData

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  })

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Dados de agendamento não encontrados</h2>
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

  const business = mockBusinesses.find((b) => b.id === bookingData.businessId)
  const service = mockServices.find((s) => s.id === bookingData.serviceId)
  const professional = mockProfessionals.find((p) => p.id === bookingData.professionalId)

  if (!business || !service || !professional) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Erro ao carregar dados</h2>
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert('Por favor, selecione uma forma de pagamento')
      return
    }

    if (selectedPaymentMethod === 'credit' || selectedPaymentMethod === 'debit') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        alert('Por favor, preencha todos os dados do cartão')
        return
      }
    }

    // Simular processamento de pagamento
    navigate('/confirmacao-agendamento', {
      state: {
        ...bookingData,
        paymentMethod: selectedPaymentMethod,
        business,
        service,
        professional,
      },
    })
  }

  const paymentMethods = [
    {
      id: 'credit' as PaymentMethod,
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Parcelamento em até 3x sem juros',
    },
    {
      id: 'debit' as PaymentMethod,
      name: 'Cartão de Débito',
      icon: CreditCard,
      description: 'Pagamento à vista',
    },
    {
      id: 'pix' as PaymentMethod,
      name: 'PIX',
      icon: Smartphone,
      description: 'Aprovação instantânea',
    },
    {
      id: 'cash' as PaymentMethod,
      name: 'Dinheiro',
      icon: Banknote,
      description: 'Pagar no local',
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Resumo da Reserva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Business */}
                  <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                    <Building2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{business.name}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {business.address.street}, {business.address.number} - {business.address.neighborhood}
                      </p>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                    <Scissors className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{service.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {service.duration} min
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Professional */}
                  <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                    <User className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{professional.name}</p>
                      <p className="text-sm text-gray-400">{professional.role}</p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white capitalize">{formatDate(bookingData.date)}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {bookingData.time}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {paymentMethods.map((method, index) => {
                      const Icon = method.icon
                      const isSelected = selectedPaymentMethod === method.id

                      return (
                        <motion.button
                          key={method.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            ${
                              isSelected
                                ? 'border-gold bg-gold/10'
                                : 'border-white/10 hover:border-white/20 bg-white/5'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-gold' : 'text-gray-400'}`} />
                            <div className="flex-1">
                              <p className={`font-semibold ${isSelected ? 'text-gold' : 'text-white'}`}>
                                {method.name}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">{method.description}</p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-gold" />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Card Details */}
                  {(selectedPaymentMethod === 'credit' || selectedPaymentMethod === 'debit') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-4 border-t border-white/10"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-gray-300">Número do Cartão</Label>
                        <Input
                          id="cardNumber"
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={cardData.number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '')
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                            setCardData({ ...cardData, number: formatted })
                          }}
                          className="bg-white/5 border-white/10 text-white focus:ring-gold"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardName" className="text-gray-300">Nome no Cartão</Label>
                        <Input
                          id="cardName"
                          placeholder="Nome como está no cartão"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          className="bg-white/5 border-white/10 text-white focus:ring-gold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry" className="text-gray-300">Validade</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/AA"
                            maxLength={5}
                            value={cardData.expiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '')
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4)
                              }
                              setCardData({ ...cardData, expiry: value })
                            }}
                            className="bg-white/5 border-white/10 text-white focus:ring-gold"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv" className="text-gray-300">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            maxLength={3}
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                            }
                            className="bg-white/5 border-white/10 text-white focus:ring-gold"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* PIX Info */}
                  {selectedPaymentMethod === 'pix' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-white/10"
                    >
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-sm text-blue-400">
                          Após confirmar, você receberá um QR Code para realizar o pagamento via PIX.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Cash Info */}
                  {selectedPaymentMethod === 'cash' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-white/10"
                    >
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <p className="text-sm text-amber-400">
                          Você pagará em dinheiro diretamente no estabelecimento no dia do agendamento.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24"
            >
              <Card className="bg-white/5 backdrop-blur-sm border-2 border-gold/50 shadow-2xl shadow-gold/10">
                <CardHeader>
                  <CardTitle className="text-white">Resumo do Valor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{service.name}</span>
                      <span className="font-semibold text-white">{formatCurrency(service.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Taxa de serviço</span>
                      <span className="font-semibold text-green-400">Grátis</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-white">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent">{formatCurrency(service.price)}</span>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold shadow-lg shadow-gold/20"
                        onClick={handlePayment}
                        disabled={!selectedPaymentMethod}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Confirmar Pagamento
                      </Button>
                    </motion.div>

                    <p className="text-xs text-gray-500 text-center mt-3">
                      Ao confirmar, você concorda com nossos termos de serviço
                    </p>
                  </div>

                  {/* Security Badge */}
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Lock className="w-4 h-4 text-green-400" />
                      <span>Pagamento 100% seguro</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
