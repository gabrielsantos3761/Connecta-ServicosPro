import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { createBusiness, formatCNPJ, validateCNPJ, type CreateBusinessData, type BusinessHours } from '@/services/businessService'
import { updateProfessionalProfile } from '@/services/authService'
import { createProfessionalLink } from '@/services/professionalLinkService'
import { useToast } from '@/hooks/use-toast'

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { day: 'monday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'tuesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'wednesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'thursday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'friday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'saturday', open: '09:00', close: '14:00', isOpen: true },
  { day: 'sunday', open: '09:00', close: '14:00', isOpen: false },
]

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const CATEGORIES = [
  'Barbearia',
  'Salão de Beleza',
  'Clínica Estética',
  'Spa',
  'Manicure e Pedicure',
  'Massagem',
  'Tatuagem e Piercing',
  'Outros',
]

export function CadastrarEstabelecimento() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    description: '',
    category: 'Barbearia',
    phone: '',
    email: '',
    website: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(DEFAULT_BUSINESS_HOURS)

  const handleInputChange = (field: string, value: string) => {
    // Aplicar máscaras
    if (field === 'cnpj') {
      value = formatCNPJ(value)
    } else if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 11)
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    } else if (field === 'zipCode') {
      value = value.replace(/\D/g, '').slice(0, 8)
      value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2')
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBusinessHourChange = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    const newBusinessHours = [...businessHours]
    newBusinessHours[index] = { ...newBusinessHours[index], [field]: value }
    setBusinessHours(newBusinessHours)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para cadastrar um estabelecimento',
        variant: 'destructive',
      })
      return
    }

    // Validações
    if (!formData.name || !formData.cnpj || !formData.description || !formData.phone) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: 'Erro',
        description: 'CNPJ inválido',
        variant: 'destructive',
      })
      return
    }

    if (!formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos de endereço',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const businessData: CreateBusinessData = {
        name: formData.name,
        cnpj: formData.cnpj,
        description: formData.description,
        category: formData.category,
        phone: formData.phone,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        businessHours,
      }

      const newBusiness = await createBusiness(user.id, businessData)

      // Criar perfil de profissional do proprietário (se não existir)
      try {
        await updateProfessionalProfile(user.id, {
          phone: formData.phone,
          specialties: [],
        })
      } catch (error) {
        console.error('Erro ao criar perfil profissional do owner:', error)
      }

      // Vincular o proprietário como profissional ativo no próprio estabelecimento
      try {
        await createProfessionalLink({
          professionalId: user.id,
          professionalName: user.name,
          professionalEmail: user.email,
          professionalAvatar: user.avatar,
          businessId: newBusiness.id,
          businessName: formData.name,
          linkedBy: 'invite',
          status: 'active',
        })
      } catch (error) {
        console.error('Erro ao vincular owner como profissional:', error)
      }

      toast({
        title: 'Sucesso!',
        description: 'Estabelecimento cadastrado com sucesso',
      })

      navigate('/selecionar-empresa')
    } catch (error: any) {
      console.error('Erro ao cadastrar estabelecimento:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cadastrar estabelecimento',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/selecionar-empresa')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-gold" />
              <h1 className="text-2xl font-bold text-white">Cadastrar Estabelecimento</h1>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit}>
          {/* Informações Básicas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Nome do Estabelecimento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Barbearia do João"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj" className="text-white">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-white">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva seu estabelecimento..."
                    className="bg-white/10 border-white/20 text-white min-h-[100px]"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gold" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-white">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contato@exemplo.com"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className="text-white flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.exemplo.com"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Endereço */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-white">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Ex: Rua das Flores"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="number" className="text-white">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      placeholder="123"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complement" className="text-white">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      placeholder="Sala, Andar, etc."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood" className="text-white">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Centro"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-white">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="São Paulo"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-white">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-white">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="00000-000"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Horário de Funcionamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {businessHours.map((hour, index) => (
                  <div key={hour.day} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 w-40">
                      <input
                        type="checkbox"
                        checked={hour.isOpen}
                        onChange={(e) => handleBusinessHourChange(index, 'isOpen', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label className="text-white text-sm">{DAY_LABELS[hour.day]}</Label>
                    </div>
                    {hour.isOpen && (
                      <>
                        <Input
                          type="time"
                          value={hour.open}
                          onChange={(e) => handleBusinessHourChange(index, 'open', e.target.value)}
                          className="bg-white/10 border-white/20 text-white w-32"
                        />
                        <span className="text-white">às</span>
                        <Input
                          type="time"
                          value={hour.close}
                          onChange={(e) => handleBusinessHourChange(index, 'close', e.target.value)}
                          className="bg-white/10 border-white/20 text-white w-32"
                        />
                      </>
                    )}
                    {!hour.isOpen && <span className="text-gray-400 text-sm">Fechado</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Botão de Salvar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end gap-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/selecionar-empresa')}
              className="border-white/20 text-white hover:bg-white/10"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
              disabled={isLoading}
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Estabelecimento'}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
