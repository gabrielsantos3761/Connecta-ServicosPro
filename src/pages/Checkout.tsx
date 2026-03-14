import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createAppointment } from '@/services/appointmentService'
import { getLinkByProfessionalAndBusiness } from '@/services/professionalLinkService'
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
    let appointmentId: string | undefined

    if (user) {
      try {
        // Buscar configuração de pagamento do vínculo do profissional
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
          paymentType,
          commissionPercent,
          professionalAmount,
          businessAmount,
        })
      } catch (error) {
        console.error('[Checkout] Erro ao salvar agendamento:', error)
        // Continua mesmo com erro para não bloquear o fluxo
      }
    }

    setIsProcessing(false)
    navigate('/confirmacao-agendamento', {
      state: {
        ...bookingData,
        paymentMethod: selectedPaymentMethod,
        appointmentId,
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

      {/* Loader2 spin keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
