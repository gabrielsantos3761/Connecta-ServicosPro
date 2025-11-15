import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import {
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { mockAppointments } from "@/data/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type DateRange = { from?: Date; to?: Date };

interface DailyStats {
  date: Date;
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  revenue: number;
}

interface HourlyStats {
  hour: string;
  count: number;
  revenue: number;
}

export function DashboardAgendamentos() {
  const { setIsMobileMenuOpen } = useOutletContext<{
    setIsMobileMenuOpen: (value: boolean) => void;
  }>();
  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  });

  // Filtrar agendamentos por data
  const filteredAppointments = useMemo(() => {
    if (!dateRange.from) return [];

    return mockAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);

      const fromDate = new Date(dateRange.from!);
      fromDate.setHours(0, 0, 0, 0);

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return aptDate >= fromDate && aptDate <= toDate;
      }

      return aptDate.toDateString() === fromDate.toDateString();
    });
  }, [dateRange]);

  // Estatísticas por dia
  const dailyStats = useMemo((): DailyStats[] => {
    const statsMap = new Map<string, DailyStats>();

    filteredAppointments.forEach((apt) => {
      const dateKey = apt.date.toDateString();
      const existing = statsMap.get(dateKey);

      if (!existing) {
        statsMap.set(dateKey, {
          date: new Date(apt.date),
          total: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          confirmed: 0,
          revenue: 0,
        });
      }

      const stats = statsMap.get(dateKey)!;
      stats.total++;

      if (apt.status === "completed") {
        stats.completed++;
        stats.revenue += apt.price;
      } else if (apt.status === "cancelled") {
        stats.cancelled++;
      } else if (apt.status === "pending") {
        stats.pending++;
      } else if (apt.status === "confirmed") {
        stats.confirmed++;
      }
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [filteredAppointments]);

  // Estatísticas por horário
  const hourlyStats = useMemo((): HourlyStats[] => {
    const statsMap = new Map<number, HourlyStats>();

    // Inicializar todos os horários (9h às 18h)
    for (let h = 9; h <= 18; h++) {
      statsMap.set(h, {
        hour: `${h.toString().padStart(2, "0")}:00`,
        count: 0,
        revenue: 0,
      });
    }

    filteredAppointments.forEach((apt) => {
      const hour = apt.date.getHours();
      const stats = statsMap.get(hour);

      if (stats) {
        stats.count++;
        if (apt.status === "completed") {
          stats.revenue += apt.price;
        }
      }
    });

    return Array.from(statsMap.values());
  }, [filteredAppointments]);

  // Horários de pico
  const peakHours = useMemo(() => {
    return [...hourlyStats].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [hourlyStats]);

  // Estatísticas por dia da semana
  const weekdayStats = useMemo(() => {
    const weekdays = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    const stats = Array(7)
      .fill(0)
      .map((_, i) => ({
        day: weekdays[i],
        count: 0,
        revenue: 0,
      }));

    filteredAppointments.forEach((apt) => {
      const day = apt.date.getDay();
      stats[day].count++;
      if (apt.status === "completed") {
        stats[day].revenue += apt.price;
      }
    });

    return stats.filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredAppointments]);

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const completed = filteredAppointments.filter(
      (a) => a.status === "completed"
    );
    const cancelled = filteredAppointments.filter(
      (a) => a.status === "cancelled"
    );
    const pending = filteredAppointments.filter((a) => a.status === "pending");
    const confirmed = filteredAppointments.filter(
      (a) => a.status === "confirmed"
    );

    const revenue = completed.reduce((sum, apt) => sum + apt.price, 0);
    const completionRate =
      filteredAppointments.length > 0
        ? (completed.length / filteredAppointments.length) * 100
        : 0;
    const cancellationRate =
      filteredAppointments.length > 0
        ? (cancelled.length / filteredAppointments.length) * 100
        : 0;

    const avgPerDay =
      dailyStats.length > 0
        ? filteredAppointments.length / dailyStats.length
        : 0;

    return {
      total: filteredAppointments.length,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: pending.length,
      confirmed: confirmed.length,
      revenue,
      completionRate,
      cancellationRate,
      avgPerDay,
    };
  }, [filteredAppointments, dailyStats]);

  // Status badge helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div>
      <Header
        title="Dashboard de Agendamentos"
        subtitle="Análise de agendamentos e padrões de horários"
        onMobileMenuClick={() => setIsMobileMenuOpen(true)}
      />

      <div className="p-4 md:p-8">
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
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Total de Agendamentos
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {totalStats.total}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Média: {totalStats.avgPerDay.toFixed(1)}/dia
                    </p>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Concluídos
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {totalStats.completed}
                    </h3>
                    <p className="text-xs text-green-600 font-semibold">
                      {totalStats.completionRate.toFixed(1)}% de conclusão
                    </p>
                  </div>
                  <div className="bg-green-500 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Cancelados
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {totalStats.cancelled}
                    </h3>
                    <p className="text-xs text-red-600 font-semibold">
                      {totalStats.cancellationRate.toFixed(1)}% de cancelamento
                    </p>
                  </div>
                  <div className="bg-red-500 p-3 rounded-lg">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Pendentes/Confirmados
                    </p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {totalStats.pending + totalStats.confirmed}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {totalStats.pending} pendentes, {totalStats.confirmed}{" "}
                      confirmados
                    </p>
                  </div>
                  <div className="bg-gold p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Evolução Diária */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  Evolução Diária
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {dailyStats.slice(-10).map((day) => (
                    <div key={day.date.toISOString()}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {day.total} agendamentos
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(day.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="h-2 bg-green-500 rounded-l"
                          style={{
                            width: `${(day.completed / day.total) * 100}%`,
                          }}
                          title={`Concluídos: ${day.completed}`}
                        />
                        <div
                          className="h-2 bg-blue-500"
                          style={{
                            width: `${(day.confirmed / day.total) * 100}%`,
                          }}
                          title={`Confirmados: ${day.confirmed}`}
                        />
                        <div
                          className="h-2 bg-yellow-500"
                          style={{
                            width: `${(day.pending / day.total) * 100}%`,
                          }}
                          title={`Pendentes: ${day.pending}`}
                        />
                        <div
                          className="h-2 bg-red-500 rounded-r"
                          style={{
                            width: `${(day.cancelled / day.total) * 100}%`,
                          }}
                          title={`Cancelados: ${day.cancelled}`}
                        />
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded" />
                          {day.completed} concluídos
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded" />
                          {day.confirmed} confirmados
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded" />
                          {day.pending} pendentes
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded" />
                          {day.cancelled} cancelados
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Horários de Pico */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Horários de Pico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {peakHours.map((hourStat, index) => (
                    <div key={hourStat.hour}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`
                            w-8 h-8 rounded flex items-center justify-center text-sm font-bold
                            ${
                              index === 0
                                ? "bg-gold text-white"
                                : "bg-gray-100 text-gray-600"
                            }
                          `}
                          >
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {hourStat.hour}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {hourStat.count} agendamentos
                          </span>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(hourStat.revenue)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gold h-2 rounded-full"
                          style={{
                            width: `${
                              (hourStat.count /
                                Math.max(...hourlyStats.map((h) => h.count))) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Distribuição por Horário
                  </h4>
                  <div className="grid grid-cols-5 gap-1">
                    {hourlyStats.map((hourStat) => {
                      const maxCount = Math.max(
                        ...hourlyStats.map((h) => h.count)
                      );
                      const height =
                        maxCount > 0 ? (hourStat.count / maxCount) * 100 : 0;

                      return (
                        <div
                          key={hourStat.hour}
                          className="flex flex-col items-center"
                        >
                          <div className="w-full h-20 flex items-end">
                            <div
                              className="w-full bg-gold rounded-t"
                              style={{ height: `${height}%` }}
                              title={`${hourStat.hour}: ${hourStat.count} agendamentos`}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {hourStat.hour.split(":")[0]}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Análise por Dia da Semana */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Desempenho por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekdayStats.map((stat) => {
                  const maxCount = Math.max(
                    ...weekdayStats.map((s) => s.count)
                  );
                  const percentage =
                    maxCount > 0 ? (stat.count / maxCount) * 100 : 0;

                  return (
                    <div
                      key={stat.day}
                      className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {stat.day.substring(0, 3)}
                      </div>
                      <div className="w-full h-32 flex items-end mb-2">
                        <div
                          className="w-full bg-gold rounded-t"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {stat.count}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(stat.revenue)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimos Agendamentos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle>Últimos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data e Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serviço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profissional
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.slice(0, 15).map((apt) => (
                      <tr key={apt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(apt.date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {apt.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {apt.clientName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {apt.service}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {apt.professional}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(apt.status)}>
                            {getStatusLabel(apt.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900">
                            {formatCurrency(apt.price)}
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
  );
}
