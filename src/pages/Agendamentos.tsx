import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Filter, Plus, Kanban, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { CalendarView, CalendarMode } from '@/components/calendar/CalendarView'
import { KanbanView } from '@/components/calendar/KanbanView'
import { usePinchZoom, getNextZoomLevel } from '@/hooks/usePinchZoom'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import { getAppointmentsByBusiness, type Appointment as FirebaseAppointment } from '@/services/appointmentService'
import { type Appointment } from '@/types'

/** Converte o Appointment do Firebase para o formato que CalendarView/KanbanView esperam */
function toCalendarAppointment(apt: FirebaseAppointment): Appointment {
  const [year, month, day] = apt.date.split('-').map(Number)
  return {
    id: apt.id,
    businessId: apt.businessId,
    clientId: apt.clientId,
    clientName: apt.clientName,
    serviceId: apt.serviceId,
    service: apt.serviceName,
    professionalId: apt.professionalId,
    professional: apt.professionalName ?? '',
    date: new Date(year, month - 1, day),
    time: apt.time,
    price: apt.servicePrice,
    status: apt.status,
    duration: apt.serviceDuration,
    paymentMethod: apt.paymentMethod as Appointment['paymentMethod'],
  }
}

type ViewMode = 'kanban' | 'calendar'

const springTransition = { type: 'spring', stiffness: 320, damping: 36 }

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

const goldButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: '#050400',
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.25rem',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap' as const,
  flexShrink: 0,
}

function ViewToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'background 0.15s, color 0.15s',
        background: active
          ? 'linear-gradient(135deg,#D4AF37,#B8941E)'
          : 'transparent',
        color: active ? '#050400' : 'rgba(255,255,255,0.5)',
      }}
    >
      {children}
    </button>
  )
}

function CalendarModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  mobile,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  mobile?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: mobile ? 'column' : 'row',
        alignItems: 'center',
        gap: mobile ? '0.25rem' : '0.375rem',
        padding: mobile ? '0.5rem 0.25rem' : '0.375rem 0.875rem',
        borderRadius: '0.375rem',
        border: '1px solid',
        borderColor: active ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)',
        cursor: 'pointer',
        fontSize: mobile ? '0.7rem' : '0.875rem',
        fontWeight: 500,
        background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(255,255,255,0.5)',
        flex: mobile ? 1 : 'none',
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.375rem 1rem',
        borderRadius: '9999px',
        border: '1px solid',
        borderColor: active ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.1)',
        background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
        color: active ? '#D4AF37' : 'rgba(255,255,255,0.5)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export function Agendamentos() {
  const { businessId } = useParams<{ businessId: string }>()
  const [filter, setFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('day')
  const [zoomIndicator, setZoomIndicator] = useState<string | null>(null)
  const [rawAppointments, setRawAppointments] = useState<FirebaseAppointment[]>([])

  useEffect(() => {
    if (!businessId) return
    // Carrega 90 dias atrás até hoje para suportar navegação no calendário
    const from = new Date()
    from.setDate(from.getDate() - 90)
    getAppointmentsByBusiness(businessId, from)
      .then(setRawAppointments)
      .catch(console.error)
  }, [businessId])

  const appointments = useMemo(
    () => rawAppointments.map(toCalendarAppointment),
    [rawAppointments]
  )

  const showZoomIndicator = (mode: CalendarMode) => {
    const labels = {
      day: 'Visualização: Dia',
      week: 'Visualização: Semana',
      month: 'Visualização: Mês',
      year: 'Visualização: Ano',
    }
    setZoomIndicator(labels[mode])
    setTimeout(() => setZoomIndicator(null), 1500)
  }

  // Gestos de pinça para zoom
  usePinchZoom({
    onZoomIn: () => {
      if (viewMode === 'calendar') {
        const nextMode = getNextZoomLevel(calendarMode, 'in')
        if (nextMode !== calendarMode) {
          setCalendarMode(nextMode)
          showZoomIndicator(nextMode)
        }
      }
    },
    onZoomOut: () => {
      if (viewMode === 'calendar') {
        const nextMode = getNextZoomLevel(calendarMode, 'out')
        if (nextMode !== calendarMode) {
          setCalendarMode(nextMode)
          showZoomIndicator(nextMode)
        }
      }
    },
    threshold: 50,
  })

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true
    return apt.status === filter
  })

  return (
    <OwnerPageLayout title="Agendamentos" subtitle="Gerencie todos os agendamentos">
      {/* Indicador de Zoom */}
      <AnimatePresence>
        {zoomIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springTransition}
            style={{
              position: 'fixed',
              top: '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
              color: '#050400',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 4px 24px rgba(212,175,55,0.3)',
            }}
          >
            {zoomIndicator}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}
      >
        {/* Desktop */}
        <div
          style={{
            display: 'none',
            gap: '0.5rem',
            alignItems: 'center',
          }}
          className="sm-flex-row"
        >
          {/* Desktop row via responsive wrapper below */}
        </div>

        {/* Busca e Botões - Desktop (sm+) */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search input */}
          <input
            type="search"
            placeholder="Buscar cliente..."
            style={{
              flex: 1,
              minWidth: '10rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.875rem',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />

          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '0.25rem',
              ...cardStyle,
            }}
          >
            <ViewToggleButton active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>
              <CalendarDays size={16} />
              Calendário
            </ViewToggleButton>
            <ViewToggleButton active={viewMode === 'kanban'} onClick={() => setViewMode('kanban')}>
              <Kanban size={16} />
              Kanban
            </ViewToggleButton>
          </div>

          {/* Filtros button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 1rem',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
            }}
          >
            <Filter size={16} />
            Filtros
          </button>

          {/* Novo button */}
          <button style={goldButtonStyle}>
            <Plus size={16} />
            Novo
          </button>
        </div>

        {/* Filtros de Status - Apenas para calendário */}
        {viewMode === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springTransition}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}
          >
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterChip>
            <FilterChip active={filter === 'pending'} onClick={() => setFilter('pending')}>Pendentes</FilterChip>
            <FilterChip active={filter === 'confirmed'} onClick={() => setFilter('confirmed')}>Confirmados</FilterChip>
            <FilterChip active={filter === 'completed'} onClick={() => setFilter('completed')}>Concluídos</FilterChip>
          </motion.div>
        )}
      </motion.div>

      {/* Calendar Mode Selector */}
      {viewMode === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          style={{ marginBottom: '1rem' }}
        >
          {/* Desktop */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', marginRight: '0.25rem' }}>
              Visualizar:
            </span>
            <CalendarModeButton
              active={calendarMode === 'day'}
              onClick={() => setCalendarMode('day')}
              icon={CalendarClock}
              label="Dia"
            />
            <CalendarModeButton
              active={calendarMode === 'week'}
              onClick={() => setCalendarMode('week')}
              icon={CalendarRange}
              label="Semana"
            />
            <CalendarModeButton
              active={calendarMode === 'month'}
              onClick={() => setCalendarMode('month')}
              icon={CalendarDays}
              label="Mês"
            />
            <CalendarModeButton
              active={calendarMode === 'year'}
              onClick={() => setCalendarMode('year')}
              icon={Calendar}
              label="Ano"
            />
          </div>
        </motion.div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springTransition}
          style={{ ...cardStyle, overflow: 'hidden' }}
        >
          <CalendarView
            appointments={filteredAppointments}
            mode={calendarMode}
            onAppointmentClick={(apt) => console.log('Clicked appointment:', apt)}
          />
        </motion.div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springTransition}
        >
          <KanbanView
            appointments={appointments}
            onAppointmentClick={(apt) => console.log('Clicked appointment:', apt)}
          />
        </motion.div>
      )}
    </OwnerPageLayout>
  )
}
