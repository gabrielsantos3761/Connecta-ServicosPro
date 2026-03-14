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
// STYLES
// ============================================

const S = {
  bg: '#050400',
  gold: '#D4AF37',
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '1.125rem',
    padding: '1.5rem',
  },
  select: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
    padding: '0.5rem 0.75rem',
    outline: 'none',
  },
  goldBtn: {
    background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
    color: '#050400',
    fontWeight: 600,
    borderRadius: '0.5rem',
    padding: '0.625rem 1.5rem',
    border: 'none',
    cursor: 'pointer',
  },
  badge: (variant: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      confirmed: { bg: 'rgba(212,175,55,0.15)', color: '#D4AF37' },
      cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
      completed: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
      pending: { bg: 'rgba(234,179,8,0.15)', color: '#fde047' },
    }
    const c = map[variant] ?? map.pending
    return {
      background: c.bg,
      color: c.color,
      borderRadius: '9999px',
      padding: '2px 10px',
      fontSize: '0.75rem',
    }
  },
}

const SPRING = { type: 'spring', stiffness: 320, damping: 36 }

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 style={{ width: 32, height: 32, color: S.gold, animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Carregando painel...</span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  if (!link) {
    return (
      <ProfissionalPageLayout title="Painel do Estabelecimento">
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <Building2 style={{ width: 64, height: 64, margin: '0 auto 1rem', color: 'rgba(255,255,255,0.15)' }} />
          <p style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>
            Vínculo não encontrado
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Você não possui um vínculo ativo com este estabelecimento.
          </p>
          <button
            onClick={() => navigate('/profissional/associar-barbearia')}
            style={S.goldBtn}
          >
            <ArrowLeft style={{ width: 16, height: 16, display: 'inline', marginRight: '0.5rem' }} />
            Voltar aos Estabelecimentos
          </button>
        </div>
      </ProfissionalPageLayout>
    )
  }

  return (
    <ProfissionalPageLayout
      title={business?.name ?? link.businessName}
      subtitle="Painel do profissional"
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Voltar */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={SPRING}
          onClick={() => navigate('/profissional/associar-barbearia')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.5)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            padding: 0,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Voltar aos Estabelecimentos
        </motion.button>

        {/* Feedback de save */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              background: saveMessage.type === 'success'
                ? 'rgba(212,175,55,0.12)'
                : 'rgba(239,68,68,0.12)',
              color: saveMessage.type === 'success' ? S.gold : '#f87171',
              border: `1px solid ${saveMessage.type === 'success' ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {saveMessage.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: '2rem' }}>
          {/* Tab bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            gap: '0.25rem',
          }}>
            {(['dashboard', 'horario'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  background: activeTab === tab ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: activeTab === tab ? S.gold : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'dashboard' ? <Calendar style={{ width: 16, height: 16 }} /> : <Clock style={{ width: 16, height: 16 }} />}
                {tab === 'dashboard' ? 'Dashboard' : 'Definir Horário'}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TAB: DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Cards de stats */}
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const agendamentosHoje = appointments.filter(a => a.date === today)
              const mesAtual = new Date().toISOString().slice(0, 7)
              const faturamentoMes = appointments
                .filter(a => a.date.startsWith(mesAtual) && a.status !== 'cancelled')
                .reduce((sum, a) => sum + (a.professionalAmount ?? a.servicePrice), 0)

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING}
                    style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1rem' }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: '0.75rem', flexShrink: 0,
                      background: 'rgba(212,175,55,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Calendar style={{ width: 28, height: 28, color: S.gold }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        Agendamentos Hoje
                      </p>
                      <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif" }}>
                        {appointmentsLoading ? '...' : agendamentosHoje.length}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.08 }}
                    style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1rem' }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: '0.75rem', flexShrink: 0,
                      background: 'rgba(212,175,55,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <DollarSign style={{ width: 28, height: 28, color: S.gold }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        Faturamento do Mês
                      </p>
                      <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif" }}>
                        {appointmentsLoading ? '...' : formatCurrency(faturamentoMes)}
                      </p>
                    </div>
                  </motion.div>
                </div>
              )
            })()}

            {/* Lista de próximos agendamentos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.16 }}
              style={S.card}
            >
              <h3 style={{
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: "'Playfair Display', serif",
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                Próximos Agendamentos
              </h3>

              {appointmentsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0' }}>
                  <Loader2 style={{ width: 24, height: 24, color: S.gold, animation: 'spin 1s linear infinite' }} />
                </div>
              ) : appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                  <Calendar style={{ width: 48, height: 48, margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.1)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                    Nenhum agendamento no momento
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '0.5rem',
                        background: 'rgba(212,175,55,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Calendar style={{ width: 20, height: 20, color: S.gold }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                            {appt.clientName}
                          </p>
                          <span style={S.badge(appt.status)}>
                            {appt.status === 'confirmed' ? 'Confirmado' :
                             appt.status === 'cancelled' ? 'Cancelado' :
                             appt.status === 'completed' ? 'Concluído' : 'Pendente'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            <Scissors style={{ width: 12, height: 12 }} />
                            {appt.serviceName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            <Clock style={{ width: 12, height: 12 }} />
                            {appt.date.split('-').reverse().join('/')} às {appt.time}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {appt.paymentType === 'fixed'
                          ? <p style={{ fontSize: '0.875rem', fontWeight: 600, color: S.gold }}>Salário Fixo</p>
                          : <p style={{ fontSize: '0.875rem', fontWeight: 600, color: S.gold }}>{formatCurrency(appt.professionalAmount ?? appt.servicePrice)}</p>
                        }
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.125rem' }}>
                          {appt.serviceDuration} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ===== TAB: HORÁRIO ===== */}
        {activeTab === 'horario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Defina os dias e horários em que você estará disponível neste estabelecimento.
              Os horários devem estar dentro do funcionamento do estabelecimento.
            </p>

            {schedule.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Clock style={{ width: 48, height: 48, margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.1)' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Nenhum horário de funcionamento configurado no estabelecimento.
                </p>
              </div>
            ) : (
              <>
                {schedule.map((day, idx) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: idx * 0.05 }}
                    style={{
                      background: day.isActive ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                      border: day.isActive ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '1.125rem',
                      padding: '1rem 1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                      {/* Toggle + nome do dia */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 180 }}>
                        <button
                          type="button"
                          onClick={() => toggleDay(day.day)}
                          style={{
                            position: 'relative',
                            width: 48, height: 24,
                            borderRadius: '9999px',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                            background: day.isActive ? S.gold : 'rgba(255,255,255,0.15)',
                            transition: 'background 0.2s',
                          }}
                        >
                          <span style={{
                            position: 'absolute',
                            top: 2, left: day.isActive ? 26 : 2,
                            width: 20, height: 20,
                            background: '#fff',
                            borderRadius: '9999px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                            transition: 'left 0.2s',
                          }} />
                        </button>
                        <span style={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: day.isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                        }}>
                          {DAY_LABELS[day.day]}
                        </span>
                      </div>

                      {/* Seletores de horário */}
                      {day.isActive ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Das</span>
                            <select
                              value={day.start}
                              onChange={(e) => updateDayTime(day.day, 'start', e.target.value)}
                              style={{ ...S.select, cursor: 'pointer' }}
                            >
                              {generateTimeSlots(day.businessOpen, day.businessClose).slice(0, -1).map(t => (
                                <option key={t} value={t} style={{ background: '#050400' }}>{t}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>às</span>
                            <select
                              value={day.end}
                              onChange={(e) => updateDayTime(day.day, 'end', e.target.value)}
                              style={{ ...S.select, cursor: 'pointer' }}
                            >
                              {generateTimeSlots(day.businessOpen, day.businessClose)
                                .filter(t => timeLt(day.start, t))
                                .map(t => (
                                  <option key={t} value={t} style={{ background: '#050400' }}>{t}</option>
                                ))}
                            </select>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>
                            (estab. {day.businessOpen} – {day.businessClose})
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>
                          Não disponível
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: schedule.length * 0.05 + 0.1 }}
                  style={{ paddingTop: '0.5rem' }}
                >
                  <button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    style={{
                      ...S.goldBtn,
                      width: '100%',
                      height: '3rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontSize: '1rem',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? (
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Save style={{ width: 16, height: 16 }} />
                    )}
                    {saving ? 'Salvando...' : 'Salvar Horário'}
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>
    </ProfissionalPageLayout>
  )
}
