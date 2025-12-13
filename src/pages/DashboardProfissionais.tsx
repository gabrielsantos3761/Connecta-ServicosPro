import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, DollarSign, Calendar, TrendingUp, AlertCircle, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/DateRangePicker'
import { mockAppointments, mockProfessionals } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { theme, cardClasses, iconClasses, pageClasses } from '@/styles/theme'

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

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Dashboard de Profissionais</h1>
          <p className="text-sm text-gray-400">Análise de desempenho e estatísticas dos profissionais</p>
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
                      {totalStats.completed} atendimentos
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
                      Avaliação Média
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {totalStats.avgRating.toFixed(1)}
                    </h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(totalStats.avgRating)
                              ? 'text-gold fill-gold'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={iconClasses.container('gold')}>
                    <Award className={iconClasses.icon('gold')} />
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
                      Total de Agendamentos
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {totalStats.appointments}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {mockProfessionals.length} profissionais ativos
                    </p>
                  </div>
                  <div className={iconClasses.container('blue')}>
                    <Calendar className={iconClasses.icon('blue')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('red')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Taxa de Cancelamento
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {totalStats.avgCancellationRate.toFixed(1)}%
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {totalStats.cancelled} cancelamentos
                    </p>
                  </div>
                  <div className={iconClasses.container('red')}>
                    <AlertCircle className={iconClasses.icon('red')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className={pageClasses.grid2()}>
          {/* Ranking de Profissionais */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <TrendingUp className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Ranking por Receita
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className={theme.colors.divider.light}>
                  {topProfessionals.map((prof, index) => (
                    <div
                      key={prof.id}
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
                              {prof.name}
                            </h4>
                            <div className={`flex items-center gap-3 text-sm ${theme.colors.text.tertiary}`}>
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-gold fill-gold" />
                                {prof.rating.toFixed(1)}
                              </span>
                              <span>
                                {prof.completedCount} atendimentos
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${theme.colors.text.primary}`}>
                            {formatCurrency(prof.totalRevenue)}
                          </p>
                          <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                            {prof.completionRate.toFixed(0)}% conclusão
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Distribuição de Serviços */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <Calendar className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Serviços por Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {serviceDistribution.slice(0, 8).map((service) => (
                    <div key={service.service}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                          {service.service}
                        </span>
                        <span className={`text-sm font-bold ${theme.colors.text.primary}`}>
                          {service.total} atendimentos
                        </span>
                      </div>
                      <div className="flex gap-1 mb-1">
                        {service.professionals.map((prof) => {
                          const percentage = (prof.count / service.total) * 100
                          return (
                            <div
                              key={prof.name}
                              className="h-2 bg-gold rounded"
                              style={{ width: `${percentage}%` }}
                              title={`${prof.name}: ${prof.count}`}
                            />
                          )
                        })}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {service.professionals.map((prof) => (
                          <Badge
                            key={prof.name}
                            variant="outline"
                            className="text-xs"
                          >
                            {prof.name}: {prof.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detalhes por Profissional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={cardClasses.container('base')}>
            <CardHeader className={theme.components.cardHeader}>
              <CardTitle className={theme.components.cardTitle}>Análise Detalhada por Profissional</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme.components.table.header}>
                    <tr>
                      <th className={theme.components.table.headerCell}>
                        Profissional
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Avaliação
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
                        Receita
                      </th>
                    </tr>
                  </thead>
                  <tbody className={theme.components.table.body}>
                    {topProfessionals.map((prof) => (
                      <tr key={prof.id} className={theme.components.table.row}>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <div className={`font-medium ${theme.colors.text.primary}`}>{prof.name}</div>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-gold fill-gold" />
                            <span className={`font-semibold ${theme.colors.text.primary}`}>{prof.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`font-semibold ${theme.colors.text.primary}`}>{prof.appointmentsCount}</span>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge variant="default" className="bg-green-500">
                            {prof.completedCount} ({prof.completionRate.toFixed(0)}%)
                          </Badge>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge variant="destructive">
                            {prof.cancelledCount} ({prof.cancellationRate.toFixed(0)}%)
                          </Badge>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`font-bold ${theme.colors.text.primary}`}>
                            {formatCurrency(prof.totalRevenue)}
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
