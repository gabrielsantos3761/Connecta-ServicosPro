import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Mail, Users, DollarSign, Percent, X, QrCode, Copy, Check, Clock, UserCheck, UserX, Loader2, Phone, MapPin, User, Settings2, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'
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
  type ProfessionalLink,
} from '@/services/professionalLinkService'
import {
  getProfissionalInfoPessoais,
  getProfissionalEspecialidades,
  getProfissionalEndereco,
  type EnderecoData,
} from '@/services/professionalProfileService'

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

export function Profissionais() {
  const { user } = useAuth()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
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

  // Modo de gerenciamento
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set())
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  // Links do Firestore
  const [links, setLinks] = useState<ProfessionalLink[]>([])

  const businessId = localStorage.getItem('selected_business_id')

  // Carregar vínculos do Firestore e garantir que o owner está vinculado
  useEffect(() => {
    async function loadLinks() {
      if (!businessId || !user) return

      try {
        // Limpar duplicatas existentes no Firestore
        await cleanDuplicateLinks(businessId)

        let businessLinks = await getLinksByBusiness(businessId)

        // Verificar se o owner já está vinculado ao próprio negócio
        const ownerLinked = businessLinks.some(l => l.professionalId === user.uid)

        if (!ownerLinked) {
          // Buscar dados do business para o nome
          const business = await getBusinessById(businessId)
          if (business && business.ownerId === user.uid) {
            // Criar perfil profissional do owner se não existir
            try {
              await updateProfessionalProfile(user.uid, {
                specialties: [],
              })
            } catch { /* pode falhar se já existir */ }

            // Criar vínculo ativo automático
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
              // Recarregar links
              businessLinks = await getLinksByBusiness(businessId)
            } catch (e: any) {
              // Ignorar se já existe (não é erro real)
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

  // Carregar dados de perfil dos profissionais ativos
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
            console.error(`Erro ao carregar perfil do profissional ${link.professionalId}:`, error)
          }
        })
      )

      setProfilesData(profilesMap)
    }

    loadProfiles()
  }, [links])

  const pendingLinks = links.filter(l => l.status === 'pending')
  const activeLinks = links.filter(l => l.status === 'active')

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

  const handleOpenAddModal = async () => {
    setIsAddProfModalOpen(true)

    // Gerar/obter o código de vinculação
    if (businessId) {
      try {
        const code = await getOrCreateLinkCode(businessId)
        setLinkCode(code)
      } catch (error) {
        console.error('Erro ao gerar código:', error)
      }
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

      // Atualizar a lista local
      setLinks(prev => prev.map(l =>
        l.id === linkId ? { ...l, status: 'active' as const } : l
      ))
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

      // Remover da lista local
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

  // ---- Gerenciar modo ----
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
    if (selectedForRemoval.size === activeLinks.length) {
      setSelectedForRemoval(new Set())
    } else {
      setSelectedForRemoval(new Set(activeLinks.map(l => l.id)))
    }
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="ml-3 text-gray-400">Carregando equipe...</span>
        </div>
      </OwnerPageLayout>
    )
  }

  return (
    <OwnerPageLayout title="Profissionais" subtitle="Gerencie sua equipe">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-lg md:text-xl font-semibold ${theme.colors.text.primary}`}>
            {activeLinks.length} {activeLinks.length === 1 ? 'Profissional' : 'Profissionais'}
          </h2>
          <p className={`text-xs md:text-sm ${theme.colors.text.secondary} mt-1`}>
            {pendingLinks.length > 0 && (
              <span className="text-yellow-400 font-medium">
                {pendingLinks.length} {pendingLinks.length === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
              </span>
            )}
            {pendingLinks.length === 0 && 'Todos os profissionais estão ativos'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {/* Botão Aprovações Pendentes */}
          {pendingLinks.length > 0 && !isManageMode && (
            <Button
              variant="outline"
              size="sm"
              className="relative flex-1 sm:flex-none border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              onClick={() => {
                document.getElementById('pending-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Aprovações
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingLinks.length}
              </span>
            </Button>
          )}

          {/* Controles do modo gerenciar */}
          {isManageMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-white/20 text-white/70 hover:bg-white/10"
                onClick={handleSelectAll}
              >
                {selectedForRemoval.size === activeLinks.length ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {selectedForRemoval.size === activeLinks.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                disabled={selectedForRemoval.size === 0}
                onClick={() => setIsConfirmRemoveOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Desvincular ({selectedForRemoval.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none border-white/20 text-white/70 hover:bg-white/10"
                onClick={handleToggleManageMode}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              {activeLinks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-white/20 text-white/70 hover:bg-white/10"
                  onClick={handleToggleManageMode}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Gerenciar Profissional
                </Button>
              )}
              <Button
                variant="gold"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={handleOpenAddModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Profissional
              </Button>
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
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Solicitações Pendentes ({pendingLinks.length})
          </h3>

          <div className="space-y-3">
            {pendingLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${theme.colors.card.base} border-l-4 border-l-yellow-500`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Info do profissional */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-bold bg-gradient-to-br from-yellow-500 to-yellow-600">
                          {link.professionalAvatar ? (
                            <img src={link.professionalAvatar} alt={link.professionalName} className="w-full h-full object-cover" />
                          ) : (
                            link.professionalName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${theme.colors.text.primary}`}>
                            {link.professionalName}
                          </h4>
                          <p className={`text-sm ${theme.colors.text.secondary}`}>
                            {link.professionalEmail}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                              <Clock className="w-3 h-3 mr-1" />
                              Aguardando aprovação
                            </Badge>
                            <span className={`text-xs ${theme.colors.text.tertiary}`}>
                              via {link.linkedBy === 'code' ? 'código' : link.linkedBy === 'qrcode' ? 'QR Code' : 'convite'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={() => handleRejectLink(link.id)}
                          disabled={actionLoading === link.id}
                          variant="outline"
                          className="flex-1 sm:flex-none border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {actionLoading === link.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Recusar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveLink(link.id)}
                          disabled={actionLoading === link.id}
                          variant="gold"
                          className="flex-1 sm:flex-none"
                        >
                          {actionLoading === link.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {activeLinks.map((link, index) => {
            const profile = profilesData[link.professionalId] || {}
            const displayName = profile.name || link.professionalName
            const avatar = profile.avatarUrl || link.professionalAvatar
            const phone = profile.phone
            const specialties = profile.specialties || []

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: isManageMode ? 0 : -5 }}
              >
                <Card
                  className={cn(
                    `h-full ${theme.colors.card.base} hover:shadow-xl transition-all duration-300 group border-l-4`,
                    isManageMode && selectedForRemoval.has(link.id)
                      ? 'border-l-red-500 ring-2 ring-red-500/40'
                      : 'border-l-gold',
                    isManageMode && 'cursor-pointer'
                  )}
                  onClick={isManageMode ? () => handleToggleSelect(link.id) : undefined}
                >
                  <CardHeader className="pb-3">
                    {/* Avatar + Status / Checkbox */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-gold to-gold-dark flex-shrink-0">
                          {avatar ? (
                            <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-white/80" />
                          )}
                        </div>
                        {/* Checkbox overlay no modo gerenciar */}
                        {isManageMode && (
                          <div className={cn(
                            'absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors',
                            selectedForRemoval.has(link.id)
                              ? 'bg-red-500 border-red-500'
                              : 'bg-gray-800 border-white/30'
                          )}>
                            {selectedForRemoval.has(link.id) && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        )}
                      </div>
                      <Badge variant="success">
                        Ativo
                      </Badge>
                    </div>

                    {/* Nome */}
                    <CardTitle className="text-base text-gold leading-tight">
                      {displayName}
                    </CardTitle>

                    {/* Cargo */}
                    <p className={`text-sm ${theme.colors.text.secondary}`}>
                      {link.role || 'Profissional'}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Especialidades */}
                    {specialties.length > 0 && (
                      <div className="mb-4">
                        <p className={`text-xs ${theme.colors.text.tertiary} mb-2`}>Especialidades:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {specialties.map((spec) => (
                            <span
                              key={spec}
                              className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botões — ocultos no modo gerenciar */}
                    {!isManageMode && (
                      <div className={`space-y-2 pt-3 border-t ${theme.colors.border.light}`}>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/15 text-xs"
                            onClick={() => window.open(`mailto:${link.professionalEmail}`, '_blank')}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/15 text-xs disabled:opacity-40"
                            disabled={!phone}
                            onClick={() => phone && window.open(`tel:${phone}`, '_blank')}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Ligar
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-gold text-gold hover:bg-gold/10"
                          onClick={() => handleOpenPaymentModal(link.id)}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Configurar Pagamento
                        </Button>
                        <button
                          className="w-full text-sm text-gold hover:text-gold-dark transition-colors py-1 font-medium"
                          onClick={() => handleOpenProfileModal(link)}
                        >
                          Ver Perfil Completo
                        </button>
                      </div>
                    )}

                    {/* Indicador no modo gerenciar */}
                    {isManageMode && (
                      <div className={cn(
                        'mt-3 pt-3 border-t text-center text-xs py-1 rounded-md transition-colors',
                        theme.colors.border.light,
                        selectedForRemoval.has(link.id)
                          ? 'text-red-400'
                          : 'text-white/40'
                      )}>
                        {selectedForRemoval.has(link.id) ? 'Selecionado para desvincular' : 'Clique para selecionar'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      ) : pendingLinks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white/5 rounded-xl border border-white/10"
        >
          <Users className="w-20 h-20 mx-auto text-gray-600 mb-6" />
          <h3 className={`text-2xl font-bold ${theme.colors.text.primary} mb-2`}>
            Nenhum profissional na equipe
          </h3>
          <p className={`${theme.colors.text.secondary} mb-8`}>
            Adicione profissionais compartilhando o código de vinculação
          </p>
          <Button variant="gold" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Profissional
          </Button>
        </motion.div>
      ) : null}

      {/* Modal de Confirmação de Desvinculação */}
      <AnimatePresence>
        {isConfirmRemoveOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !removeLoading && setIsConfirmRemoveOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${theme.colors.text.primary}`}>
                      Desvincular Profissional{selectedForRemoval.size > 1 ? 'is' : ''}
                    </h3>
                    <p className={`text-sm ${theme.colors.text.secondary}`}>
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                </div>

                <p className={`text-sm ${theme.colors.text.secondary} mb-2`}>
                  Você está prestes a desvincular <span className="text-white font-semibold">{selectedForRemoval.size} profissional{selectedForRemoval.size > 1 ? 'is' : ''}</span> do seu estabelecimento.
                </p>
                <p className={`text-xs ${theme.colors.text.tertiary} mb-6`}>
                  O vínculo será removido do banco de dados. O profissional poderá se vincular novamente no futuro se necessário.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/20 text-white/70"
                    onClick={() => setIsConfirmRemoveOpen(false)}
                    disabled={removeLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                    onClick={handleConfirmRemove}
                    disabled={removeLoading}
                  >
                    {removeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {removeLoading ? 'Desvinculando...' : 'Confirmar'}
                  </Button>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h3 className={`text-xl font-bold ${theme.colors.text.primary}`}>
                    Perfil Completo
                  </h3>
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className={`w-5 h-5 ${theme.colors.text.tertiary}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Avatar + Nome */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-gold to-gold-dark flex-shrink-0">
                      {selectedProfileModal.profile.avatarUrl || selectedProfileModal.link.professionalAvatar ? (
                        <img
                          src={selectedProfileModal.profile.avatarUrl || selectedProfileModal.link.professionalAvatar}
                          alt={selectedProfileModal.profile.name || selectedProfileModal.link.professionalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white/80" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${theme.colors.text.primary}`}>
                        {selectedProfileModal.profile.name || selectedProfileModal.link.professionalName}
                      </h4>
                      <p className={`text-sm ${theme.colors.text.secondary}`}>
                        {selectedProfileModal.link.role || 'Profissional'}
                      </p>
                      <Badge variant="success" className="mt-1">Ativo</Badge>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div>
                    <h5 className={`text-sm font-semibold ${theme.colors.text.secondary} mb-3 uppercase tracking-wider`}>
                      Contato
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                        <span className={`text-sm ${theme.colors.text.primary} break-all`}>
                          {selectedProfileModal.link.professionalEmail}
                        </span>
                      </div>
                      {selectedProfileModal.profile.phone && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                          <span className={`text-sm ${theme.colors.text.primary}`}>
                            {selectedProfileModal.profile.phone}
                          </span>
                        </div>
                      )}
                      {selectedProfileModal.profile.pix && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                          <DollarSign className="w-4 h-4 text-gold flex-shrink-0" />
                          <div>
                            <p className={`text-xs ${theme.colors.text.tertiary}`}>PIX</p>
                            <p className={`text-sm ${theme.colors.text.primary}`}>
                              {selectedProfileModal.profile.pix}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Especialidades */}
                  {selectedProfileModal.profile.specialties && selectedProfileModal.profile.specialties.length > 0 && (
                    <div>
                      <h5 className={`text-sm font-semibold ${theme.colors.text.secondary} mb-3 uppercase tracking-wider`}>
                        Especialidades
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfileModal.profile.specialties.map((spec) => (
                          <span
                            key={spec}
                            className="text-sm px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Endereço */}
                  {selectedProfileModal.profile.endereco && (
                    selectedProfileModal.profile.endereco.endereco ||
                    selectedProfileModal.profile.endereco.cep
                  ) && (
                    <div>
                      <h5 className={`text-sm font-semibold ${theme.colors.text.secondary} mb-3 uppercase tracking-wider`}>
                        Endereço
                      </h5>
                      <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <div className={`text-sm ${theme.colors.text.primary} space-y-0.5`}>
                          {selectedProfileModal.profile.endereco.endereco && (
                            <p>
                              {selectedProfileModal.profile.endereco.endereco}
                              {selectedProfileModal.profile.endereco.numero && `, ${selectedProfileModal.profile.endereco.numero}`}
                            </p>
                          )}
                          {selectedProfileModal.profile.endereco.complemento && (
                            <p className={theme.colors.text.secondary}>
                              {selectedProfileModal.profile.endereco.complemento}
                            </p>
                          )}
                          {selectedProfileModal.profile.endereco.cep && (
                            <p className={theme.colors.text.secondary}>
                              CEP: {selectedProfileModal.profile.endereco.cep}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vincular desde */}
                  <div className={`text-xs ${theme.colors.text.tertiary} pt-2 border-t border-white/10`}>
                    Vinculado via {selectedProfileModal.link.linkedBy === 'code' ? 'código' : selectedProfileModal.link.linkedBy === 'qrcode' ? 'QR Code' : 'convite'}
                  </div>
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
                        value={linkCode || 'Gerando...'}
                        readOnly
                        className="font-mono text-center text-lg tracking-wider"
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopyCode}
                        disabled={!linkCode}
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
                      O profissional pode inserir este código manualmente na área dele
                    </p>
                  </div>

                  {/* Info */}
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                    <p className="text-sm text-gold font-medium mb-1">Como funciona?</p>
                    <ol className={`text-xs ${theme.colors.text.secondary} space-y-1 list-decimal list-inside`}>
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
    </OwnerPageLayout>
  )
}
