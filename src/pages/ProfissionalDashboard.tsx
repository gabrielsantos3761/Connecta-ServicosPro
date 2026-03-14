import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { User, MapPin, Scissors, Camera, Save, Plus, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ProfissionalPageLayout } from '@/components/layout/ProfissionalPageLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

// ── design tokens ────────────────────────────────────────────────────────────
const GOLD = '#D4AF37'
const GOLD_DIM = 'rgba(212,175,55,0.15)'
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}
const DIVIDER: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}
const SPRING = { type: 'spring' as const, stiffness: 320, damping: 36 }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#fff',
  padding: '0.625rem 0.875rem',
  width: '100%',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.5)',
}

const goldBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: '#050400',
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
  transition: 'opacity 0.2s',
}

const badgeStyle: React.CSSProperties = {
  background: GOLD_DIM,
  color: GOLD,
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
}

// ─────────────────────────────────────────────────────────────────────────────

export function ProfissionalDashboard() {
  const { user } = useAuth()
  const { isDirty, setIsDirty } = useOutletContext<LayoutContext>()
  const [activeTab, setActiveTab] = useState<TabType>('informacoes')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    pix: '',
  })

  const [addressData, setAddressData] = useState({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
  })

  const [specialties, setSpecialties] = useState<string[]>([])
  const [newSpecialty, setNewSpecialty] = useState('')

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
            name: infoPessoais.name || prev.name,
            phone: infoPessoais.phone || prev.phone,
            pix: infoPessoais.pix || '',
          }))
          if (infoPessoais.avatarUrl) setAvatarPreview(infoPessoais.avatarUrl)
        }
        if (endereco) {
          setAddressData({
            cep: endereco.cep || '',
            endereco: endereco.endereco || '',
            numero: endereco.numero || '',
            complemento: endereco.complemento || '',
          })
        }
        if (especialidades) setSpecialties(especialidades.items || [])
      } catch (error) {
        console.error('Erro ao carregar perfil:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  if (!user) return null

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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

  // ── loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ProfissionalPageLayout title="Meu Perfil" subtitle="Configure suas informações profissionais">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit' }}>
            Carregando perfil...
          </span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  // ── tab nav data ──────────────────────────────────────────────────────────
  const TABS: { key: TabType; icon: React.ReactNode; label: string; labelShort: string }[] = [
    { key: 'informacoes', icon: <User size={15} />, label: 'Informações Pessoais', labelShort: 'Pessoal' },
    { key: 'endereco',    icon: <MapPin size={15} />, label: 'Endereço',            labelShort: 'Endereço' },
    { key: 'especialidades', icon: <Scissors size={15} />, label: 'Especialidades', labelShort: 'Skills' },
  ]

  return (
    <ProfissionalPageLayout title="Meu Perfil" subtitle="Configure suas informações profissionais">

      {/* ── feedback toast ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              ...(saveMessage.type === 'success'
                ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }
                : { background: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }),
            }}
          >
            {saveMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── tab bar + save button ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>

        {/* tab pills */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '2px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.75rem',
            padding: '4px',
            minWidth: 0,
          }}
        >
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#050400' : 'rgba(255,255,255,0.55)',
                  background: active ? 'linear-gradient(135deg,#D4AF37,#B8941E)' : 'transparent',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                <span className="hidden-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* save button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{ ...goldBtnStyle, opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Save size={15} />}
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
          {isDirty && !saving && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 10,
                height: 10,
                background: '#FBBF24',
                borderRadius: '9999px',
                border: '2px solid #050400',
              }}
            />
          )}
        </div>
      </div>

      {/* ── tab panels ────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── INFORMAÇÕES PESSOAIS ─────────────────────────────────────── */}
        {activeTab === 'informacoes' && (
          <motion.div
            key="informacoes"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.05 }}
              style={{ ...CARD, padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                {/* avatar circle */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${GOLD_DIM}, rgba(212,175,55,0.06))`,
                      border: `2px solid rgba(212,175,55,0.35)`,
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: GOLD,
                    }}
                  >
                    {displayAvatar
                      ? <img src={displayAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(user.name)}
                  </div>
                  <label
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 30,
                      height: 30,
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
                      border: '2px solid #050400',
                    }}
                  >
                    <Camera size={13} color="#050400" />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </label>
                </div>

                {/* name / email / badge */}
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {user.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0.2rem 0 0.6rem' }}>
                    {user.email}
                  </p>
                  <span style={badgeStyle}>Profissional</span>
                </div>
              </div>
            </motion.div>

            {/* fields card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.12 }}
              style={{ ...CARD, padding: '1.5rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* nome */}
                <div>
                  <label style={labelStyle}>Nome Social</label>
                  <input
                    style={inputStyle}
                    value={formData.name}
                    placeholder="Seu nome"
                    onChange={e => { setFormData({ ...formData, name: e.target.value }); setIsDirty(true) }}
                  />
                </div>
                {/* email */}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                    type="email"
                    value={formData.email}
                    placeholder="seu@email.com"
                    disabled
                  />
                </div>
                {/* telefone */}
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input
                    style={inputStyle}
                    value={formData.phone}
                    placeholder="(11) 98765-4321"
                    onChange={e => { setFormData({ ...formData, phone: e.target.value }); setIsDirty(true) }}
                  />
                </div>
                {/* pix */}
                <div>
                  <label style={labelStyle}>Chave PIX</label>
                  <input
                    style={inputStyle}
                    value={formData.pix}
                    placeholder="Email, CPF ou telefone"
                    onChange={e => { setFormData({ ...formData, pix: e.target.value }); setIsDirty(true) }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── ENDEREÇO ─────────────────────────────────────────────────── */}
        {activeTab === 'endereco' && (
          <motion.div
            key="endereco"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            style={{ maxWidth: '48rem', margin: '0 auto' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.05 }}
              style={{ ...CARD, padding: '1.5rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>CEP</label>
                  <input
                    style={inputStyle}
                    value={addressData.cep}
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={e => { setAddressData({ ...addressData, cep: e.target.value }); setIsDirty(true) }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Endereço</label>
                  <input
                    style={inputStyle}
                    value={addressData.endereco}
                    placeholder="Rua, Avenida..."
                    onChange={e => { setAddressData({ ...addressData, endereco: e.target.value }); setIsDirty(true) }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Número</label>
                  <input
                    style={inputStyle}
                    value={addressData.numero}
                    placeholder="123"
                    onChange={e => { setAddressData({ ...addressData, numero: e.target.value }); setIsDirty(true) }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Complemento</label>
                  <input
                    style={inputStyle}
                    value={addressData.complemento}
                    placeholder="Apto, Bloco..."
                    onChange={e => { setAddressData({ ...addressData, complemento: e.target.value }); setIsDirty(true) }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── ESPECIALIDADES ───────────────────────────────────────────── */}
        {activeTab === 'especialidades' && (
          <motion.div
            key="especialidades"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING}
            style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* add specialty */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.05 }}
              style={{ ...CARD, padding: '1.5rem' }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#fff',
                  margin: '0 0 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Plus size={16} color={GOLD} />
                Adicionar Especialidade
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={newSpecialty}
                  placeholder="Ex: Corte Masculino, Barba, Coloração..."
                  onChange={e => setNewSpecialty(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                />
                <button
                  onClick={handleAddSpecialty}
                  disabled={!newSpecialty.trim()}
                  style={{ ...goldBtnStyle, opacity: !newSpecialty.trim() ? 0.45 : 1, flexShrink: 0 }}
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>
            </motion.div>

            {/* specialty list */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.12 }}
              style={{ ...CARD, padding: '1.5rem' }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#fff',
                  margin: '0 0 1rem',
                  paddingBottom: '0.75rem',
                  ...DIVIDER,
                }}
              >
                Suas Especialidades
              </h3>

              {specialties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <Scissors size={44} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem', display: 'block' }} />
                  <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Nenhuma especialidade cadastrada</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.825rem', marginTop: '0.35rem' }}>
                    Adicione suas especialidades para que os clientes possam conhecer seu trabalho
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                  <AnimatePresence>
                    {specialties.map((specialty, i) => (
                      <motion.div
                        key={specialty}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.75 }}
                        transition={{ ...SPRING, delay: i * 0.04 }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          background: GOLD_DIM,
                          border: '1px solid rgba(212,175,55,0.25)',
                          borderRadius: '9999px',
                          padding: '0.35rem 0.85rem',
                          color: GOLD,
                          fontSize: '0.825rem',
                          fontWeight: 500,
                        }}
                      >
                        <Scissors size={11} />
                        {specialty}
                        <button
                          onClick={() => handleRemoveSpecialty(specialty)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: GOLD,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.7,
                            marginLeft: '0.15rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </ProfissionalPageLayout>
  )
}
