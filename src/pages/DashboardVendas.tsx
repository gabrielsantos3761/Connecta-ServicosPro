import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Users,
  Target,
  Award,
  Star,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { mockAppointments } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { DateRangePicker, type DateRange } from "@/components/DateRangePicker";
import { OwnerPageLayout } from "@/components/layout/OwnerPageLayout";

// ─── Design tokens ────────────────────────────────────────────────────────────
const gold = "#D4AF37";
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "1.125rem",
};
const divLine = { borderBottom: "1px solid rgba(255,255,255,0.06)" };
const spring = { type: "spring", stiffness: 320, damping: 36 };

const medalGradients = [
  "linear-gradient(135deg,#D4AF37,#B8941E)",
  "linear-gradient(135deg,#9ca3af,#6b7280)",
  "linear-gradient(135deg,#b45309,#92400e)",
  "linear-gradient(135deg,#6366f1,#4f46e5)",
  "linear-gradient(135deg,#22c55e,#16a34a)",
];

function perfBadge(perf: string): React.CSSProperties {
  if (perf === "Alta") return { background: "rgba(34,197,94,0.15)", color: "#22c55e", borderRadius: "9999px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 };
  if (perf === "Média") return { background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: "9999px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 };
  return { background: "rgba(248,113,113,0.15)", color: "#f87171", borderRadius: "9999px", padding: "2px 10px", fontSize: "0.72rem", fontWeight: 600 };
}

export default function DashboardVendas() {
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({ from: today, to: today });

  const salesData = useMemo(() => {
    const from = dateRange.from || today;
    const to = dateRange.to || today;

    const filteredAppointments = mockAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= from && aptDate <= to && apt.status === "completed";
    });

    const servicesSales = filteredAppointments.reduce((acc, apt) => {
      if (!acc[apt.service]) acc[apt.service] = { count: 0, revenue: 0 };
      acc[apt.service].count += 1;
      acc[apt.service].revenue += apt.price;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const professionalSales = filteredAppointments.reduce((acc, apt) => {
      if (!acc[apt.professional]) acc[apt.professional] = { count: 0, revenue: 0 };
      acc[apt.professional].count += 1;
      acc[apt.professional].revenue += apt.price;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    const topServices = Object.entries(servicesSales).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
    const topProfessionals = Object.entries(professionalSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
    const totalSales = filteredAppointments.length;
    const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
    const uniqueClients = new Set(filteredAppointments.map((apt) => apt.clientName)).size;
    const conversionRate = 85;

    return { totalSales, totalRevenue, uniqueClients, conversionRate, topServices, topProfessionals, servicesSales, professionalSales };
  }, [dateRange]);

  const statsCards = [
    { title: "Total de Vendas", value: salesData.totalSales.toString(), icon: ShoppingCart, trend: "+18.2%" },
    { title: "Receita de Vendas", value: formatCurrency(salesData.totalRevenue), icon: TrendingUp, trend: "+23.5%" },
    { title: "Clientes Únicos", value: salesData.uniqueClients.toString(), icon: Users, trend: "+12.8%" },
    { title: "Taxa de Conversão", value: `${salesData.conversionRate}%`, icon: Target, trend: "+5.3%" },
  ];

  return (
    <OwnerPageLayout title="Painel de Vendas" subtitle="Análise de desempenho de vendas e serviços">
      <div className="mb-6 flex justify-end">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.07 }}
            style={{ ...card, padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ background: "rgba(212,175,55,0.1)", borderRadius: "0.625rem", padding: "0.625rem", display: "flex" }}>
                <stat.icon size={20} style={{ color: gold }} />
              </div>
              <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", borderRadius: "9999px", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                {stat.trend}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.25rem" }}>{stat.title}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", lineHeight: 1.1 }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Serviços */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: 0.3 }}
          style={{ ...card }}
        >
          <div style={{ padding: "1.25rem 1.5rem", ...divLine, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={18} style={{ color: gold }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#fff" }}>Top 5 Serviços Mais Vendidos</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {salesData.topServices.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>Nenhuma venda no período</p>
            ) : (
              salesData.topServices.map(([service, data], i) => {
                const maxCount = salesData.topServices[0][1].count;
                const pct = (data.count / maxCount) * 100;
                return (
                  <div key={service}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: medalGradients[i] || medalGradients[4], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#050400" }}>#{i + 1}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{service}</p>
                          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{data.count} vendas</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: gold }}>{formatCurrency(data.revenue)}</p>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ ...spring, delay: 0.4 + i * 0.06 }}
                        style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${gold},#B8941E)` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Top 5 Profissionais */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          style={{ ...card }}
        >
          <div style={{ padding: "1.25rem 1.5rem", ...divLine, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award size={18} style={{ color: gold }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#fff" }}>Top 5 Profissionais</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {salesData.topProfessionals.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>Nenhuma venda no período</p>
            ) : (
              salesData.topProfessionals.map(([professional, data], i) => {
                const maxRevenue = salesData.topProfessionals[0][1].revenue;
                const pct = (data.revenue / maxRevenue) * 100;
                return (
                  <div key={professional}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: medalGradients[i] || medalGradients[4], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {i === 0 ? <Star size={14} style={{ color: "#050400", fill: "#050400" }} /> : <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#050400" }}>#{i + 1}</span>}
                        </div>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{professional}</p>
                          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{data.count} atendimentos</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: gold }}>{formatCurrency(data.revenue)}</p>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ ...spring, delay: 0.45 + i * 0.06 }}
                        style={{ height: "100%", borderRadius: 2, background: medalGradients[i] || medalGradients[4] }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Tabela de Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.5 }}
        style={{ ...card, marginTop: "1.5rem" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", ...divLine, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <BarChart3 size={18} style={{ color: gold }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#fff" }}>Análise de Performance por Serviço</span>
        </div>
        <div style={{ padding: "0 0.5rem 0.5rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={divLine}>
                {["Serviço", "Vendas", "Receita", "Ticket Médio", "Performance"].map((h, i) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", textAlign: i === 0 ? "left" : i === 4 ? "center" : "right", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(salesData.servicesSales).sort((a, b) => b[1].revenue - a[1].revenue).map(([service, data]) => {
                const avgTicket = data.revenue / data.count;
                const perf = data.count > 10 ? "Alta" : data.count > 5 ? "Média" : "Baixa";
                return (
                  <tr key={service} style={divLine}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{service}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textAlign: "right" }}>{data.count}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#22c55e", textAlign: "right" }}>{formatCurrency(data.revenue)}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textAlign: "right" }}>{formatCurrency(avgTicket)}</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                      <span style={perfBadge(perf)}>{perf}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </OwnerPageLayout>
  );
}
