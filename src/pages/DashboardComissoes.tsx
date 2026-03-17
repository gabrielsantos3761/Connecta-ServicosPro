import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Percent, User, X, Loader2, CheckCircle, DollarSign, Users, Edit2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import {
  getLinksByBusiness,
  updateLinkDetails,
  type ProfessionalLink,
} from '@/services/professionalLinkService'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ─── Design tokens ─────────────────────────────────────────────────────────
const gold = '#D4AF37'
const gold2 = '#B8941E'
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1.125rem' }
const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }
const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', padding: '0.625rem 0.875rem', outline: 'none', fontSize: '0.875rem', width: '100%', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.375rem' }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function linkStatusBadge(s: string): React.CSSProperties {
  if (s === 'active') return { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }
  if (s === 'pending') return { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
  if (s === 'rejected') return { background: 'rgba(248,113,113,0.12)', color: '#f87171' }
  return { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }
}

const BADGE_BASE: React.CSSProperties = { borderRadius: '9999px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 600 }

export function DashboardComissoes() {
  const { businessId } = useParams<{ businessId: string }>()
  const { toast } = useToast()
  const [links, setLinks] = useState<ProfessionalLink[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProfessionalLink | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [paymentType, setPaymentType] = useState<'percentage' | 'fixed'>('percentage')
  const [commission, setCommission] = useState('')
  const [fixedMonthly, setFixedMonthly] = useState('')

  useEffect(() => {
    if (!businessId) return
    getLinksByBusiness(businessId)
      .then(data => setLinks(data.filter(l => l.status === 'active' || l.status === 'pending')))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [businessId])

  const openEdit = (link: ProfessionalLink) => {
    setEditing(link)
    setPaymentType(link.paymentType ?? 'percentage')
    setCommission(link.commission != null ? String(link.commission) : '')
    setFixedMonthly(link.fixedMonthly != null ? String(link.fixedMonthly) : '')
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateLinkDetails(editing.id, {
        paymentType,
        commission: paymentType === 'percentage' ? Number(commission) || 0 : undefined,
        fixedMonthly: paymentType === 'fixed' ? Number(fixedMonthly) || 0 : undefined,
      })
      setLinks(prev => prev.map(l => l.id === editing.id
        ? { ...l, paymentType, commission: paymentType === 'percentage' ? Number(commission) : undefined, fixedMonthly: paymentType === 'fixed' ? Number(fixedMonthly) : undefined }
        : l
      ))
      toast({ title: 'Comissão atualizada', description: `Configuração salva para ${editing.professionalName}.` })
      setEditing(null)
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const activeLinks = links.filter(l => l.status === 'active')
  const totalFixed = activeLinks.filter(l => l.paymentType === 'fixed').reduce((s, l) => s + (l.fixedMonthly ?? 0), 0)
  const avgCommission = activeLinks.filter(l => l.paymentType === 'percentage' && l.commission)
  const avgPct = avgCommission.length ? avgCommission.reduce((s, l) => s + (l.commission ?? 0), 0) / avgCommission.length : 0

  return (
    <OwnerPageLayout title="Gestão de Comissões" subtitle="Configure pagamentos e comissões por profissional">

      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Profissionais Ativos', value: String(activeLinks.length), icon: Users },
          { label: 'Folha Fixa Mensal', value: formatCurrency(totalFixed), icon: DollarSign },
          { label: 'Comissão Média', value: avgPct > 0 ? `${avgPct.toFixed(0)}%` : '—', icon: Percent },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.07 }}
            style={{ ...card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <kpi.icon size={18} style={{ color: gold }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}>{kpi.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0 0' }}>{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Professionals list */}
      <motion.div style={{ ...card }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.22 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={17} style={{ color: gold }} />
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#fff', margin: 0 }}>Profissionais Vinculados</h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2.5rem 1.5rem', color: 'rgba(255,255,255,0.4)' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Carregando...
          </div>
        ) : links.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <User size={36} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>Nenhum profissional vinculado ainda.</p>
          </div>
        ) : (
          <div>
            {links.map((link, i) => {
              const hasConfig = link.paymentType != null
              const configLabel = !hasConfig ? 'Não configurado'
                : link.paymentType === 'fixed' ? `Fixo: ${formatCurrency(link.fixedMonthly ?? 0)}/mês`
                : `Comissão: ${link.commission ?? 0}%`

              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.26 + i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: i < links.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  {/* Avatar */}
                  {link.professionalAvatar ? (
                    <img src={link.professionalAvatar} alt={link.professionalName} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: `linear-gradient(135deg,${gold},${gold2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, color: '#050400' }}>
                      {getInitials(link.professionalName)}
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{link.professionalName}</p>
                      <span style={{ ...BADGE_BASE, ...linkStatusBadge(link.status) }}>{link.status === 'active' ? 'Ativo' : 'Pendente'}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.professionalEmail}</p>
                    <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0', color: hasConfig ? gold : 'rgba(255,255,255,0.3)', fontWeight: hasConfig ? 600 : 400 }}>
                      {configLabel}
                    </p>
                  </div>

                  {/* Edit button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => openEdit(link)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.875rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '0.5rem', color: gold, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Edit2 size={13} /> Editar
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={spring}
              style={{ position: 'relative', background: '#0a0900', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.125rem', padding: '1.75rem', width: '100%', maxWidth: '440px' }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#fff', margin: 0 }}>Editar Comissão</h3>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0' }}>{editing.professionalName}</p>
                </div>
                <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Payment type selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Tipo de Pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                  {([['percentage', 'Porcentagem (%)'], ['fixed', 'Fixo Mensal (R$)']] as const).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setPaymentType(type)}
                      style={{ padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', border: paymentType === type ? `1px solid ${gold}` : '1px solid rgba(255,255,255,0.1)', background: paymentType === type ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)', color: paymentType === type ? gold : 'rgba(255,255,255,0.6)' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value input */}
              {paymentType === 'percentage' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Percentual de Comissão</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min="0" max="100" value={commission} onChange={e => setCommission(e.target.value)} placeholder="ex: 30" style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                    <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: gold, fontWeight: 700, fontSize: '0.9rem' }}>%</span>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Salário Fixo Mensal</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: gold, fontWeight: 700, fontSize: '0.85rem' }}>R$</span>
                    <input type="number" min="0" value={fixedMonthly} onChange={e => setFixedMonthly(e.target.value)} placeholder="ex: 2500" style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setEditing(null)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.625rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 2, padding: '0.75rem', background: saving ? 'rgba(212,175,55,0.4)' : `linear-gradient(135deg,${gold},${gold2})`, border: 'none', borderRadius: '0.625rem', color: '#050400', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><CheckCircle size={14} /> Salvar</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </OwnerPageLayout>
  )
}
