import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Calendar, Plus, Mail, Phone, Users, DollarSign, Percent, X, QrCode, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mockProfessionals } from '@/data/mockData'
import { cn } from '@/lib/utils'
import { theme, pageClasses } from '@/styles/theme'

type PaymentType = 'fixed' | 'percentage'

interface PaymentConfig {
  type: PaymentType
  fixedValue?: number
  percentageValue?: number
}

export function Profissionais() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isAddProfModalOpen, setIsAddProfModalOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>('percentage')
  const [fixedValue, setFixedValue] = useState('')
  const [percentageValue, setPercentageValue] = useState('40')
  const [linkCode] = useState('ABC123XYZ')
  const [copied, setCopied] = useState(false)

  const handleOpenPaymentModal = (professionalId: string) => {
    setSelectedProfessional(professionalId)
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedProfessional(null)
    setPaymentType('percentage')
    setFixedValue('')
    setPercentageValue('40')
  }

  const handleSavePayment = () => {
    const config: PaymentConfig = {
      type: paymentType,
      ...(paymentType === 'fixed' ? { fixedValue: parseFloat(fixedValue) } : { percentageValue: parseFloat(percentageValue) })
    }

    console.log('Configuração de pagamento salva:', {
      professionalId: selectedProfessional,
      config
    })

    alert('Configuração salva com sucesso!')
    handleClosePaymentModal()
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(linkCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Profissionais</h1>
          <p className="text-sm text-gray-400">Gerencie sua equipe</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className={`text-lg md:text-xl font-semibold ${theme.colors.text.primary}`}>
              {mockProfessionals.length} Profissionais
            </h2>
            <p className={`text-xs md:text-sm ${theme.colors.text.secondary} mt-1`}>
              {mockProfessionals.filter(p => p.available).length} disponíveis para agendamento
            </p>
          </div>

          <Button
            variant="gold"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setIsAddProfModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Profissional
          </Button>
        </div>

        {/* Professionals Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {mockProfessionals.map((professional, index) => (
            <motion.div
              key={professional.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className={`h-full ${theme.colors.card.base} hover:shadow-xl transition-all duration-300 group border-l-4 border-l-gold`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-gradient-to-br from-gold to-gold-dark p-3 rounded-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={professional.available ? "success" : "destructive"}>
                      {professional.available ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-gold transition-colors">
                    {professional.name}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className={`text-sm ${theme.colors.text.secondary} mb-4`}>
                    {professional.role}
                  </p>

                  {/* Rating */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`flex items-center gap-2 ${theme.colors.text.secondary}`}>
                        <Star className="w-4 h-4 text-gold fill-gold" />
                        Avaliação
                      </span>
                      <span className={`font-semibold ${theme.colors.text.primary}`}>
                        {professional.rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`flex items-center gap-2 ${theme.colors.text.secondary}`}>
                        <Calendar className="w-4 h-4 text-gold" />
                        Agendamentos
                      </span>
                      <span className={`font-semibold ${theme.colors.text.primary}`}>
                        {professional.totalAppointments}
                      </span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-4">
                    <p className={`text-xs ${theme.colors.text.tertiary} mb-2`}>
                      Especialidades:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {professional.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`space-y-2 pt-4 border-t ${theme.colors.border.light}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="w-3 h-3 mr-1" />
                        Ligar
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gold text-gold hover:bg-gold/10"
                      onClick={() => handleOpenPaymentModal(professional.id)}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Configurar Pagamento
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-gold hover:text-gold-dark hover:bg-white/5">
                      Ver Perfil Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal de Adicionar Profissional */}
      <AnimatePresence>
        {isAddProfModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProfModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className={`text-2xl font-bold ${theme.colors.text.primary}`}>
                      Vincular Profissional
                    </h3>
                    <p className={`text-sm ${theme.colors.text.secondary} mt-1`}>
                      Compartilhe o QR Code ou código
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddProfModalOpen(false)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className={`w-5 h-5 ${theme.colors.text.tertiary}`} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    <div className="w-64 h-64 bg-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                      <QrCode className={`w-32 h-32 ${theme.colors.text.tertiary}`} />
                    </div>
                    <p className={`text-sm ${theme.colors.text.secondary} text-center`}>
                      O profissional deve escanear este QR Code com o app
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className={`px-2 bg-gray-900 ${theme.colors.text.tertiary}`}>ou</span>
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <Label className={`${theme.colors.text.secondary} mb-2 block`}>Código de Vinculação</Label>
                    <div className="flex gap-2">
                      <Input
                        value={linkCode}
                        readOnly
                        className="font-mono text-center text-lg tracking-wider"
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopyCode}
                        className="px-4"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className={`text-xs ${theme.colors.text.tertiary} mt-2`}>
                      O profissional pode inserir este código manualmente
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Configuração de Pagamento */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePaymentModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className={`text-2xl font-bold ${theme.colors.text.primary}`}>
                      Configurar Pagamento
                    </h3>
                    <p className={`text-sm ${theme.colors.text.secondary} mt-1`}>
                      Defina como o profissional será remunerado
                    </p>
                  </div>
                  <button
                    onClick={handleClosePaymentModal}
                    className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className={`w-5 h-5 ${theme.colors.text.tertiary}`} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Tipo de Pagamento */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentType('percentage')}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all group",
                        paymentType === 'percentage'
                          ? "border-gold bg-gold/10"
                          : "border-white/20 hover:border-gold/50 hover:bg-gold/5"
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          paymentType === 'percentage' ? "bg-gold" : "bg-white/5 group-hover:bg-gold/20"
                        )}>
                          <Percent className={cn(
                            "w-6 h-6",
                            paymentType === 'percentage' ? "text-white" : `${theme.colors.text.secondary} group-hover:text-gold`
                          )} />
                        </div>
                        <div className="text-center">
                          <h4 className={cn(
                            "font-semibold",
                            paymentType === 'percentage' ? "text-gold" : theme.colors.text.primary
                          )}>
                            Porcentagem
                          </h4>
                          <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>Por serviço</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentType('fixed')}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all group",
                        paymentType === 'fixed'
                          ? "border-gold bg-gold/10"
                          : "border-white/20 hover:border-gold/50 hover:bg-gold/5"
                      )}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          paymentType === 'fixed' ? "bg-gold" : "bg-white/5 group-hover:bg-gold/20"
                        )}>
                          <DollarSign className={cn(
                            "w-6 h-6",
                            paymentType === 'fixed' ? "text-white" : `${theme.colors.text.secondary} group-hover:text-gold`
                          )} />
                        </div>
                        <div className="text-center">
                          <h4 className={cn(
                            "font-semibold",
                            paymentType === 'fixed' ? "text-gold" : theme.colors.text.primary
                          )}>
                            Valor Fixo
                          </h4>
                          <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>Mensal</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Configuração de Valor */}
                  {paymentType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="percentage" className={theme.colors.text.secondary}>
                        Porcentagem do Profissional (%)
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={percentageValue}
                          onChange={(e) => setPercentageValue(e.target.value)}
                          className="text-lg"
                        />
                        <span className={`text-sm ${theme.colors.text.tertiary} whitespace-nowrap`}>
                          Estabelecimento: {100 - parseFloat(percentageValue || '0')}%
                        </span>
                      </div>
                      <p className={`text-xs ${theme.colors.text.tertiary}`}>
                        Exemplo: Serviço de R$ 100 → Profissional recebe R$ {parseFloat(percentageValue || '0')} e estabelecimento recebe R$ {100 - parseFloat(percentageValue || '0')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="fixed" className={theme.colors.text.secondary}>
                        Valor Mensal Fixo (R$)
                      </Label>
                      <Input
                        id="fixed"
                        type="number"
                        min="0"
                        step="0.01"
                        value={fixedValue}
                        onChange={(e) => setFixedValue(e.target.value)}
                        placeholder="Ex: 3000.00"
                        className="text-lg"
                      />
                      <p className={`text-xs ${theme.colors.text.tertiary}`}>
                        O profissional receberá este valor fixo mensalmente, independente do número de serviços
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleClosePaymentModal}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="gold"
                      onClick={handleSavePayment}
                      className="flex-1"
                      disabled={paymentType === 'fixed' && !fixedValue}
                    >
                      Salvar Configuração
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
