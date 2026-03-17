import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, Clock, Loader2, Scissors, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { getAppointmentsByClient, type Appointment, type AppointmentStatus } from '@/services/appointmentService'
import { AppointmentDetailModal } from '@/components/calendar/AppointmentDetailModal'

// ─── Design tokens ─────────────────────────────────────────────────────────
const gold = '#D4AF37'
const gold2 = '#B8941E'
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }
const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled'

function statusStyle(s: AppointmentStatus): { label: string; bg: string; color: string } {
  if (s === 'confirmed') return { label: 'Confirmado', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' }
  if (s === 'pending')   return { label: 'Pendente',   bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
  if (s === 'completed') return { label: 'Concluído',  bg: 'rgba(129,140,248,0.12)', color: '#818cf8' }
  return                        { label: 'Cancelado',  bg: 'rgba(248,113,113,0.12)', color: '#f87171' }
}

function toCalendarAppointment(apt: Appointment) {
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
    paymentMethod: apt.paymentMethod as any,
  }
}

export function ClienteAgendamentos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Appointment | null>(null)

  useEffect(() => {
    if (!user?.id) return
    getAppointmentsByClient(user.id)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }, [])

  const filtered = useMemo(() => {
    let list = appointments
    if (tab === 'upcoming') list = list.filter(a => a.date >= today && (a.status === 'pending' || a.status === 'confirmed'))
    else if (tab === 'completed') list = list.filter(a => a.status === 'completed')
    else if (tab === 'cancelled') list = list.filter(a => a.status === 'cancelled')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.serviceName.toLowerCase().includes(q) ||
        (a.professionalName ?? '').toLowerCase().includes(q) ||
        a.businessName.toLowerCase().includes(q)
      )
    }
    return list
  }, [appointments, tab, today, search])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: appointments.length },
    { key: 'upcoming', label: 'Próximos', count: appointments.filter(a => a.date >= today && (a.status === 'pending' || a.status === 'confirmed')).length },
    { key: 'completed', label: 'Concluídos', count: appointments.filter(a => a.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelados', count: appointments.filter(a => a.status === 'cancelled').length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#050400' }}>
      {/* Grain */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(5,4,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: '4rem', gap: '1rem' }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cliente')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.25rem 0' }}
          >
            <ArrowLeft size={16} /> Voltar
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Meus Agendamentos</h1>
          </div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar serviço, profissional ou estabelecimento..."
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '0.75rem', color: '#fff', padding: '0.75rem 1rem 0.75rem 2.25rem', fontSize: '0.875rem', outline: 'none' }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                background: tab === t.key ? `linear-gradient(135deg,${gold},${gold2})` : 'rgba(255,255,255,0.05)',
                color: tab === t.key ? '#050400' : 'rgba(255,255,255,0.6)',
              }}
            >
              {t.label}
              <span style={{ background: tab === t.key ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', borderRadius: '9999px', padding: '0 6px', fontSize: '0.7rem' }}>
                {t.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '4rem 0', color: 'rgba(255,255,255,0.4)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Carregando agendamentos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            style={{ ...card, padding: '3rem', textAlign: 'center' }}
          >
            <Calendar size={40} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {tab === 'all' ? 'Nenhum agendamento ainda' : `Nenhum agendamento ${tabs.find(t => t.key === tab)?.label.toLowerCase()}`}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/')}
              style={{ padding: '0.75rem 2rem', background: `linear-gradient(135deg,${gold},${gold2})`, border: 'none', borderRadius: '0.75rem', color: '#000', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              Agendar Agora
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((apt, i) => {
              const st = statusStyle(apt.status)
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelected(apt)}
                  style={{ ...card, padding: '1.25rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  {/* Icon */}
                  <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scissors size={18} style={{ color: gold }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{apt.serviceName}</h3>
                      <span style={{ background: st.bg, color: st.color, fontSize: '0.65rem', padding: '1px 8px', borderRadius: '9999px', fontWeight: 600, flexShrink: 0 }}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {apt.businessName} · {apt.professionalName || 'Profissional'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        <Calendar size={11} /> {apt.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        <Clock size={11} /> {apt.time} · {apt.serviceDuration}min
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: gold, margin: 0 }}>{formatCurrency(apt.servicePrice)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <AppointmentDetailModal
            appointment={toCalendarAppointment(selected)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
