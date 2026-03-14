import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Calendar, UserPlus } from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
import { mockAppointments } from '@/data/mockData'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OwnerPageLayout } from "@/components/layout/OwnerPageLayout"

type DateRange = { from?: Date; to?: Date }

interface ClientStats {
  name: string
  totalRevenue: number
  appointmentsCount: number
  completedCount: number
  cancelledCount: number
  lastVisit: Date
  firstVisit: Date
  favoriteService: string
  averageSpent: number
  completionRate: number
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const CARD_STYLE = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
}
const GOLD = "#D4AF37"
const DIV_LINE = { borderBottom: "1px solid rgba(255,255,255,0.06)" }
const MEDAL_GRADIENTS = [
  "linear-gradient(135deg,#D4AF37,#B8941E)",
  "linear-gradient(135deg,#9ca3af,#6b7280)",
  "linear-gradient(135deg,#b45309,#92400e)",
]

// ─── SVG Ring Chart ────────────────────────────────────────────────────────────
function RingChart({ value, max, color, size = 52, sw = 4 }: {
  value: number; max: number; color: string; size?: number; sw?: number
}) {
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Urgency color helper ──────────────────────────────────────────────────────
function urgencyColor(days: number): string {
  if (days > 90) return "#f87171"
  if (days > 60) return "#fb923c"
  return "#fbbf24"
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DashboardClientes() {
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  })

  // Filtrar agendamentos por data
  const filteredAppointments = useMemo(() => {
    if (!dateRange.from) return []

    return mockAppointments.filter(apt => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)

      const fromDate = new Date(dateRange.from!)
      fromDate.setHours(0, 0, 0, 0)

      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        return aptDate >= fromDate && aptDate <= toDate
      }

      return aptDate.toDateString() === fromDate.toDateString()
    })
  }, [dateRange])

  // Calcular estatísticas por cliente
  const clientStats = useMemo((): ClientStats[] => {
    const clientsMap = new Map<string, ClientStats>()

    mockAppointments.forEach(apt => {
      const existing = clientsMap.get(apt.clientName)

      if (!existing) {
        const clientAppointments = mockAppointments.filter(a => a.clientName === apt.clientName)
        const completed = clientAppointments.filter(a => a.status === 'completed')
        const cancelled = clientAppointments.filter(a => a.status === 'cancelled')

        const serviceCounts = new Map<string, number>()
        completed.forEach(a => {
          serviceCounts.set(a.service, (serviceCounts.get(a.service) || 0) + 1)
        })
        const favoriteService = Array.from(serviceCounts.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

        const totalRevenue = completed.reduce((sum, a) => sum + a.price, 0)
        const dates = clientAppointments.map(a => a.date)
        const firstVisit = new Date(Math.min(...dates.map(d => d.getTime())))
        const lastVisit = new Date(Math.max(...dates.map(d => d.getTime())))

        clientsMap.set(apt.clientName, {
          name: apt.clientName,
          totalRevenue,
          appointmentsCount: clientAppointments.length,
          completedCount: completed.length,
          cancelledCount: cancelled.length,
          lastVisit,
          firstVisit,
          favoriteService,
          averageSpent: completed.length > 0 ? totalRevenue / completed.length : 0,
          completionRate: clientAppointments.length > 0
            ? (completed.length / clientAppointments.length) * 100
            : 0,
        })
      }
    })

    return Array.from(clientsMap.values())
  }, [])

  // Filtrar clientes com atividade no período
  const activeClientsInPeriod = useMemo(() => {
    const clientNamesInPeriod = new Set(filteredAppointments.map(apt => apt.clientName))
    return clientStats.filter(client => clientNamesInPeriod.has(client.name))
  }, [clientStats, filteredAppointments])

  // Top clientes por receita
  const topClients = useMemo(() => {
    return [...activeClientsInPeriod].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10)
  }, [activeClientsInPeriod])

  // Novos clientes no período
  const newClients = useMemo(() => {
    if (!dateRange.from) return []

    const fromDate = new Date(dateRange.from)
    fromDate.setHours(0, 0, 0, 0)

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)
    toDate.setHours(23, 59, 59, 999)

    return clientStats.filter(client => {
      const firstVisit = new Date(client.firstVisit)
      firstVisit.setHours(0, 0, 0, 0)
      return firstVisit >= fromDate && firstVisit <= toDate
    })
  }, [clientStats, dateRange])

  // Clientes inativos (última visita há mais de 30 dias)
  const inactiveClients = useMemo(() => {
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return clientStats.filter(client => {
      return client.lastVisit < thirtyDaysAgo
    }).slice(0, 10)
  }, [clientStats])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const revenue = activeClientsInPeriod.reduce((sum, c) => {
      const clientAppointmentsInPeriod = filteredAppointments.filter(
        apt => apt.clientName === c.name && apt.status === 'completed'
      )
      return sum + clientAppointmentsInPeriod.reduce((s, apt) => s + apt.price, 0)
    }, 0)

    const avgSpent = activeClientsInPeriod.length > 0
      ? revenue / activeClientsInPeriod.length
      : 0

    const totalAppointments = filteredAppointments.length
    const avgAppointmentsPerClient = activeClientsInPeriod.length > 0
      ? totalAppointments / activeClientsInPeriod.length
      : 0

    return {
      totalClients: clientStats.length,
      activeInPeriod: activeClientsInPeriod.length,
      newClients: newClients.length,
      revenue,
      avgSpent,
      avgAppointmentsPerClient,
      inactiveCount: inactiveClients.length,
    }
  }, [activeClientsInPeriod, newClients, clientStats, filteredAppointments, inactiveClients])

  // Derived ring chart metrics
  const retentionPct = totalStats.totalClients > 0
    ? ((totalStats.totalClients - totalStats.inactiveCount) / totalStats.totalClients) * 100
    : 0
  const activePct = totalStats.totalClients > 0
    ? (totalStats.activeInPeriod / totalStats.totalClients) * 100
    : 0

  const maxRevenue = topClients.length > 0 ? topClients[0].totalRevenue : 1

  return (
    <OwnerPageLayout
      title="Dashboard de Clientes"
      subtitle="Análise de comportamento e estatísticas dos clientes"
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* ── HERO Feature Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div
          style={{
            ...CARD_STYLE,
            border: "1px solid rgba(99,102,241,0.2)",
            background: "rgba(99,102,241,0.04)",
          }}
          className="p-6 flex items-center justify-between gap-6 flex-wrap"
        >
          {/* Left: total count + inline stats */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
              Base Total de Clientes
            </p>
            <p
              className="text-6xl font-bold text-white leading-none mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {totalStats.totalClients}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap text-sm">
              <span style={{ color: "#818cf8" }} className="font-semibold">
                {totalStats.activeInPeriod} ativos
              </span>
              <span className="text-gray-600">·</span>
              <span style={{ color: "#34d399" }} className="font-semibold">
                {totalStats.newClients} novos
              </span>
              <span className="text-gray-600">·</span>
              <span style={{ color: "#f87171" }} className="font-semibold">
                {totalStats.inactiveCount} inativos
              </span>
            </div>
          </div>

          {/* Right: two ring charts */}
          <div className="flex items-center gap-8">
            {/* Retention ring */}
            <div className="flex flex-col items-center gap-2">
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <RingChart value={retentionPct} max={100} color="#34d399" size={80} sw={7} />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span className="text-base font-bold text-white">{retentionPct.toFixed(0)}%</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">Retenção</span>
            </div>

            {/* Active ring */}
            <div className="flex flex-col items-center gap-2">
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <RingChart value={activePct} max={100} color="#818cf8" size={80} sw={7} />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                  }}
                >
                  <span className="text-base font-bold text-white">{activePct.toFixed(0)}%</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">Ativos</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4 KPI Cards ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {/* Clientes Ativos */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Clientes Ativos</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {totalStats.activeInPeriod}
              </p>
              <p className="text-xs text-gray-500">Total: {totalStats.totalClients} clientes</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(129,140,248,0.12)", width: 44, height: 44 }}
            >
              <Users size={20} style={{ color: "#818cf8" }} />
            </div>
          </div>
        </motion.div>

        {/* Novos Clientes */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Novos Clientes</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {totalStats.newClients}
              </p>
              <p className="text-xs text-gray-500">No período selecionado</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(52,211,153,0.12)", width: 44, height: 44 }}
            >
              <UserPlus size={20} style={{ color: "#34d399" }} />
            </div>
          </div>
        </motion.div>

        {/* Receita no Período */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Receita no Período</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {formatCurrency(totalStats.revenue)}
              </p>
              <p className="text-xs text-gray-500">Média: {formatCurrency(totalStats.avgSpent)}/cliente</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: `${GOLD}18`, width: 44, height: 44 }}
            >
              <DollarSign size={20} style={{ color: GOLD }} />
            </div>
          </div>
        </motion.div>

        {/* Média Agend./Cliente */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Média Agend./Cliente</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {totalStats.avgAppointmentsPerClient.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">No período selecionado</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(167,139,250,0.12)", width: 44, height: 44 }}
            >
              <Calendar size={20} style={{ color: "#a78bfa" }} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Asymmetric 3/5 + 2/5 grid ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Left 3/5 — Top clients */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-5 lg:col-span-3"
        >
          <div style={CARD_STYLE} className="p-6">
            <p
              className="text-sm font-semibold text-white mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Top Clientes por Receita
            </p>

            {topClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhum cliente ativo no período
              </div>
            ) : (
              <div className="space-y-0">
                {topClients.map((client, index) => {
                  const pct = maxRevenue > 0 ? (client.totalRevenue / maxRevenue) * 100 : 0
                  const completionColor = client.completionRate >= 80
                    ? "#34d399"
                    : client.completionRate >= 50
                    ? GOLD
                    : "#f87171"

                  return (
                    <div
                      key={client.name}
                      className="py-3.5"
                      style={index < topClients.length - 1 ? DIV_LINE : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {/* Medal badge */}
                        <div
                          className="flex items-center justify-center rounded-full font-bold text-sm shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            background: index < 3 ? MEDAL_GRADIENTS[index] : "rgba(255,255,255,0.06)",
                            color: index < 3 ? (index === 0 ? "#000" : "#fff") : "#6b7280",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-white truncate">{client.name}</span>
                            {/* Completion color indicator */}
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                              style={{ background: `${completionColor}18`, color: completionColor }}
                            >
                              {client.completionRate.toFixed(0)}% conclusão
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Favorite service tag */}
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${GOLD}15`, color: GOLD }}
                            >
                              {client.favoriteService}
                            </span>
                            <span className="text-xs text-gray-500">
                              {client.completedCount} visitas · Média {formatCurrency(client.averageSpent)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className="text-base font-bold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {formatCurrency(client.totalRevenue)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(client.lastVisit)}
                          </p>
                        </div>
                      </div>

                      {/* Revenue bar */}
                      <div
                        className="relative w-full rounded-full overflow-hidden"
                        style={{ height: 10, background: "rgba(255,255,255,0.06)", marginLeft: 44 }}
                      >
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.05 * index }}
                          style={{ background: "#818cf8" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right 2/5 — New clients panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="col-span-5 lg:col-span-2"
        >
          <div style={{ ...CARD_STYLE, height: "100%" }} className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <p
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Novos Clientes
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}
              >
                {newClients.length} no período
              </span>
            </div>

            {newClients.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm text-center px-4">
                Nenhum cliente novo no período selecionado
              </div>
            ) : (
              <div className="space-y-0 overflow-y-auto" style={{ maxHeight: 400 }}>
                {newClients.slice(0, 10).map((client, index) => (
                  <div
                    key={client.name}
                    className="py-3 hover:bg-white/[0.02] transition-colors"
                    style={index < Math.min(newClients.length, 10) - 1 ? DIV_LINE : {}}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white truncate">{client.name}</span>
                          {/* New badge */}
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}
                          >
                            Novo
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          1ª visita: {formatDate(client.firstVisit)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.appointmentsCount} agendamentos · {client.completedCount} concluídos
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="text-sm font-bold text-white"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {formatCurrency(client.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Inactive Clients Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div style={CARD_STYLE} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Clientes Inativos
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}
            >
              {inactiveClients.length} clientes · última visita há mais de 30 dias
            </span>
          </div>

          {inactiveClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum cliente inativo encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Header */}
              <div
                className="grid items-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3"
                style={{ gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr", ...DIV_LINE }}
              >
                <span>Cliente</span>
                <span>Última Visita</span>
                <span className="text-center">Visitas</span>
                <span className="text-right">Receita Total</span>
                <span className="text-right">Serviço Favorito</span>
              </div>

              {/* Rows */}
              <div>
                {inactiveClients.map((client, index) => {
                  const daysSince = Math.floor(
                    (today.getTime() - client.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const urg = urgencyColor(daysSince)

                  return (
                    <div
                      key={client.name}
                      className="grid items-center py-3 px-4 transition-colors hover:bg-white/[0.02]"
                      style={{
                        gridTemplateColumns: "3fr 2fr 1fr 2fr 2fr",
                        borderLeft: `3px solid ${urg}`,
                        ...(index < inactiveClients.length - 1 ? DIV_LINE : {}),
                      }}
                    >
                      <span className="text-sm font-medium text-white">{client.name}</span>

                      <div>
                        <p className="text-sm text-gray-300">{formatDate(client.lastVisit)}</p>
                        <p className="text-xs font-semibold" style={{ color: urg }}>
                          há {daysSince} dias
                        </p>
                      </div>

                      <span className="text-sm text-gray-300 text-center font-semibold">
                        {client.completedCount}
                      </span>

                      <span
                        className="text-sm font-bold text-white text-right"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {formatCurrency(client.totalRevenue)}
                      </span>

                      <div className="flex justify-end">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
                        >
                          {client.favoriteService}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </OwnerPageLayout>
  )
}
