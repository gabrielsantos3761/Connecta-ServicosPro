import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, DollarSign, Users, Clock, TrendingUp,
  Scissors, AlertCircle, ArrowRight, RefreshCw,
  CalendarX, UserX, Award, Zap, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import { getAppointmentsByBusiness, type Appointment, type AppointmentStatus } from '@/services/appointmentService'
import { formatCurrency, formatDate } from '@/lib/utils'
import { theme, CARD, ACCENT, STATUS_CFG as _STATUS_CFG } from '@/styles/theme'

// ─── SVG Primitives ───────────────────────────────────────────────────────────

function Sparkline({
  data, color, id, className = '',
}: { data: number[]; color: string; id: string; className?: string }) {
  if (data.length < 2) return <div className={className} />
  const W = 200; const H = 44
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 6 - (v / max) * (H - 14),
  }))
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `M0,${H} ${pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${W},${H} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="3" fill={color} />
    </svg>
  )
}

function DonutChart({
  segments, total, centerValue, centerLabel,
}: {
  segments: Array<{ value: number; color: string }>
  total: number; centerValue: string; centerLabel: string
}) {
  const r = 48; const cx = 64; const cy = 64
  const circ = 2 * Math.PI * r
  const gap = 3
  let cum = 0
  const segs = segments.map(s => {
    const pct = total > 0 ? s.value / total : 0
    const len = Math.max(0, pct * circ - (s.value > 0 ? gap : 0))
    const off = cum; cum += pct * circ
    return { ...s, len, off }
  })
  return (
    <svg viewBox="0 0 128 128" className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="13" />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segs.map((s, i) => (
          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="13" strokeLinecap="butt"
            strokeDasharray={`${s.len} ${circ}`} strokeDashoffset={-s.off}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${s.len} ${circ}` }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
          />
        ))}
      </g>
      <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="18"
        fontWeight="800" fontFamily="system-ui, sans-serif">{centerValue}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize="8.5" fontFamily="system-ui, sans-serif">{centerLabel}</text>
    </svg>
  )
}

function AreaChart({
  data, color, id,
}: { data: Array<{ y: number }>; color: string; id: string }) {
  const W = 400; const H = 88; const pad = 8
  const max = Math.max(...data.map(d => d.y), 1)
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * (W - pad * 2) + pad,
    y: pad + (1 - d.y / max) * (H - pad * 2),
  }))
  const lineD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`
    const prev = pts[i - 1]
    const cpx = ((prev.x + p.x) / 2).toFixed(1)
    return `${acc} C${cpx},${prev.y.toFixed(1)} ${cpx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }, '')
  const last = pts[pts.length - 1]; const first = pts[0]
  const areaD = `${lineD} L${last.x.toFixed(1)},${H} L${first.x.toFixed(1)},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={areaD} fill={`url(#${id})`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      <motion.path d={lineD} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, ease: 'easeOut' }} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.7" />)}
    </svg>
  )
}

function HourlyBars({
  data, currentHour,
}: { data: Array<{ hour: number; count: number }>; currentHour: number }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const H = 72
  return (
    <div className="flex items-end gap-[2px] w-full" style={{ height: H }}>
      {data.map((d, i) => {
        const barH = d.count > 0 ? Math.max(4, (d.count / max) * H) : 3
        const isCur = d.hour === currentHour
        const isPeak = d.count === max && max > 1
        const isEmpty = d.count === 0
        return (
          <div key={i} className="flex-1 flex flex-col justify-end h-full">
            <motion.div
              className={`w-full rounded-t-[3px] ${
                isCur   ? 'bg-gold'        :
                isPeak  ? 'bg-gold/55'     :
                isEmpty ? 'bg-white/[0.04]' : 'bg-white/20'
              }`}
              initial={{ height: 0 }} animate={{ height: barH }}
              transition={{ duration: 0.45, delay: i * 0.025, ease: 'easeOut' }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string; value: string; detail: string
  icon: ReactNode
  accent: typeof ACCENT[keyof typeof ACCENT]
  sparkData: number[]; sparkId: string
  badge?: string; badgePositive?: boolean
}

function KPICard({ label, value, detail, icon, accent, sparkData, sparkId, badge, badgePositive }: KPICardProps) {
  return (
    <div className={`${CARD} p-5 flex flex-col gap-3`}>
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${accent.hex}55, transparent 60%)` }} />
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.icon}`}>
          <span style={{ color: accent.hex, display: 'flex' }}>{icon}</span>
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            badgePositive === true  ? 'bg-emerald-500/15 text-emerald-400' :
            badgePositive === false ? 'bg-red-500/15 text-red-400' :
            'bg-white/[0.08] text-white/50'
          }`}>{badge}</span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1">{label}</p>
        <motion.p className="text-4xl font-black text-white tracking-tight leading-none"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {value}
        </motion.p>
      </div>
      <Sparkline data={sparkData} color={accent.hex} id={sparkId} className="h-11 w-full" />
      <p className="text-[11px] text-white/35 leading-relaxed">{detail}</p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.06] ${className}`} />
}

function DashboardSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`${CARD} p-5 space-y-3`}>
            <Pulse className="w-9 h-9" />
            <Pulse className="h-2.5 w-20" />
            <Pulse className="h-10 w-24" />
            <Pulse className="h-11 w-full" />
            <Pulse className="h-2.5 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className={`${CARD} p-5 space-y-4`}>
            <Pulse className="h-5 w-36" /><Pulse className="h-28 w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className={`${CARD} p-5 space-y-4`}>
            <Pulse className="h-5 w-28" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map(j => <Pulse key={j} className="h-10 w-full" />)}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = _STATUS_CFG as Record<AppointmentStatus, { label: string; textCls: string; bgCls: string; hex: string }>

function getRelativeTime(time: string): { label: string; urgent: boolean } {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const appt = new Date(); appt.setHours(h, m, 0, 0)
  const diff = Math.round((appt.getTime() - now.getTime()) / 60000)
  if (diff <= 0 && diff > -5) return { label: 'Agora', urgent: true }
  if (diff > 0 && diff <= 15)  return { label: `${diff}min`, urgent: true }
  if (diff > 15 && diff <= 60) return { label: `${diff}min`, urgent: false }
  return { label: '', urgent: false }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { businessId } = useParams<{ businessId: string }>()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(() => {
    if (!businessId) return
    setLoading(true); setError(null)
    let mounted = true
    getAppointmentsByBusiness(businessId)
      .then(d => { if (mounted) setAppointments(d) })
      .catch(() => { if (mounted) setError('Não foi possível carregar os dados. Verifique sua conexão.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [businessId])

  useEffect(() => { return fetchData() }, [fetchData])

  const todayStr = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }, [])

  const todayApts = useMemo(
    () => appointments.filter(a => a.date === todayStr),
    [appointments, todayStr],
  )

  const stats = useMemo(() => {
    const completed = todayApts.filter(a => a.status === 'completed')
    const confirmed = todayApts.filter(a => a.status === 'confirmed')
    const pending   = todayApts.filter(a => a.status === 'pending')
    const cancelled = todayApts.filter(a => a.status === 'cancelled')
    const revenue   = completed.reduce((s, a) => s + a.servicePrice, 0)
    const total     = todayApts.length
    return {
      total, revenue,
      completed: completed.length, confirmed: confirmed.length,
      pending: pending.length, cancelled: cancelled.length,
      rate: total > 0 ? Math.round((completed.length / total) * 100) : 0,
    }
  }, [todayApts])

  // Hourly buckets 8h–20h (13 slots)
  const hourly = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const hour = i + 8
      const appts = todayApts.filter(a => parseInt(a.time.split(':')[0]) === hour)
      const done  = appts.filter(a => a.status === 'completed')
      return {
        hour, label: `${hour}h`,
        count:   appts.length,
        revenue: done.reduce((s, a) => s + a.servicePrice, 0),
      }
    })
  }, [todayApts])

  const revenueByHour = useMemo(() => {
    let cum = 0
    return hourly.map(h => { cum += h.revenue; return { y: cum } })
  }, [hourly])

  const topProfs = useMemo(() => {
    const m = new Map<string, { name: string; count: number; revenue: number }>()
    todayApts.filter(a => a.status === 'completed').forEach(a => {
      const ex = m.get(a.professionalId) ?? { name: a.professionalName ?? a.professionalId, count: 0, revenue: 0 }
      m.set(a.professionalId, { ...ex, count: ex.count + 1, revenue: ex.revenue + a.servicePrice })
    })
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 4)
  }, [todayApts])

  const topSvcs = useMemo(() => {
    const m = new Map<string, { name: string; count: number; revenue: number }>()
    todayApts.filter(a => a.status === 'completed').forEach(a => {
      const ex = m.get(a.serviceId) ?? { name: a.serviceName, count: 0, revenue: 0 }
      m.set(a.serviceId, { ...ex, count: ex.count + 1, revenue: ex.revenue + a.servicePrice })
    })
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 4)
  }, [todayApts])

  const uniqueClients = useMemo(
    () => new Set(todayApts.map(a => a.clientId)).size,
    [todayApts],
  )

  const upcoming = useMemo(() => {
    const now = new Date()
    const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return todayApts
      .filter(a => a.time >= cur && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5)
  }, [todayApts])

  const peakHour = useMemo(() => {
    const peak = hourly.reduce((b, h) => h.count > b.count ? h : b, hourly[0])
    return peak?.count > 0 ? peak : null
  }, [hourly])

  const maxProfRev = topProfs[0]?.revenue ?? 1
  const maxSvcCnt  = topSvcs[0]?.count ?? 1

  const nowHour = useMemo(() => new Date().getHours(), [])
  const subtitle = useMemo(() => `Visão geral do dia — ${formatDate(new Date())}`, [])
  const title = 'Dashboard Geral'

  // Spark series for Clientes and Pendentes KPI cards (memoized to avoid inline re-computation)
  const sparkClients = useMemo(
    () => hourly.map(h =>
      new Set(todayApts.filter(a => parseInt(a.time.split(':')[0]) === h.hour).map(a => a.clientId)).size
    ),
    [hourly, todayApts],
  )

  const sparkPending = useMemo(
    () => hourly.map(h =>
      todayApts.filter(a => parseInt(a.time.split(':')[0]) === h.hour && a.status === 'pending').length
    ),
    [hourly, todayApts],
  )

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <OwnerPageLayout title={title} subtitle={subtitle}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-1">Falha ao carregar dados</p>
          <p className="text-white/40 text-sm max-w-xs">{error}</p>
        </div>
        <Button onClick={fetchData} variant="outline"
          className="border-white/10 text-white hover:bg-white/5 gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </motion.div>
    </OwnerPageLayout>
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <OwnerPageLayout title={title} subtitle={subtitle}>
      <DashboardSkeleton />
    </OwnerPageLayout>
  )

  // ── Content ────────────────────────────────────────────────────────────────
  return (
    <OwnerPageLayout title={title} subtitle={subtitle}>
      <motion.div variants={theme.animations.container} initial="hidden" animate="show" className="space-y-5">

        {/* ── Row 1: KPIs ───────────────────────────────────────────────────── */}
        <motion.div variants={theme.animations.item}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Agendamentos"
            value={String(stats.total)}
            detail={`${stats.completed} concluídos · ${stats.confirmed} confirmados`}
            icon={<Calendar className="w-4 h-4" />}
            accent={ACCENT.blue}
            sparkData={hourly.map(h => h.count)}
            sparkId="sp-apts"
            badge={`${stats.rate}% concluídos`}
            badgePositive={stats.rate >= 70 ? true : undefined}
          />
          <KPICard
            label="Receita"
            value={formatCurrency(stats.revenue)}
            detail={`De ${stats.completed} serviços finalizados`}
            icon={<DollarSign className="w-4 h-4" />}
            accent={ACCENT.emerald}
            sparkData={hourly.map(h => h.revenue)}
            sparkId="sp-rev"
            badge={stats.completed > 0 ? `Ø ${formatCurrency(stats.revenue / stats.completed)}` : undefined}
          />
          <KPICard
            label="Clientes"
            value={String(uniqueClients)}
            detail="Clientes únicos atendidos hoje"
            icon={<Users className="w-4 h-4" />}
            accent={ACCENT.violet}
            sparkData={sparkClients}
            sparkId="sp-clients"
            badge={stats.total > 0 ? `${stats.total} atend.` : undefined}
          />
          <KPICard
            label="Pendentes"
            value={String(stats.pending)}
            detail={`${stats.cancelled} cancelados · ${stats.confirmed} confirmados`}
            icon={<Clock className="w-4 h-4" />}
            accent={ACCENT.amber}
            sparkData={sparkPending}
            sparkId="sp-pend"
            badge={stats.cancelled > 0 ? `${stats.cancelled} cancelados` : undefined}
            badgePositive={stats.cancelled > 0 ? false : undefined}
          />
        </motion.div>

        {/* ── Row 2: Charts principais ───────────────────────────────────────── */}
        <motion.div variants={theme.animations.item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Revenue area chart */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">
                  Receita Acumulada Hoje
                </p>
                <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-white/30 mt-1">
                  {stats.completed} serviços · Ø {formatCurrency(stats.completed > 0 ? stats.revenue / stats.completed : 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="h-22" style={{ height: 88 }}>
              <AreaChart data={revenueByHour} color="#10b981" id="ac-rev" />
            </div>
            <div className="flex justify-between mt-2">
              {hourly.filter((_, i) => i % 3 === 0).map(h => (
                <span key={h.hour} className="text-[10px] text-white/20">{h.label}</span>
              ))}
            </div>
          </div>

          {/* Hourly bar chart */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">
                  Atendimentos por Hora
                </p>
                <p className="text-3xl font-black text-white tracking-tight">
                  {peakHour ? peakHour.label : '—'}
                </p>
                <p className="text-xs text-white/30 mt-1">
                  {peakHour ? `Horário de pico · ${peakHour.count} atendimento${peakHour.count !== 1 ? 's' : ''}` : 'Nenhum atendimento hoje'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-gold" />
              </div>
            </div>
            <HourlyBars data={hourly} currentHour={nowHour} />
            <div className="flex justify-between mt-2">
              {hourly.filter((_, i) => i % 3 === 0).map(h => (
                <span key={h.hour} className="text-[10px] text-white/20">{h.label}</span>
              ))}
            </div>
          </div>

        </motion.div>

        {/* ── Row 3: Status + Rankings ────────────────────────────────────────── */}
        <motion.div variants={theme.animations.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Status donut */}
          <div className={`${CARD} p-5`}>
            <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-4">
              Distribuição por Status
            </p>
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 shrink-0">
                <DonutChart
                  segments={[
                    { value: stats.completed, color: '#3b82f6' },
                    { value: stats.confirmed, color: '#10b981' },
                    { value: stats.pending,   color: '#f59e0b' },
                    { value: stats.cancelled, color: '#ef4444' },
                  ]}
                  total={stats.total}
                  centerValue={`${stats.rate}%`}
                  centerLabel="conclusão"
                />
              </div>
              <div className="flex-1 space-y-2.5">
                {([
                  { label: 'Concluídos',  value: stats.completed, dot: 'bg-blue-400' },
                  { label: 'Confirmados', value: stats.confirmed, dot: 'bg-emerald-400' },
                  { label: 'Pendentes',   value: stats.pending,   dot: 'bg-amber-400' },
                  { label: 'Cancelados',  value: stats.cancelled, dot: 'bg-red-400' },
                ] as const).map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                      <span className="text-[11px] text-white/45">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-white">{item.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/45">Total</span>
                    <span className="text-[11px] font-bold text-white">{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional ranking */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Top Profissionais</p>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            {topProfs.length > 0 ? (
              <div className="space-y-4">
                {topProfs.map((p, i) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          i === 0 ? 'bg-gold text-black' : 'bg-white/[0.07] text-white/50'
                        }`}>{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-none">{p.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{p.count} atend.</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white/75">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${i === 0 ? 'bg-gold' : 'bg-white/25'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.revenue / maxProfRev) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-7 gap-2.5">
                <UserX className="w-7 h-7 text-white/15" />
                <p className="text-xs text-white/25 text-center">Nenhum atendimento<br />concluído hoje</p>
              </div>
            )}
          </div>

          {/* Services ranking */}
          <div className={`${CARD} p-5`}>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest">Top Serviços</p>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            {topSvcs.length > 0 ? (
              <div className="space-y-4">
                {topSvcs.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          i === 0 ? 'bg-gold text-black' : 'bg-white/[0.07] text-white/50'
                        }`}>{i + 1}</div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-none truncate max-w-[110px]">{s.name}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">{s.count}× realizado</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white/75">{formatCurrency(s.revenue)}</span>
                    </div>
                    <div className="h-[3px] w-full rounded-full bg-white/[0.05] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${i === 0 ? 'bg-gold' : 'bg-white/25'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / maxSvcCnt) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-7 gap-2.5">
                <Scissors className="w-7 h-7 text-white/15" />
                <p className="text-xs text-white/25 text-center">Nenhum serviço<br />concluído hoje</p>
              </div>
            )}
          </div>

        </motion.div>

        {/* ── Row 4: Upcoming + Summary ───────────────────────────────────────── */}
        <motion.div variants={theme.animations.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Upcoming appointments */}
          <div className={`${CARD} p-5 lg:col-span-2`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Próximos Agendamentos</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{upcoming.length} restantes hoje</p>
                </div>
              </div>
              <Button variant="ghost" size="sm"
                onClick={() => navigate(`/${businessId}/agendamentos`)}
                className="text-gold hover:text-gold hover:bg-gold/10 gap-1.5 text-xs rounded-xl h-8 px-3">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map(apt => {
                  const { label: rel, urgent } = getRelativeTime(apt.time)
                  const cfg = STATUS_CFG[apt.status] ?? STATUS_CFG.pending
                  return (
                    <motion.div key={apt.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.045] transition-colors cursor-default">
                      {/* Time pill */}
                      <div className={`shrink-0 min-w-[58px] rounded-lg px-2 py-2 text-center border ${
                        urgent ? 'bg-gold/15 border-gold/30' : 'bg-white/[0.04] border-white/[0.06]'
                      }`}>
                        <p className={`text-sm font-black leading-none ${urgent ? 'text-gold' : 'text-white'}`}>
                          {apt.time}
                        </p>
                        {rel && (
                          <p className={`text-[9px] font-semibold mt-0.5 ${urgent ? 'text-gold/60' : 'text-white/25'}`}>
                            {rel}
                          </p>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{apt.clientName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-white/35 truncate">{apt.serviceName}</span>
                          <span className="text-white/15 text-xs">·</span>
                          <span className="text-[11px] text-white/35 truncate">{apt.professionalName}</span>
                          <span className="text-white/15 text-xs">·</span>
                          <span className="text-[11px] text-white/25">{apt.serviceDuration}min</span>
                        </div>
                      </div>
                      {/* Price + status */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-gold">{formatCurrency(apt.servicePrice)}</p>
                        <span className={`mt-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bgCls} ${cfg.textCls}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                  <CalendarX className="w-6 h-6 text-white/15" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/35">Sem agendamentos pendentes</p>
                  <p className="text-xs text-white/20 mt-1">Nenhum horário restante para hoje</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: summary + insights */}
          <div className="flex flex-col gap-4">

            {/* Day summary */}
            <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.12] via-gold/[0.05] to-transparent p-5 shadow-[0_2px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(212,175,55,0.12)]">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
              <p className="text-[11px] font-medium text-gold/50 uppercase tracking-widest mb-3">Resumo do Dia</p>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs text-white/35">Total</p>
                  <p className="text-3xl font-black text-white">{stats.total}</p>
                </div>
                <div className="h-px bg-white/[0.07]" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/35">Receita</p>
                  <p className="text-lg font-bold text-gold">{formatCurrency(stats.revenue)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/35">Conclusão</p>
                  <p className="text-sm font-bold text-white">{stats.rate}%</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/35">Clientes únicos</p>
                  <p className="text-sm font-bold text-white">{uniqueClients}</p>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className={`${CARD} p-5 flex-1`}>
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-3">Destaques</p>
              <div className="space-y-3">
                {peakHour && peakHour.count > 0 && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Pico às <span className="text-white font-semibold">{peakHour.label}</span> — {peakHour.count} atendimento{peakHour.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {topSvcs[0] && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Scissors className="w-3 h-3 text-blue-400" />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      <span className="text-white font-semibold">{topSvcs[0].name}</span> é o serviço mais popular hoje
                    </p>
                  </div>
                )}
                {topProfs[0] && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-3 h-3 text-gold" />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      <span className="text-white font-semibold">{topProfs[0].name}</span> lidera com {formatCurrency(topProfs[0].revenue)}
                    </p>
                  </div>
                )}
                {upcoming[0] && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-violet-400" />
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Próximo às <span className="text-white font-semibold">{upcoming[0].time}</span> — {upcoming[0].clientName}
                    </p>
                  </div>
                )}
                {stats.total === 0 && (
                  <p className="text-xs text-white/25 text-center py-3">Sem dados para exibir hoje</p>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </OwnerPageLayout>
  )
}
