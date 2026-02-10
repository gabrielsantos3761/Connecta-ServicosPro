import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Scissors, DollarSign, TrendingUp, Clock, BarChart3, PieChart, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/DateRangePicker'
import { formatCurrency } from '@/lib/utils'
import { theme, cardClasses, iconClasses } from '@/styles/theme'
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

export function DashboardServicos() {
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today
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
      totalDuration: 0
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
        services: []
      }

      categories.set(service.category, {
        ...existing,
        totalRevenue: existing.totalRevenue + service.totalRevenue,
        appointmentsCount: existing.appointmentsCount + service.appointmentsCount,
        services: [...existing.services, service.name]
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
      duration: acc.duration + service.totalDuration
    }), { revenue: 0, appointments: 0, completed: 0, cancelled: 0, duration: 0 })

    const avgCompletionRate = total.appointments > 0 ? (total.completed / total.appointments) * 100 : 0
    const avgPrice = total.completed > 0 ? total.revenue / total.completed : 0

    return {
      ...total,
      avgCompletionRate,
      avgPrice
    }
  }, [serviceStats])

  const getCategoryLabel = (category: string) => {
    // Buscar nome da categoria real do Firestore
    const cat = categorias.find(c => c.id === category || c.name === category)
    if (cat) return cat.name
    return category || 'Sem categoria'
  }

  const getCategoryColor = (category: string) => {
    // Cores dinâmicas baseadas no índice da categoria
    const colors = ['bg-blue-500', 'bg-amber-600', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500']
    const index = categorias.findIndex(c => c.id === category || c.name === category)
    return colors[index >= 0 ? index % colors.length : 0]
  }

  if (isLoading) {
    return (
      <OwnerPageLayout
        title="Dashboard de Serviços"
        subtitle="Análise de desempenho e estatísticas dos serviços"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="ml-3 text-gray-400">Carregando dados...</span>
        </div>
      </OwnerPageLayout>
    )
  }

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

        {/* Cards de Estatísticas Gerais */}
        <motion.div
          variants={theme.animations.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('green')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Receita Total
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {formatCurrency(totalStats.revenue)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {totalStats.completed} serviços concluídos
                    </p>
                  </div>
                  <div className={iconClasses.container('green')}>
                    <DollarSign className={iconClasses.icon('green')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('yellow')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Ticket Médio
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {formatCurrency(totalStats.avgPrice)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      Por serviço concluído
                    </p>
                  </div>
                  <div className={iconClasses.container('gold')}>
                    <TrendingUp className={iconClasses.icon('gold')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('blue')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Total de Serviços
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {totalStats.appointments}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {servicos.length} tipos disponíveis
                    </p>
                  </div>
                  <div className={iconClasses.container('blue')}>
                    <Scissors className={iconClasses.icon('blue')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('purple')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Tempo Total
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {Math.round(totalStats.duration / 60)}h
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {totalStats.duration} minutos
                    </p>
                  </div>
                  <div className={iconClasses.container('purple')}>
                    <Clock className={iconClasses.icon('purple')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ranking de Serviços */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <BarChart3 className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Ranking por Receita
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topServices.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className={`text-sm ${theme.colors.text.tertiary}`}>
                      Nenhum serviço cadastrado ainda
                    </p>
                  </div>
                ) : (
                <div className={theme.colors.divider.light}>
                  {topServices.map((service, index) => (
                    <div
                      key={service.name}
                      className={`p-6 ${theme.components.table.row}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 items-center flex-1">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                            ${index === 0 ? 'bg-gold text-black' : ''}
                            ${index === 1 ? 'bg-gray-700 text-white' : ''}
                            ${index === 2 ? 'bg-amber-600 text-white' : ''}
                            ${index > 2 ? 'bg-white/10 text-gray-400' : ''}
                          `}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${theme.colors.text.primary} mb-1`}>
                              {service.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(service.category)}
                              </Badge>
                            </div>
                            <div className={`flex items-center gap-3 text-sm ${theme.colors.text.tertiary}`}>
                              <span>
                                {service.completedCount} concluídos
                              </span>
                              <span>
                                Média: {formatCurrency(service.averagePrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${theme.colors.text.primary}`}>
                            {formatCurrency(service.totalRevenue)}
                          </p>
                          <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                            {service.completionRate.toFixed(0)}% conclusão
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Análise por Categoria */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <PieChart className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Análise por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {categoryStats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-sm ${theme.colors.text.tertiary}`}>
                      Nenhuma categoria encontrada
                    </p>
                  </div>
                ) : (
                <div className="space-y-6">
                  {categoryStats.map((category) => {
                    const percentage = totalStats.revenue > 0
                      ? (category.totalRevenue / totalStats.revenue) * 100
                      : 0

                    return (
                      <div key={category.category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getCategoryColor(category.category)}`} />
                            <span className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                              {getCategoryLabel(category.category)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${theme.colors.text.primary}`}>
                              {formatCurrency(category.totalRevenue)}
                            </span>
                            <span className={`text-xs ${theme.colors.text.tertiary} ml-2`}>
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full ${getCategoryColor(category.category)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${theme.colors.text.tertiary}`}>
                          <span>{category.appointmentsCount} agendamentos</span>
                          <span>•</span>
                          <span>{category.services.length} tipos de serviço</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabela Detalhada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={cardClasses.container('base')}>
            <CardHeader className={theme.components.cardHeader}>
              <CardTitle className={theme.components.cardTitle}>Análise Detalhada por Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme.components.table.header}>
                    <tr>
                      <th className={theme.components.table.headerCell}>
                        Serviço
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Categoria
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Agendamentos
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Concluídos
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Cancelados
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Ticket Médio
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Receita Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className={theme.components.table.body}>
                    {topServices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8">
                          <p className={`text-sm ${theme.colors.text.tertiary}`}>
                            Nenhum serviço cadastrado
                          </p>
                        </td>
                      </tr>
                    ) : (
                    topServices.map((service) => (
                      <tr key={service.name} className={theme.components.table.row}>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <div className={`font-medium ${theme.colors.text.primary}`}>{service.name}</div>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge variant="outline">
                            {getCategoryLabel(service.category)}
                          </Badge>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`font-semibold ${theme.colors.text.primary}`}>{service.appointmentsCount}</span>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge variant="default" className="bg-green-500">
                            {service.completedCount}
                          </Badge>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge variant="destructive">
                            {service.cancelledCount}
                          </Badge>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`font-semibold ${theme.colors.text.primary}`}>
                            {formatCurrency(service.averagePrice)}
                          </span>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`font-bold ${theme.colors.text.primary}`}>
                            {formatCurrency(service.totalRevenue)}
                          </span>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </OwnerPageLayout>
  )
}
