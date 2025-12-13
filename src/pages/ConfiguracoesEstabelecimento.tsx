import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  Image as ImageIcon
} from 'lucide-react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  getBusinessById,
  updateBusiness,
  formatCNPJ,
  validateCNPJ,
  type Business,
  type BusinessHours
} from '@/services/businessService'

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

export function ConfiguracoesEstabelecimento() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)

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

  // Carregar dados do estabelecimento
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

      try {
        setIsLoading(true)
        const businessData = await getBusinessById(selectedBusinessId)

        if (!businessData) {
          toast({
            title: 'Erro',
            description: 'Estabelecimento não encontrado',
            variant: 'destructive',
          })
          navigate('/selecionar-empresa')
          return
        }

        setBusiness(businessData)

        // Preencher formulário
        setFormData({
          name: businessData.name,
          cnpj: businessData.cnpj,
          description: businessData.description,
          category: businessData.category,
          phone: businessData.phone,
          email: businessData.email || '',
          website: businessData.website || '',
          street: businessData.address.street,
          number: businessData.address.number,
          complement: businessData.address.complement || '',
          neighborhood: businessData.address.neighborhood,
          city: businessData.address.city,
          state: businessData.address.state,
          zipCode: businessData.address.zipCode,
        })

        setBusinessHours(businessData.businessHours)
        setMainImage(businessData.image || '')
        setGalleryImages(businessData.gallery || [])
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

  // Funções de validação por tab
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
      hours: 'Horários'
    }
    return names[tab] || tab
  }

  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !business) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas imagens',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const storageRef = ref(storage, `businesses/${business.id}/main-${Date.now()}.jpg`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      setMainImage(downloadURL)

      await updateBusiness(business.id, {
        image: downloadURL,
      } as any)

      toast({
        title: 'Sucesso!',
        description: 'Imagem principal atualizada',
      })
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da imagem',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleGalleryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !business) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Aviso',
          description: `${file.name} não é uma imagem válida`,
          variant: 'destructive',
        })
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Aviso',
          description: `${file.name} excede o tamanho máximo de 5MB`,
          variant: 'destructive',
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return
    if (galleryImages.length + validFiles.length > 10) {
      toast({
        title: 'Erro',
        description: 'Você pode ter no máximo 10 imagens na galeria',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingImage(true)

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const storageRef = ref(storage, `businesses/${business.id}/gallery-${Date.now()}-${Math.random()}.jpg`)
        await uploadBytes(storageRef, file)
        return getDownloadURL(storageRef)
      })

      const downloadURLs = await Promise.all(uploadPromises)
      const newGallery = [...galleryImages, ...downloadURLs]

      setGalleryImages(newGallery)

      await updateBusiness(business.id, {
        gallery: newGallery,
      } as any)

      toast({
        title: 'Sucesso!',
        description: `${downloadURLs.length} imagem(ns) adicionada(s) à galeria`,
      })
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload das imagens',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveGalleryImage = async (imageUrl: string) => {
    if (!business) return

    try {
      const newGallery = galleryImages.filter(url => url !== imageUrl)
      setGalleryImages(newGallery)

      await updateBusiness(business.id, {
        gallery: newGallery,
      } as any)

      // Tentar deletar do storage
      try {
        const imageRef = ref(storage, imageUrl)
        await deleteObject(imageRef)
      } catch (error) {
        console.error('Erro ao deletar imagem do storage:', error)
      }

      toast({
        title: 'Sucesso!',
        description: 'Imagem removida da galeria',
      })
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover imagem',
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!business) return

    // Validar todas as tabs e navegar para a primeira com erro
    if (!validateInfoTab()) {
      setActiveTab('info')
      toast({
        title: 'Campos obrigatórios faltando',
        description: `Por favor, complete a seção ${getTabName('info')}`,
        variant: 'destructive',
      })
      return
    }

    if (!validateContactTab()) {
      setActiveTab('contact')
      toast({
        title: 'Campos obrigatórios faltando',
        description: `Por favor, complete a seção ${getTabName('contact')}`,
        variant: 'destructive',
      })
      return
    }

    if (!validateAddressTab()) {
      setActiveTab('address')
      toast({
        title: 'Campos obrigatórios faltando',
        description: `Por favor, complete a seção ${getTabName('address')}`,
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      await updateBusiness(business.id, {
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
      })

      toast({
        title: 'Sucesso!',
        description: 'Estabelecimento atualizado com sucesso',
      })
    } catch (error: any) {
      console.error('Erro ao atualizar estabelecimento:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar estabelecimento',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Configurações do Estabelecimento</h1>
            <p className="text-sm text-gray-400">Gerencie as informações do seu estabelecimento</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-8 grid grid-cols-5 sm:inline-flex gap-1 sm:gap-0 h-auto">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Informações</span>
              {!validateInfoTab() && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Contato</span>
              {!validateContactTab() && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Endereço</span>
              {!validateAddressTab() && (
                <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Horários</span>
            </TabsTrigger>
          </TabsList>

          {/* Informações Básicas */}
          <TabsContent value="info">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Nome do Estabelecimento *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj" className="text-gray-300">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      disabled
                      title="CNPJ não pode ser alterado"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-gray-300">Categoria *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 focus:border-gold/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Fotos */}
          <TabsContent value="photos">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-gold" />
                  Fotos do Estabelecimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Imagem Principal */}
                <div>
                  <Label className="text-gray-300 mb-3 block">Imagem Principal</Label>
                  <div className="flex flex-col gap-4">
                    {mainImage && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gold/30">
                        <img
                          src={mainImage}
                          alt="Imagem principal"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="main-image-upload"
                        className={`flex-1 cursor-pointer ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-lg hover:border-gold/50 hover:bg-white/10 transition-all">
                          <Upload className="w-5 h-5 text-gold" />
                          <span className="text-sm text-gray-300">
                            {mainImage ? 'Alterar Imagem Principal' : 'Selecionar Imagem Principal'}
                          </span>
                        </div>
                        <input
                          id="main-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Esta imagem será exibida como destaque do seu estabelecimento. Tamanho máximo: 5MB
                    </p>
                  </div>
                </div>

                {/* Galeria de Imagens */}
                <div>
                  <Label className="text-gray-300 mb-3 block">
                    Galeria de Fotos ({galleryImages.length}/10)
                  </Label>

                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                      {galleryImages.map((imageUrl, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={imageUrl}
                            alt={`Galeria ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveGalleryImage(imageUrl)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover imagem"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {galleryImages.length < 10 && (
                    <div>
                      <label
                        htmlFor="gallery-image-upload"
                        className={`block cursor-pointer ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-2 px-4 py-8 bg-white/5 border-2 border-dashed border-white/20 rounded-lg hover:border-gold/50 hover:bg-white/10 transition-all">
                          <Upload className="w-6 h-6 text-gold" />
                          <span className="text-sm text-gray-300">
                            Adicionar Fotos à Galeria
                          </span>
                        </div>
                        <input
                          id="gallery-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Selecione até {10 - galleryImages.length} fotos do seu estabelecimento. Tamanho máximo por foto: 5MB
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Contato */}
          <TabsContent value="contact">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gold" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-gray-300">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      placeholder="contato@exemplo.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className="text-gray-300 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                    placeholder="https://www.exemplo.com"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="address">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street" className="text-gray-300">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="number" className="text-gray-300">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="complement" className="text-gray-300">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood" className="text-gray-300">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-gray-300">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-gray-300">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      maxLength={2}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      placeholder="SP"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-gray-300">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50"
                      placeholder="00000-000"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

          {/* Horário de Funcionamento */}
          <TabsContent value="hours">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {DAYS_ORDER.map((day) => {
                  const hour = businessHours.find(h => h.day === day)
                  if (!hour) return null

                  return (
                    <div key={day} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 w-40">
                        <input
                          type="checkbox"
                          checked={hour.isOpen}
                          onChange={(e) => {
                            const hourIndex = businessHours.findIndex(h => h.day === day)
                            handleBusinessHourChange(hourIndex, 'isOpen', e.target.checked)
                          }}
                          className="w-4 h-4"
                        />
                        <Label className="text-white text-sm">{DAY_LABELS[day]}</Label>
                      </div>
                      {hour.isOpen && (
                        <>
                          <Input
                            type="time"
                            value={hour.open}
                            onChange={(e) => {
                              const hourIndex = businessHours.findIndex(h => h.day === day)
                              handleBusinessHourChange(hourIndex, 'open', e.target.value)
                            }}
                            className="bg-white/10 border-white/20 text-white w-32"
                          />
                          <span className="text-white">às</span>
                          <Input
                            type="time"
                            value={hour.close}
                            onChange={(e) => {
                              const hourIndex = businessHours.findIndex(h => h.day === day)
                              handleBusinessHourChange(hourIndex, 'close', e.target.value)
                            }}
                            className="bg-white/10 border-white/20 text-white w-32"
                          />
                        </>
                      )}
                      {!hour.isOpen && <span className="text-gray-400 text-sm">Fechado</span>}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
