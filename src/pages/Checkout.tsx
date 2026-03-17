import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createAppointment,
  updateAppointmentPayment,
} from '@/services/appointmentService'
import { getLinkByProfessionalAndBusiness } from '@/services/professionalLinkService'
import {
  createPixQRCode,
  checkPixStatus,
  simulatePixPayment,
  type PixQRCode,
  type PixStatus,
} from '@/services/abacatePayService'
import {
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Calendar,
  Clock,
  Scissors,
  Check,
  Lock,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingData {
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
  professionalId?: string
  professionalName?: string
  professionalRole?: string
  date: string
  time: string
}

type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash'

const GOLD = '#D4AF37'
const BG = '#050400'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
  padding: '1.75rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.625rem',
  color: '#fff',
  padding: '0.625rem 0.875rem',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8125rem',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '0.4rem',
  letterSpacing: '0.03em',
}

const divider: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  margin: '1rem 0',
}

const springTransition = { type: 'spring' as const, stiffness: 320, damping: 36 }

export function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const bookingData = location.state as BookingData

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  })

  // ── PIX Abacate Pay ─────────────────────────────────────────
  const [pixBilling, setPixBilling] = useState<PixQRCode | null>(null)
  const [pixStatus, setPixStatus] = useState<'waiting' | 'paid' | 'expired' | 'error'>('waiting')
  const [pixError, setPixError] = useState<string | null>(null)
  const [copiedBrCode, setCopiedBrCode] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appointmentIdRef = useRef<string | undefined>(undefined)

  // Limpa timers ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const startPolling = (pix: PixQRCode, apptId: string) => {
    setElapsedSeconds(0)
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)

    pollingRef.current = setInterval(async () => {
      try {
        const { status } = await checkPixStatus(pix.id)
        if (status === 'PAID') {
          stopPolling()
          await updateAppointmentPayment(apptId, pix.id, 'PAID')
          setPixStatus('paid')
          setTimeout(() => {
            navigate('/confirmacao-agendamento', {
              state: { ...bookingData, paymentMethod: 'pix', appointmentId: apptId },
            })
          }, 2000)
        } else if (status === 'EXPIRED' || status === 'CANCELLED' || status === 'REFUNDED') {
          stopPolling()
          await updateAppointmentPayment(apptId, pix.id, status as PixStatus)
          setPixStatus('expired')
        }
      } catch (err) {
        console.error('[Checkout] Polling PIX:', err)
      }
    }, 5000)
  }

  if (!bookingData) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
            Dados de agendamento não encontrados
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #b8941e)`,
              color: '#050400',
              fontWeight: 700,
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.75rem 2rem',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  if (!bookingData.serviceName || !bookingData.businessName) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
            Erro ao carregar dados
          </h2>
          <button
            onClick={() => navigate('/')}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #b8941e)`,
              color: '#050400',
              fontWeight: 700,
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.75rem 2rem',
              fontSize: '0.9375rem',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  /** Resolve o vínculo de comissão do profissional */
  const resolveCommission = async () => {
    let paymentType: 'fixed' | 'percentage' | null = null
    let commissionPercent: number | null = null
    let professionalAmount: number | null = null
    let businessAmount: number | null = null

    if (bookingData.professionalId) {
      try {
        const link = await getLinkByProfessionalAndBusiness(
          bookingData.professionalId,
          bookingData.businessId
        )
        if (link) {
          paymentType = link.paymentType ?? null
          if (paymentType === 'percentage' && link.commission != null) {
            commissionPercent = link.commission
            professionalAmount = bookingData.servicePrice * (link.commission / 100)
            businessAmount = bookingData.servicePrice * ((100 - link.commission) / 100)
          } else if (paymentType === 'fixed') {
            commissionPercent = null
            professionalAmount = 0
            businessAmount = bookingData.servicePrice
          }
        }
      } catch (err) {
        console.error('[Checkout] Erro ao buscar vínculo do profissional:', err)
      }
    }

    return { paymentType, commissionPercent, professionalAmount, businessAmount }
  }

  const handlePayment = async () => {
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

    setIsProcessing(true)

    try {
      const commission = user ? await resolveCommission() : { paymentType: null, commissionPercent: null, professionalAmount: null, businessAmount: null }

      // ── Fluxo PIX via Abacate Pay ──────────────────────────
      if (selectedPaymentMethod === 'pix' && user) {
        let appointmentId: string
        try {
          appointmentId = await createAppointment({
            businessId: bookingData.businessId,
            businessName: bookingData.businessName,
            professionalId: bookingData.professionalId ?? '',
            professionalName: bookingData.professionalName,
            clientId: user.uid,
            clientName: user.name,
            serviceId: bookingData.serviceId,
            serviceName: bookingData.serviceName,
            servicePrice: bookingData.servicePrice,
            serviceDuration: bookingData.serviceDuration,
            serviceDescription: bookingData.serviceDescription,
            date: bookingData.date,
            time: bookingData.time,
            paymentMethod: 'pix',
            ...commission,
            abacatePayStatus: 'PENDING',
          })
          appointmentIdRef.current = appointmentId
        } catch (err) {
          console.error('[Checkout] Erro ao criar agendamento:', err)
          setIsProcessing(false)
          return
        }

        try {
          const pix = await createPixQRCode({
            amount: bookingData.servicePrice,
            description: bookingData.serviceName.slice(0, 37),
            customerName: user.name,
            customerEmail: user.email ?? 'sandbox@teste.com',
          })
          await updateAppointmentPayment(appointmentId, pix.id, 'PENDING')
          setPixBilling(pix)
          setPixStatus('waiting')
          setPixError(null)
          setIsProcessing(false)
          startPolling(pix, appointmentId)
        } catch (err: unknown) {
          console.error('[Checkout] Erro Abacate Pay:', err)
          setPixError(err instanceof Error ? err.message : 'Erro ao gerar cobrança PIX')
          setPixBilling(null)
          setPixStatus('error')
          setIsProcessing(false)
        }
        return
      }

      // ── Outros métodos (cartão / dinheiro) ─────────────────
      let appointmentId: string | undefined
      if (user) {
        try {
          appointmentId = await createAppointment({
            businessId: bookingData.businessId,
            businessName: bookingData.businessName,
            professionalId: bookingData.professionalId ?? '',
            professionalName: bookingData.professionalName,
            clientId: user.uid,
            clientName: user.name,
            serviceId: bookingData.serviceId,
            serviceName: bookingData.serviceName,
            servicePrice: bookingData.servicePrice,
            serviceDuration: bookingData.serviceDuration,
            serviceDescription: bookingData.serviceDescription,
            date: bookingData.date,
            time: bookingData.time,
            paymentMethod: selectedPaymentMethod,
            ...commission,
          })
        } catch (error) {
          console.error('[Checkout] Erro ao salvar agendamento:', error)
        }
      }

      setIsProcessing(false)
      navigate('/confirmacao-agendamento', {
        state: { ...bookingData, paymentMethod: selectedPaymentMethod, appointmentId },
      })
    } catch (error) {
      console.error('[Checkout] Erro inesperado:', error)
      setIsProcessing(false)
    }
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
    <div style={{ minHeight: '100vh', background: BG }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
          }}
        >
          {/* ── Main Content ─────────────────────────────────────────── */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Booking Summary */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
              style={card}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '1.5rem',
                }}
              >
                Resumo da Reserva
              </h2>

              {/* Business */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Building2 size={18} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{bookingData.businessName}</p>
              </div>

              {/* Service */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Scissors size={18} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{bookingData.serviceName}</p>
                  {bookingData.serviceDescription && (
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0.375rem 0 0' }}>
                      {bookingData.serviceDescription}
                    </p>
                  )}
                  <div style={{ marginTop: '0.625rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.625rem',
                      }}
                    >
                      <Clock size={11} />
                      {bookingData.serviceDuration} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                }}
              >
                <Calendar size={18} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#fff', margin: 0, textTransform: 'capitalize' }}>
                    {formatDate(bookingData.date)}
                  </p>
                  <p
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.5)',
                      margin: '0.375rem 0 0',
                    }}
                  >
                    <Clock size={12} />
                    {bookingData.time}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.08 }}
              style={card}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '1.5rem',
                }}
              >
                Forma de Pagamento
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                {paymentMethods.map((method, index) => {
                  const Icon = method.icon
                  const isSelected = selectedPaymentMethod === method.id

                  return (
                    <motion.button
                      key={method.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...springTransition, delay: index * 0.05 }}
                      whileHover={{ scale: 1.025 }}
                      whileTap={{ scale: 0.975 }}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.875rem',
                        border: isSelected
                          ? `2px solid ${GOLD}`
                          : '2px solid rgba(255,255,255,0.07)',
                        background: isSelected ? `rgba(212,175,55,0.08)` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <Icon size={22} color={isSelected ? GOLD : 'rgba(255,255,255,0.4)'} />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontWeight: 600,
                              color: isSelected ? GOLD : '#fff',
                              margin: 0,
                              fontSize: '0.9375rem',
                            }}
                          >
                            {method.name}
                          </p>
                          <p
                            style={{
                              fontSize: '0.8125rem',
                              color: 'rgba(255,255,255,0.5)',
                              margin: '0.25rem 0 0',
                            }}
                          >
                            {method.description}
                          </p>
                        </div>
                        {isSelected && <Check size={18} color={GOLD} style={{ flexShrink: 0 }} />}
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
                  transition={springTransition}
                  style={{
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    overflow: 'hidden',
                  }}
                >
                  <div>
                    <label htmlFor="cardNumber" style={labelStyle}>Número do Cartão</label>
                    <input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardData.number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '')
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                        setCardData({ ...cardData, number: formatted })
                      }}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor="cardName" style={labelStyle}>Nome no Cartão</label>
                    <input
                      id="cardName"
                      placeholder="Nome como está no cartão"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label htmlFor="expiry" style={labelStyle}>Validade</label>
                      <input
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
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label htmlFor="cvv" style={labelStyle}>CVV</label>
                      <input
                        id="cvv"
                        placeholder="123"
                        maxLength={3}
                        value={cardData.cvv}
                        onChange={(e) =>
                          setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                        }
                        style={inputStyle}
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
                  transition={springTransition}
                  style={{
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(99,179,237,0.06)',
                      border: '1px solid rgba(99,179,237,0.18)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', color: '#93c5fd', margin: 0 }}>
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
                  transition={springTransition}
                  style={{
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(251,191,36,0.06)',
                      border: '1px solid rgba(251,191,36,0.18)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', color: '#fbbf24', margin: 0 }}>
                      Você pagará em dinheiro diretamente no estabelecimento no dia do agendamento.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Sidebar – Price Summary ───────────────────────────────── */}
          <div style={{ gridColumn: 'span 1' }}>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springTransition}
              style={{ position: 'sticky', top: '6rem' }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `2px solid rgba(212,175,55,0.40)`,
                  borderRadius: '1.125rem',
                  padding: '1.75rem',
                  boxShadow: `0 24px 64px rgba(212,175,55,0.08)`,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: '1.5rem',
                  }}
                >
                  Resumo do Valor
                </h2>

                {/* Line items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{bookingData.serviceName}</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{formatCurrency(bookingData.servicePrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Taxa de serviço</span>
                    <span style={{ fontWeight: 600, color: '#22c55e' }}>Grátis</span>
                  </div>
                </div>

                <div style={divider} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff' }}>Total</span>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${GOLD}, #b8941e)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatCurrency(bookingData.servicePrice)}
                  </span>
                </div>

                {/* Confirm button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || isProcessing}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background:
                      !selectedPaymentMethod || isProcessing
                        ? 'rgba(212,175,55,0.30)'
                        : `linear-gradient(135deg, ${GOLD}, #b8941e)`,
                    color: '#050400',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    letterSpacing: '0.02em',
                    cursor: !selectedPaymentMethod || isProcessing ? 'not-allowed' : 'pointer',
                    boxShadow: !selectedPaymentMethod || isProcessing
                      ? 'none'
                      : `0 8px 28px rgba(212,175,55,0.22)`,
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {isProcessing ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Check size={18} />
                  )}
                  {isProcessing ? 'Confirmando...' : 'Confirmar Pagamento'}
                </motion.button>

                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.28)',
                    textAlign: 'center',
                    marginTop: '0.875rem',
                  }}
                >
                  Ao confirmar, você concorda com nossos termos de serviço
                </p>

                {/* Security badge */}
                <div
                  style={{
                    marginTop: '1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Lock size={15} color="#22c55e" />
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                    Pagamento 100% seguro
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Modal PIX Abacate Pay ───────────────────────────────── */}
      <AnimatePresence>
        {(pixBilling || pixStatus === 'error') && (
          <motion.div
            key="pix-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.80)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            <motion.div
              key="pix-modal"
              initial={{ opacity: 0, scale: 0.92, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 32 }}
              transition={springTransition}
              style={{
                background: '#0a0900',
                border: `1px solid rgba(212,175,55,0.30)`,
                borderRadius: '1.25rem',
                padding: '2rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Status: erro */}
              {pixStatus === 'error' && (
                <div style={{ textAlign: 'center' }}>
                  <XCircle size={48} color="#f87171" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#fff', margin: '0 0 0.75rem' }}>
                    Erro ao gerar PIX
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem' }}>
                    {pixError ?? 'Não foi possível criar a cobrança. Tente outro método.'}
                  </p>
                  <button
                    onClick={() => { setPixBilling(null); setPixStatus('waiting'); setPixError(null) }}
                    style={{ background: `linear-gradient(135deg,${GOLD},#b8941e)`, color: '#050400', fontWeight: 700, border: 'none', borderRadius: '0.625rem', padding: '0.75rem 2rem', cursor: 'pointer', fontSize: '0.9375rem' }}
                  >
                    Fechar
                  </button>
                </div>
              )}

              {/* Status: pago */}
              {pixStatus === 'paid' && (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={52} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.375rem', color: '#fff', margin: '0 0 0.5rem' }}>
                    Pagamento confirmado!
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Redirecionando para a confirmação...
                  </p>
                </div>
              )}

              {/* Status: expirado */}
              {pixStatus === 'expired' && (
                <div style={{ textAlign: 'center' }}>
                  <XCircle size={48} color="#fbbf24" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#fff', margin: '0 0 0.75rem' }}>
                    PIX expirado
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 1.5rem' }}>
                    O tempo limite de pagamento foi atingido.
                  </p>
                  <button
                    onClick={() => { setPixBilling(null); setPixStatus('waiting') }}
                    style={{ background: `linear-gradient(135deg,${GOLD},#b8941e)`, color: '#050400', fontWeight: 700, border: 'none', borderRadius: '0.625rem', padding: '0.75rem 2rem', cursor: 'pointer', fontSize: '0.9375rem' }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Status: aguardando */}
              {pixStatus === 'waiting' && pixBilling && (
                <>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                      <RefreshCw size={16} color={GOLD} style={{ animation: 'spin 2s linear infinite' }} />
                      <span style={{ fontSize: '0.75rem', color: GOLD, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Aguardando pagamento
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#fff', margin: '0 0 0.25rem' }}>
                      Escaneie o QR Code PIX
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                      Ou use o código copia-e-cola abaixo
                    </p>
                  </div>

                  {/* QR Code */}
                  {pixBilling.brCodeBase64 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                      <div style={{ background: '#fff', borderRadius: '0.75rem', padding: '0.75rem' }}>
                        <img
                          src={pixBilling.brCodeBase64}
                          alt="QR Code PIX"
                          style={{ width: 180, height: 180, display: 'block' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Valor */}
                  <div style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{bookingData.serviceName}</span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 800, background: `linear-gradient(135deg,${GOLD},#b8941e)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {formatCurrency(bookingData.servicePrice)}
                    </span>
                  </div>

                  {/* Copia-e-cola */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixBilling.brCode).then(() => {
                        setCopiedBrCode(true)
                        setTimeout(() => setCopiedBrCode(false), 2500)
                      })
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      width: '100%', padding: '0.75rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${copiedBrCode ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.10)'}`,
                      color: copiedBrCode ? '#22c55e' : 'rgba(255,255,255,0.65)',
                      fontWeight: 600, fontSize: '0.875rem', borderRadius: '0.75rem',
                      cursor: 'pointer', marginBottom: '1rem', transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    {copiedBrCode ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copiedBrCode ? 'Código copiado!' : 'Copiar código PIX (copia-e-cola)'}
                  </button>

                  {/* Botão simular pagamento (sandbox) */}
                  {pixBilling.devMode && (
                    <button
                      disabled={isSimulating}
                      onClick={async () => {
                        setIsSimulating(true)
                        try {
                          await simulatePixPayment(pixBilling.id)
                        } catch (err) {
                          console.error('[Checkout] Simulate payment:', err)
                        } finally {
                          setIsSimulating(false)
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        width: '100%', padding: '0.75rem',
                        background: isSimulating ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.35)',
                        color: '#22c55e', fontWeight: 700, fontSize: '0.875rem',
                        borderRadius: '0.75rem', cursor: isSimulating ? 'not-allowed' : 'pointer',
                        marginBottom: '0.875rem',
                      }}
                    >
                      {isSimulating
                        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Simulando...</>
                        : <><CheckCircle2 size={15} /> Simular pagamento (sandbox)</>
                      }
                    </button>
                  )}

                  {/* Timer */}
                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                    Verificando automaticamente... {elapsedSeconds}s
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader2 spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
