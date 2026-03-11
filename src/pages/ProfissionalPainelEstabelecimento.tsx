import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  DollarSign,
  Clock,
  Save,
  ArrowLeft,
  Loader2,
  Building2,
  Scissors,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfissionalPageLayout } from '@/components/layout/ProfissionalPageLayout'
import { useAuth } from '@/contexts/AuthContext'
import { getLinksByProfessional, updateLinkDetails, type ProfessionalLink, type WorkScheduleDay } from '@/services/professionalLinkService'
import { getAllBusinessConfigs } from '@/services/businessConfigService'
import { getBusinessById, type Business } from '@/services/businessService'
import { type BusinessHours } from '@/services/businessService'
import { getAppointmentsByProfessional, type Appointment } from '@/services/appointmentService'
import { formatCurrency } from '@/lib/utils'

// ============================================
// HELPERS
// ============================================

const DAY_LABELS: Record<string, string> = {
  sunday: 'Domingo',
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
}

const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** Gera lista de horários de 30 em 30 min entre start e end (inclusive) */
function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let total = sh * 60 + sm
  const endTotal = eh * 60 + em
  while (total <= endTotal) {
    const h = Math.floor(total / 60).toString().padStart(2, '0')
    const m = (total % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    total += 30
  }
  return slots
}

/** Compara dois horários HH:MM, retorna true se a < b */
function timeLt(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return ah * 60 + am < bh * 60 + bm
}

// ============================================
// TIPOS INTERNOS
// ============================================

interface DaySchedule {
  day: string
  isActive: boolean
  start: string
  end: string
  businessOpen: string
  businessClose: string
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function ProfissionalPainelEstabelecimento() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'horario'>('dashboard')

  const [business, setBusiness] = useState<Business | null>(null)
  const [link, setLink] = useState<ProfessionalLink | null>(null)
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)

  // Carregar dados
  useEffect(() => {
    async function load() {
      if (!user || !businessId) return
      setLoading(true)
      try {
        const [businessData, configsData, links] = await Promise.all([
          getBusinessById(businessId),
          getAllBusinessConfigs(businessId),
          getLinksByProfessional(user.uid),
        ])

        setBusiness(businessData)

        const myLink = links.find(l => l.businessId === businessId && l.status === 'active')
        setLink(myLink ?? null)

        // Montar schedule combinando horários do estabelecimento + horários salvos do profissional
        const businessHours: BusinessHours[] = configsData?.horarios?.businessHours ?? businessData?.businessHours ?? []
        const savedSchedule: WorkScheduleDay[] = myLink?.workSchedule ?? []

        const openDays = DAY_ORDER
          .map(day => businessHours.find(h => h.day === day))
          .filter((h): h is BusinessHours => !!h && h.isOpen)

        const built: DaySchedule[] = openDays.map(bh => {
          const saved = savedSchedule.find(s => s.day === bh.day)
          return {
            day: bh.day,
            isActive: saved?.isActive ?? false,
            start: saved?.start ?? bh.open,
            end: saved?.end ?? bh.close,
            businessOpen: bh.open,
            businessClose: bh.close,
          }
        })

        setSchedule(built)

        // Carregar agendamentos do profissional neste estabelecimento
        setAppointmentsLoading(true)
        try {
          const allAppointments = await getAppointmentsByProfessional(user.uid)
          setAppointments(allAppointments.filter(a => a.businessId === businessId))
        } catch (err) {
          console.error('Erro ao carregar agendamentos:', err)
        } finally {
          setAppointmentsLoading(false)
        }
      } catch (error) {
        console.error('Erro ao carregar painel:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, businessId])

  const toggleDay = (day: string) => {
    setSchedule(prev => prev.map(d => d.day === day ? { ...d, isActive: !d.isActive } : d))
  }

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setSchedule(prev => prev.map(d => {
      if (d.day !== day) return d
      const updated = { ...d, [field]: value }
      // Garantir que start < end
      if (field === 'start' && !timeLt(updated.start, updated.end)) {
        updated.end = updated.start
      }
      return updated
    }))
  }

  const handleSaveSchedule = async () => {
    if (!link) return
    setSaving(true)
    try {
      const workSchedule: WorkScheduleDay[] = schedule.map(d => ({
        day: d.day,
        start: d.start,
        end: d.end,
        isActive: d.isActive,
      }))
      await updateLinkDetails(link.id, { workSchedule })
      setLink(prev => prev ? { ...prev, workSchedule } : prev)
      setSaveMessage({ type: 'success', text: 'Horário salvo com sucesso!' })
    } catch {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <ProfissionalPageLayout title="Painel do Estabelecimento">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-400">Carregando painel...</span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  if (!link) {
    return (
      <ProfissionalPageLayout title="Painel do Estabelecimento">
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-white text-lg font-semibold">Vínculo não encontrado</p>
          <p className="text-gray-400 mt-2 mb-6">Você não possui um vínculo ativo com este estabelecimento.</p>
          <Button
            onClick={() => navigate('/profissional/associar-barbearia')}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Estabelecimentos
          </Button>
        </div>
      </ProfissionalPageLayout>
    )
  }

  return (
    <ProfissionalPageLayout
      title={business?.name ?? link.businessName}
      subtitle="Painel do profissional"
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Voltar */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/profissional/associar-barbearia')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Estabelecimentos
        </motion.button>

        {/* Feedback de save */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dashboard' | 'horario')} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8 bg-white/5 border border-white/10">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="horario" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Definir Horário
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB: DASHBOARD ===== */}
          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Cards de stats */}
              {(() => {
                const today = new Date().toISOString().split('T')[0]
                const agendamentosHoje = appointments.filter(a => a.date === today)
                const mesAtual = new Date().toISOString().slice(0, 7)
                const faturamentoMes = appointments
                  .filter(a => a.date.startsWith(mesAtual) && a.status !== 'cancelled')
                  .reduce((sum, a) => sum + a.servicePrice, 0)

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="bg-white/5 border-white/10 hover:border-emerald-500/30 transition-all">
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}>
                            <Calendar className="w-7 h-7 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Agendamentos Hoje</p>
                            <p className="text-3xl font-bold text-white">
                              {appointmentsLoading ? '...' : agendamentosHoje.length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <Card className="bg-white/5 border-white/10 hover:border-emerald-500/30 transition-all">
                        <CardContent className="p-6 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}>
                            <DollarSign className="w-7 h-7 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Faturamento do Mês</p>
                            <p className="text-3xl font-bold text-white">
                              {appointmentsLoading ? '...' : formatCurrency(faturamentoMes)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                )
              })()}

              {/* Lista de próximos agendamentos */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Próximos Agendamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointmentsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                      </div>
                    ) : appointments.length === 0 ? (
                      <div className="text-center py-10">
                        <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400 text-sm">Nenhum agendamento no momento</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                          >
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-white text-sm truncate">{appt.clientName}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  appt.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                                  appt.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                  appt.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {appt.status === 'confirmed' ? 'Confirmado' :
                                   appt.status === 'cancelled' ? 'Cancelado' :
                                   appt.status === 'completed' ? 'Concluído' : 'Pendente'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Scissors className="w-3 h-3" />
                                  {appt.serviceName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {appt.date.split('-').reverse().join('/')} às {appt.time}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-emerald-400">{formatCurrency(appt.servicePrice)}</p>
                              <p className="text-xs text-gray-500">{appt.serviceDuration} min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* ===== TAB: HORÁRIO ===== */}
          <TabsContent value="horario">
            <div className="space-y-4">
              <p className="text-sm text-gray-400 mb-6">
                Defina os dias e horários em que você estará disponível neste estabelecimento.
                Os horários devem estar dentro do funcionamento do estabelecimento.
              </p>

              {schedule.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">Nenhum horário de funcionamento configurado no estabelecimento.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {schedule.map((day, idx) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className={`border transition-all ${
                        day.isActive ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/5'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Toggle + nome do dia */}
                            <div className="flex items-center gap-3 min-w-[180px]">
                              <button
                                type="button"
                                onClick={() => toggleDay(day.day)}
                                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                                  day.isActive ? 'bg-emerald-500' : 'bg-white/20'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                  day.isActive ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                              </button>
                              <span className={`font-medium text-sm ${day.isActive ? 'text-white' : 'text-gray-500'}`}>
                                {DAY_LABELS[day.day]}
                              </span>
                            </div>

                            {/* Seletores de horário */}
                            {day.isActive ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">Das</span>
                                  <select
                                    value={day.start}
                                    onChange={(e) => updateDayTime(day.day, 'start', e.target.value)}
                                    className="h-9 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                  >
                                    {generateTimeSlots(day.businessOpen, day.businessClose).slice(0, -1).map(t => (
                                      <option key={t} value={t} className="bg-gray-900">{t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">às</span>
                                  <select
                                    value={day.end}
                                    onChange={(e) => updateDayTime(day.day, 'end', e.target.value)}
                                    className="h-9 px-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                                  >
                                    {generateTimeSlots(day.businessOpen, day.businessClose)
                                      .filter(t => timeLt(day.start, t))
                                      .map(t => (
                                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                                      ))}
                                  </select>
                                </div>
                                <span className="text-xs text-gray-500">
                                  (estab. {day.businessOpen} – {day.businessClose})
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600">Não disponível</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: schedule.length * 0.05 + 0.1 }}
                    className="pt-2"
                  >
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving ? 'Salvando...' : 'Salvar Horário'}
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProfissionalPageLayout>
  )
}
