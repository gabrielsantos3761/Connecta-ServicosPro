import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Appointment } from '@/types'

interface WeekViewProps {
  appointments: Appointment[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

const getStatusInlineStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'confirmed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderLeft: '2px solid #22c55e' }
    case 'pending':
      return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderLeft: '2px solid #fbbf24' }
    case 'completed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderLeft: '2px solid #22c55e' }
    case 'cancelled':
      return { background: 'rgba(248,113,113,0.15)', color: '#f87171', borderLeft: '2px solid #f87171' }
    default:
      return { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', borderLeft: '2px solid #D4AF37' }
  }
}

export function WeekView({ appointments, currentDate, onDateChange, onAppointmentClick }: WeekViewProps) {
  const getWeekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate)
      date.setDate(diff + i)
      weekDays.push(date)
    }
    return weekDays
  }, [currentDate])

  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    onDateChange(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear()
    }).sort((a, b) => {
      const timeA = a.time.split(':').map(Number)
      const timeB = b.time.split(':').map(Number)
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const formatWeekRange = () => {
    const firstDay = getWeekDays[0]
    const lastDay = getWeekDays[6]

    const firstDayStr = firstDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    const lastDayStr = lastDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

    return `${firstDayStr} - ${lastDayStr}`
  }

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const navBtnBase: React.CSSProperties = {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '0.5rem',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    transition: 'color 0.2s, border-color 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#D4AF37',
              margin: 0,
            }}
          >
            {formatWeekRange()}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} na semana
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={goToToday}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '0.5rem',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
          >
            Esta Semana
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              style={navBtnBase}
              onClick={previousWeek}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              style={navBtnBase}
              onClick={nextWeek}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '1.125rem',
          padding: '1rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '0.75rem',
          }}
          className="md:grid-cols-7"
        >
          {getWeekDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDay(date)
            const isCurrentDay = isToday(date)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 320, damping: 36 }}
                style={{
                  minHeight: 300,
                  border: isCurrentDay
                    ? '2px solid #D4AF37'
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  background: isCurrentDay
                    ? 'rgba(212,175,55,0.06)'
                    : 'rgba(255,255,255,0.015)',
                  boxShadow: isCurrentDay ? '0 0 20px rgba(212,175,55,0.1)' : 'none',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Cabeçalho do dia */}
                <div
                  style={{
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isCurrentDay ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {dayNames[date.getDay()]}
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: isCurrentDay ? '#D4AF37' : '#fff',
                      lineHeight: 1.2,
                    }}
                  >
                    {date.getDate()}
                  </div>
                  {dayAppointments.length > 0 && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        borderRadius: '9999px',
                        padding: '1px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: 'rgba(212,175,55,0.15)',
                        color: '#D4AF37',
                      }}
                    >
                      {dayAppointments.length}
                    </span>
                  )}
                </div>

                {/* Lista de agendamentos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dayAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onAppointmentClick?.(appointment)}
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'box-shadow 0.2s',
                        ...getStatusInlineStyle(appointment.status),
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Clock size={11} />
                        <span style={{ fontWeight: 700 }}>{appointment.time}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 1 }}>
                        {appointment.clientName}
                      </div>
                      <div
                        style={{
                          opacity: 0.8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {appointment.service}
                      </div>
                    </motion.div>
                  ))}

                  {dayAppointments.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '0.75rem',
                        padding: '1rem 0',
                      }}
                    >
                      Sem agendamentos
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
