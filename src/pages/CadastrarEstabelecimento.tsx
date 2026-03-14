import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Clock, Save } from 'lucide-react'
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

// ============================================
// STYLES
// ============================================

const SPRING = { type: 'spring', stiffness: 320, damping: 36 }

const GOLD = '#D4AF37'
const BG = '#050400'

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
  padding: '1.5rem',
  marginBottom: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#fff',
  padding: '0.5rem 0.75rem',
  outline: 'none',
  width: '100%',
  fontSize: '0.875rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.375rem',
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#fff',
  fontFamily: "'Playfair Display', serif",
  fontSize: '1rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.25rem',
  paddingBottom: '0.75rem',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const goldBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: BG,
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9375rem',
}

const ghostBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '0.5rem',
  color: 'rgba(255,255,255,0.6)',
  padding: '0.625rem 1.5rem',
  cursor: 'pointer',
  fontSize: '0.9375rem',
}

// ============================================
// COMPONENT
// ============================================

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
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        style={{
          background: 'rgba(5,4,0,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => navigate('/selecionar-empresa')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: 0,
              }}
            >
              <ArrowLeft style={{ width: 18, height: 18 }} />
              Voltar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 style={{ width: 28, height: 28, color: GOLD }} />
              <h1 style={{
                fontSize: '1.375rem',
                fontWeight: 700,
                color: '#fff',
                fontFamily: "'Playfair Display', serif",
                margin: 0,
              }}>
                Cadastrar Estabelecimento
              </h1>
            </div>

            <div style={{ width: 96 }} /> {/* Spacer for centering */}
          </div>
        </div>
      </motion.header>

      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <form onSubmit={handleSubmit}>

          {/* Informações Básicas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.08 }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <Building2 style={{ width: 18, height: 18, color: GOLD }} />
                Informações Básicas
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Nome do Estabelecimento *</label>
                  <input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Barbearia do João"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cnpj" style={labelStyle}>CNPJ *</label>
                  <input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="category" style={labelStyle}>Categoria *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ ...inputStyle }}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: BG }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" style={labelStyle}>Descrição *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva seu estabelecimento..."
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Contato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.16 }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <Phone style={{ width: 18, height: 18, color: GOLD }} />
                Contato
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="phone" style={labelStyle}>Telefone *</label>
                  <input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" style={labelStyle}>
                    <Mail style={{ width: 14, height: 14, display: 'inline', marginRight: '0.25rem' }} />
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@exemplo.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="website" style={labelStyle}>
                  <Globe style={{ width: 14, height: 14, display: 'inline', marginRight: '0.25rem' }} />
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.exemplo.com"
                  style={inputStyle}
                />
              </div>
            </div>
          </motion.div>

          {/* Endereço */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.24 }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <MapPin style={{ width: 18, height: 18, color: GOLD }} />
                Endereço
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="street" style={labelStyle}>Rua *</label>
                  <input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Ex: Rua das Flores"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="number" style={labelStyle}>Número *</label>
                  <input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="123"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="complement" style={labelStyle}>Complemento</label>
                  <input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Sala, Andar, etc."
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label htmlFor="neighborhood" style={labelStyle}>Bairro *</label>
                  <input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Centro"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label htmlFor="city" style={labelStyle}>Cidade *</label>
                  <input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" style={labelStyle}>Estado *</label>
                  <input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" style={labelStyle}>CEP *</label>
                  <input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="00000-000"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Horário de Funcionamento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.32 }}
          >
            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>
                <Clock style={{ width: 18, height: 18, color: GOLD }} />
                Horário de Funcionamento
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {businessHours.map((hour, index) => (
                  <div
                    key={hour.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      background: hour.isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                      border: hour.isOpen ? '1px solid rgba(212,175,55,0.15)' : '1px solid rgba(255,255,255,0.05)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 160 }}>
                      <input
                        type="checkbox"
                        checked={hour.isOpen}
                        onChange={(e) => handleBusinessHourChange(index, 'isOpen', e.target.checked)}
                        style={{
                          width: 16, height: 16,
                          accentColor: GOLD,
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: hour.isOpen ? '#fff' : 'rgba(255,255,255,0.35)',
                      }}>
                        {DAY_LABELS[hour.day]}
                      </span>
                    </div>

                    {hour.isOpen && (
                      <>
                        <input
                          type="time"
                          value={hour.open}
                          onChange={(e) => handleBusinessHourChange(index, 'open', e.target.value)}
                          style={{ ...inputStyle, width: 'auto', minWidth: 110 }}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>às</span>
                        <input
                          type="time"
                          value={hour.close}
                          onChange={(e) => handleBusinessHourChange(index, 'close', e.target.value)}
                          style={{ ...inputStyle, width: 'auto', minWidth: 110 }}
                        />
                      </>
                    )}
                    {!hour.isOpen && (
                      <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.25)' }}>Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Botão de Salvar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.4 }}
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}
          >
            <button
              type="button"
              onClick={() => navigate('/selecionar-empresa')}
              style={{ ...ghostBtnStyle, opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ ...goldBtnStyle, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              disabled={isLoading}
            >
              <Save style={{ width: 18, height: 18 }} />
              {isLoading ? 'Salvando...' : 'Salvar Estabelecimento'}
            </button>
          </motion.div>

        </form>
      </div>
    </div>
  )
}
