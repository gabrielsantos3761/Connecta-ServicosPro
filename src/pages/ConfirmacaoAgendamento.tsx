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

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

const DIVIDER_STYLE = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  marginTop: '1.5rem',
  marginBottom: '1.5rem',
}

const BADGE_GOLD = {
  background: 'rgba(212,175,55,0.15)',
  color: '#D4AF37',
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
}

const BTN_GOLD = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: '#050400',
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.95rem',
}

const BTN_OUTLINE = {
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontWeight: 500,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.95rem',
  width: '100%',
  justifyContent: 'center',
}

export function ConfirmacaoAgendamento() {
  const navigate = useNavigate()
  const location = useLocation()
  const confirmationData = location.state as ConfirmationData
  const bookingId = confirmationData?.appointmentId ?? `AG${Date.now().toString().slice(-8)}`

  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  if (!confirmationData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
            Dados não encontrados
          </h2>
          <button style={BTN_GOLD} onClick={() => navigate('/')}>
            <Home size={16} />
            Voltar para início
          </button>
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
    <div style={{ minHeight: '100vh', background: '#050400' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '6rem',
            height: '6rem',
            background: 'rgba(212,175,55,0.1)',
            borderRadius: '9999px',
            marginBottom: '1.5rem',
            border: '2px solid rgba(212,175,55,0.35)',
          }}>
            <CheckCircle size={56} color="#D4AF37" />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2.25rem',
            fontWeight: 700,
            color: '#D4AF37',
            marginBottom: '0.5rem',
          }}>
            Agendamento Confirmado!
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
            Seu horário foi reservado com sucesso
          </p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 36, delay: 0.15 }}
        >
          <div style={{ ...CARD_STYLE, padding: '2rem' }}>

            {/* Booking ID */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Número do Agendamento
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#D4AF37' }}>
                {bookingId}
              </p>
            </div>

            {/* Details */}
            <div>

              {/* Business */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,175,55,0.1)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={22} color="#D4AF37" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estabelecimento</p>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{businessName}</p>
                  {businessAddress && (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      {businessAddress.street}{businessAddress.number ? `, ${businessAddress.number}` : ''}{businessAddress.neighborhood ? ` - ${businessAddress.neighborhood}` : ''}
                      {(businessAddress.city || businessAddress.state) && (
                        <><br />{businessAddress.city}{businessAddress.state ? ` - ${businessAddress.state}` : ''}</>
                      )}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {businessPhone && (
                      <a href={`tel:${businessPhone}`} style={{ fontSize: '0.85rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <Phone size={13} />
                        {businessPhone}
                      </a>
                    )}
                    {businessEmail && (
                      <a href={`mailto:${businessEmail}`} style={{ fontSize: '0.85rem', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <Mail size={13} />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={DIVIDER_STYLE} />

              {/* Service */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,175,55,0.07)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Scissors size={22} color="#D4AF37" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Serviço</p>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{serviceName}</p>
                  {serviceDescription && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>{serviceDescription}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={BADGE_GOLD}>
                      <Clock size={11} />
                      {serviceDuration} min
                    </span>
                    <span style={BADGE_GOLD}>
                      {formatCurrency(servicePrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={DIVIDER_STYLE} />

              {/* Professional */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,175,55,0.07)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={22} color="#D4AF37" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissional</p>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{professionalName || 'Qualquer profissional disponível'}</p>
                  {professionalRole && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{professionalRole}</p>}
                </div>
              </div>

              <div style={DIVIDER_STYLE} />

              {/* Date & Time */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,175,55,0.07)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={22} color="#D4AF37" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data e Horário</p>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', textTransform: 'capitalize' }}>{formatDate(date)}</p>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                    <Clock size={13} />
                    {time}
                  </p>
                </div>
              </div>

              <div style={DIVIDER_STYLE} />

              {/* Payment */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', background: 'rgba(212,175,55,0.07)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PaymentIcon size={22} color="#D4AF37" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Forma de Pagamento</p>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{paymentInfo.name}</p>
                  {paymentMethod === 'cash' && (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(212,175,55,0.8)', marginTop: '0.25rem' }}>
                      Pagamento a ser realizado no local
                    </p>
                  )}
                  {paymentMethod === 'pix' && (
                    <span style={{ ...BADGE_GOLD, marginTop: '0.5rem' }}>Pagamento Confirmado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Important Info */}
            <div style={{
              marginTop: '2rem',
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.18)',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: '#D4AF37', marginBottom: '0.5rem', fontSize: '1rem' }}>
                Informações Importantes
              </h3>
              <ul style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', listStyle: 'none', padding: 0, margin: 0 }}>
                <li>• Chegue com 10 minutos de antecedência</li>
                <li>• Em caso de atraso, o horário poderá ser reagendado</li>
                <li>• Para cancelamentos, avisar com no mínimo 24h de antecedência</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button style={BTN_OUTLINE} onClick={handleDownloadReceipt}>
                  <Download size={16} />
                  Baixar Comprovante
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button style={BTN_OUTLINE} onClick={handleShareBooking}>
                  <Share2 size={16} />
                  Compartilhar
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button style={{ ...BTN_GOLD, width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
                  <Home size={16} />
                  Voltar ao Início
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 36, delay: 0.3 }}
          style={{ marginTop: '2rem', textAlign: 'center' }}
        >
          <div style={{ ...CARD_STYLE, padding: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.15rem', color: '#fff', marginBottom: '0.5rem' }}>
              Próximos Passos
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Um email de confirmação foi enviado com todos os detalhes do seu agendamento.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ display: 'inline-block' }}>
              <button
                style={{
                  background: 'transparent',
                  color: '#D4AF37',
                  border: '1px solid rgba(212,175,55,0.45)',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                onClick={() => navigate('/login')}
              >
                Fazer Login para Ver Meus Agendamentos
              </button>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
