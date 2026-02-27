import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { User, MapPin, Scissors, Camera, Save, Plus, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProfissionalPageLayout } from '@/components/layout/ProfissionalPageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { uploadProfilePhoto } from '@/services/storageService'
import {
  getProfissionalInfoPessoais,
  getProfissionalEndereco,
  getProfissionalEspecialidades,
  saveProfissionalInfoPessoais,
  saveProfissionalEndereco,
  saveProfissionalEspecialidades,
} from '@/services/professionalProfileService'

type TabType = 'informacoes' | 'endereco' | 'especialidades'

type LayoutContext = {
  setIsMobileMenuOpen: (value: boolean) => void
  isDirty: boolean
  setIsDirty: (value: boolean) => void
}

export function ProfissionalDashboard() {
  const { user } = useAuth()
  const { isDirty, setIsDirty } = useOutletContext<LayoutContext>()
  const [activeTab, setActiveTab] = useState<TabType>('informacoes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Estado do formulário de informações pessoais
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pix: '',
  })

  // Estado do formulário de endereço
  const [addressData, setAddressData] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
  })

  // Estado de especialidades
  const [specialties, setSpecialties] = useState<string[]>([])
  const [newSpecialty, setNewSpecialty] = useState('')

  // Avisar o browser ao fechar/recarregar aba com mudanças não salvas
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Carregar dados do Firestore ao montar
  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      try {
        const [infoPessoais, endereco, especialidades] = await Promise.all([
          getProfissionalInfoPessoais(user.uid),
          getProfissionalEndereco(user.uid),
          getProfissionalEspecialidades(user.uid),
        ])

        if (infoPessoais) {
          setFormData(prev => ({
            ...prev,
            phone: infoPessoais.phone || prev.phone,
            pix: infoPessoais.pix || '',
          }))
          if (infoPessoais.avatarUrl) {
            setAvatarPreview(infoPessoais.avatarUrl)
          }
        }

        if (endereco) {
          setAddressData({
            cep: endereco.cep || '',
            endereco: endereco.endereco || '',
            numero: endereco.numero || '',
            complemento: endereco.complemento || '',
          })
        }

        if (especialidades) {
          setSpecialties(especialidades.items || [])
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

  if (!user) {
    return null
  }

  // Funções para pegar iniciais e imagem
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c')) {
      return url.replace('=s96-c', '=s400-c')
    }
    return url
  }

  const displayAvatar = avatarPreview ? getHighQualityImageUrl(avatarPreview) : undefined

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setIsDirty(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSpecialty = () => {
    const trimmed = newSpecialty.trim()
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed])
      setNewSpecialty('')
      setIsDirty(true)
    }
  }

  const handleRemoveSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty))
    setIsDirty(true)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleSaveAll = async () => {
    if (!user) return
    setSaving(true)

    try {
      // Upload do avatar primeiro para capturar a URL antes do Promise.all
      let avatarUrl: string | undefined
      if (avatarFile && avatarPreview) {
        avatarUrl = await uploadProfilePhoto(user.uid, avatarPreview)
        setAvatarPreview(avatarUrl)
        setAvatarFile(null)
      }

      await Promise.all([
        saveProfissionalInfoPessoais(user.uid, {
          name: formData.name,
          phone: formData.phone,
          pix: formData.pix,
          ...(avatarUrl ? { avatarUrl } : {}),
        }),
        saveProfissionalEndereco(user.uid, {
          cep: addressData.cep,
          endereco: addressData.endereco,
          numero: addressData.numero,
          complemento: addressData.complemento,
        }),
        saveProfissionalEspecialidades(user.uid, { items: specialties }),
      ])

      setIsDirty(false)
      showMessage('success', 'Perfil salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      showMessage('error', 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProfissionalPageLayout title="Meu Perfil" subtitle="Configure suas informações profissionais">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-400">Carregando perfil...</span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  return (
    <ProfissionalPageLayout title="Meu Perfil" subtitle="Configure suas informações profissionais">
      {/* Mensagem de feedback */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
        {/* Header das abas + botão salvar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <TabsList className="flex-1 grid grid-cols-3 sm:inline-flex gap-1 sm:gap-0 h-auto bg-white/5 border border-white/10">
            <TabsTrigger value="informacoes" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Informações Pessoais</span>
              <span className="sm:hidden">Pessoal</span>
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Endereço</span>
            </TabsTrigger>
            <TabsTrigger value="especialidades" className="flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Especialidades</span>
              <span className="sm:hidden">Skills</span>
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="relative text-white font-semibold shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
            {/* Indicador de mudanças não salvas */}
            {isDirty && !saving && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-black" />
            )}
          </Button>
        </div>

        {/* Aba: Informações Pessoais */}
        <TabsContent value="informacoes">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Avatar */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
                    >
                      {displayAvatar ? (
                        <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full inline-block mt-2"
                      style={{ backgroundColor: '#1a333a33', color: '#4db8c7' }}
                    >
                      Profissional
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campos */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Nome Social</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500 opacity-60"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Telefone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="(11) 98765-4321"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Chave PIX</Label>
                    <Input
                      value={formData.pix}
                      onChange={(e) => { setFormData({ ...formData, pix: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="Email, CPF ou telefone"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Endereço */}
        <TabsContent value="endereco">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">CEP</Label>
                    <Input
                      value={addressData.cep}
                      onChange={(e) => { setAddressData({ ...addressData, cep: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Endereço</Label>
                    <Input
                      value={addressData.endereco}
                      onChange={(e) => { setAddressData({ ...addressData, endereco: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="Rua, Avenida..."
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Número</Label>
                    <Input
                      value={addressData.numero}
                      onChange={(e) => { setAddressData({ ...addressData, numero: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block">Complemento</Label>
                    <Input
                      value={addressData.complemento}
                      onChange={(e) => { setAddressData({ ...addressData, complemento: e.target.value }); setIsDirty(true) }}
                      className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                      placeholder="Apto, Bloco..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Especialidades */}
        <TabsContent value="especialidades">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Adicionar nova especialidade */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" style={{ color: '#4db8c7' }} />
                  Adicionar Especialidade
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-500 flex-1"
                    placeholder="Ex: Corte Masculino, Barba, Coloração..."
                  />
                  <Button
                    onClick={handleAddSpecialty}
                    disabled={!newSpecialty.trim()}
                    className="text-white font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de especialidades */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Suas Especialidades
                </h3>

                {specialties.length === 0 ? (
                  <div className="text-center py-12">
                    <Scissors className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Nenhuma especialidade cadastrada</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Adicione suas especialidades para que os clientes possam conhecer seu trabalho
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {specialties.map((specialty) => (
                      <motion.div
                        key={specialty}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge
                          className="text-sm py-2 px-4 flex items-center gap-2 text-white border-0"
                          style={{ backgroundColor: '#1a333a' }}
                        >
                          <Scissors className="w-3 h-3" />
                          {specialty}
                          <button
                            onClick={() => handleRemoveSpecialty(specialty)}
                            className="ml-1 hover:text-red-300 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </ProfissionalPageLayout>
  )
}
