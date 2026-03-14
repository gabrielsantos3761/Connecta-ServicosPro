import { motion } from 'framer-motion'
import { Clock, User, Scissors, Calendar, DollarSign, MoreVertical } from 'lucide-react'
import { Appointment } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface KanbanViewProps {
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
}

interface Column {
  id: string
  title: string
  status: string
  headingColor: string
  accentColor: string
  borderTopColor: string
  countBg: string
}

const columns: Column[] = [
  {
    id: 'pending',
    title: 'Pendentes',
    status: 'pending',
    headingColor: '#fbbf24',
    accentColor: 'rgba(251,191,36,0.35)',
    borderTopColor: 'rgba(251,191,36,0.5)',
    countBg: 'rgba(251,191,36,0.15)',
  },
  {
    id: 'confirmed',
    title: 'Confirmados',
    status: 'confirmed',
    headingColor: '#22c55e',
    accentColor: 'rgba(34,197,94,0.35)',
    borderTopColor: 'rgba(34,197,94,0.5)',
    countBg: 'rgba(34,197,94,0.15)',
  },
  {
    id: 'completed',
    title: 'Concluídos',
    status: 'completed',
    headingColor: '#22c55e',
    accentColor: 'rgba(34,197,94,0.35)',
    borderTopColor: 'rgba(34,197,94,0.5)',
    countBg: 'rgba(34,197,94,0.15)',
  },
  {
    id: 'cancelled',
    title: 'Cancelados',
    status: 'cancelled',
    headingColor: '#f87171',
    accentColor: 'rgba(248,113,113,0.35)',
    borderTopColor: 'rgba(248,113,113,0.5)',
    countBg: 'rgba(248,113,113,0.15)',
  },
]

const getStatusBadgeStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'confirmed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
    case 'pending':
      return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
    case 'completed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
    case 'cancelled':
      return { background: 'rgba(248,113,113,0.15)', color: '#f87171' }
    default:
      return { background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }
  }
}

export function KanbanView({ appointments, onAppointmentClick }: KanbanViewProps) {
  const getAppointmentsByStatus = (status: string) => {
    return appointments.filter(apt => apt.status === status)
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(18rem, 1fr))',
          gap: '1rem',
          minWidth: 'max-content',
        }}
        className="lg:min-w-0"
      >
        {columns.map((column, columnIndex) => {
          const columnAppointments = getAppointmentsByStatus(column.status)

          return (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: columnIndex * 0.1, type: 'spring', stiffness: 320, damping: 36 }}
              style={{ flexShrink: 0 }}
            >
              {/* Column wrapper */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '1.125rem',
                  borderTop: `4px solid ${column.borderTopColor}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.125rem 0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.0625rem',
                      fontWeight: 700,
                      color: column.headingColor,
                      margin: 0,
                    }}
                  >
                    {column.title}
                  </h3>
                  <span
                    style={{
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: column.countBg,
                      color: column.headingColor,
                    }}
                  >
                    {columnAppointments.length}
                  </span>
                </div>

                {/* Column body */}
                <div
                  style={{
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                    maxHeight: 'calc(100vh - 280px)',
                    overflowY: 'auto',
                  }}
                >
                  {columnAppointments.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '2rem 0',
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.25)',
                      }}
                    >
                      Nenhum agendamento
                    </div>
                  ) : (
                    columnAppointments.map((appointment, index) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 320, damping: 36 }}
                        whileHover={{ scale: 1.02 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onAppointmentClick?.(appointment)}
                      >
                        {/* Appointment card */}
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '1.125rem',
                            borderLeft: `4px solid ${column.borderTopColor}`,
                            padding: '1rem',
                            transition: 'box-shadow 0.2s, border-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = `0 4px 24px ${column.accentColor}`
                            e.currentTarget.style.borderColor = column.borderTopColor
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                          }}
                        >
                          {/* Header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h4
                              style={{
                                fontWeight: 700,
                                color: '#fff',
                                fontSize: '0.9375rem',
                                margin: 0,
                              }}
                            >
                              {appointment.clientName}
                            </h4>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.35)',
                                padding: '0 0 0 4px',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                marginTop: -2,
                                marginRight: -6,
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>

                          {/* Service */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Scissors size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                color: 'rgba(255,255,255,0.65)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {appointment.service}
                            </span>
                          </div>

                          {/* Professional */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <User size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                color: 'rgba(255,255,255,0.65)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {appointment.professional}
                            </span>
                          </div>

                          {/* Date & Time */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Calendar size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                              {formatDate(appointment.date)}
                            </span>
                            <Clock size={15} style={{ color: '#D4AF37', flexShrink: 0, marginLeft: 'auto' }} />
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                              {appointment.time}
                            </span>
                          </div>

                          {/* Footer */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                              {appointment.duration} min
                            </span>
                            <span
                              style={{
                                fontSize: '1.0625rem',
                                fontWeight: 700,
                                color: '#D4AF37',
                              }}
                            >
                              {formatCurrency(appointment.price)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
