import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Filter, Plus, Kanban, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      {zoomIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gold/90 text-black px-4 py-2 rounded-lg shadow-lg font-semibold text-sm"
        >
          {zoomIndicator}
        </motion.div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Busca e Botões de Ação - Desktop */}
        <div className="hidden sm:flex gap-2">
            <Input
              type="search"
              placeholder="Buscar cliente..."
              className="flex-1"
            />
            <div className="flex items-center gap-1 border border-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8 px-3"
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                Calendário
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                <Kanban className="w-4 h-4 mr-1" />
                Kanban
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="gold" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
        </div>

        {/* Mobile - Simplificado */}
        <div className="sm:hidden space-y-3">
            {/* Busca + Novo */}
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="Buscar..."
                className="flex-1"
              />
              <Button variant="gold" size="sm" className="px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Toggle Visualização */}
            <div className="flex items-center gap-1 border border-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-9 flex-1"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Calendário
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-9 flex-1"
              >
                <Kanban className="w-4 h-4 mr-2" />
                Kanban
              </Button>
            </div>
        </div>

        {/* Filtros de Status - Apenas para calendário */}
        {viewMode === 'calendar' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="whitespace-nowrap flex-shrink-0"
              >
                Todos
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className="whitespace-nowrap flex-shrink-0"
              >
                Pendentes
              </Button>
              <Button
                variant={filter === 'confirmed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('confirmed')}
                className="whitespace-nowrap flex-shrink-0"
              >
                Confirmados
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
                className="whitespace-nowrap flex-shrink-0"
              >
                Concluídos
              </Button>
          </div>
        )}
      </div>

      {/* Calendar Mode Selector - Only visible when in calendar view */}
      {viewMode === 'calendar' && (
          <div className="mb-4">
            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-1">Visualizar:</span>
              <Button
                variant={calendarMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('day')}
              >
                <CalendarClock className="w-4 h-4 mr-1" />
                Dia
              </Button>
              <Button
                variant={calendarMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('week')}
              >
                <CalendarRange className="w-4 h-4 mr-1" />
                Semana
              </Button>
              <Button
                variant={calendarMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('month')}
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                Mês
              </Button>
              <Button
                variant={calendarMode === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('year')}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Ano
              </Button>
            </div>

            {/* Mobile - Grid de 4 colunas */}
            <div className="sm:hidden grid grid-cols-4 gap-2">
              <Button
                variant={calendarMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('day')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <CalendarClock className="w-4 h-4" />
                <span className="text-xs">Dia</span>
              </Button>
              <Button
                variant={calendarMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('week')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <CalendarRange className="w-4 h-4" />
                <span className="text-xs">Semana</span>
              </Button>
              <Button
                variant={calendarMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('month')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs">Mês</span>
              </Button>
              <Button
                variant={calendarMode === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarMode('year')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Ano</span>
              </Button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
          <CalendarView
            appointments={filteredAppointments}
            mode={calendarMode}
            onAppointmentClick={(apt) => console.log('Clicked appointment:', apt)}
        />
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
          <KanbanView
            appointments={appointments}
          onAppointmentClick={(apt) => console.log('Clicked appointment:', apt)}
        />
      )}
    </OwnerPageLayout>
  )
}
