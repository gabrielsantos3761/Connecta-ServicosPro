import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Appointment } from '@/types'
import { DayView } from './DayView'
import { WeekView } from './WeekView'
import { YearView } from './YearView'

export type CalendarMode = 'day' | 'week' | 'month' | 'year'

interface CalendarViewProps {
  appointments: Appointment[]
  mode?: CalendarMode
  onAppointmentClick?: (appointment: Appointment) => void
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  appointments: Appointment[]
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

export function CalendarView({ appointments, mode = 'month', onAppointmentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getAppointmentsForDate = (date: Date) => {
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

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: CalendarDay[] = []

    // Dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date,
        isCurrentMonth: false,
        appointments: getAppointmentsForDate(date)
      })
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        isCurrentMonth: true,
        appointments: getAppointmentsForDate(date)
      })
    }

    // Dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        appointments: getAppointmentsForDate(date)
      })
    }

    return days
  }, [currentDate, appointments])

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  // Renderizar componentes específicos baseado no modo (após todos os hooks)
  if (mode === 'day') {
    return (
      <DayView
        appointments={appointments}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAppointmentClick={onAppointmentClick}
      />
    )
  }

  if (mode === 'week') {
    return (
      <WeekView
        appointments={appointments}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onAppointmentClick={onAppointmentClick}
      />
    )
  }

  if (mode === 'year') {
    return (
      <YearView
        appointments={appointments}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onMonthClick={(month) => {
          const newDate = new Date(currentDate.getFullYear(), month, 1)
          setCurrentDate(newDate)
        }}
      />
    )
  }

  // Visualização mensal (padrão)
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
      {/* Header do Calendário */}
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
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} no total
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
              display: 'none',
            }}
            className="sm-show"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
          >
            Hoje
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              style={navBtnBase}
              onClick={previousMonth}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              style={navBtnBase}
              onClick={nextMonth}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#D4AF37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grade do Calendário */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '1.125rem',
          padding: '1rem',
        }}
      >
        {/* Cabeçalho dos dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {dayNames.map((day, index) => (
            <div
              key={`day-name-${index}`}
              style={{
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '0.5rem 0',
                color: index === 0 || index === 6 ? 'rgba(212,175,55,0.7)' : 'rgba(255,255,255,0.5)',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {calendarDays.map((day, index) => {
            const isCurrentDay = isToday(day.date)

            return (
              <motion.div
                key={`day-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.005, type: 'spring', stiffness: 320, damping: 36 }}
                style={{
                  minHeight: 120,
                  border: isCurrentDay
                    ? '2px solid #D4AF37'
                    : day.isCurrentMonth
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(255,255,255,0.04)',
                  borderRadius: '0.625rem',
                  padding: '0.5rem',
                  background: isCurrentDay
                    ? 'rgba(212,175,55,0.07)'
                    : day.isCurrentMonth
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.01)',
                  boxShadow: isCurrentDay ? '0 0 16px rgba(212,175,55,0.12)' : 'none',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
              >
                {/* Número do dia */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: isCurrentDay
                        ? '#D4AF37'
                        : day.isCurrentMonth
                          ? '#fff'
                          : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.appointments.length > 0 && (
                    <span
                      style={{
                        borderRadius: '9999px',
                        padding: '1px 7px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        background: 'rgba(212,175,55,0.15)',
                        color: '#D4AF37',
                      }}
                    >
                      {day.appointments.length}
                    </span>
                  )}
                </div>

                {/* Lista de agendamentos do dia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {day.appointments.slice(0, 3).map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => onAppointmentClick?.(appointment)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.25rem 0.375rem',
                        borderRadius: '0.3rem',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                        ...getStatusInlineStyle(appointment.status),
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 1 }}>
                        <Clock size={10} />
                        <span style={{ fontWeight: 500 }}>{appointment.time}</span>
                      </div>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appointment.clientName}
                      </div>
                      <div style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {appointment.service}
                      </div>
                    </motion.div>
                  ))}

                  {day.appointments.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingTop: 2 }}>
                      +{day.appointments.length - 3} mais
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        {[
          { color: '#22c55e', bg: 'rgba(34,197,94,0.18)', label: 'Confirmado' },
          { color: '#fbbf24', bg: 'rgba(251,191,36,0.18)', label: 'Pendente' },
          { color: '#22c55e', bg: 'rgba(34,197,94,0.18)', label: 'Concluído' },
          { color: '#f87171', bg: 'rgba(248,113,113,0.18)', label: 'Cancelado' },
        ].map(({ color, bg, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '3px',
                background: bg,
                border: `2px solid ${color}`,
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
