import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Building2,
  Globe,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  formatCNPJ,
  validateCNPJ,
  type BusinessHours,
} from '@/services/businessService'
import {
  getAllBusinessConfigs,
  saveConfigInformacoes,
  saveConfigFotos,
  saveConfigContato,
  saveConfigEndereco,
  saveConfigHorarios,
} from '@/services/businessConfigService'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD = '#D4AF37'
const BG = '#050400'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
  padding: '2rem',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#fff',
  padding: '0.5rem 0.75rem',
  width: '100%',
  outline: 'none',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.4rem',
  fontSize: '0.8125rem',
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 500,
  letterSpacing: '0.03em',
}

const dividerStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  marginBottom: '1.5rem',
  paddingBottom: '1.5rem',
}

const springTransition = { type: 'spring' as const, stiffness: 320, damping: 36 }

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

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

// ─── Component ────────────────────────────────────────────────────────────────
export function ConfiguracoesEstabelecimento() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

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

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [mainImage, setMainImage] = useState<string>('')
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('info')

  // Carregar dados das subcoleções (com fallback ao doc principal)
  useEffect(() => {
    const loadBusiness = async () => {
      const selectedBusinessId = localStorage.getItem('selected_business_id')
      if (!selectedBusinessId) {
        toast({
          title: 'Erro',
          description: 'Nenhum estabelecimento selecionado',
          variant: 'destructive',
        })
        navigate('/selecionar-empresa')
        return
      }

      setBusinessId(selectedBusinessId)

      try {
        setIsLoading(true)
        const configs = await getAllBusinessConfigs(selectedBusinessId)

        const { informacoes, fotos, contato, endereco, horarios } = configs

        setFormData({
          name: informacoes.name ?? '',
          cnpj: informacoes.cnpj ?? '',
          description: informacoes.description ?? '',
          category: informacoes.category ?? 'Barbearia',
          phone: contato.phone ?? '',
          email: contato.email ?? '',
          website: contato.website ?? '',
          street: endereco.street ?? '',
          number: endereco.number ?? '',
          complement: endereco.complement ?? '',
          neighborhood: endereco.neighborhood ?? '',
          city: endereco.city ?? '',
          state: endereco.state ?? '',
          zipCode: endereco.zipCode ?? '',
        })

        setBusinessHours(horarios.businessHours ?? [])
        setMainImage(fotos.image ?? '')
        setGalleryImages(fotos.gallery ?? [])
      } catch (error: any) {
        console.error('Erro ao carregar estabelecimento:', error)
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do estabelecimento',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBusiness()
  }, [navigate, toast])

  const handleInputChange = (field: string, value: string) => {
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

  const validateInfoTab = () => {
    return !!(
      formData.name?.trim() &&
      formData.cnpj?.trim() &&
      validateCNPJ(formData.cnpj) &&
      formData.description?.trim() &&
      formData.category
    )
  }

  const validateContactTab = () => {
    return !!(formData.phone?.trim())
  }

  const validateAddressTab = () => {
    return !!(
      formData.street?.trim() &&
      formData.number?.trim() &&
      formData.neighborhood?.trim() &&
      formData.city?.trim() &&
      formData.state?.trim() &&
      formData.zipCode?.trim()
    )
  }

  const getTabName = (tab: string) => {
    const names: Record<string, string> = {
      info: 'Informações Básicas',
      photos: 'Fotos',
      contact: 'Contato',
      address: 'Endereço',
      hours: 'Horários',
    }
    return names[tab] || tab
  }

  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !businessId) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Por favor, selecione apenas imagens', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 5MB', variant: 'destructive' })
      return
    }

    setIsUploadingImage(true)
    try {
      const storageRef = ref(storage, `businesses/${businessId}/main-${Date.now()}.jpg`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setMainImage(downloadURL)
      await saveConfigFotos(businessId, { image: downloadURL, gallery: galleryImages })

      toast({ title: 'Sucesso!', description: 'Imagem principal atualizada' })
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      toast({ title: 'Erro', description: 'Erro ao fazer upload da imagem', variant: 'destructive' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleGalleryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !businessId) return

    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Aviso', description: `${file.name} não é uma imagem válida`, variant: 'destructive' })
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Aviso', description: `${file.name} excede o tamanho máximo de 5MB`, variant: 'destructive' })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return
    if (galleryImages.length + validFiles.length > 10) {
      toast({ title: 'Erro', description: 'Você pode ter no máximo 10 imagens na galeria', variant: 'destructive' })
      return
    }

    setIsUploadingImage(true)
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const storageRef = ref(storage, `businesses/${businessId}/gallery-${Date.now()}-${Math.random()}.jpg`)
        await uploadBytes(storageRef, file)
        return getDownloadURL(storageRef)
      })

      const downloadURLs = await Promise.all(uploadPromises)
      const newGallery = [...galleryImages, ...downloadURLs]
      setGalleryImages(newGallery)

      await saveConfigFotos(businessId, { image: mainImage || undefined, gallery: newGallery })

      toast({ title: 'Sucesso!', description: `${downloadURLs.length} imagem(ns) adicionada(s) à galeria` })
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error)
      toast({ title: 'Erro', description: 'Erro ao fazer upload das imagens', variant: 'destructive' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!businessId) return
    try {
      const newGallery = galleryImages.filter((url) => url !== imageUrl)
      setGalleryImages(newGallery)

      await saveConfigFotos(businessId, { image: mainImage || undefined, gallery: newGallery })

      try {
        await deleteObject(ref(storage, imageUrl))
      } catch { /* ignora erro de storage */ }

      toast({ title: 'Sucesso!', description: 'Imagem removida da galeria' })
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
      toast({ title: 'Erro', description: 'Erro ao remover imagem', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!businessId) return

    if (!validateInfoTab()) {
      setActiveTab('info')
      toast({ title: 'Campos obrigatórios faltando', description: `Por favor, complete a seção ${getTabName('info')}`, variant: 'destructive' })
      return
    }
    if (!validateContactTab()) {
      setActiveTab('contact')
      toast({ title: 'Campos obrigatórios faltando', description: `Por favor, complete a seção ${getTabName('contact')}`, variant: 'destructive' })
      return
    }
    if (!validateAddressTab()) {
      setActiveTab('address')
      toast({ title: 'Campos obrigatórios faltando', description: `Por favor, complete a seção ${getTabName('address')}`, variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      await Promise.all([
        saveConfigInformacoes(businessId, {
          name: formData.name,
          cnpj: formData.cnpj,
          description: formData.description,
          category: formData.category,
        }),
        saveConfigContato(businessId, {
          phone: formData.phone,
          email: formData.email || undefined,
          website: formData.website || undefined,
        }),
        saveConfigEndereco(businessId, {
          street: formData.street,
          number: formData.number,
          complement: formData.complement || undefined,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        }),
        saveConfigHorarios(businessId, { businessHours }),
      ])

      toast({ title: 'Sucesso!', description: 'Estabelecimento atualizado com sucesso' })
    } catch (error: any) {
      console.error('Erro ao atualizar estabelecimento:', error)
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar estabelecimento', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: BG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${GOLD}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            Carregando configurações…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ─── Shared field builder ────────────────────────────────────────────────────
  const Field = ({
    id,
    label,
    children,
  }: {
    id?: string
    label: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {children}
    </div>
  )

  // ─── Section header ──────────────────────────────────────────────────────────
  const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div style={{ ...dividerStyle, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <span style={{ color: GOLD }}>{icon}</span>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#fff',
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  )

  // ─── Tab indicator dot ───────────────────────────────────────────────────────
  const ErrorDot = () => (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#ef4444',
        marginLeft: 5,
        flexShrink: 0,
      }}
    />
  )

  return (
    <OwnerPageLayout
      title="Configurações do Estabelecimento"
      subtitle="Gerencie as informações do seu estabelecimento"
    >
      {/* Save button row */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: isSaving
              ? 'rgba(212,175,55,0.4)'
              : 'linear-gradient(135deg,#D4AF37,#B8941E)',
            color: '#050400',
            fontWeight: 600,
            borderRadius: '0.5rem',
            padding: '0.625rem 1.5rem',
            border: 'none',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9375rem',
            letterSpacing: '0.02em',
            transition: 'opacity 0.2s',
          }}
        >
          <Save size={16} />
          {isSaving ? 'Salvando…' : 'Salvar Alterações'}
        </button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab bar */}
        <TabsList
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.25rem',
            marginBottom: '2rem',
            height: 'auto',
          }}
        >
          {[
            { value: 'info', icon: <Building2 size={15} />, label: 'Informações', invalid: !validateInfoTab() },
            { value: 'photos', icon: <ImageIcon size={15} />, label: 'Fotos', invalid: false },
            { value: 'contact', icon: <Phone size={15} />, label: 'Contato', invalid: !validateContactTab() },
            { value: 'address', icon: <MapPin size={15} />, label: 'Endereço', invalid: !validateAddressTab() },
            { value: 'hours', icon: <Clock size={15} />, label: 'Horários', invalid: false },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem' }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.invalid && <ErrorDot />}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Informações Básicas ──────────────────────────────────────────── */}
        <TabsContent value="info">
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            style={card}
          >
            <SectionHeader icon={<Building2 size={20} />} title="Informações Básicas" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <Field id="name" label="Nome do Estabelecimento *">
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
              <Field id="cnpj" label="CNPJ *">
                <input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                  disabled
                  title="CNPJ não pode ser alterado"
                />
              </Field>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <Field id="category" label="Categoria *">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: '#0d0c08' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="description" label="Descrição *">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                required
              />
            </Field>
          </motion.div>
        </TabsContent>

        {/* ── Fotos ────────────────────────────────────────────────────────── */}
        <TabsContent value="photos">
          <motion.div
            key="photos"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            style={card}
          >
            <SectionHeader icon={<ImageIcon size={20} />} title="Fotos do Estabelecimento" />

            {/* Imagem Principal */}
            <div style={dividerStyle}>
              <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>Imagem Principal</p>

              {mainImage && (
                <div
                  style={{
                    width: '100%',
                    height: 192,
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: `1px solid rgba(212,175,55,0.25)`,
                    marginBottom: '1rem',
                  }}
                >
                  <img src={mainImage} alt="Imagem principal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <label
                htmlFor="main-image-upload"
                style={{ cursor: isUploadingImage ? 'not-allowed' : 'pointer', opacity: isUploadingImage ? 0.5 : 1 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: `2px dashed rgba(255,255,255,0.12)`,
                    borderRadius: '0.75rem',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.4)'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  <Upload size={18} style={{ color: GOLD }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                    {mainImage ? 'Alterar Imagem Principal' : 'Selecionar Imagem Principal'}
                  </span>
                </div>
                <input
                  id="main-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  style={{ display: 'none' }}
                  disabled={isUploadingImage}
                />
              </label>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Esta imagem será exibida como destaque do seu estabelecimento. Tamanho máximo: 5MB
              </p>
            </div>

            {/* Galeria */}
            <div>
              <p style={{ ...labelStyle, marginBottom: '0.75rem' }}>
                Galeria de Fotos ({galleryImages.length}/10)
              </p>

              {galleryImages.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AnimatePresence>
                    {galleryImages.map((imageUrl, index) => (
                      <motion.div
                        key={imageUrl}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={springTransition}
                        style={{
                          position: 'relative',
                          aspectRatio: '1 / 1',
                          borderRadius: '0.625rem',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        className="group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Galeria ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => handleRemoveGalleryImage(imageUrl)}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'rgba(239,68,68,0.9)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {galleryImages.length < 10 && (
                <>
                  <label
                    htmlFor="gallery-image-upload"
                    style={{ cursor: isUploadingImage ? 'not-allowed' : 'pointer', opacity: isUploadingImage ? 0.5 : 1, display: 'block' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '2rem 1rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '2px dashed rgba(255,255,255,0.12)',
                        borderRadius: '0.75rem',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.4)'
                        ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'
                        ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <Upload size={22} style={{ color: GOLD }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                        Adicionar Fotos à Galeria
                      </span>
                    </div>
                    <input
                      id="gallery-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImageUpload}
                      style={{ display: 'none' }}
                      disabled={isUploadingImage}
                    />
                  </label>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Selecione até {10 - galleryImages.length} fotos do seu estabelecimento. Tamanho máximo por foto: 5MB
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Contato ──────────────────────────────────────────────────────── */}
        <TabsContent value="contact">
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            style={card}
          >
            <SectionHeader icon={<Phone size={20} />} title="Contato" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <Field id="phone" label="Telefone *">
                <input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={inputStyle}
                  placeholder="(00) 00000-0000"
                  required
                />
              </Field>
              <Field
                id="email"
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={13} /> E-mail
                  </span>
                }
              >
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={inputStyle}
                  placeholder="contato@exemplo.com"
                />
              </Field>
            </div>

            <Field
              id="website"
              label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Globe size={13} /> Website
                </span>
              }
            >
              <input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                style={inputStyle}
                placeholder="https://www.exemplo.com"
              />
            </Field>
          </motion.div>
        </TabsContent>

        {/* ── Endereço ─────────────────────────────────────────────────────── */}
        <TabsContent value="address">
          <motion.div
            key="address"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            style={card}
          >
            <SectionHeader icon={<MapPin size={20} />} title="Endereço" />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Field id="street" label="Rua *">
                <input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
              <Field id="number" label="Número *">
                <input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <Field id="complement" label="Complemento">
                <input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field id="neighborhood" label="Bairro *">
                <input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px', gap: '1rem' }}>
              <Field id="city" label="Cidade *">
                <input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  style={inputStyle}
                  required
                />
              </Field>
              <Field id="state" label="UF *">
                <input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  maxLength={2}
                  style={{ ...inputStyle, textTransform: 'uppercase' }}
                  placeholder="SP"
                  required
                />
              </Field>
              <Field id="zipCode" label="CEP *">
                <input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  style={inputStyle}
                  placeholder="00000-000"
                  required
                />
              </Field>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Horários ─────────────────────────────────────────────────────── */}
        <TabsContent value="hours">
          <motion.div
            key="hours"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            style={card}
          >
            <SectionHeader icon={<Clock size={20} />} title="Horário de Funcionamento" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DAYS_ORDER.map((day, i) => {
                const hour = businessHours.find((h) => h.day === day)
                if (!hour) return null

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: i * 0.04 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.025)',
                      borderRadius: '0.625rem',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Checkbox + day name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 160 }}>
                      <input
                        type="checkbox"
                        checked={hour.isOpen}
                        onChange={(e) => {
                          const hourIndex = businessHours.findIndex((h) => h.day === day)
                          handleBusinessHourChange(hourIndex, 'isOpen', e.target.checked)
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          accentColor: GOLD,
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
                        {DAY_LABELS[day]}
                      </span>
                    </div>

                    {/* Time inputs or closed label */}
                    <AnimatePresence mode="wait">
                      {hour.isOpen ? (
                        <motion.div
                          key="open"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <input
                            type="time"
                            value={hour.open}
                            onChange={(e) => {
                              const hourIndex = businessHours.findIndex((h) => h.day === day)
                              handleBusinessHourChange(hourIndex, 'open', e.target.value)
                            }}
                            style={{
                              ...inputStyle,
                              width: 'auto',
                              minWidth: 110,
                              colorScheme: 'dark',
                            }}
                          />
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem' }}>às</span>
                          <input
                            type="time"
                            value={hour.close}
                            onChange={(e) => {
                              const hourIndex = businessHours.findIndex((h) => h.day === day)
                              handleBusinessHourChange(hourIndex, 'close', e.target.value)
                            }}
                            style={{
                              ...inputStyle,
                              width: 'auto',
                              minWidth: 110,
                              colorScheme: 'dark',
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="closed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8125rem' }}
                        >
                          Fechado
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </OwnerPageLayout>
  )
}
