import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  CreditCard,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { OwnerPageLayout } from "@/components/layout/OwnerPageLayout";
import { DateRangePicker } from "@/components/DateRangePicker";
import { mockAppointments, mockExpenses } from "@/data/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const gold = "#D4AF37";
const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
};
const divLine = { borderBottom: "1px solid rgba(255,255,255,0.06)" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RingChart({
  value,
  max,
  color,
  size = 52,
  sw = 4,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  sw?: number;
}) {
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={sw}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniSparkBar({
  heights,
  color,
}: {
  heights: number[];
  color: string;
}) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: color,
            opacity: 0.4 + (i / heights.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DateRange = { from?: Date; to?: Date };

// ─── Component ────────────────────────────────────────────────────────────────
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

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      rent: "#f87171",
      utilities: "#60a5fa",
      supplies: "#4ade80",
      salaries: "#c084fc",
      marketing: "#facc15",
      maintenance: "#fb923c",
      other: "#94a3b8",
    };
    return colors[category] || "#94a3b8";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <OwnerPageLayout
      title="Dashboard Financeiro"
      subtitle="Controle de entrada, saída e lucro da empresa"
    >
      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* ── HERO: Profit/Loss Feature Section ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div
          style={{
            ...card,
            background:
              "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(255,255,255,0.02) 60%)",
            border: "1px solid rgba(212,175,55,0.22)",
          }}
          className="p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Left: main profit figure */}
            <div className="flex-1">
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}
              >
                Resultado do Período
              </p>
              <p
                className="font-bold leading-none mb-4"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  color: financialStats.profit >= 0 ? "#22c55e" : "#f87171",
                }}
              >
                {financialStats.profit >= 0 ? "+" : ""}
                {formatCurrency(financialStats.profit)}
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Receita
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "#22c55e" }}>
                    {formatCurrency(financialStats.totalRevenue)}
                  </p>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 36,
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Despesas
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "#f87171" }}>
                    {formatCurrency(financialStats.totalExpenses)}
                  </p>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 36,
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Pendente
                  </p>
                  <p className="text-lg font-semibold" style={{ color: "#fbbf24" }}>
                    {formatCurrency(financialStats.pendingExpenses)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: two ring charts */}
            <div className="flex items-center gap-8 lg:gap-10">
              {/* Expense ratio ring */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <RingChart
                    value={financialStats.totalExpenses}
                    max={financialStats.totalRevenue}
                    color="#f87171"
                    size={80}
                    sw={6}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: "rotate(0deg)" }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#f87171" }}
                    >
                      {financialStats.totalRevenue > 0
                        ? (
                            (financialStats.totalExpenses /
                              financialStats.totalRevenue) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Razão
                  <br />
                  Despesas
                </p>
              </div>

              {/* Margin ring */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <RingChart
                    value={Math.max(financialStats.profitMargin, 0)}
                    max={100}
                    color={gold}
                    size={80}
                    sw={6}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: gold }}
                    >
                      {financialStats.profitMargin.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Margem
                  <br />
                  de Lucro
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
                <TrendingUp className="w-5 h-5" style={{ color: "#22c55e" }} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <ArrowUpRight className="w-4 h-4" style={{ color: "#22c55e" }} />
                <MiniSparkBar heights={[45, 60, 50, 80, 70, 95]} color="#22c55e" />
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
              {formatCurrency(financialStats.totalRevenue)}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {periodRevenues.length} transações
            </p>
          </div>
        </motion.div>

        {/* Despesas Pagas */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(248,113,113,0.12)" }}
              >
                <TrendingDown className="w-5 h-5" style={{ color: "#f87171" }} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <ArrowDownRight className="w-4 h-4" style={{ color: "#f87171" }} />
                <MiniSparkBar heights={[80, 65, 75, 55, 70, 60]} color="#f87171" />
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Despesas Pagas
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {formatCurrency(financialStats.totalExpenses)}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {periodExpenses.filter((e) => e.isPaid).length} pagamentos realizados
            </p>
          </div>
        </motion.div>

        {/* Lucro Líquido */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.12)" }}
              >
                <Wallet className="w-5 h-5" style={{ color: gold }} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="w-4 h-4" />
                <MiniSparkBar heights={[30, 45, 40, 65, 55, 80]} color={gold} />
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Lucro Líquido
            </p>
            <p
              className="text-2xl font-bold mb-1 leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: financialStats.profit >= 0 ? "#22c55e" : "#f87171",
              }}
            >
              {formatCurrency(financialStats.profit)}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Margem: {financialStats.profitMargin.toFixed(1)}%
            </p>
          </div>
        </motion.div>

        {/* Contas em Aberto */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        >
          <div style={card} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(251,191,36,0.12)" }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: "#fbbf24" }} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="w-4 h-4" />
                <MiniSparkBar heights={[50, 55, 45, 60, 50, 55]} color="#fbbf24" />
              </div>
            </div>
            <p
              className="text-xs mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}
            >
              Contas em Aberto
            </p>
            <p
              className="text-2xl font-bold text-white mb-1 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {formatCurrency(financialStats.pendingExpenses)}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              {periodExpenses.filter((e) => !e.isPaid).length} pagamentos pendentes
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Asymmetric 3/5 + 2/5 grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Left col-span-3: Expenses by category */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <div style={card} className="h-full">
            <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
              <BarChart2 className="w-4 h-4" style={{ color: gold }} />
              <span className="text-sm font-semibold text-white">
                Despesas por Categoria
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-5">
                {expensesByCategory.map((cat) => {
                  const percentage =
                    financialStats.totalExpenses > 0
                      ? (cat.total / financialStats.totalExpenses) * 100
                      : 0;
                  const catColor = getCategoryColor(cat.category);

                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: catColor }}
                          />
                          <span
                            className="text-sm font-medium"
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {getCategoryLabel(cat.category)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            {percentage.toFixed(1)}%
                          </span>
                          <span className="text-sm font-bold text-white">
                            {formatCurrency(cat.total)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="relative w-full h-2.5 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        <motion.div
                          className="absolute left-0 top-0 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.7 }}
                          style={{ background: catColor }}
                        />
                      </div>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {cat.count} {cat.count === 1 ? "transação" : "transações"}
                      </p>
                    </div>
                  );
                })}
                {expensesByCategory.length === 0 && (
                  <p
                    className="text-center text-sm py-4"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Nenhuma despesa no período selecionado
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right col-span-2: Payment methods with individual RingCharts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div style={card} className="h-full">
            <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
              <CreditCard className="w-4 h-4" style={{ color: gold }} />
              <span className="text-sm font-semibold text-white">
                Formas de Pagamento
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {revenuesByPaymentMethod.map((method, idx) => {
                  const percentage =
                    financialStats.totalRevenue > 0
                      ? (method.total / financialStats.totalRevenue) * 100
                      : 0;
                  const methodColors = [gold, "#818cf8", "#22c55e", "#60a5fa", "#fbbf24"];
                  const methodColor = methodColors[idx % methodColors.length];

                  return (
                    <div key={method.method} className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <RingChart
                          value={method.total}
                          max={financialStats.totalRevenue}
                          color={methodColor}
                          size={48}
                          sw={4}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: methodColor }}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className="text-sm font-medium truncate"
                            style={{ color: "rgba(255,255,255,0.55)" }}
                          >
                            {getPaymentMethodLabel(method.method)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(method.total)}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          {method.count}{" "}
                          {method.count === 1 ? "transação" : "transações"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {revenuesByPaymentMethod.length === 0 && (
                  <p
                    className="text-center text-sm py-4"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Nenhuma receita no período selecionado
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Transactions List ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <div style={card} className="h-full">
          <div className="px-5 py-4 flex items-center gap-2" style={divLine}>
            <Wallet className="w-4 h-4" style={{ color: gold }} />
            <span className="text-sm font-semibold text-white">
              Últimas Transações
            </span>
          </div>
          <div>
            {recentTransactions.map((transaction) => {
              const isRevenue = transaction.type === "revenue";
              const isPending =
                "isPaid" in transaction && !transaction.isPaid;
              const rowColor = isRevenue
                ? "#22c55e"
                : isPending
                ? "#fbbf24"
                : "#f87171";

              return (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    borderLeft: `3px solid ${rowColor}`,
                  }}
                >
                  {/* Date */}
                  <div className="w-24 flex-shrink-0">
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {formatDate(transaction.date)}
                    </span>
                  </div>

                  {/* Type badge */}
                  <div className="w-24 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${rowColor}18`,
                        color: rowColor,
                      }}
                    >
                      {isRevenue
                        ? "Receita"
                        : isPending
                        ? "Pendente"
                        : "Despesa"}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm truncate block"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {transaction.description}
                    </span>
                  </div>

                  {/* Payment method */}
                  <div className="w-20 flex-shrink-0 hidden sm:block">
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      {transaction.paymentMethod
                        ? getPaymentMethodLabel(transaction.paymentMethod)
                        : "—"}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className="text-sm font-bold"
                      style={{ color: rowColor }}
                    >
                      {isRevenue ? "+" : "−"}{" "}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <p
                className="text-center text-sm py-8"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Nenhuma transação no período selecionado
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Pending Expenses Alert Panel ── */}
      {periodExpenses.filter((e) => !e.isPaid).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div
            style={{
              ...card,
              background: "rgba(251,191,36,0.04)",
              border: "1px solid rgba(251,191,36,0.18)",
            }}
          >
            <div
              className="px-5 py-4 flex items-center gap-2"
              style={{
                borderBottom: "1px solid rgba(251,191,36,0.12)",
              }}
            >
              <AlertCircle className="w-4 h-4" style={{ color: "#fbbf24" }} />
              <span className="text-sm font-semibold" style={{ color: "#fbbf24" }}>
                Despesas Pendentes de Pagamento
              </span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#fbbf2418", color: "#fbbf24" }}
              >
                {periodExpenses.filter((e) => !e.isPaid).length} em aberto
              </span>
            </div>
            <div>
              {periodExpenses
                .filter((e) => !e.isPaid)
                .map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      borderLeft: "3px solid #fbbf24",
                    }}
                  >
                    {/* Due date */}
                    <div className="w-24 flex-shrink-0">
                      <span
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {formatDate(expense.date)}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span
                        className="text-sm truncate"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                      >
                        {expense.description}
                      </span>
                      {expense.recurring && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.35)",
                          }}
                        >
                          Recorrente
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="flex-shrink-0 hidden sm:block">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0">
                      <span
                        className="text-sm font-bold text-white"
                      >
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </OwnerPageLayout>
  );
}
