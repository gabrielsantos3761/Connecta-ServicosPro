import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Scissors, DollarSign, TrendingUp, Clock, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/DateRangePicker'
import { mockAppointments, mockServices } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { theme, cardClasses, iconClasses, pageClasses } from '@/styles/theme'

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

  // Calcular estatísticas por serviço
  const serviceStats = useMemo((): ServiceStats[] => {
    const statsMap = new Map<string, ServiceStats>()

    mockServices.forEach(service => {
      const serviceAppointments = filteredAppointments.filter(apt => apt.service === service.name)
      const completed = serviceAppointments.filter(apt => apt.status === 'completed')
      const cancelled = serviceAppointments.filter(apt => apt.status === 'cancelled')

      const totalRevenue = completed.reduce((sum, apt) => sum + apt.price, 0)
      const totalDuration = completed.reduce((sum, apt) => sum + (apt.duration || 0), 0)
      const completionRate = serviceAppointments.length > 0
        ? (completed.length / serviceAppointments.length) * 100
        : 0
      const cancellationRate = serviceAppointments.length > 0
        ? (cancelled.length / serviceAppointments.length) * 100
        : 0

      statsMap.set(service.name, {
        name: service.name,
        category: service.category,
        totalRevenue,
        appointmentsCount: serviceAppointments.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        averagePrice: completed.length > 0 ? totalRevenue / completed.length : service.price,
        completionRate,
        cancellationRate,
        totalDuration
      })
    })

    return Array.from(statsMap.values())
  }, [filteredAppointments])

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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      hair: 'bg-blue-500',
      beard: 'bg-amber-600',
      color: 'bg-purple-500',
      treatment: 'bg-green-500'
    }
    return colors[category] || 'bg-gray-500'
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      hair: 'Cabelo',
      beard: 'Barba',
      color: 'Coloração',
      treatment: 'Tratamentos'
    }
    return labels[category] || category
  }

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Dashboard de Serviços</h1>
          <p className="text-sm text-gray-400">Análise de desempenho e estatísticas dos serviços</p>
        </div>

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
          className={pageClasses.statsGrid()}
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
                      {mockServices.length} tipos disponíveis
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

        <div className={pageClasses.grid2()}>
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
                    {topServices.map((service) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
