import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, TrendingUp, Calendar, UserPlus, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/DateRangePicker'
import { mockAppointments } from '@/data/mockData'
import { formatCurrency, formatDate } from '@/lib/utils'
import { theme, cardClasses, iconClasses, pageClasses } from '@/styles/theme'

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

export function DashboardClientes() {
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

  // Calcular estatísticas por cliente
  const clientStats = useMemo((): ClientStats[] => {
    const clientsMap = new Map<string, ClientStats>()

    // Considerar todos os agendamentos históricos para análise completa do cliente
    mockAppointments.forEach(apt => {
      const existing = clientsMap.get(apt.clientName)

      if (!existing) {
        // Primeiro agendamento deste cliente
        const clientAppointments = mockAppointments.filter(a => a.clientName === apt.clientName)
        const completed = clientAppointments.filter(a => a.status === 'completed')
        const cancelled = clientAppointments.filter(a => a.status === 'cancelled')

        // Encontrar serviço favorito (mais frequente)
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
            : 0
        })
      }
    })

    return Array.from(clientsMap.values())
  }, [])

  // Filtrar clientes que tiveram atividade no período selecionado
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
      // Calcular apenas receita do período filtrado
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
      inactiveCount: inactiveClients.length
    }
  }, [activeClientsInPeriod, newClients, clientStats, filteredAppointments, inactiveClients])

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Dashboard de Clientes</h1>
          <p className="text-sm text-gray-400">Análise de comportamento e estatísticas dos clientes</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('blue')}>
              <CardContent className="p-6">
                <div className={iconClasses.container('blue')}>
                  <Users className={iconClasses.icon('blue')} />
                </div>
                <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                  Clientes Ativos
                </p>
                <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                  {totalStats.activeInPeriod}
                </h3>
                <p className={`text-xs ${theme.colors.text.tertiary}`}>
                  Total: {totalStats.totalClients} clientes
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('green')}>
              <CardContent className="p-6">
                <div className={iconClasses.container('green')}>
                  <UserPlus className={iconClasses.icon('green')} />
                </div>
                <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                  Novos Clientes
                </p>
                <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                  {totalStats.newClients}
                </h3>
                <p className={`text-xs ${theme.colors.text.tertiary}`}>
                  No período selecionado
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('gold')}>
              <CardContent className="p-6">
                <div className={iconClasses.container('gold')}>
                  <DollarSign className={iconClasses.icon('gold')} />
                </div>
                <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                  Receita no Período
                </p>
                <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                  {formatCurrency(totalStats.revenue)}
                </h3>
                <p className={`text-xs ${theme.colors.text.tertiary}`}>
                  Média: {formatCurrency(totalStats.avgSpent)}/cliente
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.statCard('purple')}>
              <CardContent className="p-6">
                <div className={iconClasses.container('purple')}>
                  <Calendar className={iconClasses.icon('purple')} />
                </div>
                <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                  Média Agend./Cliente
                </p>
                <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                  {totalStats.avgAppointmentsPerClient.toFixed(1)}
                </h3>
                <p className={`text-xs ${theme.colors.text.tertiary}`}>
                  No período selecionado
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Clientes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={theme.colors.card.base}>
              <CardHeader className={`border-b ${theme.colors.border.light}`}>
                <CardTitle className={`flex items-center gap-2 ${theme.colors.text.primary}`}>
                  <Award className="w-5 h-5 text-gold" />
                  Top Clientes (Receita Total)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`divide-y ${theme.colors.border.light}`}>
                  {topClients.map((client, index) => (
                    <div
                      key={client.name}
                      className="p-6 hover:bg-white/5 transition-colors"
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
                              {client.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                {client.favoriteService}
                              </Badge>
                            </div>
                            <div className={`flex items-center gap-3 text-sm ${theme.colors.text.tertiary}`}>
                              <span>
                                {client.completedCount} visitas
                              </span>
                              <span>
                                Média: {formatCurrency(client.averageSpent)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${theme.colors.text.primary}`}>
                            {formatCurrency(client.totalRevenue)}
                          </p>
                          <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                            Última visita: {formatDate(client.lastVisit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Novos Clientes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={theme.colors.card.base}>
              <CardHeader className={`border-b ${theme.colors.border.light}`}>
                <CardTitle className={`flex items-center gap-2 ${theme.colors.text.primary}`}>
                  <UserPlus className="w-5 h-5 text-gold" />
                  Novos Clientes no Período
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {newClients.length > 0 ? (
                  <div className={`divide-y ${theme.colors.border.light}`}>
                    {newClients.slice(0, 10).map((client) => (
                      <div
                        key={client.name}
                        className="p-6 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold ${theme.colors.text.primary} mb-1`}>
                              {client.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="default" className="bg-green-500 text-xs">
                                Novo
                              </Badge>
                              <span className={`text-xs ${theme.colors.text.tertiary}`}>
                                Primeira visita: {formatDate(client.firstVisit)}
                              </span>
                            </div>
                            <div className={`flex items-center gap-3 text-sm ${theme.colors.text.tertiary}`}>
                              <span>
                                {client.appointmentsCount} agendamentos
                              </span>
                              <span>
                                {client.completedCount} concluídos
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${theme.colors.text.primary}`}>
                              {formatCurrency(client.totalRevenue)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center ${theme.colors.text.tertiary}`}>
                    Nenhum cliente novo no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Clientes Inativos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={theme.colors.card.base}>
            <CardHeader className={`border-b ${theme.colors.border.light}`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`flex items-center gap-2 ${theme.colors.text.primary}`}>
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Clientes Inativos (Última visita há mais de 30 dias)
                </CardTitle>
                <Badge variant="destructive">
                  {inactiveClients.length} clientes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme.components.table.header}>
                    <tr>
                      <th className={theme.components.table.headerCell}>
                        Cliente
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Última Visita
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Total de Visitas
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Receita Total
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Serviço Favorito
                      </th>
                    </tr>
                  </thead>
                  <tbody className={theme.components.table.body}>
                    {inactiveClients.map((client) => {
                      const daysSinceLastVisit = Math.floor(
                        (today.getTime() - client.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <tr key={client.name} className={theme.components.table.row}>
                          <td className={theme.components.table.cell}>
                            <div className={`font-medium ${theme.colors.text.primary}`}>{client.name}</div>
                          </td>
                          <td className={theme.components.table.cell}>
                            <div className={`text-sm ${theme.colors.text.primary}`}>
                              {formatDate(client.lastVisit)}
                            </div>
                            <div className="text-xs text-red-500">
                              Há {daysSinceLastVisit} dias
                            </div>
                          </td>
                          <td className={theme.components.table.cell}>
                            <span className={`font-semibold ${theme.colors.text.primary}`}>{client.completedCount}</span>
                          </td>
                          <td className={theme.components.table.cell}>
                            <span className={`font-bold ${theme.colors.text.primary}`}>
                              {formatCurrency(client.totalRevenue)}
                            </span>
                          </td>
                          <td className={theme.components.table.cell}>
                            <Badge variant="outline" className="border-white/20 text-gray-400">
                              {client.favoriteService}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
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
