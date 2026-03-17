import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, CheckCircle, Loader2, ChevronLeft, ChevronRight, User, Scissors } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  getAppointmentsByProfessional,
  type Appointment,
  type AppointmentStatus,
} from '@/services/appointmentService'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useToast } from '@/hooks/use-toast'

// ─── Design tokens ─────────────────────────────────────────────────────────
const teal = '#4db8c7'
const teal2 = '#1a333a'
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }
const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }

type TabKey = 'today' | 'week' | 'upcoming'

function statusStyle(s: AppointmentStatus) {
  if (s === 'confirmed') return { label: 'Confirmado', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' }
  if (s === 'pending')   return { label: 'Pendente',   bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
  if (s === 'completed') return { label: 'Concluído',  bg: 'rgba(129,140,248,0.12)', color: '#818cf8' }
  return                        { label: 'Cancelado',  bg: 'rgba(248,113,113,0.12)', color: '#f87171' }
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

export function ProfissionalAgenda() {
  const { user } = useAuth()
  const { businessId } = useParams<{ businessId: string }>()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('today')
  const [confirming, setConfirming] = useState<string | null>(null)
  const [offsetDays, setOffsetDays] = useState(0) // for "today" navigation

  useEffect(() => {
    if (!user?.id) return
    getAppointmentsByProfessional(user.id)
      .then(data => setAppointments(
        businessId ? data.filter(a => a.businessId === businessId) : data
      ))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id, businessId])

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const targetDay = useMemo(() => {
    const d = new Date(today); d.setDate(d.getDate() + offsetDays); return d
  }, [today, offsetDays])

  const targetDayStr = toDateStr(targetDay)

  const weekStart = useMemo(() => {
    const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return d
  }, [today])
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 6); return d
  }, [weekStart])

  const filtered = useMemo(() => {
    if (tab === 'today') return appointments.filter(a => a.date === targetDayStr)
    if (tab === 'week') return appointments.filter(a => a.date >= toDateStr(weekStart) && a.date <= toDateStr(weekEnd))
    return appointments.filter(a => a.date > toDateStr(today))
  }, [appointments, tab, targetDayStr, weekStart, weekEnd, today])

  const sortedFiltered = useMemo(() =>
    [...filtered].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  , [filtered])

  const todayCount = appointments.filter(a => a.date === toDateStr(today)).length
  const weekCount = appointments.filter(a => a.date >= toDateStr(weekStart) && a.date <= toDateStr(weekEnd)).length
  const upcomingCount = appointments.filter(a => a.date > toDateStr(today)).length

  const handleConfirm = async (apt: Appointment) => {
    setConfirming(apt.id)
    try {
      await updateDoc(doc(db, 'appointments', apt.id), {
        status: 'confirmed',
        updatedAt: serverTimestamp(),
      })
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'confirmed' } : a))
      toast({ title: 'Agendamento confirmado', description: `${apt.serviceName} com ${apt.clientName}.` })
    } catch {
      toast({ title: 'Erro ao confirmar', variant: 'destructive' })
    } finally {
      setConfirming(null)
    }
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'today', label: 'Hoje', count: todayCount },
    { key: 'week', label: 'Esta Semana', count: weekCount },
    { key: 'upcoming', label: 'Próximos', count: upcomingCount },
  ]

  const dayLabel = useMemo(() => {
    if (offsetDays === 0) return 'Hoje'
    if (offsetDays === 1) return 'Amanhã'
    if (offsetDays === -1) return 'Ontem'
    return targetDay.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  }, [offsetDays, targetDay])

  return (
    <div style={{ minHeight: '100vh', background: '#050400' }}>
      {/* Grain */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '500px', height: '500px', background: `radial-gradient(circle, rgba(77,184,199,0.07) 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem' }}>
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <Calendar size={18} style={{ color: teal }} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Minha <span style={{ color: teal }}>Agenda</span>
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {businessId ? 'Agendamentos deste estabelecimento' : 'Todos os seus agendamentos'}
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.key)}
              style={{ padding: '0.5rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', background: tab === t.key ? `linear-gradient(135deg,${teal},${teal2})` : 'rgba(255,255,255,0.05)', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.5)' }}
            >
              {t.label}
              <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', padding: '0 6px', fontSize: '0.7rem' }}>{t.count}</span>
            </motion.button>
          ))}
        </div>

        {/* Day nav (only for 'today' tab) */}
        <AnimatePresence>
          {tab === 'today' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}
            >
              <button onClick={() => setOffsetDays(d => d - 1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', padding: '0.375rem', cursor: 'pointer', display: 'flex' }}>
                <ChevronLeft size={16} />
              </button>
              <p style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{dayLabel}</p>
              <button onClick={() => setOffsetDays(d => d + 1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', padding: '0.375rem', cursor: 'pointer', display: 'flex' }}>
                <ChevronRight size={16} />
              </button>
              {offsetDays !== 0 && (
                <button onClick={() => setOffsetDays(0)} style={{ background: `rgba(77,184,199,0.1)`, border: `1px solid rgba(77,184,199,0.25)`, borderRadius: '0.5rem', color: teal, padding: '0.375rem 0.625rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  Hoje
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '3rem', color: 'rgba(255,255,255,0.4)', justifyContent: 'center' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Carregando agenda...
          </div>
        ) : sortedFiltered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: '3rem', textAlign: 'center' }}>
            <Calendar size={36} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>Nenhum agendamento {tab === 'today' ? 'para este dia' : 'neste período'}.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedFiltered.map((apt, i) => {
              const st = statusStyle(apt.status)
              const canConfirm = apt.status === 'pending'
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: i * 0.05 }}
                  style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  {/* Time badge */}
                  <div style={{ background: `rgba(77,184,199,0.1)`, border: `1px solid rgba(77,184,199,0.2)`, borderRadius: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'center', flexShrink: 0, minWidth: '4rem' }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: teal, margin: 0, lineHeight: 1 }}>{apt.time}</p>
                    {tab !== 'today' && <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: '0.2rem 0 0' }}>{apt.date.slice(5)}</p>}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{apt.serviceName}</p>
                      <span style={{ ...st, background: st.bg, borderRadius: '9999px', padding: '1px 8px', fontSize: '0.65rem', fontWeight: 600 }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                        <User size={11} /> {apt.clientName}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                        <Clock size={11} /> {apt.serviceDuration}min
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                        <Scissors size={11} /> {formatCurrency(apt.servicePrice)}
                      </span>
                    </div>
                  </div>

                  {/* Confirm button */}
                  {canConfirm && (
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleConfirm(apt)}
                      disabled={confirming === apt.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: `rgba(77,184,199,0.15)`, border: `1px solid rgba(77,184,199,0.3)`, borderRadius: '0.5rem', color: teal, fontSize: '0.78rem', fontWeight: 600, cursor: confirming === apt.id ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                    >
                      {confirming === apt.id
                        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        : <CheckCircle size={13} />}
                      Confirmar
                    </motion.button>
                  )}
                  {apt.status === 'confirmed' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#22c55e', flexShrink: 0 }}>
                      <CheckCircle size={13} /> Confirmado
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
