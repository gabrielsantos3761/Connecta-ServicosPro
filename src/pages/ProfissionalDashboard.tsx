import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, DollarSign, CheckCircle, XCircle, Building2, CalendarClock, X, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

// Mock de dados de agendamentos por empresa
const mockAppointmentsByBusiness = {
  'biz-1': {
    businessName: 'BarberPro Premium',
    address: 'Rua das Flores, 123 - Centro',
    appointments: [
      {
        id: '1',
        clientName: 'João Silva',
        clientAvatar: undefined,
        service: 'Corte Masculino',
        date: '2024-01-20',
        time: '10:00',
        duration: 30,
        price: 35.00,
        status: 'confirmed' as const,
      },
      {
        id: '2',
        clientName: 'Pedro Santos',
        clientAvatar: undefined,
        service: 'Barba Completa',
        date: '2024-01-20',
        time: '14:30',
        duration: 20,
        price: 25.00,
        status: 'confirmed' as const,
      },
      {
        id: '3',
        clientName: 'Lucas Oliveira',
        clientAvatar: undefined,
        service: 'Corte + Barba',
        date: '2024-01-21',
        time: '09:00',
        duration: 45,
        price: 55.00,
        status: 'pending' as const,
      },
    ],
  },
  'biz-4': {
    businessName: 'Estilo & Charme',
    address: 'Rua dos Pinheiros, 789 - Pinheiros',
    appointments: [
      {
        id: '4',
        clientName: 'Maria Silva',
        clientAvatar: undefined,
        service: 'Coloração',
        date: '2024-01-20',
        time: '11:00',
        duration: 60,
        price: 80.00,
        status: 'confirmed' as const,
      },
      {
        id: '5',
        clientName: 'Ana Costa',
        clientAvatar: undefined,
        service: 'Corte Feminino',
        date: '2024-01-20',
        time: '16:00',
        duration: 45,
        price: 50.00,
        status: 'completed' as const,
      },
      {
        id: '6',
        clientName: 'Beatriz Santos',
        clientAvatar: undefined,
        service: 'Hidratação Capilar',
        date: '2024-01-21',
        time: '10:30',
        duration: 90,
        price: 120.00,
        status: 'confirmed' as const,
      },
    ],
  },
}

type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusColors: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Horários disponíveis (8h às 20h)
const availableHours = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = i % 2 === 0 ? '00' : '30'
  return `${hour.toString().padStart(2, '0')}:${minute}`
}).filter(time => time <= '20:00')

interface ScheduleSlot {
  id: string
  businessId: string
  date: string // Formato: YYYY-MM-DD
  startTime: string
  endTime: string
}

export function ProfissionalDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('today')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)

  // Pegar o estabelecimento selecionado do localStorage
  const currentBusinessId = localStorage.getItem('selected_business_id') || 'biz-1'

  // Estados do modal de agenda
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    // Exemplos de horários já configurados
    { id: '1', businessId: 'biz-1', date: '2025-01-27', startTime: '09:00', endTime: '12:00' },
    { id: '2', businessId: 'biz-1', date: '2025-01-27', startTime: '14:00', endTime: '18:00' },
    { id: '3', businessId: 'biz-1', date: '2025-01-28', startTime: '10:00', endTime: '16:00' },
  ])
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
  })
  const [conflictError, setConflictError] = useState<string | null>(null)

  if (!user || user.role !== 'professional') {
    return null
  }

  // Filtrar agendamentos
  const getFilteredAppointments = () => {
    let allAppointments: any[] = []

    if (selectedBusiness === 'all') {
      // Combinar todos os agendamentos de todas as empresas
      Object.entries(mockAppointmentsByBusiness).forEach(([businessId, data]) => {
        allAppointments.push(...data.appointments.map(apt => ({ ...apt, businessId, businessName: data.businessName })))
      })
    } else {
      const businessData = mockAppointmentsByBusiness[selectedBusiness as keyof typeof mockAppointmentsByBusiness]
      if (businessData) {
        allAppointments = businessData.appointments.map(apt => ({
          ...apt,
          businessId: selectedBusiness,
          businessName: businessData.businessName
        }))
      }
    }

    // Filtrar por data
    const today = new Date().toISOString().split('T')[0]
    if (selectedDate === 'today') {
      allAppointments = allAppointments.filter(apt => apt.date === today || apt.date === '2024-01-20')
    } else if (selectedDate === 'tomorrow') {
      allAppointments = allAppointments.filter(apt => apt.date === '2024-01-21')
    }

    return allAppointments.sort((a, b) => a.time.localeCompare(b.time))
  }

  const filteredAppointments = getFilteredAppointments()

  // Estatísticas
  const totalAppointmentsToday = getFilteredAppointments().filter(apt => apt.status !== 'cancelled').length
  const completedToday = getFilteredAppointments().filter(apt => apt.status === 'completed').length
  const totalEarnings = getFilteredAppointments()
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.price, 0)

  // Verificar conflito de horários
  const checkTimeConflict = (date: string, startTime: string, endTime: string, excludeId?: string): boolean => {
    // Verificar se o horário final é depois do inicial
    if (endTime <= startTime) {
      return true
    }

    // Verificar conflitos com outros slots na mesma data (em todos os estabelecimentos)
    const slotsOnSameDate = scheduleSlots.filter(
      slot => slot.date === date && slot.id !== excludeId
    )

    for (const slot of slotsOnSameDate) {
      // Verificar se há sobreposição de horários
      if (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      ) {
        return true
      }
    }

    return false
  }

  const handleAddScheduleSlot = () => {
    const { date, startTime, endTime } = newSlot

    // Validações
    if (!date || !startTime || !endTime) {
      setConflictError('Preencha todos os campos')
      return
    }

    // Verificar se o horário final é depois do inicial
    if (endTime <= startTime) {
      setConflictError('O horário de término deve ser posterior ao horário de início')
      return
    }

    // Verificar se a data não é passada
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date + 'T00:00:00')

    if (selectedDate < today) {
      setConflictError('Não é possível adicionar horários em datas passadas')
      return
    }

    // Verificar conflitos com outros slots na mesma data (em todos os estabelecimentos)
    const conflictSlot = scheduleSlots.find(
      slot => slot.date === date &&
      (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      )
    )

    if (conflictSlot) {
      const conflictBusiness = mockAppointmentsByBusiness[conflictSlot.businessId as keyof typeof mockAppointmentsByBusiness]?.businessName
      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
      const isCurrentBusiness = conflictSlot.businessId === currentBusinessId

      if (isCurrentBusiness) {
        setConflictError(`Conflito de horário! Você já possui um horário cadastrado neste período (${formattedDate} - ${conflictBusiness}: ${conflictSlot.startTime} - ${conflictSlot.endTime})`)
      } else {
        setConflictError(`Conflito de horário! Você já está comprometido neste período em outro estabelecimento (${formattedDate} - ${conflictBusiness}: ${conflictSlot.startTime} - ${conflictSlot.endTime})`)
      }
      return
    }

    // Adicionar novo slot para o estabelecimento atual
    const newScheduleSlot: ScheduleSlot = {
      id: Date.now().toString(),
      businessId: currentBusinessId,
      date,
      startTime,
      endTime,
    }

    setScheduleSlots([...scheduleSlots, newScheduleSlot])
    setNewSlot({ date: '', startTime: '', endTime: '' })
    setConflictError(null)
  }

  const handleRemoveScheduleSlot = (id: string) => {
    setScheduleSlots(scheduleSlots.filter(slot => slot.id !== id))
  }

  const handleOpenScheduleModal = () => {
    setIsScheduleModalOpen(true)
    setConflictError(null)
  }

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false)
    setNewSlot({ date: '', startTime: '', endTime: '' })
    setConflictError(null)
  }

  // Filtrar slots do estabelecimento atual
  const currentBusinessSlots = scheduleSlots.filter(slot => slot.businessId === currentBusinessId)

  // Agrupar slots por data
  const slotsByDate = currentBusinessSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = []
    }
    acc[slot.date].push(slot)
    return acc
  }, {} as Record<string, ScheduleSlot[]>)

  // Ordenar datas
  const sortedDates = Object.keys(slotsByDate).sort()

  // Data mínima (hoje)
  const today = new Date()
  const minDate = today.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Olá, {user.name}!
              </h1>
              <p className="text-purple-100">Gerencie seus atendimentos</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={handleOpenScheduleModal}
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Agenda
              </Button>
              <Button
                variant="outline"
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={() => navigate('/profissional/perfil')}
              >
                Meu Perfil
              </Button>
              <Button
                variant="outline"
                className="bg-white text-purple-600 hover:bg-purple-50"
                onClick={logout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Agendamentos Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">{totalAppointmentsToday}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Concluídos</p>
                  <p className="text-3xl font-bold text-gray-900">{completedToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ganhos Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
                </div>
                <div className="w-12 h-12 bg-gold-light rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Empresa
                </label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {Object.entries(mockAppointmentsByBusiness).map(([id, data]) => (
                      <SelectItem key={id} value={id}>
                        {data.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Período
                </label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="tomorrow">Amanhã</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Seus Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-sm text-gray-500">
                  Você não tem agendamentos para o período selecionado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                              {appointment.clientName.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {appointment.clientName}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">{appointment.service}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                {selectedBusiness === 'all' && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {appointment.businessName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {appointment.time} ({appointment.duration} min)
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(appointment.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 md:flex-col md:items-end">
                            <Badge className={statusColors[appointment.status as AppointmentStatus]}>
                              {statusLabels[appointment.status as AppointmentStatus]}
                            </Badge>
                            {appointment.status === 'confirmed' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancelar
                                </Button>
                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Concluir
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Agenda */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseScheduleModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Gerenciar Agenda</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {mockAppointmentsByBusiness[currentBusinessId as keyof typeof mockAppointmentsByBusiness]?.businessName}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseScheduleModal}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Adicionar novo horário */}
                  <div className="bg-purple-50 rounded-xl p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-purple-600" />
                      Adicionar Novo Horário
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Data
                        </Label>
                        <input
                          type="date"
                          min={minDate}
                          value={newSlot.date}
                          onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Horário Início
                        </Label>
                        <Select
                          value={newSlot.startTime}
                          onValueChange={(value) => setNewSlot({ ...newSlot, startTime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHours.map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Horário Fim
                        </Label>
                        <Select
                          value={newSlot.endTime}
                          onValueChange={(value) => setNewSlot({ ...newSlot, endTime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableHours.map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {conflictError && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{conflictError}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleAddScheduleSlot}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Horário
                    </Button>
                  </div>

                  {/* Lista de horários configurados */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Horários Configurados
                    </h4>

                    {currentBusinessSlots.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <CalendarClock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600">Nenhum horário configurado ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedDates.map((date) => {
                          const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          const slots = slotsByDate[date]

                          return (
                            <div key={date} className="bg-gray-50 rounded-xl p-4">
                              <h5 className="font-semibold text-gray-900 mb-3 capitalize">{formattedDate}</h5>
                              <div className="space-y-2">
                                {slots.map((slot) => (
                                  <div
                                    key={slot.id}
                                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Clock className="w-4 h-4 text-purple-600" />
                                      <span className="text-sm font-medium text-gray-900">
                                        {slot.startTime} - {slot.endTime}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveScheduleSlot(slot.id)}
                                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <Button
                    variant="outline"
                    onClick={handleCloseScheduleModal}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={handleCloseScheduleModal}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
