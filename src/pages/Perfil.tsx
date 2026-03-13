import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Camera, ArrowLeft, Mail, User as UserIcon, Phone, Save, X,
  CreditCard, Calendar, Users, Image, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { ImageCropModal } from '@/components/ImageCropModal'
import { uploadProfilePhoto, uploadCoverPhoto } from '@/services/storageService'
import { updateUserProfilePhoto, updateUserCoverPhoto, updateUserProfile, getUserProfile } from '@/services/authService'
import { getProfileCompletenessInfo } from '@/utils/profileValidation'

// ── Grain helper ────────────────────────────────────────────────────────────
const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '256px 256px',
}

// ── Field row ────────────────────────────────────────────────────────────────
function Field({
  icon: Icon,
  label,
  value,
  onChange,
  editable = false,
  disabled = false,
  hint,
  type = 'text',
  placeholder,
}: {
  icon: React.ElementType
  label: string
  value: string
  onChange?: (v: string) => void
  editable?: boolean
  disabled?: boolean
  hint?: string
  type?: string
  placeholder?: string
}) {
  const locked = disabled || !editable
  return (
    <div className="group">
      <label
        className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'rgba(212,175,55,0.5)' }}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={locked}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-medium outline-none transition-all pb-2"
        style={{
          color: locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
          borderBottom: locked
            ? '1px solid rgba(255,255,255,0.07)'
            : '1px solid rgba(212,175,55,0.4)',
          cursor: locked ? 'default' : 'text',
        }}
      />
      {hint && (
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
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
  const [imageLoadError, setImageLoadError] = useState(false)

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropModalType, setCropModalType] = useState<'avatar' | 'cover'>('avatar')
  const [tempImageSrc, setTempImageSrc] = useState<string>('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || '',
        gender: user.gender || '',
        birthDate: user.birthDate || '',
      })
    }
  }, [user])

  if (!user) { navigate('/login'); return null }

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const getHighQualityImageUrl = (url: string | undefined) => {
    if (!url) return url
    if (url.includes('googleusercontent.com') && url.includes('=s96-c'))
      return url.replace('=s96-c', '=s400-c')
    return url
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!valid.includes(file.type)) return alert('Formato não suportado.')
    if (file.size > 5 * 1024 * 1024) return alert('Imagem deve ter no máximo 5MB.')
    const reader = new FileReader()
    reader.onloadend = () => { setTempImageSrc(reader.result as string); setCropModalType('avatar'); setCropModalOpen(true) }
    reader.readAsDataURL(file)
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!valid.includes(file.type)) return alert('Formato não suportado.')
    if (file.size > 5 * 1024 * 1024) return alert('Imagem deve ter no máximo 5MB.')
    const reader = new FileReader()
    reader.onloadend = () => { setTempImageSrc(reader.result as string); setCropModalType('cover'); setCropModalOpen(true) }
    reader.readAsDataURL(file)
  }

  const handleCropSave = (croppedImage: string) => {
    if (cropModalType === 'avatar') setPreviewAvatar(croppedImage)
    else setPreviewCover(croppedImage)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (previewAvatar) {
        const url = await uploadProfilePhoto(user.id, previewAvatar)
        await updateUserProfilePhoto(user.id, url)
      }
      if (previewCover) {
        const url = await uploadCoverPhoto(user.id, previewCover)
        await updateUserCoverPhoto(user.id, url)
      }
      if (formData.name !== user.name || formData.phone !== user.phone) {
        await updateUserProfile(user.id, { displayName: formData.name, phone: formData.phone })
      }
      const updated = await getUserProfile(user.id)
      if (updated) window.location.reload()
      setIsEditing(false)
      setPreviewAvatar(null)
      setPreviewCover(null)
    } catch (error: any) {
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
      name: user.name, email: user.email, phone: user.phone || '',
      cpf: user.cpf || '', gender: user.gender || '', birthDate: user.birthDate || '',
    })
  }

  const formatCPF = (cpf: string) => {
    const c = cpf.replace(/\D/g, '')
    return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf
  }

  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('pt-BR')
  }

  const genderLabel = (g: string) =>
    ({ masculino: 'Masculino', feminino: 'Feminino' }[g] ?? (g ? 'Outro' : ''))

  const roleLabel = { client: 'Cliente', professional: 'Profissional', owner: 'Proprietário' }[user.activeRole ?? 'client'] ?? 'Cliente'

  const displayAvatar = previewAvatar || getHighQualityImageUrl(user.avatar)
  const displayCover = previewCover || getHighQualityImageUrl(user.coverPhoto)
  const completenessInfo = getProfileCompletenessInfo(user as any)

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#050400' }}
    >
      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]" style={grainStyle} />

      {/* Ambient glow top-right */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 10%, rgba(212,175,55,0.06) 0%, transparent 60%)' }}
      />

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{
          background: 'rgba(5,4,0,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Back + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
            <div>
              <h1
                className="text-lg font-bold text-white leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Meu Perfil
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Gerencie suas informações
              </p>
            </div>
          </div>

          {/* Actions */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
            >
              Editar Perfil
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-black transition-opacity hover:opacity-90 flex items-center gap-1.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* ── ALERT: photo error ── */}
        {imageLoadError && user.avatar?.includes('googleusercontent.com') && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl flex items-start gap-4"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <Camera className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">Foto temporariamente indisponível</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Sua foto do Google não pôde ser carregada. Faça upload de uma nova foto para resolver.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg text-black"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
              >
                Fazer upload
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ALERT: profile incomplete ── */}
        {!completenessInfo.isComplete && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl"
            style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)' }}
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">
                  Perfil {completenessInfo.completeness}% completo
                </p>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Complete as informações para desbloquear todas as funcionalidades.
                </p>
                {/* Progress bar */}
                <div
                  className="w-full h-1 rounded-full mb-3 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completenessInfo.completeness}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #D4AF37, #B8941E)' }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {completenessInfo.missingFieldsLabels.map((label: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.8)' }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/profile/complete')}
                  className="mt-4 text-xs font-semibold px-3 py-1.5 rounded-lg text-black"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #B8941E)' }}
                >
                  Completar agora
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PROFILE CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Cover */}
          <div className="relative h-52 overflow-hidden group">
            {displayCover ? (
              <img src={displayCover} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(30,20,0,0.8) 50%, rgba(10,5,20,0.9) 100%)',
                }}
              />
            )}
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(5,4,0,0.9) 100%)' }}
            />

            {/* Edit cover button */}
            {isEditing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white transition-all opacity-0 group-hover:opacity-100"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <Image className="w-3.5 h-3.5" />
                Alterar capa
              </motion.button>
            )}
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleCoverChange} className="hidden" />
          </div>

          {/* Avatar — fora do overflow-hidden para não ser cortado */}
          <div className="relative px-8">
            <div className="absolute -top-14 left-8 group/av">
              {displayAvatar && !imageLoadError ? (
                <img
                  src={displayAvatar}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover"
                  style={{ border: '3px solid rgba(212,175,55,0.6)', boxShadow: '0 0 40px rgba(212,175,55,0.2)' }}
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-black text-3xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #B8941E)',
                    border: '3px solid rgba(212,175,55,0.4)',
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}

              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
                >
                  <Camera className="w-7 h-7 text-white" />
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          {/* User info */}
          <div className="px-8 pb-8" style={{ paddingTop: '4rem' }}>
            <div className="mb-8">
              <h2
                className="text-3xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {user.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: 'rgba(212,175,55,0.1)',
                    color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}
                >
                  {roleLabel}
                </span>
                {completenessInfo.isComplete && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                    style={{
                      background: 'rgba(34,197,94,0.08)',
                      color: '#22c55e',
                      border: '1px solid rgba(34,197,94,0.2)',
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Perfil completo
                  </span>
                )}
              </div>
            </div>

            {/* Thin divider */}
            <div className="mb-8" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-7">
              <Field icon={UserIcon} label="Nome Completo" value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                editable={isEditing} />

              <Field icon={Mail} label="Email" value={formData.email}
                disabled hint="Email não pode ser alterado" />

              <Field icon={CreditCard} label="CPF" value={formatCPF(formData.cpf)}
                disabled hint="CPF não pode ser alterado" />

              <Field icon={Phone} label="Telefone" value={formData.phone}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                editable={isEditing} type="tel" placeholder="(00) 00000-0000" />

              <Field icon={Users} label="Gênero" value={genderLabel(formData.gender)}
                disabled hint="Gênero não pode ser alterado" />

              <Field icon={Calendar} label="Data de Nascimento" value={formatDate(formData.birthDate)}
                disabled hint="Data de nascimento não pode ser alterada" />
            </div>

            {/* Thin divider */}
            <div className="mt-10 mb-7" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Account info */}
            <div>
              <p
                className="text-xs font-semibold uppercase mb-5"
                style={{ letterSpacing: '0.2em', color: 'rgba(212,175,55,0.4)' }}
              >
                Informações da Conta
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Conta criada', value: new Date().toLocaleDateString('pt-BR') },
                  { label: 'Tipo de conta', value: roleLabel },
                  {
                    label: 'Última atualização',
                    value: `${new Date().toLocaleDateString('pt-BR')}`,
                  },
                  { label: 'Status', value: 'Ativa' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {item.label}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: item.label === 'Status' ? '#22c55e' : 'rgba(255,255,255,0.75)' }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Crop modal */}
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
