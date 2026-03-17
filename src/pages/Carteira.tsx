import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Wallet, TrendingUp, Calendar, Scissors, Loader2, BarChart2, Store, TrendingDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  getAppointmentsByClient,
  getAppointmentsByProfessional,
  type Appointment,
} from '@/services/appointmentService'

const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }
const gold = '#D4AF37'
const teal = '#4db8c7'

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Carteira() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const role = user?.activeRole ?? 'client'
  const accent = role === 'professional' ? teal : gold
  // For professional: earnings. For client/owner: spending.
  const isProfessional = role === 'professional'

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)

    const fetch = isProfessional
      ? getAppointmentsByProfessional(user.id, new Date(0))
      : getAppointmentsByClient(user.id)

    fetch
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id, isProfessional])

  const completed = useMemo(
    () => appointments.filter(a => a.status === 'completed'),
    [appointments]
  )

  const getAmount = (apt: Appointment) =>
    isProfessional ? (apt.professionalAmount ?? apt.servicePrice) : apt.servicePrice

  // KPIs
  const totalAmount = useMemo(
    () => completed.reduce((sum, a) => sum + getAmount(a), 0),
    [completed]
  )

  const thisMonth = useMemo(() => {
    const now = new Date()
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return completed
      .filter(a => a.date.startsWith(prefix))
      .reduce((sum, a) => sum + getAmount(a), 0)
  }, [completed])

  const favoriteService = useMemo(() => {
    if (completed.length === 0) return '—'
    const count = new Map<string, number>()
    for (const a of completed) count.set(a.serviceName, (count.get(a.serviceName) ?? 0) + 1)
    let max = 0; let name = '—'
    for (const [k, v] of count) { if (v > max) { max = v; name = k } }
    return name
  }, [completed])

  // Chart: last 6 months
  const chartData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const value = completed.filter(a => a.date.startsWith(key)).reduce((sum, a) => sum + getAmount(a), 0)
      return { label: MONTH_SHORT[d.getMonth()], key, value }
    })
  }, [completed])

  const chartMax = useMemo(() => Math.max(...chartData.map(m => m.value), 1), [chartData])

  const recentTransactions = useMemo(
    () => [...completed].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 10),
    [completed]
  )

  const kpis = [
    {
      icon: isProfessional ? TrendingUp : TrendingDown,
      label: isProfessional ? 'Total recebido' : 'Total investido',
      value: formatCurrency(totalAmount),
      sub: isProfessional ? 'em atendimentos concluídos' : 'em serviços concluídos',
      highlight: true,
    },
    {
      icon: Calendar,
      label: 'Este mês',
      value: formatCurrency(thisMonth),
      sub: 'mês corrente',
      highlight: false,
    },
    {
      icon: Scissors,
      label: isProfessional ? 'Serviço mais realizado' : 'Serviço favorito',
      value: favoriteService,
      sub: isProfessional ? 'mais atendido' : 'mais agendado',
      highlight: false,
      isText: true,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#050400', overflowX: 'hidden' }}>
      {/* Grain */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.025'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '0 1.25rem 4rem' }}>
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={spring} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem 0 0.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '0.625rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Wallet size={22} color={accent} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 400, fontFamily: "'Playfair Display', serif", color: '#fff', letterSpacing: '-0.01em' }}>
                Carteira
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                {isProfessional ? 'Seus ganhos por atendimentos' : role === 'owner' ? 'Seus gastos pessoais como cliente' : 'Seus gastos em serviços'}
              </p>
            </div>
          </div>
        </motion.header>

        {/* Banner for owner: link to business financeiro */}
        {role === 'owner' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}
            style={{ ...cardBase, padding: '0.875rem 1.125rem', marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer', borderColor: 'rgba(212,175,55,0.2)' }}
            onClick={() => { const bid = localStorage.getItem('selected_business_id'); navigate(bid ? `/${bid}/dashboard/financeiro` : '/selecionar-empresa') }}
          >
            <Store size={16} color={gold} />
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', flex: 1 }}>
              Ver receitas do estabelecimento no painel financeiro
            </p>
            <span style={{ fontSize: '0.75rem', color: gold }}>→</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={24} />
              </motion.div>
              <span style={{ fontSize: '0.9375rem' }}>Carregando carteira…</span>
            </motion.div>
          )}

          {!loading && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingTop: '1.5rem' }}>

              {/* KPI Cards */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {kpis.map((kpi, i) => (
                  <div key={i} style={{ ...cardBase, padding: '1.25rem', borderColor: kpi.highlight ? `${accent}30` : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <kpi.icon size={15} color={accent} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {kpi.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: kpi.isText ? '1rem' : '1.625rem', fontWeight: 700, fontFamily: "'Playfair Display', serif", color: kpi.highlight ? accent : '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: kpi.isText ? 'normal' : 'nowrap' }}>
                      {kpi.value}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{kpi.sub}</p>
                  </div>
                ))}
              </motion.div>

              {/* Bar Chart */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }} style={{ ...cardBase, padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <BarChart2 size={16} color={accent} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.02em' }}>
                    {isProfessional ? 'Ganhos nos últimos 6 meses' : 'Gastos nos últimos 6 meses'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem', height: 120, paddingBottom: '2.5rem', position: 'relative' }}>
                  {[0.25, 0.5, 0.75, 1].map(ratio => (
                    <div key={ratio} aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: `calc(2.5rem + ${ratio * 100}px)`, borderTop: '1px dashed rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                  ))}
                  {chartData.map((m, i) => {
                    const heightPx = chartMax > 0 ? Math.max((m.value / chartMax) * 100, m.value > 0 ? 4 : 0) : 0
                    return (
                      <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', position: 'relative' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: heightPx }}
                          transition={{ ...spring, delay: 0.15 + i * 0.06 }}
                          style={{ width: '100%', borderRadius: '0.375rem 0.375rem 0 0', background: heightPx > 0 ? `linear-gradient(180deg, ${accent} 0%, ${accent}99 100%)` : 'rgba(255,255,255,0.05)', minHeight: 3, alignSelf: 'flex-end' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
                          <p style={{ margin: 0, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{m.label}</p>
                          {m.value > 0 && <p style={{ margin: 0, fontSize: '0.6rem', color: accent, fontWeight: 600 }}>{m.value >= 1000 ? `R$${(m.value / 1000).toFixed(1)}k` : `R$${m.value.toFixed(0)}`}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Recent transactions */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}>
                <p style={{ margin: '0 0 0.875rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  Transações recentes
                </p>
                {recentTransactions.length === 0 ? (
                  <div style={{ ...cardBase, padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                    Nenhuma transação concluída ainda
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {recentTransactions.map((apt, i) => {
                      const [year, month, day] = apt.date.split('-')
                      const amount = getAmount(apt)
                      return (
                        <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.18 + i * 0.04 }} style={{ ...cardBase, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Scissors size={15} color={accent} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {apt.serviceName}
                            </p>
                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                              {isProfessional ? apt.clientName : apt.businessName} · {day}/{month}/{year}
                            </p>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: isProfessional ? '#22c55e' : '#f87171', fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
                            {isProfessional ? '+' : '-'}{formatCurrency(amount)}
                          </p>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');`}</style>
    </div>
  )
}
