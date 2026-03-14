import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Plus,
  X,
  Percent,
  Loader2,
} from 'lucide-react'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import { getAppointmentsByBusiness, type Appointment } from '@/services/appointmentService'
import { formatCurrency } from '@/lib/utils'

type TabType = 'entradas' | 'despesas'
type StatusFilter = 'todos' | 'concluido' | 'agendado' | 'cancelado'

interface DespesaManual {
  id: string
  descricao: string
  valor: number
  data: string
  categoria: string
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all ${props.className ?? ''}`}
      style={{ ...inputStyle, ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'rgba(212,175,55,0.4)'; props.onFocus?.(e) }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; props.onBlur?.(e) }}
    />
  )
}

export function EntradaDespesas() {
  const { businessId } = useParams<{ businessId: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('entradas')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [despesasManuais, setDespesasManuais] = useState<DespesaManual[]>([])
  const [isAddDespesaModalOpen, setIsAddDespesaModalOpen] = useState(false)
  const [despesaForm, setDespesaForm] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
  })

  useEffect(() => {
    const id = businessId || localStorage.getItem('selected_business_id')
    if (!id) { setLoading(false); return }
    setLoading(true)
    getAppointmentsByBusiness(id)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [businessId])

  const calcularEntrada = (appt: Appointment): number => {
    if (appt.status === 'cancelled') return 0
    return appt.businessAmount ?? appt.servicePrice
  }

  const calcularDespesaProfissional = (appt: Appointment): number => {
    if (appt.status === 'cancelled') return 0
    return appt.professionalAmount ?? 0
  }

  const { receitaConfirmada, projecaoFaturamento, despesaProfissionaisConfirmada } = appointments.reduce(
    (acc, a) => {
      if (a.status === 'completed') {
        acc.receitaConfirmada += calcularEntrada(a)
        acc.despesaProfissionaisConfirmada += calcularDespesaProfissional(a)
      } else if (a.status === 'pending' || a.status === 'confirmed') {
        acc.projecaoFaturamento += calcularEntrada(a)
      }
      return acc
    },
    { receitaConfirmada: 0, projecaoFaturamento: 0, despesaProfissionaisConfirmada: 0 },
  )

  const despesasManuaisTotal = despesasManuais.reduce((sum, d) => sum + d.valor, 0)
  const totalDespesasConfirmadas = despesaProfissionaisConfirmada + despesasManuaisTotal

  const appointmentsFiltrados = (() => {
    if (statusFilter === 'todos') return appointments
    if (statusFilter === 'concluido') return appointments.filter(a => a.status === 'completed')
    if (statusFilter === 'agendado') return appointments.filter(a => a.status === 'pending' || a.status === 'confirmed')
    if (statusFilter === 'cancelado') return appointments.filter(a => a.status === 'cancelled')
    return appointments
  })()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <CheckCircle className="w-3 h-3" /> Concluído
          </span>
        )
      case 'confirmed':
        return (
          <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <CheckCircle className="w-3 h-3" /> Confirmado
          </span>
        )
      case 'pending':
        return (
          <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
            <Clock className="w-3 h-3" /> Pendente
          </span>
        )
      case 'cancelled':
        return (
          <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <XCircle className="w-3 h-3" /> Cancelado
          </span>
        )
      default:
        return null
    }
  }

  const getPaymentBadge = (appt: Appointment) => {
    if (appt.paymentType === 'fixed') {
      return (
        <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
          <DollarSign className="w-3 h-3" /> Fixo
        </span>
      )
    }
    if (appt.paymentType === 'percentage' && appt.commissionPercent != null) {
      return (
        <span className="text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1"
          style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc' }}>
          <Percent className="w-3 h-3" /> {appt.commissionPercent}% / {100 - appt.commissionPercent}%
        </span>
      )
    }
    return null
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleAddDespesa = () => {
    if (!despesaForm.descricao || !despesaForm.valor) return
    const nova: DespesaManual = {
      id: Date.now().toString(),
      descricao: despesaForm.descricao,
      valor: parseFloat(despesaForm.valor),
      data: despesaForm.data,
      categoria: despesaForm.categoria,
    }
    setDespesasManuais(prev => [...prev, nova])
    setIsAddDespesaModalOpen(false)
    setDespesaForm({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      categoria: '',
    })
  }

  const lucroLiquido = receitaConfirmada - totalDespesasConfirmadas
  const margemLucro = receitaConfirmada > 0 ? (lucroLiquido / receitaConfirmada) * 100 : 0

  const comissoes = appointments.filter(
    a => a.status === 'completed' && a.paymentType === 'percentage' && (a.professionalAmount ?? 0) > 0
  )

  if (loading) {
    return (
      <OwnerPageLayout title="Entrada/Despesas" subtitle="Gerencie suas entradas e despesas">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#D4AF37' }} />
          <span className="ml-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando dados financeiros...</span>
        </div>
      </OwnerPageLayout>
    )
  }

  return (
    <OwnerPageLayout title="Entrada/Despesas" subtitle="Gerencie suas entradas e despesas">

      {/* Resumo Geral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Receita Confirmada</p>
                  <p className="text-2xl font-bold" style={{ color: '#10b981', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(receitaConfirmada)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <TrendingDown className="w-6 h-6" style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Despesas Totais</p>
                  <p className="text-2xl font-bold" style={{ color: '#ef4444', fontFamily: "'Playfair Display', serif" }}>{formatCurrency(totalDespesasConfirmadas)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: lucroLiquido >= 0 ? 'rgba(212,175,55,0.15)' : 'rgba(239,68,68,0.15)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: lucroLiquido >= 0 ? '#D4AF37' : '#ef4444' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Lucro Líquido</p>
                  <p className="text-2xl font-bold" style={{ color: lucroLiquido >= 0 ? '#D4AF37' : '#ef4444', fontFamily: "'Playfair Display', serif" }}>
                    {formatCurrency(lucroLiquido)}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Margem: {margemLucro.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('entradas')}
            className="px-6 py-3 font-semibold transition-all duration-200 relative"
            style={{ color: activeTab === 'entradas' ? '#10b981' : 'rgba(255,255,255,0.4)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Entradas</span>
            </div>
            {activeTab === 'entradas' && (
              <motion.div
                layoutId="activeFinTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#10b981' }}
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('despesas')}
            className="px-6 py-3 font-semibold transition-all duration-200 relative"
            style={{ color: activeTab === 'despesas' ? '#ef4444' : 'rgba(255,255,255,0.4)' }}
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              <span>Despesas</span>
            </div>
            {activeTab === 'despesas' && (
              <motion.div
                layoutId="activeFinTab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#ef4444' }}
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'entradas' ? (
          <div className="space-y-6">
            {/* Cards de Resumo - ENTRADAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Receita Confirmada', value: receitaConfirmada, color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', Icon: CheckCircle, sub: 'Serviços concluídos' },
                { label: 'Projeção de Faturamento', value: projecaoFaturamento, color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', Icon: Clock, sub: 'Agendamentos pendentes' },
                { label: 'Total Previsto', value: receitaConfirmada + projecaoFaturamento, color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)', Icon: DollarSign, sub: 'Confirmado + Projeção' },
              ].map(({ label, value, color, borderColor, Icon, sub }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${borderColor}`, borderRadius: '1.125rem' }}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="text-3xl font-bold" style={{ color, fontFamily: "'Playfair Display', serif" }}>
                      {formatCurrency(value)}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'todos', label: 'Todos', activeColor: 'rgba(255,255,255,0.1)', activeText: '#fff' },
                { key: 'concluido', label: 'Concluídos', activeColor: 'rgba(16,185,129,0.15)', activeText: '#10b981' },
                { key: 'agendado', label: 'Agendados', activeColor: 'rgba(59,130,246,0.15)', activeText: '#3b82f6' },
                { key: 'cancelado', label: 'Cancelados', activeColor: 'rgba(239,68,68,0.15)', activeText: '#ef4444' },
              ].map(({ key, label, activeColor, activeText }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key as StatusFilter)}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    background: statusFilter === key ? activeColor : 'rgba(255,255,255,0.04)',
                    color: statusFilter === key ? activeText : 'rgba(255,255,255,0.5)',
                    border: statusFilter === key ? `1px solid ${activeText}40` : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Lista de Agendamentos */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }}>
              <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Calendar className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <span className="text-sm font-semibold text-white">Agendamentos ({appointmentsFiltrados.length})</span>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {appointmentsFiltrados.length > 0 ? (
                    appointmentsFiltrados.map((appt) => {
                      const entradaEstabelecimento = calcularEntrada(appt)
                      const paymentBadge = getPaymentBadge(appt)
                      const valueColor = appt.status === 'completed' ? '#10b981'
                        : (appt.status === 'pending' || appt.status === 'confirmed') ? '#3b82f6'
                        : 'rgba(255,255,255,0.3)'

                      return (
                        <motion.div
                          key={appt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-xl transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(212,175,55,0.12)' }}>
                              <User className="w-6 h-6" style={{ color: '#D4AF37' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h4 className="font-semibold text-white">{appt.clientName}</h4>
                                {getStatusBadge(appt.status)}
                                {paymentBadge}
                              </div>
                              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{appt.serviceName}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  {formatDate(appt.date)} às {appt.time}
                                </p>
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{appt.professionalName}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="text-xl font-bold"
                              style={{
                                color: valueColor,
                                fontFamily: "'Playfair Display', serif",
                                textDecoration: appt.status === 'cancelled' ? 'line-through' : 'none',
                              }}>
                              {formatCurrency(entradaEstabelecimento)}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              Total: {formatCurrency(appt.servicePrice)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
                      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum agendamento encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo - DESPESAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Despesas com Profissionais', value: despesaProfissionaisConfirmada, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', Icon: User, sub: 'Comissões pagas' },
                { label: 'Despesas Fixas', value: despesasManuaisTotal, color: '#f97316', borderColor: 'rgba(249,115,22,0.3)', Icon: DollarSign, sub: 'Despesas adicionais' },
                { label: 'Total de Despesas', value: totalDespesasConfirmadas, color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)', Icon: TrendingDown, sub: 'Total confirmado' },
              ].map(({ label, value, color, borderColor, Icon, sub }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${borderColor}`, borderRadius: '1.125rem' }}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="text-3xl font-bold" style={{ color, fontFamily: "'Playfair Display', serif" }}>
                      {formatCurrency(value)}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Adicionar Despesa */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddDespesaModalOpen(true)}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Despesa
              </button>
            </div>

            {/* Lista de Despesas Manuais */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }}>
              <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <DollarSign className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <span className="text-sm font-semibold text-white">Despesas Fixas ({despesasManuais.length})</span>
              </div>
              <div className="p-5">
                {despesasManuais.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma despesa adicionada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {despesasManuais.map((despesa) => (
                      <motion.div
                        key={despesa.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #ef4444' }}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{despesa.descricao}</h4>
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{despesa.categoria}</p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDate(despesa.data)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold" style={{ color: '#ef4444', fontFamily: "'Playfair Display', serif" }}>
                            {formatCurrency(despesa.valor)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Comissões de Profissionais */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }}>
              <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <User className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <span className="text-sm font-semibold text-white">Comissões de Profissionais ({comissoes.length})</span>
              </div>
              <div className="p-5">
                {comissoes.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma comissão registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comissoes.map((appt) => {
                      const despesaProf = calcularDespesaProfissional(appt)
                      return (
                        <motion.div
                          key={appt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #ef4444' }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-white">{appt.professionalName}</h4>
                              {getPaymentBadge(appt)}
                            </div>
                            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {appt.serviceName} — {appt.clientName}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {formatDate(appt.date)} • Total: {formatCurrency(appt.servicePrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold" style={{ color: '#ef4444', fontFamily: "'Playfair Display', serif" }}>
                              {formatCurrency(despesaProf)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal Adicionar Despesa */}
      <AnimatePresence>
        {isAddDespesaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'rgba(12,11,8,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', maxWidth: '480px', width: '100%' }}
            >
              <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Adicionar Despesa</h3>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Nova despesa manual</p>
                </div>
                <button
                  onClick={() => setIsAddDespesaModalOpen(false)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Descrição</label>
                  <StyledInput
                    value={despesaForm.descricao}
                    onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })}
                    placeholder="Ex: Água, Internet, Produtos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Valor (R$)</label>
                  <StyledInput
                    type="number"
                    step="0.01"
                    value={despesaForm.valor}
                    onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Categoria</label>
                  <StyledInput
                    value={despesaForm.categoria}
                    onChange={(e) => setDespesaForm({ ...despesaForm, categoria: e.target.value })}
                    placeholder="Ex: Utilidades, Produtos, Manutenção..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Data</label>
                  <StyledInput
                    type="date"
                    value={despesaForm.data}
                    onChange={(e) => setDespesaForm({ ...despesaForm, data: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsAddDespesaModalOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddDespesa}
                    disabled={!despesaForm.descricao || !despesaForm.valor}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OwnerPageLayout>
  )
}
