import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  AlertCircle,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/DateRangePicker";
import { mockAppointments, mockExpenses } from "@/data/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";
import { theme, cardClasses, iconClasses, pageClasses } from "@/styles/theme";

type DateRange = { from?: Date; to?: Date };

export default function DashboardFinanceiro() {
  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: today,
  });

  // Filtrar receitas (agendamentos concluídos) por período
  const periodRevenues = useMemo(() => {
    if (!dateRange.from) return [];

    return mockAppointments.filter((apt) => {
      if (apt.status !== "completed") return false;

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

  // Filtrar despesas por período
  const periodExpenses = useMemo(() => {
    if (!dateRange.from) return [];

    return mockExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      expDate.setHours(0, 0, 0, 0);

      const fromDate = new Date(dateRange.from!);
      fromDate.setHours(0, 0, 0, 0);

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return expDate >= fromDate && expDate <= toDate;
      }

      return expDate.toDateString() === fromDate.toDateString();
    });
  }, [dateRange]);

  // Estatísticas financeiras
  const financialStats = useMemo(() => {
    const totalRevenue = periodRevenues.reduce(
      (sum, apt) => sum + apt.price,
      0
    );
    const totalExpenses = periodExpenses
      .filter((exp) => exp.isPaid)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const pendingExpenses = periodExpenses
      .filter((exp) => !exp.isPaid)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      pendingExpenses,
      profit,
      profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
    };
  }, [periodRevenues, periodExpenses]);

  // Despesas por categoria
  const expensesByCategory = useMemo(() => {
    const categories = new Map<
      string,
      { category: string; total: number; count: number }
    >();

    periodExpenses
      .filter((exp) => exp.isPaid)
      .forEach((exp) => {
        const existing = categories.get(exp.category) || {
          category: exp.category,
          total: 0,
          count: 0,
        };
        categories.set(exp.category, {
          ...existing,
          total: existing.total + exp.amount,
          count: existing.count + 1,
        });
      });

    return Array.from(categories.values()).sort((a, b) => b.total - a.total);
  }, [periodExpenses]);

  // Receitas por método de pagamento
  const revenuesByPaymentMethod = useMemo(() => {
    const methods = new Map<
      string,
      { method: string; total: number; count: number }
    >();

    periodRevenues.forEach((apt) => {
      if (!apt.paymentMethod) return;

      const existing = methods.get(apt.paymentMethod) || {
        method: apt.paymentMethod,
        total: 0,
        count: 0,
      };
      methods.set(apt.paymentMethod, {
        ...existing,
        total: existing.total + apt.price,
        count: existing.count + 1,
      });
    });

    return Array.from(methods.values()).sort((a, b) => b.total - a.total);
  }, [periodRevenues]);

  // Últimas transações (mix de receitas e despesas)
  const recentTransactions = useMemo(() => {
    const revenues = periodRevenues.slice(0, 5).map((apt) => ({
      id: apt.id,
      type: "revenue" as const,
      description: `${apt.service} - ${apt.clientName}`,
      amount: apt.price,
      date: apt.date,
      paymentMethod: apt.paymentMethod,
    }));

    const expenses = periodExpenses.slice(0, 5).map((exp) => ({
      id: exp.id,
      type: "expense" as const,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      paymentMethod: exp.paymentMethod,
      isPaid: exp.isPaid,
    }));

    return [...revenues, ...expenses]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }, [periodRevenues, periodExpenses]);

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      rent: "Aluguel",
      utilities: "Utilidades",
      supplies: "Suprimentos",
      salaries: "Salários",
      marketing: "Marketing",
      maintenance: "Manutenção",
      other: "Outros",
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      pix: "PIX",
      credit: "Crédito",
      debit: "Débito",
      cash: "Dinheiro",
      boleto: "Boleto",
    };
    return labels[method] || method;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      rent: "bg-red-500",
      utilities: "bg-blue-500",
      supplies: "bg-green-500",
      salaries: "bg-purple-500",
      marketing: "bg-yellow-500",
      maintenance: "bg-orange-500",
      other: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Dashboard Financeiro</h1>
          <p className="text-sm text-gray-400">Controle de entrada, saída e lucro da empresa</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Cards de Estatísticas Principais */}
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
                      {formatCurrency(financialStats.totalRevenue)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {periodRevenues.length} transações
                    </p>
                  </div>
                  <div className={iconClasses.container('green')}>
                    <TrendingUp className={iconClasses.icon('green')} />
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
                      Despesas Pagas
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {formatCurrency(financialStats.totalExpenses)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {periodExpenses.filter((e) => e.isPaid).length} pagamentos
                      realizados
                    </p>
                  </div>
                  <div className={iconClasses.container('red')}>
                    <TrendingDown className={iconClasses.icon('red')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={theme.animations.item}>
            <Card className={cardClasses.container('goldGradient')}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme.colors.text.secondary} mb-1`}>
                      Lucro Líquido
                    </p>
                    <h3
                      className={`text-3xl font-bold mb-2 ${
                        financialStats.profit >= 0
                          ? theme.colors.status.success
                          : theme.colors.status.error
                      }`}
                    >
                      {formatCurrency(financialStats.profit)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      Margem: {financialStats.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div className={iconClasses.container('gold')}>
                    <Wallet className={iconClasses.icon('gold')} />
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
                      Despesas Pendentes
                    </p>
                    <h3 className={`text-3xl font-bold ${theme.colors.text.primary} mb-2`}>
                      {formatCurrency(financialStats.pendingExpenses)}
                    </h3>
                    <p className={`text-xs ${theme.colors.text.tertiary}`}>
                      {periodExpenses.filter((e) => !e.isPaid).length}{" "}
                      pagamentos pendentes
                    </p>
                  </div>
                  <div className={iconClasses.container('yellow')}>
                    <AlertCircle className={iconClasses.icon('yellow')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <div className={pageClasses.grid2()}>
          {/* Despesas por Categoria */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <PieChart className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {expensesByCategory.map((cat) => {
                    const percentage =
                      financialStats.totalExpenses > 0
                        ? (cat.total / financialStats.totalExpenses) * 100
                        : 0;

                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded ${getCategoryColor(
                                cat.category
                              )}`}
                            />
                            <span className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                              {getCategoryLabel(cat.category)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${theme.colors.text.primary}`}>
                              {formatCurrency(cat.total)}
                            </span>
                            <span className={`text-xs ${theme.colors.text.tertiary} ml-2`}>
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getCategoryColor(
                              cat.category
                            )}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                          {cat.count}{" "}
                          {cat.count === 1 ? "transação" : "transações"}
                        </p>
                      </div>
                    );
                  })}
                  {expensesByCategory.length === 0 && (
                    <p className={`text-center ${theme.colors.text.secondary} text-sm py-4`}>
                      Nenhuma despesa no período selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Receitas por Método de Pagamento */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={cardClasses.container('base')}>
              <CardHeader className={theme.components.cardHeader}>
                <CardTitle className={`flex items-center gap-2 ${theme.components.cardTitle}`}>
                  <CreditCard className={`w-5 h-5 ${theme.colors.icon.gold}`} />
                  Receitas por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {revenuesByPaymentMethod.map((method) => {
                    const percentage =
                      financialStats.totalRevenue > 0
                        ? (method.total / financialStats.totalRevenue) * 100
                        : 0;

                    return (
                      <div key={method.method}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${theme.colors.text.secondary}`}>
                            {getPaymentMethodLabel(method.method)}
                          </span>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${theme.colors.text.primary}`}>
                              {formatCurrency(method.total)}
                            </span>
                            <span className={`text-xs ${theme.colors.text.tertiary} ml-2`}>
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gold"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                          {method.count}{" "}
                          {method.count === 1 ? "transação" : "transações"}
                        </p>
                      </div>
                    );
                  })}
                  {revenuesByPaymentMethod.length === 0 && (
                    <p className={`text-center ${theme.colors.text.secondary} text-sm py-4`}>
                      Nenhuma receita no período selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Últimas Transações */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={cardClasses.container('base')}>
            <CardHeader className={theme.components.cardHeader}>
              <CardTitle className={theme.components.cardTitle}>Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={theme.components.table.header}>
                    <tr>
                      <th className={theme.components.table.headerCell}>
                        Data
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Tipo
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Descrição
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Forma de Pagamento
                      </th>
                      <th className={theme.components.table.headerCell}>
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className={theme.components.table.body}>
                    {recentTransactions.map((transaction) => (
                      <tr
                        key={`${transaction.type}-${transaction.id}`}
                        className={theme.components.table.row}
                      >
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span className={`text-sm ${theme.colors.text.primary}`}>
                            {formatDate(transaction.date)}
                          </span>
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <Badge
                            variant={
                              transaction.type === "revenue"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.type === "revenue"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </td>
                        <td className={theme.components.table.cell}>
                          <span className={`text-sm ${theme.colors.text.primary}`}>
                            {transaction.description}
                          </span>
                          {"isPaid" in transaction && !transaction.isPaid && (
                            <Badge variant="warning" className="ml-2">
                              Pendente
                            </Badge>
                          )}
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          {transaction.paymentMethod ? (
                            <span className={`text-sm ${theme.colors.text.secondary}`}>
                              {getPaymentMethodLabel(transaction.paymentMethod)}
                            </span>
                          ) : (
                            <span className={`text-sm ${theme.colors.text.tertiary}`}>-</span>
                          )}
                        </td>
                        <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                          <span
                            className={`text-sm font-bold ${
                              transaction.type === "revenue"
                                ? theme.colors.status.success
                                : theme.colors.status.error
                            }`}
                          >
                            {transaction.type === "revenue" ? "+" : "-"}{" "}
                            {formatCurrency(transaction.amount)}
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

        {/* Despesas Pendentes */}
        {periodExpenses.filter((e) => !e.isPaid).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <Card className={cardClasses.statCard('yellow')}>
              <CardHeader className="border-b border-yellow-500/20 bg-yellow-500/10">
                <CardTitle className={`flex items-center gap-2 ${theme.colors.status.warning}`}>
                  <AlertCircle className="w-5 h-5" />
                  Despesas Pendentes de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={theme.components.table.header}>
                      <tr>
                        <th className={theme.components.table.headerCell}>
                          Vencimento
                        </th>
                        <th className={theme.components.table.headerCell}>
                          Descrição
                        </th>
                        <th className={theme.components.table.headerCell}>
                          Categoria
                        </th>
                        <th className={theme.components.table.headerCell}>
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className={theme.components.table.body}>
                      {periodExpenses
                        .filter((e) => !e.isPaid)
                        .map((expense) => (
                          <tr key={expense.id} className={theme.components.table.row}>
                            <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                              <span className={`text-sm ${theme.colors.text.primary}`}>
                                {formatDate(expense.date)}
                              </span>
                            </td>
                            <td className={theme.components.table.cell}>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${theme.colors.text.primary}`}>
                                  {expense.description}
                                </span>
                                {expense.recurring && (
                                  <Badge variant="outline" className="text-xs">
                                    Recorrente
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                              <Badge variant="outline">
                                {getCategoryLabel(expense.category)}
                              </Badge>
                            </td>
                            <td className={`${theme.components.table.cell} whitespace-nowrap`}>
                              <span className={`text-sm font-bold ${theme.colors.text.primary}`}>
                                {formatCurrency(expense.amount)}
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
        )}
      </div>
    </div>
  );
}
