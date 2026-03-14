import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Appointment } from '@/types'

const GOLD = '#D4AF37'

interface YearViewProps {
  appointments: Appointment[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onMonthClick?: (month: number) => void
}

export function YearView({ appointments, currentDate, onDateChange, onMonthClick }: YearViewProps) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNamesShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  const previousYear = () => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() - 1)
    onDateChange(newDate)
  }

  const nextYear = () => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() + 1)
    onDateChange(newDate)
  }

  const goToCurrentYear = () => {
    onDateChange(new Date())
  }

  const getMonthData = (monthIndex: number) => {
    const year = currentDate.getFullYear()
    const firstDayOfMonth = new Date(year, monthIndex, 1)
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const days: Array<{ date: number | null; hasAppointments: boolean }> = []

    // Dias vazios antes do início do mês
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, hasAppointments: false })
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const hasAppointments = appointments.some(apt => {
        const aptDate = new Date(apt.date)
        return aptDate.getDate() === day &&
               aptDate.getMonth() === monthIndex &&
               aptDate.getFullYear() === year
      })
      days.push({ date: day, hasAppointments })
    }

    return days
  }

  const getMonthAppointmentsCount = (monthIndex: number) => {
    const year = currentDate.getFullYear()
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getMonth() === monthIndex && aptDate.getFullYear() === year
    }).length
  }

  const getMonthRevenue = (monthIndex: number) => {
    const year = currentDate.getFullYear()
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.date)
        return aptDate.getMonth() === monthIndex && aptDate.getFullYear() === year
      })
      .reduce((sum, apt) => sum + apt.price, 0)
  }

  const isToday = (monthIndex: number, day: number) => {
    const today = new Date()
    return today.getDate() === day &&
           today.getMonth() === monthIndex &&
           today.getFullYear() === currentDate.getFullYear()
  }

  const yearStats = useMemo(() => {
    const year = currentDate.getFullYear()
    const yearAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return aptDate.getFullYear() === year
    })

    return {
      totalAppointments: yearAppointments.length,
      totalRevenue: yearAppointments.reduce((sum, apt) => sum + apt.price, 0),
      averagePerMonth: yearAppointments.length / 12
    }
  }, [appointments, currentDate])

  const navBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '0.5rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    transition: 'color 0.18s, border-color 0.18s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: GOLD,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {currentDate.getFullYear()}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            {yearStats.totalAppointments} agendamentos no ano
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Ano Atual button — hidden on small screens via inline style override in parent, kept visible here */}
          <button
            onClick={goToCurrentYear}
            style={{
              padding: '0.4rem 0.875rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Ano Atual
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button onClick={previousYear} style={navBtnBase} aria-label="Ano anterior">
              <ChevronLeft style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
            <button onClick={nextYear} style={navBtnBase} aria-label="Próximo ano">
              <ChevronRight style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Year Stats */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${GOLD}33`,
          borderRadius: '1.125rem',
          padding: '1rem 1.25rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: GOLD }}>{yearStats.totalAppointments}</div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Total de Agendamentos</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: GOLD }}>
              R$ {yearStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Receita Total</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: GOLD }}>
              {yearStats.averagePerMonth.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.125rem' }}>Média por Mês</div>
          </div>
        </div>
      </div>

      {/* Months Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {monthNames.map((monthName, monthIndex) => {
          const monthDays = getMonthData(monthIndex)
          const appointmentsCount = getMonthAppointmentsCount(monthIndex)
          const revenue = getMonthRevenue(monthIndex)

          return (
            <motion.div
              key={monthIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 36, delay: monthIndex * 0.03 }}
              onClick={() => onMonthClick?.(monthIndex)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '0.875rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              whileHover={{
                borderColor: `${GOLD}80`,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              {/* Month Header */}
              <div style={{ marginBottom: '0.5rem' }}>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: GOLD,
                    margin: '0 0 0.25rem 0',
                  }}
                >
                  {monthName}
                </h3>
                {appointmentsCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                      {appointmentsCount} agend.
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#4ade80', fontWeight: 600 }}>
                      R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Day Names */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '2px',
                  marginBottom: '0.25rem',
                }}
              >
                {dayNamesShort.map((day, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.5rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.3)',
                      fontWeight: 600,
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Mini Calendar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '2px',
                }}
              >
                {monthDays.map((day, index) => {
                  const isTodayDate = day.date ? isToday(monthIndex, day.date) : false

                  let cellBg = 'transparent'
                  let cellColor = 'rgba(255,255,255,0.55)'
                  let outline = 'none'
                  let fontWeight: React.CSSProperties['fontWeight'] = 400

                  if (day.hasAppointments) {
                    cellBg = `${GOLD}30`
                    cellColor = '#ffffff'
                    fontWeight = 700
                  }
                  if (isTodayDate) {
                    cellBg = `${GOLD}25`
                    outline = `1px solid ${GOLD}`
                    cellColor = '#ffffff'
                    fontWeight = 700
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.5625rem',
                        borderRadius: '3px',
                        background: cellBg,
                        color: cellColor,
                        fontWeight,
                        outline,
                        outlineOffset: '-1px',
                      }}
                    >
                      {day.date}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
