import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, DollarSign, Calendar, TrendingUp, AlertCircle, Award } from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
import { mockAppointments, mockProfessionals } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { OwnerPageLayout } from "@/components/layout/OwnerPageLayout"

// ─── Design tokens ────────────────────────────────────────────────────────────
const gold = "#D4AF37"
const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
}
const divLine = { borderBottom: "1px solid rgba(255,255,255,0.06)" }

const medalGradients = [
  "linear-gradient(135deg,#D4AF37,#B8941E)",
  "linear-gradient(135deg,#9ca3af,#6b7280)",
  "linear-gradient(135deg,#b45309,#92400e)",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RingChart({
  value,
  max,
  color,
  size = 52,
  sw = 4,
}: {
  value: number
  max: number
  color: string
  size?: number
  sw?: number
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

// ─── Types ────────────────────────────────────────────────────────────────────
type DateRange = { from?: Date; to?: Date }

interface ProfessionalStats {
  id: string
  name: string
  rating: number
  totalRevenue: number
  appointmentsCount: number
  cancelledCount: number
  completedCount: number
  cancellationRate: number
  completionRate: number
  services: { [key: string]: number }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DashboardProfissionais() {
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today
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

  // Calcular estatísticas por profissional
  const professionalStats = useMemo((): ProfessionalStats[] => {
    return mockProfessionals.map(prof => {
      const profAppointments = filteredAppointments.filter(apt => apt.professional === prof.name)
      const completed = profAppointments.filter(apt => apt.status === 'completed')
      const cancelled = profAppointments.filter(apt => apt.status === 'cancelled')

      const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
      const cancellationRate = profAppointments.length > 0
        ? (cancelled.length / profAppointments.length) * 100
        : 0
      const completionRate = profAppointments.length > 0
        ? (completed.length / profAppointments.length) * 100
        : 0

      // Contar serviços por tipo
      const services: { [key: string]: number } = {}
      completed.forEach(apt => {
        services[apt.service] = (services[apt.service] || 0) + 1
      })

      return {
        id: prof.id,
        name: prof.name,
        rating: prof.rating,
        totalRevenue,
        appointmentsCount: profAppointments.length,
        cancelledCount: cancelled.length,
        completedCount: completed.length,
        cancellationRate,
        completionRate,
        services
      }
    })
  }, [filteredAppointments])

  // Ordenar por receita
  const topProfessionals = useMemo(() => {
    return [...professionalStats].sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [professionalStats])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const total = professionalStats.reduce((acc, prof) => ({
      revenue: acc.revenue + prof.totalRevenue,
      appointments: acc.appointments + prof.appointmentsCount,
      completed: acc.completed + prof.completedCount,
      cancelled: acc.cancelled + prof.cancelledCount
    }), { revenue: 0, appointments: 0, completed: 0, cancelled: 0 })

    const avgRating = professionalStats.reduce((sum, p) => sum + p.rating, 0) / professionalStats.length || 0
    const avgCancellationRate = total.appointments > 0 ? (total.cancelled / total.appointments) * 100 : 0

    return {
      ...total,
      avgRating,
      avgCancellationRate
    }
  }, [professionalStats])

  // Gráfico de radar - Serviços por profissional
  const serviceDistribution = useMemo(() => {
    const allServices = new Set<string>()
    professionalStats.forEach(prof => {
      Object.keys(prof.services).forEach(service => allServices.add(service))
    })

    return Array.from(allServices).map(service => {
      const profCounts = professionalStats.map(prof => ({
        name: prof.name,
        count: prof.services[service] || 0
      }))

      const total = profCounts.reduce((sum, p) => sum + p.count, 0)

      return {
        service,
        total,
        professionals: profCounts.filter(p => p.count > 0)
      }
    }).sort((a, b) => b.total - a.total)
  }, [professionalStats])

  const maxRevenue = topProfessionals[0]?.totalRevenue || 1

  // Per-professional bar colors for service distribution
  const profColors = ["#D4AF37", "#818cf8", "#22c55e", "#60a5fa", "#f87171", "#fb923c", "#c084fc"]

  return (
    <OwnerPageLayout
      title="Dashboard de Profissionais"
      subtitle="Análise de desempenho e estatísticas dos profissionais"
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* ── 4 KPI Cards ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {/* Receita Total */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.12)" }}
              >
                <DollarSign className="w-5 h-5" style={{ color: "#22c55e" }} />
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Receita Total
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {formatCurrency(totalStats.revenue)}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {totalStats.completed} atendimentos
            </p>
          </div>
        </motion.div>

        {/* Avaliação Média */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.12)" }}
              >
                <Award className="w-5 h-5" style={{ color: gold }} />
              </div>
              <div className="relative flex-shrink-0">
                <RingChart
                  value={totalStats.avgRating}
                  max={5}
                  color={gold}
                  size={48}
                  sw={4}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: gold }}>
                    {totalStats.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Avaliação Média
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {totalStats.avgRating.toFixed(1)}
              <span className="text-base font-normal ml-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                / 5
              </span>
            </p>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3 h-3"
                  style={{
                    color: i < Math.floor(totalStats.avgRating) ? gold : "rgba(255,255,255,0.15)",
                    fill: i < Math.floor(totalStats.avgRating) ? gold : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Total Agendamentos */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(129,140,248,0.12)" }}
              >
                <Calendar className="w-5 h-5" style={{ color: "#818cf8" }} />
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Total Agendamentos
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {totalStats.appointments}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {mockProfessionals.length} profissionais ativos
            </p>
          </div>
        </motion.div>

        {/* Taxa Cancelamento */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(248,113,113,0.12)" }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: "#f87171" }} />
              </div>
              <div className="relative flex-shrink-0">
                <RingChart
                  value={totalStats.avgCancellationRate}
                  max={100}
                  color="#f87171"
                  size={48}
                  sw={4}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: "#f87171" }}>
                    {totalStats.avgCancellationRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Taxa Cancelamento
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {totalStats.avgCancellationRate.toFixed(1)}%
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {totalStats.cancelled} cancelamentos
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Asymmetric 3/5 + 2/5 grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Left col-span-3: Ranking por Receita */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <div style={card} className="h-full">
            <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
              <TrendingUp className="w-4 h-4" style={{ color: gold }} />
              <span className="text-sm font-semibold text-white">Ranking por Receita</span>
            </div>
            <div className="p-5 space-y-4">
              {topProfessionals.map((prof, index) => {
                const revPct = maxRevenue > 0 ? (prof.totalRevenue / maxRevenue) * 100 : 0
                const completionColor =
                  prof.completionRate >= 80
                    ? "#22c55e"
                    : prof.completionRate >= 50
                    ? "#fbbf24"
                    : "#f87171"
                const medalBg =
                  index < 3
                    ? medalGradients[index]
                    : "rgba(255,255,255,0.06)"
                const medalTextColor =
                  index < 3 ? "#050400" : "rgba(255,255,255,0.35)"

                return (
                  <div
                    key={prof.id}
                    style={{
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "0.875rem",
                    }}
                    className="p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Medal badge */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: medalBg,
                          color: index < 3 ? "#050400" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className="font-semibold text-white leading-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {prof.name}
                          </p>
                          <p
                            className="font-bold text-white flex-shrink-0"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {formatCurrency(prof.totalRevenue)}
                          </p>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3 h-3"
                                style={{
                                  color: i < Math.floor(prof.rating) ? gold : "rgba(255,255,255,0.15)",
                                  fill: i < Math.floor(prof.rating) ? gold : "none",
                                }}
                              />
                            ))}
                            <span className="text-xs ml-1" style={{ color: gold }}>
                              {prof.rating.toFixed(1)}
                            </span>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                          >
                            |
                          </span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {prof.appointmentsCount} agend.
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: `${completionColor}18`,
                              color: completionColor,
                            }}
                          >
                            {prof.completionRate.toFixed(0)}% conclusão
                          </span>
                        </div>

                        {/* Revenue progress bar + ring chart */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div
                              className="relative w-full h-2.5 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                              <motion.div
                                className="absolute left-0 top-0 h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${revPct}%` }}
                                transition={{ duration: 0.7, delay: 0.1 * index }}
                                style={{
                                  background:
                                    index === 0
                                      ? gold
                                      : index === 1
                                      ? "#9ca3af"
                                      : index === 2
                                      ? "#b45309"
                                      : "rgba(255,255,255,0.2)",
                                }}
                              />
                            </div>
                          </div>
                          <div className="relative flex-shrink-0">
                            <RingChart
                              value={prof.completionRate}
                              max={100}
                              color={completionColor}
                              size={48}
                              sw={4}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="text-xs font-bold"
                                style={{ color: completionColor }}
                              >
                                {prof.completionRate.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Right col-span-2: Service distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div style={card} className="h-full">
            <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
              <Calendar className="w-4 h-4" style={{ color: gold }} />
              <span className="text-sm font-semibold text-white">
                Serviços por Profissional
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-5">
                {serviceDistribution.slice(0, 8).map((service) => (
                  <div key={service.service}>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {service.service}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {service.total} atend.
                      </span>
                    </div>
                    {/* Grouped bars per professional */}
                    <div className="flex gap-0.5 mb-2 h-5 items-end">
                      {service.professionals.map((prof, pIdx) => {
                        const pct = service.total > 0
                          ? (prof.count / service.total) * 100
                          : 0
                        const pColor = profColors[
                          topProfessionals.findIndex(p => p.name === prof.name) % profColors.length
                        ]
                        return (
                          <div
                            key={prof.name}
                            className="rounded-sm"
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: pColor,
                              opacity: 0.7 + pIdx * 0.1,
                            }}
                            title={`${prof.name}: ${prof.count}`}
                          />
                        )
                      })}
                    </div>
                    {/* Legend chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {service.professionals.map((prof) => {
                        const pColor = profColors[
                          topProfessionals.findIndex(p => p.name === prof.name) % profColors.length
                        ]
                        return (
                          <span
                            key={prof.name}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: `${pColor}18`,
                              color: pColor,
                            }}
                          >
                            {prof.name}: {prof.count}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Detailed Analysis Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div style={card}>
          <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
            <Award className="w-4 h-4" style={{ color: gold }} />
            <span className="text-sm font-semibold text-white">
              Análise Detalhada por Profissional
            </span>
          </div>

          {/* Header row */}
          <div
            className="grid px-5 py-2.5"
            style={{
              gridTemplateColumns: "3fr 1fr 1fr 2fr 2fr 2fr",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {["Profissional", "Aval.", "Agend.", "Concluídos", "Cancelados", "Receita"].map(h => (
              <span
                key={h}
                className="text-xs uppercase"
                style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Data rows */}
          {topProfessionals.map((prof, index) => {
            const completionColor =
              prof.completionRate >= 80
                ? "#22c55e"
                : prof.completionRate >= 50
                ? "#fbbf24"
                : "#f87171"
            const revPct = maxRevenue > 0 ? (prof.totalRevenue / maxRevenue) * 100 : 0
            const rowMedalColor =
              index === 0 ? gold : index === 1 ? "#9ca3af" : index === 2 ? "#b45309" : "transparent"

            return (
              <div
                key={prof.id}
                className="hover:bg-white/[0.015] transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div
                  className="grid px-5 py-3 items-center"
                  style={{
                    gridTemplateColumns: "3fr 1fr 1fr 2fr 2fr 2fr",
                    borderLeft: `3px solid ${index < 3 ? rowMedalColor : "transparent"}`,
                  }}
                >
                  {/* Name */}
                  <div>
                    <span
                      className="text-sm font-medium text-white"
                    >
                      {prof.name}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" style={{ color: gold, fill: gold }} />
                    <span className="text-sm font-semibold text-white">
                      {prof.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Appointments */}
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {prof.appointmentsCount}
                    </span>
                  </div>

                  {/* Completed */}
                  <div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "#22c55e18",
                        color: "#22c55e",
                      }}
                    >
                      {prof.completedCount} ({prof.completionRate.toFixed(0)}%)
                    </span>
                  </div>

                  {/* Cancelled */}
                  <div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "#f8717118",
                        color: "#f87171",
                      }}
                    >
                      {prof.cancelledCount} ({prof.cancellationRate.toFixed(0)}%)
                    </span>
                  </div>

                  {/* Revenue */}
                  <div>
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(prof.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Mini revenue bar below each row */}
                <div className="px-5 pb-2">
                  <div
                    className="relative w-full h-1 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${revPct}%` }}
                      transition={{ duration: 0.7, delay: 0.05 * index }}
                      style={{
                        background:
                          index === 0
                            ? gold
                            : index === 1
                            ? "#9ca3af"
                            : index === 2
                            ? "#b45309"
                            : "rgba(255,255,255,0.15)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </OwnerPageLayout>
  )
}
