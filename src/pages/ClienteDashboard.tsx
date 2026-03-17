import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Clock, Scissors, LogOut, User,
  Heart, Wallet, History, ChevronRight, Loader2, MapPin,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { getAppointmentsByClient, type Appointment } from '@/services/appointmentService'
import { AppointmentDetailModal } from '@/components/calendar/AppointmentDetailModal'

const GOLD = '#D4AF37'
const GOLD_DARK = '#B8941E'
const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
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

function statusStyle(s: string) {
  if (s === 'confirmed') return { label: 'Confirmado', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' }
  if (s === 'pending')   return { label: 'Pendente',   bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
  if (s === 'completed') return { label: 'Concluído',  bg: 'rgba(129,140,248,0.12)', color: '#818cf8' }
  return                        { label: 'Cancelado',  bg: 'rgba(248,113,113,0.12)', color: '#f87171' }
}

export function ClienteDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appointment | null>(null)

  useEffect(() => {
    if (!user?.id) return
    getAppointmentsByClient(user.id)
      .then(data => setAppointments(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }, [])

  const nextAppointment = useMemo(() =>
    [...appointments]
      .filter(a => a.date >= today && (a.status === 'pending' || a.status === 'confirmed'))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0] ?? null
  , [appointments, today])

  const upcomingCount = useMemo(() =>
    appointments.filter(a => a.date >= today && (a.status === 'pending' || a.status === 'confirmed')).length
  , [appointments, today])

  const completedCount = useMemo(() =>
    appointments.filter(a => a.status === 'completed').length
  , [appointments])

  const totalInvested = useMemo(() =>
    appointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.servicePrice, 0)
  , [appointments])

  const quickLinks = [
    { icon: Calendar,  label: 'Agendar',       sub: 'Novo serviço',        path: '/',                    primary: true  },
    { icon: Scissors,  label: 'Agendamentos',   sub: `${upcomingCount} próximos`, path: '/cliente/agendamentos', primary: false },
    { icon: Heart,     label: 'Favoritos',      sub: 'Estabelecimentos',    path: '/favoritos',           primary: false },
    { icon: Wallet,    label: 'Carteira',       sub: formatCurrency(totalInvested), path: '/carteira',    primary: false },
    { icon: History,   label: 'Histórico',      sub: `${completedCount} realizados`, path: '/historico', primary: false },
    { icon: User,      label: 'Perfil',         sub: 'Minha conta',         path: '/perfil',              primary: false },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#050400' }}>
      {/* Grain */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}
        style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,4,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/assets/images/Logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif" }}>Connecta</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.625rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <LogOut size={13} /> Sair
          </motion.button>
        </div>
      </motion.header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '1.75rem 1.5rem 4rem' }}>

        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }} style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>Bem-vindo de volta</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.15 }}>
            Olá, {user?.name?.split(' ')[0]}!
          </h2>
        </motion.div>

        {/* Next appointment card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }} style={{ ...card, borderColor: 'rgba(212,175,55,0.2)', borderLeft: `3px solid ${GOLD}`, padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={15} color={GOLD} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Próximo agendamento</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'rgba(255,255,255,0.35)', padding: '0.5rem 0' }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.875rem' }}>Carregando...</span>
            </div>
          ) : !nextAppointment ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', margin: 0 }}>Nenhum agendamento próximo.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/')}
                style={{ padding: '0.5rem 1.25rem', background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`, border: 'none', borderRadius: '0.625rem', color: '#000', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                Agendar agora
              </motion.button>
            </div>
          ) : (() => {
            const st = statusStyle(nextAppointment.status)
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.375rem' }}>
                      {nextAppointment.serviceName}
                    </h3>
                    <span style={{ background: st.bg, color: st.color, fontSize: '0.65rem', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '0.75rem', padding: '0.5rem 0.875rem', textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.375rem', fontWeight: 700, color: GOLD, margin: 0, lineHeight: 1 }}>{nextAppointment.time}</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0 0' }}>
                      {nextAppointment.date.split('-').reverse().join('/')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                    <User size={13} /> {nextAppointment.professionalName || 'Profissional'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                    <MapPin size={13} /> {nextAppointment.businessName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                    <Clock size={13} /> {nextAppointment.serviceDuration}min
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: GOLD }}>
                    {formatCurrency(nextAppointment.servicePrice)}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(nextAppointment)}
                  style={{ marginTop: '0.875rem', width: '100%', padding: '0.625rem', background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '0.625rem', color: GOLD, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Ver detalhes
                </motion.button>
              </div>
            )
          })()}
        </motion.div>

        {/* Quick links grid */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.18 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 0.875rem' }}>
            Navegação
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {quickLinks.map((link, i) => (
              <motion.button
                key={link.path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(link.path)}
                style={{
                  ...card,
                  padding: '1.125rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  cursor: 'pointer', border: 'none', textAlign: 'left',
                  background: link.primary ? `linear-gradient(135deg, ${GOLD}22, ${GOLD_DARK}11)` : 'rgba(255,255,255,0.02)',
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: link.primary ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: link.primary ? `${GOLD}20` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <link.icon size={17} color={link.primary ? GOLD : 'rgba(255,255,255,0.5)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: link.primary ? GOLD : '#fff', lineHeight: 1.2 }}>{link.label}</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.sub}</p>
                </div>
                <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

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
