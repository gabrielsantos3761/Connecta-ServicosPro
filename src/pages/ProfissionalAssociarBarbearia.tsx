import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Star, ArrowRight, Check, QrCode, Hash, X, Link as LinkIcon, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { ProfissionalPageLayout } from '@/components/layout/ProfissionalPageLayout'
import {
  createProfessionalLink,
  getLinksByProfessional,
  getBusinessByLinkCode,
  type ProfessionalLink,
} from '@/services/professionalLinkService'
import { getBusinessById } from '@/services/businessService'

type LinkMethod = 'qrcode' | 'code' | null

export function ProfissionalAssociarBarbearia() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [linkMethod, setLinkMethod] = useState<LinkMethod>(null)
  const [businessCode, setBusinessCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [loading, setLoading] = useState(true)

  // Links do profissional (vindos do Firestore)
  const [links, setLinks] = useState<ProfessionalLink[]>([])
  const [businessDetails, setBusinessDetails] = useState<Record<string, any>>({})

  // Carregar vínculos do Firestore
  useEffect(() => {
    async function loadLinks() {
      if (!user) return

      try {
        const professionalLinks = await getLinksByProfessional(user.uid)
        setLinks(professionalLinks)

        // Carregar detalhes dos estabelecimentos vinculados
        const details: Record<string, any> = {}
        for (const link of professionalLinks) {
          if (link.status === 'active' || link.status === 'pending') {
            try {
              const business = await getBusinessById(link.businessId)
              if (business) {
                details[link.businessId] = business
              }
            } catch {
              // Business pode não existir mais
            }
          }
        }
        setBusinessDetails(details)
      } catch (error) {
        console.error('Erro ao carregar vínculos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLinks()
  }, [user])

  const activeLinks = links.filter(l => l.status === 'active')
  const pendingLinks = links.filter(l => l.status === 'pending')

  const handleSelectBusiness = (businessId: string) => {
    navigate(`/profissional/${businessId}/painel`)
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setLinkMethod(null)
    setBusinessCode('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setLinkMethod(null)
    setBusinessCode('')
  }

  const handleSelectLinkMethod = (method: LinkMethod) => {
    setLinkMethod(method)
  }

  const handleSubmitCode = async () => {
    if (!businessCode.trim() || !user) return
    setLinking(true)

    try {
      // Buscar o estabelecimento pelo código
      const business = await getBusinessByLinkCode(businessCode.trim())

      if (!business) {
        alert('Código inválido. Verifique com o proprietário do estabelecimento.')
        setLinking(false)
        return
      }

      // Criar o vínculo com status pending
      await createProfessionalLink({
        professionalId: user.uid,
        professionalName: user.name,
        professionalEmail: user.email,
        professionalAvatar: user.avatar,
        businessId: business.id,
        businessName: business.name,
        linkedBy: 'code',
      })

      alert('Solicitação enviada! Aguarde a aprovação do proprietário.')
      handleCloseModal()

      // Recarregar os vínculos
      const updatedLinks = await getLinksByProfessional(user.uid)
      setLinks(updatedLinks)
    } catch (error: any) {
      alert(error.message || 'Erro ao vincular. Tente novamente.')
    } finally {
      setLinking(false)
    }
  }

  const handleScanQRCode = () => {
    // TODO: Implementar leitor de QR Code
    alert('Abrindo leitor de QR Code...')
  }

  if (loading) {
    return (
      <ProfissionalPageLayout title="Meus Estabelecimentos" subtitle="Gerencie seus vínculos com estabelecimentos">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-400">Carregando vínculos...</span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  return (
    <ProfissionalPageLayout title="Meus Estabelecimentos" subtitle="Gerencie seus vínculos com estabelecimentos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Botão Vincular */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-emerald-500/30"
            >
              <LinkIcon className="w-5 h-5 mr-2" />
              Vincular a um estabelecimento
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-all"
          >
            <Building2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{activeLinks.length}</p>
            <p className="text-sm text-gray-400">
              {activeLinks.length === 1 ? 'Vinculado' : 'Vinculados'}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-yellow-500/50 transition-all"
          >
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{pendingLinks.length}</p>
            <p className="text-sm text-gray-400">
              {pendingLinks.length === 1 ? 'Pendente' : 'Pendentes'}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-all"
          >
            <Star className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">
              {activeLinks.length > 0
                ? (
                    activeLinks.reduce((acc, l) => {
                      const biz = businessDetails[l.businessId]
                      return acc + (biz?.rating || 0)
                    }, 0) / activeLinks.length
                  ).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-sm text-gray-400">Avaliação Média</p>
          </motion.div>
        </motion.div>

        {/* Solicitações Pendentes */}
        {pendingLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Aguardando Aprovação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLinks.map((link, index) => {
                const business = businessDetails[link.businessId]
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full border-2 border-yellow-500/30 bg-white/5 backdrop-blur-sm overflow-hidden">
                      <div className="relative h-32 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 overflow-hidden">
                        {business?.image && (
                          <img
                            src={business.image}
                            alt={link.businessName}
                            className="w-full h-full object-cover opacity-60"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h4 className="text-lg font-bold text-white mb-1">{link.businessName}</h4>
                        <p className="text-sm text-gray-400">
                          Aguardando aprovação do proprietário
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Estabelecimentos Vinculados (Ativos) */}
        {activeLinks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Estabelecimentos Vinculados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeLinks.map((link, index) => {
                const business = businessDetails[link.businessId]
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleSelectBusiness(link.businessId)}
                  >
                    <Card className="h-full cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 border-2 border-emerald-500/30 hover:border-emerald-500/50 group overflow-hidden bg-white/5 backdrop-blur-sm">
                      {/* Image/Banner */}
                      <div className="relative h-40 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 overflow-hidden">
                        {business?.image && (
                          <img
                            src={business.image}
                            alt={link.businessName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0">
                            <Check className="w-3 h-3 mr-1" />
                            Vinculado
                          </Badge>
                        </div>
                        {business?.rating && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-gradient-to-r from-gold to-yellow-600 text-black border-0">
                              <Star className="w-3 h-3 mr-1 fill-black" />
                              {business.rating.toFixed(1)}
                            </Badge>
                          </div>
                        )}
                        {business?.category && (
                          <div className="absolute bottom-3 left-3 right-3">
                            <Badge
                              variant="outline"
                              className="bg-white/10 backdrop-blur-sm text-white border-white/20"
                            >
                              {business.category}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-green-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                          {link.businessName}
                        </h3>

                        {business?.description && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                            {business.description}
                          </p>
                        )}

                        {business?.address && (
                          <div className="flex items-start gap-2 text-sm text-gray-400 mb-4">
                            <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="line-clamp-2">
                              {business.address.neighborhood}, {business.address.city} - {business.address.state}
                            </p>
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                          <span>Acessar Painel</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : pendingLinks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <Building2 className="w-20 h-20 mx-auto text-gray-600 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Nenhum estabelecimento vinculado
            </h3>
            <p className="text-gray-400 mb-8">
              Vincule-se a um estabelecimento para começar a trabalhar
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-emerald-500/30"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Vincular ao primeiro estabelecimento
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </div>

      {/* Modal de Vinculação */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {linkMethod === null && 'Vincular a um estabelecimento'}
                      {linkMethod === 'qrcode' && 'Escanear QR Code'}
                      {linkMethod === 'code' && 'Inserir Código'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {linkMethod === null && 'Escolha como deseja se vincular'}
                      {linkMethod === 'qrcode' && 'Aponte a câmera para o QR Code'}
                      {linkMethod === 'code' && 'Digite o código fornecido pelo proprietário'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {linkMethod === null ? (
                    // Seleção do método
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Opção QR Code */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectLinkMethod('qrcode')}
                        className="p-6 rounded-xl border-2 border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 transition-all group"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <QrCode className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                          Escanear QR Code
                        </h4>
                        <p className="text-sm text-gray-400">
                          Use a câmera para ler o código do estabelecimento
                        </p>
                      </motion.button>

                      {/* Opção Código */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectLinkMethod('code')}
                        className="p-6 rounded-xl border-2 border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 transition-all group"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <Hash className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                          Inserir Código
                        </h4>
                        <p className="text-sm text-gray-400">
                          Digite o código fornecido pelo proprietário
                        </p>
                      </motion.button>
                    </div>
                  ) : linkMethod === 'qrcode' ? (
                    // Leitor de QR Code
                    <div className="space-y-6">
                      <div className="aspect-square bg-white/5 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                        <div className="text-center">
                          <QrCode className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-400">
                            Leitor de QR Code será implementado aqui
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setLinkMethod(null)}
                          className="flex-1 border-white/10 text-white hover:bg-white/5"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleScanQRCode}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Iniciar Scanner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Input de Código
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="business-code" className="text-sm font-medium text-gray-300">
                          Código do Estabelecimento
                        </Label>
                        <input
                          id="business-code"
                          type="text"
                          placeholder="Ex: ABC123XYZ"
                          value={businessCode}
                          onChange={(e) => setBusinessCode(e.target.value.toUpperCase())}
                          className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all text-center text-lg font-mono tracking-wider"
                        />
                        <p className="text-xs text-gray-400">
                          Digite o código fornecido pelo proprietário do estabelecimento
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setLinkMethod(null)}
                          disabled={linking}
                          className="flex-1 border-white/10 text-white hover:bg-white/5"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleSubmitCode}
                          disabled={!businessCode.trim() || linking}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {linking ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          {linking ? 'Vinculando...' : 'Vincular'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ProfissionalPageLayout>
  )
}
