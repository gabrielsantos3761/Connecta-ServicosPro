import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Camera, ArrowLeft, Mail, User as UserIcon, Phone, Save, X, CreditCard, Calendar, Users, Image, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageCropModal } from '@/components/ImageCropModal'
import { uploadProfilePhoto, uploadCoverPhoto } from '@/services/storageService'
import { updateUserProfilePhoto, updateUserCoverPhoto, updateUserProfile, getUserProfile } from '@/services/authService'
import { getProfileCompletenessInfo } from '@/utils/profileValidation'

export function Perfil() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    gender: user?.gender || '',
    birthDate: user?.birthDate || '',
  })
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [previewCover, setPreviewCover] = useState<string | null>(null)

  // Estados para o modal de crop
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropModalType, setCropModalType] = useState<'avatar' | 'cover'>('avatar')
  const [tempImageSrc, setTempImageSrc] = useState<string>('')

  if (!user) {
    navigate('/login')
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarClick = () => {
    if (isEditing) {
      avatarInputRef.current?.click()
    }
  }

  const handleCoverClick = () => {
    if (isEditing) {
      coverInputRef.current?.click()
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Formato de imagem não suportado. Use JPG, JPEG, PNG, WEBP ou GIF.')
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string)
        setCropModalType('avatar')
        setCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Formato de imagem não suportado. Use JPG, JPEG, PNG, WEBP ou GIF.')
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string)
        setCropModalType('cover')
        setCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropSave = (croppedImage: string) => {
    if (cropModalType === 'avatar') {
      setPreviewAvatar(croppedImage)
    } else {
      setPreviewCover(croppedImage)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: any = {}

      // Upload e atualização de foto de perfil
      if (previewAvatar) {
        const photoURL = await uploadProfilePhoto(user.id, previewAvatar)
        await updateUserProfilePhoto(user.id, photoURL)
        updates.photoURL = photoURL
      }

      // Upload e atualização de foto de capa
      if (previewCover) {
        const coverPhotoURL = await uploadCoverPhoto(user.id, previewCover)
        await updateUserCoverPhoto(user.id, coverPhotoURL)
        updates.coverPhotoURL = coverPhotoURL
      }

      // Atualizar nome e telefone se alterados
      if (formData.name !== user.name || formData.phone !== user.phone) {
        await updateUserProfile(user.id, {
          displayName: formData.name,
          phone: formData.phone,
        })
      }

      // Recarregar perfil do usuário para atualizar o contexto
      const updatedProfile = await getUserProfile(user.id)
      if (updatedProfile) {
        // Força atualização da página para refletir as mudanças
        window.location.reload()
      }

      setIsEditing(false)
      setPreviewAvatar(null)
      setPreviewCover(null)
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPreviewAvatar(null)
    setPreviewCover(null)
    setCropModalOpen(false)
    setTempImageSrc('')
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      cpf: user.cpf || '',
      gender: user.gender || '',
      birthDate: user.birthDate || '',
    })
  }

  const formatCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length === 11) {
      return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cpf
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const displayAvatar = previewAvatar || user.avatar
  const displayCover = previewCover || user.coverPhoto
  const completenessInfo = getProfileCompletenessInfo(user as any)

  console.log('[Perfil] user.avatar:', user.avatar)
  console.log('[Perfil] displayAvatar:', displayAvatar)

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
                <p className="text-sm text-gray-400">Gerencie suas informações pessoais</p>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-gold to-yellow-600 hover:opacity-90 text-white"
              >
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-gold to-yellow-600 hover:opacity-90 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Incomplete Warning */}
        {!completenessInfo.isComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Complete seu perfil</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Seu perfil está {completenessInfo.completeness}% completo. Complete as informações abaixo para desbloquear todas as funcionalidades da plataforma.
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completenessInfo.completeness}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {completenessInfo.totalFilled} de {completenessInfo.totalRequired} campos preenchidos
                  </p>
                </div>

                {/* Missing Fields */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-amber-400 mb-2">Campos necessários:</p>
                  <ul className="space-y-1">
                    {completenessInfo.missingFieldsLabels.map((label, index) => (
                      <li key={index} className="text-sm text-amber-300/90 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => navigate('/profile/complete')}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:opacity-90 text-white"
                >
                  Completar agora
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          {/* Cover Photo Section */}
          <div className="relative h-48 bg-gradient-to-r from-gold/20 to-purple-500/20 group">
            {displayCover ? (
              <img
                src={displayCover}
                alt="Foto de capa"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-purple-500/20" />
            )}

            <div className="absolute inset-0 bg-black/20" />

            {/* Botão para editar capa */}
            {isEditing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleCoverClick}
                className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-lg border border-white/20 transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
              >
                <Image className="w-4 h-4" />
                <span className="text-sm font-medium">Alterar capa</span>
              </motion.button>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleCoverChange}
              className="hidden"
            />

            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={user.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-black shadow-2xl"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-black shadow-2xl">
                    {getInitials(user.name)}
                  </div>
                )}

                {isEditing && (
                  <button
                    onClick={handleAvatarClick}
                    className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                )}

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="pt-20 px-8 pb-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-400 mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold/10 text-gold border border-gold/20">
                {user.activeRole === 'client' ? 'Cliente' : user.activeRole === 'owner' ? 'Proprietário' : 'Profissional'}
              </span>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gold" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-white/5 border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-white/5 border-white/10 text-white opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>

                {/* CPF */}
                <div>
                  <Label htmlFor="cpf" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={formatCPF(formData.cpf)}
                    disabled
                    className="bg-white/5 border-white/10 text-white opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">CPF não pode ser alterado</p>
                </div>

                {/* Telefone */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gold" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="(00) 00000-0000"
                    className="bg-white/5 border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Gênero */}
                <div>
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" />
                    Gênero
                  </Label>
                  <Input
                    id="gender"
                    value={formData.gender ? (formData.gender === 'masculino' ? 'Masculino' : formData.gender === 'feminino' ? 'Feminino' : 'Outro') : ''}
                    disabled
                    className="bg-white/5 border-white/10 text-white opacity-50 cursor-not-allowed capitalize"
                  />
                  <p className="text-xs text-gray-500 mt-1">Gênero não pode ser alterado</p>
                </div>

                {/* Data de Nascimento */}
                <div>
                  <Label htmlFor="birthDate" className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    value={formatDate(formData.birthDate)}
                    disabled
                    className="bg-white/5 border-white/10 text-white opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Data de nascimento não pode ser alterada</p>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  Informações da Conta
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Conta criada em: <span className="text-white font-medium">{new Date().toLocaleDateString('pt-BR')}</span></p>
                  <p>• Tipo de conta: <span className="text-white font-medium">{user.activeRole === 'client' ? 'Cliente' : user.activeRole === 'owner' ? 'Proprietário' : 'Profissional'}</span></p>
                  <p>• Última atualização: <span className="text-white font-medium">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></p>
                  <p>• Status: <span className="text-green-400 font-medium">✅ Ativa</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={tempImageSrc}
        onClose={() => setCropModalOpen(false)}
        onSave={handleCropSave}
        aspectRatio={cropModalType === 'avatar' ? 1 : 16 / 9}
        title={cropModalType === 'avatar' ? 'Ajustar Foto de Perfil' : 'Ajustar Foto de Capa'}
      />
    </div>
  )
}
