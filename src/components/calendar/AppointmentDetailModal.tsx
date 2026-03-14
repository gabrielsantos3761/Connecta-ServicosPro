import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, User, Scissors, Phone, DollarSign, Calendar, CheckCircle2 } from 'lucide-react'
import { Appointment } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface AppointmentDetailModalProps {
  appointment: Appointment | null
  onClose: () => void
}

const statusBadge = (status: string): { label: string; style: React.CSSProperties } => {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmado', style: { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } }
    case 'pending':
      return { label: 'Pendente', style: { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' } }
    case 'completed':
      return { label: 'Concluído', style: { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } }
    case 'cancelled':
      return { label: 'Cancelado', style: { background: 'rgba(248,113,113,0.15)', color: '#f87171' } }
    default:
      return { label: 'Desconhecido', style: { background: 'rgba(212,175,55,0.15)', color: '#D4AF37' } }
  }
}

export function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  useEffect(() => {
    if (appointment) {
      // Previne scroll do body quando o modal está aberto
      document.body.style.overflow = 'hidden'

      // Adiciona listener para fechar com ESC
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)

      return () => {
        document.body.style.overflow = 'unset'
        document.removeEventListener('keydown', handleEscape)
      }
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [appointment, onClose])

  if (!appointment) return null

  const { label: statusLabel, style: statusStyle } = statusBadge(appointment.status)

  const appointmentDate = new Date(appointment.date)
  const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const divider = (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
  )

  const modalContent = (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(8px)',
          padding: '0',
        }}
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{
            background: '#0c0b08',
            border: '1px solid rgba(212,175,55,0.22)',
            borderRadius: '1.5rem 1.5rem 0 0',
            width: '100%',
            maxWidth: '28rem',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid rgba(212,175,55,0.14)',
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#D4AF37',
                margin: 0,
              }}
            >
              Detalhes do Agendamento
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>Status</span>
              <span
                style={{
                  borderRadius: '9999px',
                  padding: '2px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  ...statusStyle,
                }}
              >
                {statusLabel}
              </span>
            </div>

            {/* Data e Hora */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Calendar size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Data</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0', textTransform: 'capitalize' }}>
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <Clock size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Horário e Duração</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>
                    {appointment.time}{' '}
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>({appointment.duration} minutos)</span>
                  </p>
                </div>
              </div>
            </div>

            {divider}

            {/* Cliente */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <User size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Cliente</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>
                  {appointment.clientName}
                </p>
                {appointment.clientId && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                    ID: {appointment.clientId}
                  </p>
                )}
              </div>
            </div>

            {/* Contato do Cliente - Mock (não está no tipo atual) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Phone size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Contato</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>
                  (11) 98765-4321
                </p>
              </div>
            </div>

            {divider}

            {/* Serviço */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Scissors size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Serviço</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>
                  {appointment.service}
                </p>
              </div>
            </div>

            {/* Profissional */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <CheckCircle2 size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Profissional Responsável</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#fff', margin: '2px 0 0' }}>
                  {appointment.professional}
                </p>
              </div>
            </div>

            {divider}

            {/* Preço */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <DollarSign size={18} style={{ color: '#D4AF37', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Valor</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37', margin: '2px 0 0' }}>
                  {formatCurrency(appointment.price)}
                </p>
                {appointment.paymentMethod && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                    Pagamento: {appointment.paymentMethod.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(212,175,55,0.14)',
              display: 'flex',
              gap: '0.75rem',
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0.625rem',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                padding: '0.625rem 0',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
              }}
            >
              Fechar
            </button>
            <button
              onClick={() => {
                // Aqui pode adicionar ação de editar
                console.log('Editar agendamento:', appointment.id)
              }}
              style={{
                flex: 1,
                background: '#D4AF37',
                border: 'none',
                borderRadius: '0.625rem',
                color: '#050400',
                fontSize: '0.9375rem',
                fontWeight: 700,
                padding: '0.625rem 0',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Editar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
