import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Star, ArrowRight, Check, QrCode, Hash, X, Link as LinkIcon, Clock, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { ProfissionalPageLayout } from '@/components/layout/ProfissionalPageLayout'
import {
  createProfessionalLink,
  getLinksByProfessional,
  getBusinessByLinkCode,
  type ProfessionalLink,
} from '@/services/professionalLinkService'
import { getBusinessById } from '@/services/businessService'

type LinkMethod = 'qrcode' | 'code' | null

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
}

const BADGE_GOLD = {
  background: 'rgba(212,175,55,0.15)',
  color: '#D4AF37',
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
}

const BTN_GOLD = {
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
  fontSize: '0.95rem',
}

const BTN_OUTLINE = {
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontWeight: 500,
  borderRadius: '0.5rem',
  padding: '0.625rem 1.5rem',
  border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
}

const SPRING = { type: 'spring', stiffness: 320, damping: 36 }

export function ProfissionalAssociarBarbearia() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [linkMethod, setLinkMethod] = useState<LinkMethod>(null)
  const [businessCode, setBusinessCode] = useState('')
  const [linking, setLinking] = useState(false)
  const [loading, setLoading] = useState(true)

  const [links, setLinks] = useState<ProfessionalLink[]>([])
  const [businessDetails, setBusinessDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    async function loadLinks() {
      if (!user) return

      try {
        const professionalLinks = await getLinksByProfessional(user.uid)
        setLinks(professionalLinks)

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
      const business = await getBusinessByLinkCode(businessCode.trim())

      if (!business) {
        alert('Código inválido. Verifique com o proprietário do estabelecimento.')
        setLinking(false)
        return
      }

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ marginLeft: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Carregando vínculos...</span>
        </div>
      </ProfissionalPageLayout>
    )
  }

  return (
    <ProfissionalPageLayout title="Meus Estabelecimentos" subtitle="Gerencie seus vínculos com estabelecimentos">
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Botão Vincular */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
            <button style={{ ...BTN_GOLD, padding: '0.875rem 2.25rem', fontSize: '1.05rem' }} onClick={handleOpenModal}>
              <LinkIcon size={20} />
              Vincular a um estabelecimento
            </button>
          </motion.div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1.5rem', marginBottom: '3rem', maxWidth: '48rem', margin: '0 auto 3rem' }}
        >
          {/* Vinculados */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            style={{ ...CARD_STYLE, padding: '1.5rem', textAlign: 'center', cursor: 'default' }}
          >
            <Building2 size={32} color="#D4AF37" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#fff' }}>{activeLinks.length}</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {activeLinks.length === 1 ? 'Vinculado' : 'Vinculados'}
            </p>
          </motion.div>

          {/* Pendentes */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            style={{ ...CARD_STYLE, padding: '1.5rem', textAlign: 'center', cursor: 'default' }}
          >
            <Clock size={32} color="#D4AF37" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#fff' }}>{pendingLinks.length}</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {pendingLinks.length === 1 ? 'Pendente' : 'Pendentes'}
            </p>
          </motion.div>

          {/* Avaliação Média */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            style={{ ...CARD_STYLE, padding: '1.5rem', textAlign: 'center', cursor: 'default' }}
          >
            <Star size={32} color="#D4AF37" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.875rem', fontWeight: 700, color: '#fff' }}>
              {activeLinks.length > 0
                ? (
                    activeLinks.reduce((acc, l) => {
                      const biz = businessDetails[l.businessId]
                      return acc + (biz?.rating || 0)
                    }, 0) / activeLinks.length
                  ).toFixed(1)
                : '0.0'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Avaliação Média</p>
          </motion.div>
        </motion.div>

        {/* Solicitações Pendentes */}
        {pendingLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.25 }}
            style={{ marginBottom: '3rem' }}
          >
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#D4AF37',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <Clock size={20} />
              Aguardando Aprovação
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1.5rem' }}>
              {pendingLinks.map((link, index) => {
                const business = businessDetails[link.businessId]
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...SPRING, delay: index * 0.08 }}
                  >
                    <div style={{ ...CARD_STYLE, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <div style={{ position: 'relative', height: '8rem', background: 'rgba(212,175,55,0.07)', overflow: 'hidden' }}>
                        {business?.image && (
                          <img
                            src={business.image}
                            alt={link.businessName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                          />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050400 0%, transparent 100%)' }} />
                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                          <span style={BADGE_GOLD}>
                            <Clock size={11} />
                            Pendente
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '1.25rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{link.businessName}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                          Aguardando aprovação do proprietário
                        </p>
                      </div>
                    </div>
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
            transition={{ ...SPRING, delay: 0.3 }}
            style={{ marginBottom: '3rem' }}
          >
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '1.5rem',
            }}>
              Estabelecimentos Vinculados
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '2rem' }}>
              {activeLinks.map((link, index) => {
                const business = businessDetails[link.businessId]
                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...SPRING, delay: index * 0.08 }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleSelectBusiness(link.businessId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ ...CARD_STYLE, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.18)', height: '100%' }}>
                      {/* Image/Banner */}
                      <div style={{ position: 'relative', height: '10rem', background: 'rgba(212,175,55,0.07)', overflow: 'hidden' }}>
                        {business?.image && (
                          <img
                            src={business.image}
                            alt={link.businessName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
                          />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050400 0%, transparent 100%)' }} />
                        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                          <span style={BADGE_GOLD}>
                            <Check size={11} />
                            Vinculado
                          </span>
                        </div>
                        {business?.rating && (
                          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                            <span style={{ ...BADGE_GOLD, background: 'rgba(212,175,55,0.25)' }}>
                              <Star size={11} />
                              {business.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {business?.category && (
                          <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                            <span style={{
                              background: 'rgba(255,255,255,0.08)',
                              color: 'rgba(255,255,255,0.8)',
                              borderRadius: '9999px',
                              padding: '2px 10px',
                              fontSize: '0.75rem',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}>
                              {business.category}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          {link.businessName}
                        </h3>

                        {business?.description && (
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {business.description}
                          </p>
                        )}

                        {business?.address && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                            <MapPin size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {business.address.neighborhood}, {business.address.city} - {business.address.state}
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem' }}>
                          <span>Acessar Painel</span>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : pendingLinks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.3 }}
            style={{ ...CARD_STYLE, textAlign: 'center', padding: '4rem 2rem' }}
          >
            <Building2 size={72} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Nenhum estabelecimento vinculado
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Vincule-se a um estabelecimento para começar a trabalhar
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
              <button style={{ ...BTN_GOLD, padding: '0.875rem 2.25rem', fontSize: '1.05rem' }} onClick={handleOpenModal}>
                <LinkIcon size={20} />
                Vincular ao primeiro estabelecimento
              </button>
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
              style={{ position: 'fixed', inset: 0, background: 'rgba(5,4,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={SPRING}
              style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
              <div style={{
                background: '#0d0c08',
                border: '1px solid rgba(212,175,55,0.18)',
                borderRadius: '1.25rem',
                maxWidth: '32rem',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}>
                {/* Modal Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                      {linkMethod === null && 'Vincular a um estabelecimento'}
                      {linkMethod === 'qrcode' && 'Escanear QR Code'}
                      {linkMethod === 'code' && 'Inserir Código'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                      {linkMethod === null && 'Escolha como deseja se vincular'}
                      {linkMethod === 'qrcode' && 'Aponte a câmera para o QR Code'}
                      {linkMethod === 'code' && 'Digite o código fornecido pelo proprietário'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                  >
                    <X size={18} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* Modal Content */}
                <div style={{ padding: '1.5rem' }}>
                  {linkMethod === null ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* QR Code */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectLinkMethod('qrcode')}
                        style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center' }}
                      >
                        <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', background: 'linear-gradient(135deg,#D4AF37,#B8941E)', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={30} color="#050400" />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          Escanear QR Code
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          Use a câmera para ler o código do estabelecimento
                        </p>
                      </motion.button>

                      {/* Code */}
                      <motion.button
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectLinkMethod('code')}
                        style={{ padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'center' }}
                      >
                        <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', background: 'linear-gradient(135deg,#D4AF37,#B8941E)', borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Hash size={30} color="#050400" />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                          Inserir Código
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          Digite o código fornecido pelo proprietário
                        </p>
                      </motion.button>
                    </div>
                  ) : linkMethod === 'qrcode' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <QrCode size={72} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem' }} />
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Leitor de QR Code será implementado aqui
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button style={{ ...BTN_OUTLINE, flex: 1, justifyContent: 'center' }} onClick={() => setLinkMethod(null)}>
                          Voltar
                        </button>
                        <button style={{ ...BTN_GOLD, flex: 1, justifyContent: 'center' }} onClick={handleScanQRCode}>
                          <QrCode size={16} />
                          Iniciar Scanner
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label htmlFor="business-code" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                          Código do Estabelecimento
                        </label>
                        <input
                          id="business-code"
                          type="text"
                          placeholder="Ex: ABC123XYZ"
                          value={businessCode}
                          onChange={(e) => setBusinessCode(e.target.value.toUpperCase())}
                          style={{
                            width: '100%',
                            height: '3rem',
                            padding: '0 1rem',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '0.75rem',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.15em',
                            textAlign: 'center',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                          Digite o código fornecido pelo proprietário do estabelecimento
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          style={{ ...BTN_OUTLINE, flex: 1, justifyContent: 'center', opacity: linking ? 0.6 : 1, cursor: linking ? 'not-allowed' : 'pointer' }}
                          onClick={() => setLinkMethod(null)}
                          disabled={linking}
                        >
                          Voltar
                        </button>
                        <button
                          style={{ ...BTN_GOLD, flex: 1, justifyContent: 'center', opacity: (!businessCode.trim() || linking) ? 0.5 : 1, cursor: (!businessCode.trim() || linking) ? 'not-allowed' : 'pointer' }}
                          onClick={handleSubmitCode}
                          disabled={!businessCode.trim() || linking}
                        >
                          {linking ? (
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Check size={16} />
                          )}
                          {linking ? 'Vinculando...' : 'Vincular'}
                        </button>
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
