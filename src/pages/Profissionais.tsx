import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mail, Users, DollarSign, Percent, X, QrCode, Copy, Check, Clock, UserCheck, UserX, Loader2, Phone, MapPin, User, Settings2, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import { useAuth } from '@/contexts/AuthContext'
import { getOrCreateLinkCode, getBusinessById } from '@/services/businessService'
import { updateProfessionalProfile } from '@/services/authService'
import {
  getLinksByBusiness,
  approveProfessionalLink,
  rejectProfessionalLink,
  createProfessionalLink,
  cleanDuplicateLinks,
  deleteProfessionalLinks,
  updateLinkDetails,
  type ProfessionalLink,
} from '@/services/professionalLinkService'
import {
  getProfissionalInfoPessoais,
  getProfissionalEspecialidades,
  getProfissionalEndereco,
  type EnderecoData,
} from '@/services/professionalProfileService'

// ─── Design tokens ────────────────────────────────────────────────
const BG = '#050400'
const GOLD = '#D4AF37'

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#fff',
  padding: '0.5rem 0.75rem',
  outline: 'none',
  width: '100%',
}

const goldBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
  color: BG,
  fontWeight: 600,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
}

const outlineBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'rgba(255,255,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
}

const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.4)',
  color: '#f87171',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  fontSize: '0.875rem',
}

const badge = (active?: boolean): React.CSSProperties => ({
  background: active ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.15)',
  color: active ? '#4ade80' : GOLD,
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
})

const spring = { type: 'spring', stiffness: 320, damping: 36 }

// ─── Types ────────────────────────────────────────────────────────
type PaymentType = 'fixed' | 'percentage'

interface PaymentConfig {
  type: PaymentType
  fixedValue?: number
  percentageValue?: number
}

interface ProfessionalProfileData {
  name?: string
  phone?: string
  avatarUrl?: string
  pix?: string
  specialties?: string[]
  endereco?: EnderecoData
}

interface ProfileModalData {
  link: ProfessionalLink
  profile: ProfessionalProfileData
}

// ─── Component ───────────────────────────────────────────────────
export function Profissionais() {
  const { user } = useAuth()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [isAddProfModalOpen, setIsAddProfModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null)
  const [selectedProfileModal, setSelectedProfileModal] = useState<ProfileModalData | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>('percentage')
  const [fixedValue, setFixedValue] = useState('')
  const [percentageValue, setPercentageValue] = useState('40')
  const [linkCode, setLinkCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [profilesData, setProfilesData] = useState<Record<string, ProfessionalProfileData>>({})
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set())
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [links, setLinks] = useState<ProfessionalLink[]>([])

  const businessId = localStorage.getItem('selected_business_id')

  useEffect(() => {
    async function loadLinks() {
      if (!businessId || !user) return
      try {
        await cleanDuplicateLinks(businessId)
        let businessLinks = await getLinksByBusiness(businessId)
        const ownerLinked = businessLinks.some(l => l.professionalId === user.uid)
        if (!ownerLinked) {
          const business = await getBusinessById(businessId)
          if (business && business.ownerId === user.uid) {
            try { await updateProfessionalProfile(user.uid, { specialties: [] }) } catch { /* ok */ }
            try {
              await createProfessionalLink({
                professionalId: user.uid,
                professionalName: user.name,
                professionalEmail: user.email,
                professionalAvatar: user.avatar,
                businessId: business.id,
                businessName: business.name,
                linkedBy: 'invite',
                status: 'active',
              })
              businessLinks = await getLinksByBusiness(businessId)
            } catch (e: any) {
              if (!e.message?.includes('já está vinculado') && !e.message?.includes('solicitação pendente')) {
                console.error('Erro ao auto-vincular owner:', e)
              }
            }
          }
        }
        setLinks(businessLinks)
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLinks()
  }, [businessId, user])

  useEffect(() => {
    const activeLinks = links.filter(l => l.status === 'active')
    if (activeLinks.length === 0) return
    async function loadProfiles() {
      const profilesMap: Record<string, ProfessionalProfileData> = {}
      await Promise.all(
        activeLinks.map(async (link) => {
          try {
            const [infoPessoais, especialidades, endereco] = await Promise.all([
              getProfissionalInfoPessoais(link.professionalId),
              getProfissionalEspecialidades(link.professionalId),
              getProfissionalEndereco(link.professionalId),
            ])
            profilesMap[link.professionalId] = {
              name: infoPessoais?.name,
              phone: infoPessoais?.phone,
              avatarUrl: infoPessoais?.avatarUrl,
              pix: infoPessoais?.pix,
              specialties: especialidades?.items,
              endereco: endereco ?? undefined,
            }
          } catch (error) {
            console.error(`Erro ao carregar perfil ${link.professionalId}:`, error)
          }
        })
      )
      setProfilesData(profilesMap)
    }
    loadProfiles()
  }, [links])

  const pendingLinks = links.filter(l => l.status === 'pending')
  const activeLinks = links.filter(l => l.status === 'active')

  const handleOpenPaymentModal = (link: ProfessionalLink) => {
    setSelectedProfessional(link.professionalId)
    setSelectedLinkId(link.id)
    setPaymentType(link.paymentType ?? 'percentage')
    setPercentageValue(link.commission != null ? String(link.commission) : '40')
    setFixedValue(link.fixedMonthly != null ? String(link.fixedMonthly) : '')
    setIsPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedProfessional(null)
    setSelectedLinkId(null)
    setPaymentType('percentage')
    setFixedValue('')
    setPercentageValue('40')
  }

  const handleSavePayment = async () => {
    if (!selectedLinkId) return
    try {
      if (paymentType === 'fixed') {
        await updateLinkDetails(selectedLinkId, { paymentType: 'fixed', fixedMonthly: parseFloat(fixedValue), commission: undefined })
      } else {
        await updateLinkDetails(selectedLinkId, { paymentType: 'percentage', commission: parseFloat(percentageValue), fixedMonthly: undefined })
      }
      setLinks(prev => prev.map(l => l.id === selectedLinkId ? {
        ...l,
        paymentType,
        commission: paymentType === 'percentage' ? parseFloat(percentageValue) : l.commission,
        fixedMonthly: paymentType === 'fixed' ? parseFloat(fixedValue) : undefined,
      } : l))
      handleClosePaymentModal()
    } catch (err) {
      console.error('Erro ao salvar configuração de pagamento:', err)
      alert('Erro ao salvar. Tente novamente.')
    }
  }

  const handleOpenAddModal = async () => {
    setIsAddProfModalOpen(true)
    if (businessId) {
      try { const code = await getOrCreateLinkCode(businessId); setLinkCode(code) }
      catch (error) { console.error('Erro ao gerar código:', error) }
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(linkCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApproveLink = async (linkId: string) => {
    if (!user) return
    setActionLoading(linkId)
    try {
      await approveProfessionalLink(linkId, user.uid)
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status: 'active' as const } : l))
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      alert('Erro ao aprovar profissional. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectLink = async (linkId: string) => {
    if (!user) return
    setActionLoading(linkId)
    try {
      await rejectProfessionalLink(linkId, user.uid)
      setLinks(prev => prev.filter(l => l.id !== linkId))
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      alert('Erro ao rejeitar profissional. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenProfileModal = (link: ProfessionalLink) => {
    const profile = profilesData[link.professionalId] || {}
    setSelectedProfileModal({ link, profile })
    setIsProfileModalOpen(true)
  }

  const handleToggleManageMode = () => {
    setIsManageMode(prev => !prev)
    setSelectedForRemoval(new Set())
  }

  const handleToggleSelect = (linkId: string) => {
    setSelectedForRemoval(prev => {
      const next = new Set(prev)
      if (next.has(linkId)) next.delete(linkId)
      else next.add(linkId)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedForRemoval.size === activeLinks.length) setSelectedForRemoval(new Set())
    else setSelectedForRemoval(new Set(activeLinks.map(l => l.id)))
  }

  const handleConfirmRemove = async () => {
    if (selectedForRemoval.size === 0) return
    setRemoveLoading(true)
    try {
      await deleteProfessionalLinks(Array.from(selectedForRemoval))
      setLinks(prev => prev.filter(l => !selectedForRemoval.has(l.id)))
      setSelectedForRemoval(new Set())
      setIsConfirmRemoveOpen(false)
      setIsManageMode(false)
    } catch (error) {
      console.error('Erro ao desvincular profissionais:', error)
      alert('Erro ao desvincular. Tente novamente.')
    } finally {
      setRemoveLoading(false)
    }
  }

  if (loading) {
    return (
      <OwnerPageLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Carregando equipe...</span>
        </div>
      </OwnerPageLayout>
    )
  }

  return (
    <OwnerPageLayout title="Profissionais" subtitle="Gerencie sua equipe">
      {/* Actions Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
            {activeLinks.length} {activeLinks.length === 1 ? 'Profissional' : 'Profissionais'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            {pendingLinks.length > 0 ? (
              <span style={{ color: '#facc15', fontWeight: 500 }}>
                {pendingLinks.length} {pendingLinks.length === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
              </span>
            ) : 'Todos os profissionais estão ativos'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {pendingLinks.length > 0 && !isManageMode && (
            <button
              style={{ ...outlineBtn, borderColor: 'rgba(234,179,8,0.4)', color: '#facc15', position: 'relative' }}
              onClick={() => document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Clock style={{ width: 16, height: 16 }} />
              Aprovações
              <span style={{
                position: 'absolute', top: -8, right: -8, width: 20, height: 20,
                background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{pendingLinks.length}</span>
            </button>
          )}

          {isManageMode ? (
            <>
              <button style={outlineBtn} onClick={handleSelectAll}>
                {selectedForRemoval.size === activeLinks.length
                  ? <CheckSquare style={{ width: 16, height: 16 }} />
                  : <Square style={{ width: 16, height: 16 }} />}
                {selectedForRemoval.size === activeLinks.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              <button
                style={{ ...dangerBtn, opacity: selectedForRemoval.size === 0 ? 0.4 : 1 }}
                disabled={selectedForRemoval.size === 0}
                onClick={() => setIsConfirmRemoveOpen(true)}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                Desvincular ({selectedForRemoval.size})
              </button>
              <button style={outlineBtn} onClick={handleToggleManageMode}>
                <X style={{ width: 16, height: 16 }} />
                Cancelar
              </button>
            </>
          ) : (
            <>
              {activeLinks.length > 0 && (
                <button style={outlineBtn} onClick={handleToggleManageMode}>
                  <Settings2 style={{ width: 16, height: 16 }} />
                  Gerenciar Profissional
                </button>
              )}
              <button style={goldBtn} onClick={handleOpenAddModal}>
                <Plus style={{ width: 16, height: 16 }} />
                Adicionar Profissional
              </button>
            </>
          )}
        </div>
      </div>

      {/* Solicitações Pendentes */}
      {pendingLinks.length > 0 && (
        <motion.div
          id="pending-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          style={{ marginBottom: '2rem' }}
        >
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600, color: '#facc15', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: 20, height: 20 }} />
            Solicitações Pendentes ({pendingLinks.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: index * 0.06 }}
              >
                <div style={{ ...card, borderLeft: '4px solid #eab308', padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '9999px', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg,#D4AF37,#B8941E)', color: '#050400', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {link.professionalAvatar
                          ? <img src={link.professionalAvatar} alt={link.professionalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : link.professionalName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: 2 }}>{link.professionalName}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{link.professionalEmail}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={badge()}>
                            <Clock style={{ width: 11, height: 11 }} /> Aguardando aprovação
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                            via {link.linkedBy === 'code' ? 'código' : link.linkedBy === 'qrcode' ? 'QR Code' : 'convite'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        style={dangerBtn}
                        onClick={() => handleRejectLink(link.id)}
                        disabled={actionLoading === link.id}
                      >
                        {actionLoading === link.id
                          ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                          : <><UserX style={{ width: 16, height: 16 }} /> Recusar</>}
                      </button>
                      <button
                        style={goldBtn}
                        onClick={() => handleApproveLink(link.id)}
                        disabled={actionLoading === link.id}
                      >
                        {actionLoading === link.id
                          ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                          : <><UserCheck style={{ width: 16, height: 16 }} /> Aprovar</>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profissionais Ativos (Grid) */}
      {activeLinks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={spring}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}
        >
          {activeLinks.map((link, index) => {
            const profile = profilesData[link.professionalId] || {}
            const displayName = profile.name || link.professionalName
            const avatar = profile.avatarUrl || link.professionalAvatar
            const phone = profile.phone
            const specialties = profile.specialties || []
            const isSelected = selectedForRemoval.has(link.id)

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: index * 0.06 }}
                whileHover={{ y: isManageMode ? 0 : -4 }}
                onClick={isManageMode ? () => handleToggleSelect(link.id) : undefined}
                style={{
                  ...card,
                  borderLeft: isManageMode && isSelected ? '4px solid #ef4444' : `4px solid ${GOLD}`,
                  boxShadow: isManageMode && isSelected ? '0 0 0 2px rgba(239,68,68,0.3)' : 'none',
                  cursor: isManageMode ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: '0.75rem', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg,#D4AF37,#B8941E)', flexShrink: 0,
                      }}>
                        {avatar
                          ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <User style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.8)' }} />}
                      </div>
                      {isManageMode && (
                        <div style={{
                          position: 'absolute', top: -6, left: -6, width: 22, height: 22,
                          borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isSelected ? '#ef4444' : 'rgba(20,20,20,0.9)',
                          border: `2px solid ${isSelected ? '#ef4444' : 'rgba(255,255,255,0.3)'}`,
                        }}>
                          {isSelected && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                        </div>
                      )}
                    </div>
                    <span style={badge(true)}>Ativo</span>
                  </div>

                  <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: GOLD, fontWeight: 600, lineHeight: 1.3, marginBottom: '0.2rem' }}>
                    {displayName}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{link.role || 'Profissional'}</p>
                </div>

                {/* Body */}
                <div style={{ padding: '0.75rem 1.25rem 1.25rem', flex: 1 }}>
                  {specialties.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Especialidades</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {specialties.map((spec) => (
                          <span key={spec} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isManageMode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          style={{ ...outlineBtn, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                          onClick={() => window.open(`mailto:${link.professionalEmail}`, '_blank')}
                        >
                          <Mail style={{ width: 13, height: 13 }} /> Email
                        </button>
                        <button
                          style={{ ...outlineBtn, justifyContent: 'center', fontSize: '0.78rem', padding: '0.4rem 0.5rem', opacity: phone ? 1 : 0.4 }}
                          disabled={!phone}
                          onClick={() => phone && window.open(`tel:${phone}`, '_blank')}
                        >
                          <Phone style={{ width: 13, height: 13 }} /> Ligar
                        </button>
                      </div>
                      <button
                        style={{ ...outlineBtn, justifyContent: 'center', borderColor: `${GOLD}60`, color: GOLD, fontSize: '0.78rem', padding: '0.4rem 0.5rem' }}
                        onClick={() => handleOpenPaymentModal(link)}
                      >
                        <DollarSign style={{ width: 13, height: 13 }} /> Configurar Pagamento
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, fontSize: '0.85rem', fontWeight: 500, padding: '0.25rem 0', textAlign: 'center' }}
                        onClick={() => handleOpenProfileModal(link)}
                      >
                        Ver Perfil Completo
                      </button>
                    </div>
                  )}

                  {isManageMode && (
                    <p style={{ textAlign: 'center', fontSize: '0.78rem', color: isSelected ? '#f87171' : 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                      {isSelected ? 'Selecionado para desvincular' : 'Clique para selecionar'}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : pendingLinks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          style={{ textAlign: 'center', padding: '4rem 2rem', ...card }}
        >
          <Users style={{ width: 64, height: 64, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>
            Nenhum profissional na equipe
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
            Adicione profissionais compartilhando o código de vinculação
          </p>
          <button style={goldBtn} onClick={handleOpenAddModal}>
            <Plus style={{ width: 16, height: 16 }} />
            Adicionar Profissional
          </button>
        </motion.div>
      ) : null}

      {/* Modal de Confirmação de Desvinculação */}
      <AnimatePresence>
        {isConfirmRemoveOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !removeLoading && setIsConfirmRemoveOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={spring}
              style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <div style={{ background: '#0d0c0a', ...card, maxWidth: 400, width: '100%', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle style={{ width: 24, height: 24, color: '#f87171' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                      Desvincular Profissional{selectedForRemoval.size > 1 ? 'is' : ''}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Esta ação não pode ser desfeita</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Você está prestes a desvincular <span style={{ color: '#fff', fontWeight: 600 }}>{selectedForRemoval.size} profissional{selectedForRemoval.size > 1 ? 'is' : ''}</span> do seu estabelecimento.
                </p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem' }}>
                  O vínculo será removido do banco de dados. O profissional poderá se vincular novamente no futuro se necessário.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button style={{ ...outlineBtn, flex: 1, justifyContent: 'center' }} onClick={() => setIsConfirmRemoveOpen(false)} disabled={removeLoading}>
                    Cancelar
                  </button>
                  <button style={{ ...dangerBtn, flex: 1, justifyContent: 'center', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleConfirmRemove} disabled={removeLoading}>
                    {removeLoading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 16, height: 16 }} />}
                    {removeLoading ? 'Desvinculando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Ver Perfil Completo */}
      <AnimatePresence>
        {isProfileModalOpen && selectedProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={spring}
              style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <div style={{ background: '#0d0c0a', ...card, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Perfil Completo</h3>
                  <button onClick={() => setIsProfileModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '0.25rem', borderRadius: '0.375rem' }}>
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Avatar + Nome */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: '1rem', overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
                    }}>
                      {selectedProfileModal.profile.avatarUrl || selectedProfileModal.link.professionalAvatar
                        ? <img src={selectedProfileModal.profile.avatarUrl || selectedProfileModal.link.professionalAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.8)' }} />}
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                        {selectedProfileModal.profile.name || selectedProfileModal.link.professionalName}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>{selectedProfileModal.link.role || 'Profissional'}</p>
                      <span style={badge(true)}>Ativo</span>
                    </div>
                  </div>

                  {/* Contato */}
                  <div>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contato</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                        <Mail style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', color: '#fff', wordBreak: 'break-all' }}>{selectedProfileModal.link.professionalEmail}</span>
                      </div>
                      {selectedProfileModal.profile.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                          <Phone style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', color: '#fff' }}>{selectedProfileModal.profile.phone}</span>
                        </div>
                      )}
                      {selectedProfileModal.profile.pix && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                          <DollarSign style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>PIX</p>
                            <p style={{ fontSize: '0.875rem', color: '#fff' }}>{selectedProfileModal.profile.pix}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Especialidades */}
                  {selectedProfileModal.profile.specialties && selectedProfileModal.profile.specialties.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Especialidades</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedProfileModal.profile.specialties.map((spec) => (
                          <span key={spec} style={{ ...badge(), border: `1px solid rgba(212,175,55,0.25)` }}>{spec}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Endereço */}
                  {selectedProfileModal.profile.endereco && (selectedProfileModal.profile.endereco.endereco || selectedProfileModal.profile.endereco.cep) && (
                    <div>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Endereço</h5>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                        <MapPin style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: '0.875rem', color: '#fff' }}>
                          {selectedProfileModal.profile.endereco.endereco && (
                            <p>{selectedProfileModal.profile.endereco.endereco}{selectedProfileModal.profile.endereco.numero && `, ${selectedProfileModal.profile.endereco.numero}`}</p>
                          )}
                          {selectedProfileModal.profile.endereco.complemento && (
                            <p style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedProfileModal.profile.endereco.complemento}</p>
                          )}
                          {selectedProfileModal.profile.endereco.cep && (
                            <p style={{ color: 'rgba(255,255,255,0.5)' }}>CEP: {selectedProfileModal.profile.endereco.cep}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    Vinculado via {selectedProfileModal.link.linkedBy === 'code' ? 'código' : selectedProfileModal.link.linkedBy === 'qrcode' ? 'QR Code' : 'convite'}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Adicionar Profissional */}
      <AnimatePresence>
        {isAddProfModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddProfModalOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={spring}
              style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <div style={{ background: '#0d0c0a', ...card, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Vincular Profissional</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Compartilhe o QR Code ou código</p>
                  </div>
                  <button onClick={() => setIsAddProfModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '0.25rem', borderRadius: '0.375rem' }}>
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 256, height: 256, background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <QrCode style={{ width: 128, height: 128, color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>O profissional deve escanear este QR Code com o app</p>
                  </div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>ou</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  {/* Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Código de Vinculação</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={linkCode || 'Gerando...'}
                        readOnly
                        style={{ ...inputStyle, fontFamily: 'monospace', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.15em' }}
                      />
                      <button
                        style={{ ...outlineBtn, padding: '0.5rem 1rem', flexShrink: 0 }}
                        onClick={handleCopyCode}
                        disabled={!linkCode}
                      >
                        {copied ? <Check style={{ width: 16, height: 16, color: '#4ade80' }} /> : <Copy style={{ width: 16, height: 16 }} />}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                      O profissional pode inserir este código manualmente na área dele
                    </p>
                  </div>

                  {/* Info */}
                  <div style={{ background: 'rgba(212,175,55,0.07)', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: GOLD, fontWeight: 500, marginBottom: '0.4rem' }}>Como funciona?</p>
                    <ol style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <li>Compartilhe o código ou QR Code com o profissional</li>
                      <li>Ele insere o código na área "Associar Estabelecimento"</li>
                      <li>A solicitação aparece aqui para você aprovar</li>
                      <li>Após aprovado, ele já faz parte da sua equipe!</li>
                    </ol>
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
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClosePaymentModal}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={spring}
              style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <div style={{ background: '#0d0c0a', ...card, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Configurar Pagamento</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Defina como o profissional será remunerado</p>
                  </div>
                  <button onClick={handleClosePaymentModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '0.25rem', borderRadius: '0.375rem' }}>
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Tipo de Pagamento */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {([
                      { value: 'percentage' as PaymentType, label: 'Porcentagem', sub: 'Por serviço', icon: <Percent style={{ width: 24, height: 24 }} /> },
                      { value: 'fixed' as PaymentType, label: 'Valor Fixo', sub: 'Mensal', icon: <DollarSign style={{ width: 24, height: 24 }} /> },
                    ]).map(opt => {
                      const active = paymentType === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setPaymentType(opt.value)}
                          style={{
                            padding: '1.5rem',
                            borderRadius: '0.75rem',
                            border: active ? `2px solid ${GOLD}` : '2px solid rgba(255,255,255,0.12)',
                            background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                            transition: 'border-color 0.2s, background 0.2s',
                          }}
                        >
                          <div style={{
                            width: 48, height: 48, borderRadius: '9999px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: active ? GOLD : 'rgba(255,255,255,0.05)',
                            color: active ? BG : 'rgba(255,255,255,0.5)',
                          }}>
                            {opt.icon}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 600, color: active ? GOLD : '#fff', fontSize: '0.9rem' }}>{opt.label}</p>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{opt.sub}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Valor */}
                  {paymentType === 'percentage' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Porcentagem do Profissional (%)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="number" min="0" max="100"
                          value={percentageValue}
                          onChange={(e) => setPercentageValue(e.target.value)}
                          style={{ ...inputStyle, fontSize: '1.1rem' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                          Estabelecimento: {100 - parseFloat(percentageValue || '0')}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                        Exemplo: Serviço de R$ 100 → Profissional recebe R$ {parseFloat(percentageValue || '0')} e estabelecimento recebe R$ {100 - parseFloat(percentageValue || '0')}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Valor Mensal Fixo (R$)</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={fixedValue}
                        onChange={(e) => setFixedValue(e.target.value)}
                        placeholder="Ex: 3000.00"
                        style={{ ...inputStyle, fontSize: '1.1rem' }}
                      />
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
                        O profissional receberá este valor fixo mensalmente, independente do número de serviços
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button style={{ ...outlineBtn, flex: 1, justifyContent: 'center' }} onClick={handleClosePaymentModal}>Cancelar</button>
                    <button
                      style={{ ...goldBtn, flex: 1, justifyContent: 'center', opacity: paymentType === 'fixed' && !fixedValue ? 0.5 : 1 }}
                      onClick={handleSavePayment}
                      disabled={paymentType === 'fixed' && !fixedValue}
                    >
                      Salvar Configuração
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </OwnerPageLayout>
  )
}
