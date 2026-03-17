import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, Clock, Store, Scissors, DollarSign,
  Loader2, CalendarX, RefreshCw, User,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  getAppointmentsByClient,
  getAppointmentsByProfessional,
  type Appointment,
  type AppointmentStatus,
} from '@/services/appointmentService'
import { AppointmentDetailModal } from '@/components/calendar/AppointmentDetailModal'
import type { Appointment as AppointmentUI } from '@/types'

const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }
const gold = '#D4AF37'
const teal = '#4db8c7'

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

type FilterKey = 'all' | 'completed' | 'cancelled' | 'pending'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'completed', label: 'Concluídos' },
  { key: 'cancelled', label: 'Cancelados' },
]

function statusBadge(status: AppointmentStatus): { label: string; style: React.CSSProperties } {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmado', style: { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' } }
    case 'pending':
      return { label: 'Pendente', style: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' } }
    case 'completed':
      return { label: 'Concluído', style: { background: 'rgba(129,140,248,0.12)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.2)' } }
    case 'cancelled':
      return { label: 'Cancelado', style: { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' } }
  }
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function monthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

export default function Historico() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selected, setSelected] = useState<Appointment | null>(null)

  const role = user?.activeRole ?? 'client'
  const accent = role === 'professional' ? teal : gold

  // Page labels by role
  const pageTitle = role === 'professional' ? 'Histórico de Atendimentos' : 'Histórico'
  const pageSubtitle =
    role === 'professional'
      ? 'Todos os atendimentos realizados'
      : role === 'owner'
      ? 'Seus agendamentos pessoais como cliente'
      : 'Seus agendamentos'

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)

    const fetch =
      role === 'professional'
        // pass epoch so we get all historical appointments, not just future
        ? getAppointmentsByProfessional(user.id, new Date(0))
        : getAppointmentsByClient(user.id)

    fetch
      .then(data => setAppointments(data.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id, role])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return appointments
    if (activeFilter === 'pending') return appointments.filter(a => a.status === 'pending' || a.status === 'confirmed')
    return appointments.filter(a => a.status === activeFilter)
  }, [appointments, activeFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const apt of filtered) {
      const key = apt.date.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(apt)
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  return (
    <div style={{ minHeight: '100vh', background: '#050400', overflowX: 'hidden' }}>
      {/* Grain */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(5,4,0,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.25rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 400, fontFamily: "'Playfair Display', serif", color: '#fff' }}>
              {pageTitle}
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '1.5rem 1.25rem 4rem' }}>

        {/* Banner for owner: link to business dashboard */}
        {role === 'owner' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            style={{ ...cardBase, padding: '0.875rem 1.125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', borderColor: 'rgba(212,175,55,0.2)' }}
            onClick={() => {
              const bid = localStorage.getItem('selected_business_id')
              navigate(bid ? `/${bid}/dashboard/agendamentos` : '/selecionar-empresa')
            }}
          >
            <Store size={16} color={gold} />
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', flex: 1 }}>
              Ver agendamentos do estabelecimento
            </p>
            <span style={{ fontSize: '0.75rem', color: gold }}>→</span>
          </motion.div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '1.75rem', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '0.5rem 1.125rem', borderRadius: '2rem', border: '1px solid',
                borderColor: activeFilter === f.key ? accent : 'rgba(255,255,255,0.1)',
                background: activeFilter === f.key ? `${accent}20` : 'transparent',
                color: activeFilter === f.key ? accent : 'rgba(255,255,255,0.5)',
                fontWeight: activeFilter === f.key ? 600 : 400, fontSize: '0.8125rem',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={22} />
              </motion.div>
              <span style={{ fontSize: '0.9375rem' }}>Carregando histórico…</span>
            </motion.div>
          )}

          {!loading && grouped.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minHeight: '40vh', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarX size={28} color={accent} />
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.9375rem' }}>
                Nenhum agendamento encontrado
              </p>
              {role === 'client' && (
                <button onClick={() => navigate('/')} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', background: `linear-gradient(135deg, #B8941E, ${gold})`, color: '#050400', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Agendar agora
                </button>
              )}
            </motion.div>
          )}

          {!loading && grouped.length > 0 && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {grouped.map(([monthKey, apts]) => (
                <section key={monthKey}>
                  <p style={{ margin: '0 0 0.875rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                    {monthLabel(monthKey)}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {apts.map((apt, i) => {
                      const badge = statusBadge(apt.status)
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring, delay: i * 0.04 }}
                          onClick={() => setSelected(apt)}
                          style={{ ...cardBase, padding: '1rem 1.125rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Scissors size={18} color={accent} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#fff', fontFamily: "'Playfair Display', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {apt.serviceName}
                              </p>
                              <span style={{ ...badge.style, padding: '0.25rem 0.625rem', borderRadius: '2rem', fontSize: '0.6875rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                {badge.label}
                              </span>
                            </div>
                            <div style={{ marginTop: '0.375rem', display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
                              {/* client sees professional; professional sees client */}
                              {role === 'professional' ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                                  <User size={12} /> {apt.clientName}
                                </span>
                              ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                                  <Store size={12} /> {apt.businessName}
                                </span>
                              )}
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                                <Clock size={12} /> {apt.date.split('-').reverse().join('/')} · {apt.time}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: accent, fontWeight: 600 }}>
                                <DollarSign size={12} />
                                {role === 'professional'
                                  ? formatCurrency(apt.professionalAmount ?? apt.servicePrice)
                                  : formatCurrency(apt.servicePrice)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  {role === 'client' && (
                    <button onClick={() => navigate('/')} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <RefreshCw size={13} /> Agendar novamente
                    </button>
                  )}
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AppointmentDetailModal appointment={selected as unknown as AppointmentUI | null} onClose={() => setSelected(null)} />

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
    </div>
  )
}
