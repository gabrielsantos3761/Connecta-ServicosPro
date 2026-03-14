import { useMemo } from 'react'
import { CreditCard, Smartphone, Banknote, DollarSign, FileText } from 'lucide-react'
import { Appointment, PaymentMethod } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PaymentMethodsChartProps {
  appointments: Appointment[]
}

const GOLD = '#D4AF37'

const paymentMethodConfig = {
  pix: {
    label: 'PIX',
    icon: Smartphone,
    color: '#0d9488',
  },
  credit: {
    label: 'Cartão de Crédito',
    icon: CreditCard,
    color: '#3b82f6',
  },
  debit: {
    label: 'Cartão de Débito',
    icon: CreditCard,
    color: '#a855f7',
  },
  cash: {
    label: 'Dinheiro',
    icon: Banknote,
    color: '#22c55e',
  },
  boleto: {
    label: 'Boleto',
    icon: FileText,
    color: '#f97316',
  },
}

export function PaymentMethodsChart({ appointments }: PaymentMethodsChartProps) {
  const paymentStats = useMemo(() => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed' && apt.paymentMethod)

    const stats = {
      pix: { count: 0, revenue: 0 },
      credit: { count: 0, revenue: 0 },
      debit: { count: 0, revenue: 0 },
      cash: { count: 0, revenue: 0 },
      boleto: { count: 0, revenue: 0 },
    }

    completedAppointments.forEach(apt => {
      if (apt.paymentMethod) {
        stats[apt.paymentMethod].count++
        stats[apt.paymentMethod].revenue += apt.price
      }
    })

    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0)

    return Object.entries(stats).map(([method, data]) => ({
      method: method as PaymentMethod,
      count: data.count,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue)
  }, [appointments])

  const totalRevenue = paymentStats.reduce((sum, stat) => sum + stat.revenue, 0)
  const totalCount = paymentStats.reduce((sum, stat) => sum + stat.count, 0)

  return (
    <div
      style={{
        gridColumn: '1 / -1',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '1.125rem',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <DollarSign style={{ width: '1.25rem', height: '1.25rem', color: GOLD, flexShrink: 0 }} />
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Formas de Pagamento
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {/* Method Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {paymentStats.map((stat, index) => {
            const config = paymentMethodConfig[stat.method]
            const Icon = config.icon

            return (
              <motion.div
                key={stat.method}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 36, delay: index * 0.06 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Icon + Count row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      background: `${config.color}22`,
                      border: `1px solid ${config.color}44`,
                      borderRadius: '0.5rem',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ width: '1.125rem', height: '1.125rem', color: config.color }} />
                  </div>
                  <span
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1,
                    }}
                  >
                    {stat.count}
                  </span>
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {config.label}
                </span>

                {/* Revenue + bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {formatCurrency(stat.revenue)}
                  </span>

                  {/* Progress bar track */}
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ type: 'spring', stiffness: 320, damping: 36, delay: index * 0.06 + 0.15 }}
                      style={{
                        height: '100%',
                        borderRadius: '9999px',
                        background: config.color,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)' }}>
                      {stat.percentage.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: config.color }}>
                      {totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(0) : 0}% transações
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Summary bar */}
        <div
          style={{
            background: `linear-gradient(135deg, ${GOLD}14, ${GOLD}08)`,
            border: `1px solid ${GOLD}33`,
            borderRadius: '0.875rem',
            padding: '1rem 1.25rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
                Total de Transações
              </p>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {totalCount}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
                Receita Total
              </p>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: GOLD, margin: 0 }}>
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem' }}>
                Ticket Médio
              </p>
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {totalCount > 0 ? formatCurrency(totalRevenue / totalCount) : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
