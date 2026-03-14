import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import {
  Calendar, Clock, TrendingUp, CheckCircle2, XCircle,
  Flame, CalendarDays, Activity,
} from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
import { getAppointmentsByBusiness, type Appointment, type AppointmentStatus } from '@/services/appointmentService'
import { formatCurrency } from '@/lib/utils'
import { theme, CARD, ACCENT, STATUS_CFG as _STATUS_CFG } from '@/styles/theme'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = { from?: Date; to?: Date }

interface DailyStats {
  date: Date
  total: number
  completed: number
  cancelled: number
  pending: number
  confirmed: number
  revenue: number
}

interface HourlyStats {
  hour: string
  count: number
  revenue: number
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = _STATUS_CFG as Record<AppointmentStatus, { label: string; textCls: string; bgCls: string; hex: string }>

// ─── SVG Primitives ───────────────────────────────────────────────────────────

function Sparkline({ data, color, id, className = '' }: { data: number[]; color: string; id: string; className?: string }) {
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

function DonutChart({ segments, total, centerValue, centerLabel }: {
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

// ─── Chart Components ─────────────────────────────────────────────────────────

function StackedBarsChart({ data }: { data: DailyStats[] }) {
  const shown = data.slice(-14)
  if (shown.length === 0) return (
    <div className="flex items-center justify-center py-8">
      <p className="text-xs text-white/25">Nenhum dado no período selecionado</p>
    </div>
  )
  const maxTotal = Math.max(...shown.map(d => d.total), 1)
  const H = 96
  return (
    <div>
      <div className="flex items-end gap-[3px] overflow-hidden" style={{ height: H }}>
        {shown.map((day, i) => {
          const barH = day.total > 0 ? Math.max(4, (day.total / maxTotal) * H) : 2
          // flex-col-reverse: first DOM item renders at bottom, last at top
          // Order: completed (bottom) → confirmed → pending → cancelled (top)
          return (
            <div key={i} className="flex-1 flex flex-col justify-end group cursor-default" style={{ height: H }}
              title={`${day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}: ${day.total} agendamentos`}>
              <motion.div
                className="w-full rounded-t-[3px] overflow-hidden flex flex-col-reverse"
                initial={{ height: 0 }}
                animate={{ height: barH }}
                transition={{ duration: 0.55, delay: i * 0.025, ease: 'easeOut' }}
              >
                <div style={{ height: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%`, backgroundColor: '#3b82f6', opacity: day.completed > 0 ? 1 : 0 }} />
                <div style={{ height: `${day.total > 0 ? (day.confirmed / day.total) * 100 : 0}%`, backgroundColor: '#10b981', opacity: day.confirmed > 0 ? 1 : 0 }} />
                <div style={{ height: `${day.total > 0 ? (day.pending / day.total) * 100 : 0}%`,   backgroundColor: '#f59e0b', opacity: day.pending > 0 ? 1 : 0 }} />
                <div style={{ height: `${day.total > 0 ? (day.cancelled / day.total) * 100 : 0}%`, backgroundColor: '#ef4444', opacity: day.cancelled > 0 ? 1 : 0 }} />
              </motion.div>
            </div>
          )
        })}
      </div>
      <div className="flex mt-1.5 gap-[3px]">
        {shown.map((day, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-white/20">{day.date.getDate()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeatmapGrid({ data }: { data: HourlyStats[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
      {data.map((h, i) => {
        const intensity = max > 0 ? h.count / max : 0
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-full rounded-lg transition-all"
              style={{
                aspectRatio: '1',
                backgroundColor: h.count === 0
                  ? 'rgba(255,255,255,0.03)'
                  : `rgba(212,175,55,${0.08 + intensity * 0.58})`,
                boxShadow: intensity > 0.55 ? `0 0 7px rgba(212,175,55,${intensity * 0.28})` : 'none',
              }}
              title={`${h.hour}: ${h.count} agendamentos`}
            />
            <span className="text-[9px] text-white/20 leading-none">{h.hour.replace(':00', '')}</span>
          </div>
        )
      })}
    </div>
  )
}

function WeekdayBars({ data }: { data: { day: string; count: number; revenue: number }[] }) {
  const weekdayOrder = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const all = weekdayOrder.map(abbr => {
    const full = { Dom: 'Domingo', Seg: 'Segunda', Ter: 'Terça', Qua: 'Quarta', Qui: 'Quinta', Sex: 'Sexta', Sáb: 'Sábado' }[abbr]!
    return data.find(d => d.day === full) ?? { day: full, count: 0, revenue: 0 }
  })
  const maxCount = Math.max(...all.map(d => d.count), 1)
  const H = 60
  return (
    <div className="flex items-end gap-2" style={{ height: H + 18 }}>
      {all.map((d, i) => {
        const barH = d.count > 0 ? Math.max(4, (d.count / maxCount) * H) : 3
        const isBest = d.count === maxCount && maxCount > 0
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5"
            title={`${d.day}: ${d.count} agendamentos`}>
            <motion.div
              className={`w-full rounded-t-[4px] ${isBest ? 'bg-gold' : d.count === 0 ? 'bg-white/[0.04]' : 'bg-white/20'}`}
              initial={{ height: 0 }}
              animate={{ height: barH }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            />
            <span className={`text-[10px] leading-none ${isBest ? 'text-gold/70 font-semibold' : 'text-white/20'}`}>
              {weekdayOrder[i]}
            </span>
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

function PageSkeleton() {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${CARD} p-5 space-y-4 lg:col-span-2`}>
          <Pulse className="h-5 w-36" />
          <Pulse className="h-28 w-full" />
        </div>
        <div className={`${CARD} p-5 space-y-4`}>
          <Pulse className="h-5 w-28" />
          <Pulse className="h-32 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className={`${CARD} p-5 space-y-4`}>
            <Pulse className="h-5 w-36" />
            <Pulse className="h-16 w-full" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map(j => <Pulse key={j} className="h-10 w-full" />)}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardAgendamentos() {
  const { businessId } = useParams<{ businessId: string }>()
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!businessId || !dateRange.from) return
    setLoading(true)
    getAppointmentsByBusiness(businessId, dateRange.from, dateRange.to)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [businessId, dateRange])

  // Daily stats
  const dailyStats = useMemo((): DailyStats[] => {
    const map = new Map<string, DailyStats>()
    appointments.forEach(apt => {
      if (!map.has(apt.date)) {
        map.set(apt.date, { date: new Date(apt.date + 'T12:00:00'), total: 0, completed: 0, cancelled: 0, pending: 0, confirmed: 0, revenue: 0 })
      }
      const s = map.get(apt.date)!
      s.total++
      if (apt.status === 'completed') { s.completed++; s.revenue += apt.servicePrice }
      else if (apt.status === 'cancelled') s.cancelled++
      else if (apt.status === 'pending')   s.pending++
      else if (apt.status === 'confirmed') s.confirmed++
    })
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [appointments])

  // Hourly stats (9h–18h)
  const hourlyStats = useMemo((): HourlyStats[] => {
    const map = new Map<number, HourlyStats>()
    for (let h = 9; h <= 18; h++) map.set(h, { hour: `${String(h).padStart(2, '0')}:00`, count: 0, revenue: 0 })
    appointments.forEach(apt => {
      const h = parseInt(apt.time.split(':')[0])
      const s = map.get(h)
      if (s) { s.count++; if (apt.status === 'completed') s.revenue += apt.servicePrice }
    })
    return Array.from(map.values())
  }, [appointments])

  // Top 5 peak hours
  const peakHours = useMemo(
    () => [...hourlyStats].sort((a, b) => b.count - a.count).slice(0, 5).filter(h => h.count > 0),
    [hourlyStats],
  )

  // Weekday stats sorted by count (for ranking)
  const weekdayStats = useMemo(() => {
    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const stats = Array(7).fill(0).map((_, i) => ({ day: weekdays[i], count: 0, revenue: 0 }))
    appointments.forEach(apt => {
      const day = new Date(apt.date + 'T12:00:00').getDay()
      stats[day].count++
      if (apt.status === 'completed') stats[day].revenue += apt.servicePrice
    })
    return stats.sort((a, b) => b.count - a.count).filter(s => s.count > 0)
  }, [appointments])

  // Total stats
  const totalStats = useMemo(() => {
    const completed = appointments.filter(a => a.status === 'completed')
    const cancelled = appointments.filter(a => a.status === 'cancelled')
    const pending   = appointments.filter(a => a.status === 'pending')
    const confirmed = appointments.filter(a => a.status === 'confirmed')
    const revenue = completed.reduce((s, a) => s + a.servicePrice, 0)
    const total = appointments.length
    return {
      total,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: pending.length,
      confirmed: confirmed.length,
      revenue,
      completionRate:   total > 0 ? (completed.length / total) * 100 : 0,
      cancellationRate: total > 0 ? (cancelled.length / total) * 100 : 0,
      avgPerDay: dailyStats.length > 0 ? total / dailyStats.length : 0,
    }
  }, [appointments, dailyStats])

  const maxPeakCount = Math.max(...hourlyStats.map(h => h.count), 1)
  const maxWeekCount = weekdayStats[0]?.count ?? 1

  return (
    <OwnerPageLayout
      title="Dashboard de Agendamentos"
      subtitle="Análise de agendamentos e padrões de horários"
    >
      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className={`${CARD} p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5 text-white/40" />
          </div>
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Período</p>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
        {!loading && totalStats.total > 0 && (
          <div className="flex items-center gap-5 pl-4 border-l border-white/[0.06]">
            <div className="text-right">
              <p className="text-[10px] text-white/25">Agendamentos</p>
              <p className="text-sm font-bold text-white">{totalStats.total}</p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="text-right">
              <p className="text-[10px] text-white/25">Receita</p>
              <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(totalStats.revenue)}</p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div className="text-right">
              <p className="text-[10px] text-white/25">Conclusão</p>
              <p className="text-sm font-bold text-white">{totalStats.completionRate.toFixed(0)}%</p>
            </div>
          </div>
        )}
      </div>

      {loading ? <PageSkeleton /> : (
        <motion.div variants={theme.animations.container} initial="hidden" animate="show" className="space-y-5">

          {/* ── Row 1: KPIs ─────────────────────────────────────────────────── */}
          <motion.div variants={theme.animations.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total"
              value={String(totalStats.total)}
              detail={`Ø ${totalStats.avgPerDay.toFixed(1)} por dia · ${dailyStats.length} dias`}
              icon={<Calendar className="w-4 h-4" />}
              accent={ACCENT.blue}
              sparkData={dailyStats.map(d => d.total)}
              sparkId="dsa-total"
            />
            <KPICard
              label="Concluídos"
              value={String(totalStats.completed)}
              detail={`${totalStats.completionRate.toFixed(1)}% de taxa de conclusão`}
              icon={<CheckCircle2 className="w-4 h-4" />}
              accent={ACCENT.emerald}
              sparkData={dailyStats.map(d => d.completed)}
              sparkId="dsa-comp"
              badge={`${totalStats.completionRate.toFixed(0)}%`}
              badgePositive={totalStats.completionRate >= 70 ? true : undefined}
            />
            <KPICard
              label="Cancelados"
              value={String(totalStats.cancelled)}
              detail={`${totalStats.cancellationRate.toFixed(1)}% de cancelamentos`}
              icon={<XCircle className="w-4 h-4" />}
              accent={ACCENT.red}
              sparkData={dailyStats.map(d => d.cancelled)}
              sparkId="dsa-canc"
              badge={totalStats.cancelled > 0 ? `${totalStats.cancellationRate.toFixed(0)}%` : undefined}
              badgePositive={totalStats.cancelled > 0 ? false : undefined}
            />
            <KPICard
              label="Em Aberto"
              value={String(totalStats.pending + totalStats.confirmed)}
              detail={`${totalStats.pending} pendentes · ${totalStats.confirmed} confirmados`}
              icon={<Clock className="w-4 h-4" />}
              accent={ACCENT.amber}
              sparkData={dailyStats.map(d => d.pending + d.confirmed)}
              sparkId="dsa-open"
            />
          </motion.div>

          {/* ── Row 2: Daily evolution + Status donut ───────────────────────── */}
          <motion.div variants={theme.animations.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Stacked bar chart */}
            <div className={`${CARD} p-5 lg:col-span-2`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">
                    Evolução Diária
                  </p>
                  <p className="text-3xl font-black text-white tracking-tight">{totalStats.total}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {dailyStats.length} dias · Ø {totalStats.avgPerDay.toFixed(1)}/dia
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2.5">
                    {([
                      { color: '#3b82f6', label: 'Conc.' },
                      { color: '#10b981', label: 'Conf.' },
                      { color: '#f59e0b', label: 'Pend.' },
                      { color: '#ef4444', label: 'Canc.' },
                    ]).map(item => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] text-white/30">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>
              <StackedBarsChart data={dailyStats} />
            </div>

            {/* Status donut */}
            <div className={`${CARD} p-5`}>
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-4">
                Distribuição por Status
              </p>
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 shrink-0">
                  <DonutChart
                    segments={[
                      { value: totalStats.completed, color: '#3b82f6' },
                      { value: totalStats.confirmed, color: '#10b981' },
                      { value: totalStats.pending,   color: '#f59e0b' },
                      { value: totalStats.cancelled, color: '#ef4444' },
                    ]}
                    total={totalStats.total}
                    centerValue={`${totalStats.completionRate.toFixed(0)}%`}
                    centerLabel="conclusão"
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  {([
                    { label: 'Concluídos',  value: totalStats.completed, dot: 'bg-blue-400' },
                    { label: 'Confirmados', value: totalStats.confirmed, dot: 'bg-emerald-400' },
                    { label: 'Pendentes',   value: totalStats.pending,   dot: 'bg-amber-400' },
                    { label: 'Cancelados',  value: totalStats.cancelled, dot: 'bg-red-400' },
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
                      <span className="text-[11px] font-bold text-white">{totalStats.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue block */}
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-white/35">Receita total</p>
                  <p className="text-sm font-black text-[#D4AF37]">{formatCurrency(totalStats.revenue)}</p>
                </div>
                {totalStats.completed > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/35">Ticket médio</p>
                    <p className="text-xs font-bold text-white/60">
                      {formatCurrency(totalStats.revenue / totalStats.completed)}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </motion.div>

          {/* ── Row 3: Peak hours + Weekday ─────────────────────────────────── */}
          <motion.div variants={theme.animations.item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Peak hours */}
            <div className={`${CARD} p-5`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">
                    Horários de Pico
                  </p>
                  {peakHours[0] ? (
                    <>
                      <p className="text-3xl font-black text-white tracking-tight">{peakHours[0].hour}</p>
                      <p className="text-xs text-white/30 mt-1">
                        Mais movimentado · {peakHours[0].count} agendamentos
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/25">Sem dados</p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              {/* Heatmap */}
              <div className="mb-5">
                <p className="text-[10px] text-white/20 mb-2 uppercase tracking-widest">Mapa de calor · 9h–18h</p>
                <HeatmapGrid data={hourlyStats} />
              </div>

              {/* Top peak hours ranking */}
              {peakHours.length > 0 && (
                <div className="space-y-3">
                  {peakHours.map((h, i) => (
                    <div key={h.hour}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i === 0 ? 'bg-[#D4AF37] text-black' : 'bg-white/[0.07] text-white/50'
                          }`}>{i + 1}</div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none">{h.hour}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{formatCurrency(h.revenue)} gerados</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white/75">{h.count} agend.</span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/25'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(h.count / maxPeakCount) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekday performance */}
            <div className={`${CARD} p-5`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1.5">
                    Desempenho por Dia da Semana
                  </p>
                  {weekdayStats[0] ? (
                    <>
                      <p className="text-3xl font-black text-white tracking-tight">{weekdayStats[0].day}</p>
                      <p className="text-xs text-white/30 mt-1">
                        Mais movimentado · {weekdayStats[0].count} agendamentos
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/25">Sem dados</p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-violet-400" />
                </div>
              </div>

              {/* Weekday bar chart */}
              <div className="mb-5">
                <p className="text-[10px] text-white/20 mb-2 uppercase tracking-widest">Volume por dia</p>
                <WeekdayBars data={weekdayStats} />
              </div>

              {/* Weekday ranking */}
              {weekdayStats.length > 0 && (
                <div className="space-y-3">
                  {weekdayStats.slice(0, 4).map((day, i) => (
                    <div key={day.day}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i === 0 ? 'bg-[#D4AF37] text-black' : 'bg-white/[0.07] text-white/50'
                          }`}>{i + 1}</div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none">{day.day}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{formatCurrency(day.revenue)} gerados</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-white/75">{day.count} agend.</span>
                      </div>
                      <div className="h-[3px] w-full rounded-full bg-white/[0.05] overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${i === 0 ? 'bg-[#D4AF37]' : 'bg-white/25'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(day.count / maxWeekCount) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>

          {/* ── Row 4: Appointment history ──────────────────────────────────── */}
          <motion.div variants={theme.animations.item}>
            <div className={`${CARD} p-5`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-none">Histórico de Agendamentos</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {appointments.length} registros no período
                      {appointments.length > 15 && ' · exibindo 15 mais recentes'}
                    </p>
                  </div>
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white/15" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/35">Nenhum agendamento no período</p>
                    <p className="text-xs text-white/20 mt-1">Altere o período para ver registros</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 15).map((apt, idx) => {
                    const cfg = STATUS_CFG[apt.status] ?? STATUS_CFG.pending
                    return (
                      <motion.div key={apt.id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05] hover:bg-white/[0.045] transition-colors cursor-default">
                        {/* Date + time pill */}
                        <div className="shrink-0 min-w-[68px] rounded-lg px-2 py-2 text-center bg-white/[0.04] border border-white/[0.06]">
                          <p className="text-xs font-black text-white leading-none">{apt.time}</p>
                          <p className="text-[9px] text-white/30 mt-0.5">
                            {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        {/* Client + service info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{apt.clientName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-white/35 truncate">{apt.serviceName}</span>
                            <span className="text-white/15 text-xs">·</span>
                            <span className="text-[11px] text-white/35 truncate">{apt.professionalName}</span>
                          </div>
                        </div>
                        {/* Price + status */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-[#D4AF37]">{formatCurrency(apt.servicePrice)}</p>
                          <span className={`mt-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.bgCls} ${cfg.textCls}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </motion.div>
      )}
    </OwnerPageLayout>
  )
}
