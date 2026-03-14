import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Scissors, Eye, EyeOff } from 'lucide-react'
import { Appointment } from '@/types'
import { AppointmentDetailModal } from './AppointmentDetailModal'

interface DayViewProps {
  appointments: Appointment[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

const getStatusInlineStyle = (status: string): React.CSSProperties => {
  switch (status) {
    case 'confirmed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderLeft: '3px solid #22c55e' }
    case 'pending':
      return { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderLeft: '3px solid #fbbf24' }
    case 'completed':
      return { background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderLeft: '3px solid #22c55e' }
    case 'cancelled':
      return { background: 'rgba(248,113,113,0.15)', color: '#f87171', borderLeft: '3px solid #f87171' }
    default:
      return { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', borderLeft: '3px solid #D4AF37' }
  }
}

export function DayView({ appointments, currentDate, onDateChange, onAppointmentClick }: DayViewProps) {
  const [showAllHours, setShowAllHours] = useState(true)
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const allHours = Array.from({ length: 14 }, (_, i) => i + 7) // 7h às 20h

  const handleAppointmentClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation() // Impede que o clique propague para o container pai

    // Se já está expandido, abre o modal
    if (expandedAppointments.has(appointment.id)) {
      setSelectedAppointment(appointment)
    } else {
      // Se não está expandido, expande
      setExpandedAppointments(prev => {
        const newSet = new Set(prev)
        newSet.add(appointment.id)
        return newSet
      })
    }
  }

  const previousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    return aptDate.getDate() === currentDate.getDate() &&
           aptDate.getMonth() === currentDate.getMonth() &&
           aptDate.getFullYear() === currentDate.getFullYear()
  }).sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
  })

  const getAppointmentsForHour = (hour: number) => {
    return dayAppointments.filter(apt => {
      const [aptHour] = apt.time.split(':').map(Number)
      return aptHour === hour
    })
  }

  // Filtrar apenas horários com agendamentos ou próximos a eles
  const getRelevantHours = () => {
    // Se showAllHours está ativo, retornar todos os horários
    if (showAllHours) {
      return allHours
    }

    if (dayAppointments.length === 0) {
      // Se não há agendamentos, mostrar apenas horário comercial resumido
      return [7, 9, 11, 13, 15, 17, 19, 20]
    }

    const hoursWithAppointments = new Set<number>()
    dayAppointments.forEach(apt => {
      const [hour] = apt.time.split(':').map(Number)
      hoursWithAppointments.add(hour)
    })

    // Adicionar horários adjacentes para contexto
    const relevantHours = new Set<number>()
    hoursWithAppointments.forEach(hour => {
      relevantHours.add(hour)
      // Adicionar hora anterior e posterior para contexto
      if (hour > 7) relevantHours.add(hour - 1)
      if (hour < 20) relevantHours.add(hour + 1)
    })

    // Garantir que temos início e fim do expediente
    relevantHours.add(7)
    relevantHours.add(20)

    return Array.from(relevantHours).sort((a, b) => a - b)
  }

  const hours = getRelevantHours()

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const isCurrentHour = (hour: number) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()
    return isToday && now.getHours() === hour
  }

  const isPastHour = (hour: number) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()
    if (!isToday) {
      // Se não é hoje, verificar se a data é anterior
      const compareDate = new Date(currentDate)
      compareDate.setHours(hour, 0, 0, 0)
      return compareDate < now
    }
    return isToday && now.getHours() > hour
  }

  const isCurrentOrFuture = (appointment: Appointment) => {
    const now = new Date()
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear()

    if (!isToday) {
      // Se não é hoje, verificar se a data é futura
      const aptDate = new Date(appointment.date)
      return aptDate >= now
    }

    // Se é hoje, verificar se o horário é atual ou futuro
    const [aptHour, aptMinute] = appointment.time.split(':').map(Number)
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    return aptHour > currentHour || (aptHour === currentHour && aptMinute >= currentMinute)
  }

  const navBtnBase: React.CSSProperties = {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '0.5rem',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    transition: 'color 0.2s, border-color 0.2s',
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      onClick={() => {
        // Recolher todos os agendamentos expandidos ao clicar fora
        setExpandedAppointments(new Set())
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#D4AF37',
                margin: 0,
                textTransform: 'capitalize',
              }}
            >
              {formatDayName(currentDate)}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {dayAppointments.length} agendamento{dayAppointments.length !== 1 ? 's' : ''} hoje
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); goToToday() }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '0.5rem',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: '0.3125rem 0.625rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              Hoje
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                style={navBtnBase}
                onClick={(e) => { e.stopPropagation(); previousDay() }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                style={navBtnBase}
                onClick={(e) => { e.stopPropagation(); nextDay() }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Toggle para mostrar todos os horários */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowAllHours(!showAllHours) }}
            style={{
              background: showAllHours ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
              border: showAllHours ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.10)',
              borderRadius: '0.5rem',
              color: showAllHours ? '#D4AF37' : 'rgba(255,255,255,0.6)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.3125rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s',
            }}
          >
            {showAllHours ? (
              <>
                <EyeOff size={13} />
                Apenas com Agendamentos
              </>
            ) : (
              <>
                <Eye size={13} />
                Todos os Horários
              </>
            )}
          </button>
          {!showAllHours && dayAppointments.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
              Mostrando {hours.length} de {allHours.length} horários
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '1.125rem',
          padding: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {hours.map((hour, index) => {
            const hourAppointments = getAppointmentsForHour(hour)
            const isCurrent = isCurrentHour(hour)
            const isPast = isPastHour(hour)
            const hasAppointments = hourAppointments.length > 0

            return (
              <motion.div
                key={hour}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01, type: 'spring', stiffness: 320, damping: 36 }}
                style={{
                  display: 'flex',
                  gap: '0.625rem',
                  borderRadius: '0.625rem',
                  border: isCurrent
                    ? '1px solid rgba(212,175,55,0.4)'
                    : isPast
                      ? '1px solid rgba(255,255,255,0.03)'
                      : hasAppointments
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(255,255,255,0.04)',
                  background: isCurrent
                    ? 'rgba(212,175,55,0.07)'
                    : isPast
                      ? 'rgba(255,255,255,0.01)'
                      : hasAppointments
                        ? 'rgba(255,255,255,0.025)'
                        : 'transparent',
                  padding: hasAppointments && !isPast ? '0.5rem 0.625rem' : '0.25rem 0.625rem',
                  opacity: isPast && hasAppointments ? 0.55 : 1,
                  boxShadow: isCurrent ? '0 0 12px rgba(212,175,55,0.12)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {/* Hora */}
                <div style={{ width: 48, flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: isCurrent
                        ? '#D4AF37'
                        : isPast
                          ? 'rgba(255,255,255,0.2)'
                          : hasAppointments
                            ? 'rgba(255,255,255,0.5)'
                            : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                </div>

                {/* Linha divisória - apenas se tiver agendamentos */}
                {hasAppointments && !isPast && (
                  <div
                    style={{
                      width: 1,
                      background: isCurrent ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                      borderRadius: 1,
                    }}
                  />
                )}

                {/* Agendamentos */}
                <div style={{ flex: 1 }}>
                  {hourAppointments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {hourAppointments.map((appointment) => {
                        const isFutureAppointment = isCurrentOrFuture(appointment)
                        const isExpanded = expandedAppointments.has(appointment.id)
                        const shouldShowExpanded = isExpanded

                        return (
                          <div
                            key={appointment.id}
                            onClick={(e) => handleAppointmentClick(appointment, e)}
                            style={{
                              borderRadius: '0.4375rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              opacity: isFutureAppointment || shouldShowExpanded ? 1 : 0.6,
                              ...getStatusInlineStyle(appointment.status),
                              ...(shouldShowExpanded
                                ? { padding: '0.5rem 0.625rem' }
                                : { padding: '0.1875rem 0.5rem' }),
                            }}
                          >
                            {shouldShowExpanded ? (
                              // Versão expandida (quando clicado)
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                  <Clock size={13} style={{ flexShrink: 0 }} />
                                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{appointment.time}</span>
                                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{appointment.duration}min</span>
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Scissors size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {appointment.service}
                                  </span>
                                </div>
                              </>
                            ) : (
                              // Versão compacta (padrão)
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={11} style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{appointment.time}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>•</span>
                                <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {appointment.service}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  )
}
