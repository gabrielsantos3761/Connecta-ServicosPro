import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Scissors, DollarSign, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
import { formatCurrency } from '@/lib/utils'
import { OwnerPageLayout } from "@/components/layout/OwnerPageLayout"
import { getServicos, getCategorias, type ServicoData, type CategoriaData } from '@/services/gerenciarServicosService'

type DateRange = { from?: Date; to?: Date }

interface ServiceStats {
  name: string
  category: string
  totalRevenue: number
  appointmentsCount: number
  completedCount: number
  cancelledCount: number
  averagePrice: number
  completionRate: number
  cancellationRate: number
  totalDuration: number
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD_STYLE = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
}
const GOLD = "#D4AF37"
const DIV_LINE = { borderBottom: "1px solid rgba(255,255,255,0.06)" }
const CAT_COLORS = [
  "#D4AF37", "#818cf8", "#34d399", "#f472b6",
  "#60a5fa", "#fb923c", "#a78bfa", "#fbbf24",
]

// ─── SVG Components ────────────────────────────────────────────────────────────
interface DonutSlice { value: number; color: string }
function DonutChart({ slices, size = 160, sw = 20 }: {
  slices: DonutSlice[]; size?: number; sw?: number
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return null
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2
  let offset = 0
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
      {slices.map((sl, i) => {
        const pct = sl.value / total
        const dashLen = circ * pct
        const gap = circ - dashLen
        const thisOff = -(offset * circ)
        offset += pct
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sl.color}
            strokeWidth={sw} strokeDasharray={`${dashLen} ${gap}`}
            strokeDashoffset={thisOff} strokeLinecap="butt"
          />
        )
      })}
    </svg>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DashboardServicos() {
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  })

  const [servicos, setServicos] = useState<ServicoData[]>([])
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    const businessId = localStorage.getItem('selected_business_id')
    if (!businessId) {
      setIsLoading(false)
      return
    }
    try {
      const [servicosData, categoriasData] = await Promise.all([
        getServicos(businessId),
        getCategorias(businessId),
      ])
      setServicos(servicosData)
      setCategorias(categoriasData)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Sem agendamentos reais ainda - tudo zerado
  const filteredAppointments: never[] = []

  // Calcular estatísticas por serviço (zeradas pois não há agendamentos reais)
  const serviceStats = useMemo((): ServiceStats[] => {
    return servicos.map(service => ({
      name: service.name,
      category: service.category,
      totalRevenue: 0,
      appointmentsCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      averagePrice: service.price,
      completionRate: 0,
      cancellationRate: 0,
      totalDuration: 0,
    }))
  }, [servicos])

  // Ordenar por receita
  const topServices = useMemo(() => {
    return [...serviceStats].sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [serviceStats])

  // Agrupar por categoria
  const categoryStats = useMemo(() => {
    const categories = new Map<string, {
      category: string
      totalRevenue: number
      appointmentsCount: number
      services: string[]
    }>()

    serviceStats.forEach(service => {
      const existing = categories.get(service.category) || {
        category: service.category,
        totalRevenue: 0,
        appointmentsCount: 0,
        services: [],
      }

      categories.set(service.category, {
        ...existing,
        totalRevenue: existing.totalRevenue + service.totalRevenue,
        appointmentsCount: existing.appointmentsCount + service.appointmentsCount,
        services: [...existing.services, service.name],
      })
    })

    return Array.from(categories.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [serviceStats])

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const total = serviceStats.reduce((acc, service) => ({
      revenue: acc.revenue + service.totalRevenue,
      appointments: acc.appointments + service.appointmentsCount,
      completed: acc.completed + service.completedCount,
      cancelled: acc.cancelled + service.cancelledCount,
      duration: acc.duration + service.totalDuration,
    }), { revenue: 0, appointments: 0, completed: 0, cancelled: 0, duration: 0 })

    const avgCompletionRate = total.appointments > 0 ? (total.completed / total.appointments) * 100 : 0
    const avgPrice = total.completed > 0 ? total.revenue / total.completed : 0

    return { ...total, avgCompletionRate, avgPrice }
  }, [serviceStats])

  const getCategoryLabel = (category: string) => {
    const cat = categorias.find(c => c.id === category || c.name === category)
    if (cat) return cat.name
    return category || 'Sem categoria'
  }

  const getCategoryColorByIndex = (category: string): string => {
    const index = categorias.findIndex(c => c.id === category || c.name === category)
    return CAT_COLORS[index >= 0 ? index % CAT_COLORS.length : 0]
  }

  const medalGradients = [
    "linear-gradient(135deg,#D4AF37,#B8941E)",
    "linear-gradient(135deg,#9ca3af,#6b7280)",
    "linear-gradient(135deg,#b45309,#92400e)",
  ]

  if (isLoading) {
    return (
      <OwnerPageLayout
        title="Dashboard de Serviços"
        subtitle="Análise de desempenho e estatísticas dos serviços"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
          <span className="ml-3 text-gray-400">Carregando dados...</span>
        </div>
      </OwnerPageLayout>
    )
  }

  // Donut slices: one per category, using services.length as metric (or appointmentsCount fallback)
  const donutSlices: DonutSlice[] = categoryStats.map((cat, i) => ({
    value: Math.max(cat.services.length, 1),
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  const maxRevenue = topServices.length > 0 ? topServices[0].totalRevenue : 1
  const maxCatRevenue = categoryStats.length > 0 ? Math.max(...categoryStats.map(c => c.services.length)) : 1

  return (
    <OwnerPageLayout
      title="Dashboard de Serviços"
      subtitle="Análise de desempenho e estatísticas dos serviços"
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* ── KPI Cards (4-wide) ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {/* Receita Total */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Receita Total</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {formatCurrency(totalStats.revenue)}
              </p>
              <p className="text-xs text-gray-500">{totalStats.completed} serviços concluídos</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(52,211,153,0.12)", width: 44, height: 44 }}
            >
              <DollarSign size={20} style={{ color: "#34d399" }} />
            </div>
          </div>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Ticket Médio</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {formatCurrency(totalStats.avgPrice)}
              </p>
              <p className="text-xs text-gray-500">Por serviço concluído</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: `${GOLD}18`, width: 44, height: 44 }}
            >
              <TrendingUp size={20} style={{ color: GOLD }} />
            </div>
          </div>
        </motion.div>

        {/* Total de Serviços */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Total de Serviços</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {totalStats.appointments}
              </p>
              <p className="text-xs text-gray-500">{servicos.length} tipos disponíveis</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(129,140,248,0.12)", width: 44, height: 44 }}
            >
              <Scissors size={20} style={{ color: "#818cf8" }} />
            </div>
          </div>
        </motion.div>

        {/* Tempo Total */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
          <div style={CARD_STYLE} className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Tempo Total</p>
              <p
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {Math.round(totalStats.duration / 60)}h
              </p>
              <p className="text-xs text-gray-500">{totalStats.duration} minutos</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ background: "rgba(167,139,250,0.12)", width: 44, height: 44 }}
            >
              <Clock size={20} style={{ color: "#a78bfa" }} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Asymmetric 2/5 + 3/5 grid ── */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Left 2/5 — Donut chart by category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-5 lg:col-span-2"
        >
          <div style={{ ...CARD_STYLE, height: "100%" }} className="p-6 flex flex-col">
            <p
              className="text-sm font-semibold text-white mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Distribuição por Categoria
            </p>

            {categoryStats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Nenhuma categoria encontrada
              </div>
            ) : (
              <>
                {/* Donut centered with category count */}
                <div className="flex justify-center mb-6" style={{ position: "relative" }}>
                  <DonutChart slices={donutSlices} size={160} sw={20} />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <p
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {categoryStats.length}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight">categorias</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2.5">
                  {categoryStats.map((cat, i) => {
                    const color = CAT_COLORS[i % CAT_COLORS.length]
                    const total = categoryStats.reduce((s, c) => s + c.services.length, 0)
                    const pct = total > 0 ? ((cat.services.length / total) * 100).toFixed(1) : "0.0"
                    return (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }}
                          />
                          <span className="text-sm text-gray-300 truncate max-w-[120px]">
                            {getCategoryLabel(cat.category)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{pct}%</span>
                          <span className="text-xs font-semibold text-white">
                            {cat.services.length} serv.
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Right 3/5 — Service ranking */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="col-span-5 lg:col-span-3"
        >
          <div style={CARD_STYLE} className="p-6">
            <p
              className="text-sm font-semibold text-white mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ranking por Receita
            </p>

            {topServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhum serviço cadastrado ainda
              </div>
            ) : (
              <div className="space-y-0">
                {topServices.map((service, index) => {
                  const catColor = getCategoryColorByIndex(service.category)
                  const pct = maxRevenue > 0 ? (service.totalRevenue / maxRevenue) * 100 : 0
                  return (
                    <div
                      key={service.name}
                      className="py-3.5"
                      style={index < topServices.length - 1 ? DIV_LINE : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {/* Medal badge */}
                        <div
                          className="flex items-center justify-center rounded-full font-bold text-sm shrink-0"
                          style={{
                            width: 32,
                            height: 32,
                            background: index < 3 ? medalGradients[index] : "rgba(255,255,255,0.06)",
                            color: index < 3 ? (index === 0 ? "#000" : "#fff") : "#6b7280",
                          }}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-white truncate">{service.name}</span>
                            {/* Category color tag */}
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                              style={{ background: `${catColor}18`, color: catColor }}
                            >
                              {getCategoryLabel(service.category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{service.completedCount} concluídos</span>
                            <span>·</span>
                            <span>Média {formatCurrency(service.averagePrice)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className="text-base font-bold text-white"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {formatCurrency(service.totalRevenue)}
                          </p>
                          <p className="text-xs text-gray-500">{service.completionRate.toFixed(0)}% conclusão</p>
                        </div>
                      </div>

                      {/* Animated progress bar */}
                      <div
                        className="relative w-full rounded-full overflow-hidden"
                        style={{ height: 10, background: "rgba(255,255,255,0.06)", marginLeft: 44 }}
                      >
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.1 * index }}
                          style={{ background: catColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Category Breakdown (full width) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-6"
      >
        <div style={CARD_STYLE} className="p-6">
          <p
            className="text-sm font-semibold text-white mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Distribuição de Serviços por Categoria
          </p>

          {categoryStats.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">Nenhuma categoria encontrada</div>
          ) : (
            <div className="space-y-5">
              {categoryStats.map((cat, i) => {
                const color = CAT_COLORS[i % CAT_COLORS.length]
                const pct = maxCatRevenue > 0 ? (cat.services.length / maxCatRevenue) * 100 : 0
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }}
                        />
                        <span className="text-sm font-medium text-gray-200">
                          {getCategoryLabel(cat.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{cat.appointmentsCount} agendamentos</span>
                        <span>·</span>
                        <span>{cat.services.length} tipos de serviço</span>
                      </div>
                    </div>

                    {/* h-2.5 progress bar */}
                    <div
                      className="relative w-full rounded-full overflow-hidden mb-2.5"
                      style={{ height: 10, background: "rgba(255,255,255,0.06)" }}
                    >
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.05 * i }}
                        style={{ background: color }}
                      />
                    </div>

                    {/* Service name chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {cat.services.map(svcName => (
                        <span
                          key={svcName}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${color}15`, color }}
                        >
                          {svcName}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Service Catalog Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <div style={CARD_STYLE} className="p-6">
          <p
            className="text-sm font-semibold text-white mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Catálogo Detalhado de Serviços
          </p>

          {topServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">Nenhum serviço cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Header */}
              <div
                className="grid items-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 pb-3"
                style={{ gridTemplateColumns: "4fr 2fr 1fr 1fr 2fr", ...DIV_LINE }}
              >
                <span>Serviço</span>
                <span>Categoria</span>
                <span className="text-center">Agend.</span>
                <span className="text-center">Concluídos</span>
                <span className="text-right">Preço Base</span>
              </div>

              {/* Rows */}
              <div>
                {topServices.map((service, index) => {
                  const catColor = getCategoryColorByIndex(service.category)
                  return (
                    <div
                      key={service.name}
                      className="grid items-center py-3 px-4 transition-colors hover:bg-white/[0.02]"
                      style={{
                        gridTemplateColumns: "4fr 2fr 1fr 1fr 2fr",
                        borderLeft: `3px solid ${catColor}`,
                        ...(index < topServices.length - 1 ? DIV_LINE : {}),
                      }}
                    >
                      <span className="text-sm font-medium text-white">{service.name}</span>
                      <span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${catColor}18`, color: catColor }}
                        >
                          {getCategoryLabel(service.category)}
                        </span>
                      </span>
                      <span className="text-sm text-gray-300 text-center font-semibold">
                        {service.appointmentsCount}
                      </span>
                      <span className="text-sm text-center">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(52,211,153,0.12)", color: "#34d399" }}
                        >
                          {service.completedCount}
                        </span>
                      </span>
                      <span
                        className="text-sm font-semibold text-white text-right"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {formatCurrency(service.averagePrice)}
                      </span>
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
