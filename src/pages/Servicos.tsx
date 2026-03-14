import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scissors,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Percent,
  Ticket,
  Tag,
  Package,
  List,
  Filter,
  Check,
  X,
  Search,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { OwnerPageLayout } from '@/components/layout/OwnerPageLayout'
import { useToast } from '@/hooks/use-toast'
import {
  type ServicoData,
  type CategoriaData,
  type ComboData,
  type CupomData,
  type PromocaoData,
  getServicos,
  addServico,
  updateServico,
  deleteServicos,
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategorias,
  getCombos,
  addCombo,
  updateCombo,
  deleteCombos,
  getCupons,
  addCupom,
  updateCupom,
  deleteCupons,
  getPromocoes,
  addPromocao,
  updatePromocao,
  deletePromocoes,
} from '@/services/gerenciarServicosService'

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
  fontSize: '0.9rem',
}

const textareaStyle: React.CSSProperties = {
  ...{} as React.CSSProperties,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#fff',
  padding: '0.5rem 0.75rem',
  outline: 'none',
  width: '100%',
  fontSize: '0.9rem',
  minHeight: 100,
  resize: 'vertical' as const,
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
  fontSize: '0.875rem',
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

const inlineBadge = (color?: string): React.CSSProperties => ({
  background: color === 'green' ? 'rgba(34,197,94,0.15)'
    : color === 'red' ? 'rgba(239,68,68,0.15)'
    : 'rgba(212,175,55,0.15)',
  color: color === 'green' ? '#4ade80'
    : color === 'red' ? '#f87171'
    : GOLD,
  borderRadius: '9999px',
  padding: '2px 10px',
  fontSize: '0.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.2rem',
})

const spring = { type: 'spring', stiffness: 320, damping: 36 }

// ─── Tab types ────────────────────────────────────────────────────
type TabType = 'servicos' | 'categorias' | 'combos' | 'cupons' | 'promocoes'

const TABS: { value: TabType; label: string; icon: React.ReactNode }[] = [
  { value: 'servicos', label: 'Serviços', icon: <Scissors style={{ width: 15, height: 15 }} /> },
  { value: 'categorias', label: 'Categorias', icon: <Tag style={{ width: 15, height: 15 }} /> },
  { value: 'combos', label: 'Combos', icon: <Package style={{ width: 15, height: 15 }} /> },
  { value: 'cupons', label: 'Cupons', icon: <Ticket style={{ width: 15, height: 15 }} /> },
  { value: 'promocoes', label: 'Promoções', icon: <Percent style={{ width: 15, height: 15 }} /> },
]

function useBusinessId() {
  const navigate = useNavigate()
  const businessId = localStorage.getItem('selected_business_id')
  useEffect(() => {
    if (!businessId) navigate('/selecionar-empresa')
  }, [businessId, navigate])
  return businessId
}

// ─── Modal wrapper ───────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; wide?: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={spring}
            style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <div style={{ background: '#0d0c0a', ...card, maxWidth: wide ? 680 : 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, color: GOLD }}>{title}</h3>
                  {subtitle && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>{subtitle}</p>}
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', padding: '0.25rem', borderRadius: '0.375rem' }}>
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onCancel, onSave, saving, saveLabel }: { onCancel: () => void; onSave: () => void; saving: boolean; saveLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '1.25rem' }}>
      <button style={outlineBtn} onClick={onCancel}>Cancelar</button>
      <button style={{ ...goldBtn, opacity: saving ? 0.7 : 1 }} onClick={onSave} disabled={saving}>
        {saving && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
        {saveLabel}
      </button>
    </div>
  )
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 20, height: 20, border: `2px solid ${checked ? GOLD : 'rgba(255,255,255,0.3)'}`,
        borderRadius: '0.25rem', background: checked ? GOLD : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      {checked && <Check style={{ width: 13, height: 13, color: BG }} />}
    </div>
  )
}

// ─── SERVICOS TAB ────────────────────────────────────────────────
function ServicosTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [servicos, setServicos] = useState<ServicoData[]>([])
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [editingService, setEditingService] = useState<ServicoData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCategoryHint, setShowCategoryHint] = useState(false)
  const [categoryHintOpacity, setCategoryHintOpacity] = useState(1)
  const [formData, setFormData] = useState({ name: '', description: '', category: '', price: '', duration: '' })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [servicosData, categoriasData] = await Promise.all([getServicos(businessId), getCategorias(businessId)])
      setServicos(servicosData)
      setCategorias(categoriasData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar serviços', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  let filteredServices = servicos
  if (selectedCategoryFilters.length > 0) filteredServices = filteredServices.filter(s => selectedCategoryFilters.includes(s.category))
  if (searchTerm.trim()) filteredServices = filteredServices.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCategoryToggle = (category: string) => {
    setSelectedCategoryFilters(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])
  }

  const handleOpenModal = (service?: ServicoData) => {
    if (service) {
      setEditingService(service)
      const hours = Math.floor(service.duration / 60)
      const minutes = service.duration % 60
      setFormData({ name: service.name, description: service.description, category: service.category, price: service.price.toString(), duration: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` })
    } else {
      setEditingService(null)
      setFormData({ name: '', description: '', category: '', price: '', duration: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
    setFormData({ name: '', description: '', category: '', price: '', duration: '' })
  }

  const handleSaveService = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.duration) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    const [hours, minutes] = formData.duration.split(':').map(Number)
    const durationMinutes = (hours || 0) * 60 + (minutes || 0)
    try {
      setSaving(true)
      if (editingService) {
        await updateServico(businessId, editingService.id, { name: formData.name, description: formData.description, category: formData.category, price: parseFloat(formData.price), duration: durationMinutes })
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso' })
      } else {
        await addServico(businessId, { name: formData.name, description: formData.description, category: formData.category, price: parseFloat(formData.price), duration: durationMinutes })
        toast({ title: 'Sucesso', description: 'Serviço adicionado com sucesso' })
      }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar serviço', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => { setIsManageMode(!isManageMode); if (isManageMode) setSelectedServices(new Set()) }

  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => { const s = new Set(prev); s.has(serviceId) ? s.delete(serviceId) : s.add(serviceId); return s })
  }

  const handleDeleteSelected = async () => {
    try {
      setSaving(true)
      await deleteServicos(businessId, Array.from(selectedServices))
      toast({ title: 'Sucesso', description: `${selectedServices.size} serviço(s) removido(s)` })
      setSelectedServices(new Set())
      setIsManageMode(false)
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao deletar serviços', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button style={goldBtn} onClick={() => handleOpenModal()}>
            <Plus style={{ width: 16, height: 16 }} /> Adicionar Serviço
          </button>
          <button style={{ ...outlineBtn, background: isManageMode ? 'rgba(255,255,255,0.07)' : 'transparent' }} onClick={handleManageToggle}>
            <List style={{ width: 16, height: 16 }} /> {isManageMode ? 'Cancelar' : 'Gerenciar Serviços'}
          </button>
          {isManageMode && selectedServices.size > 0 && (
            <button style={{ ...dangerBtn, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleDeleteSelected} disabled={saving}>
              <Trash2 style={{ width: 16, height: 16 }} /> Deletar ({selectedServices.size})
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
            <input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.25rem', paddingRight: searchTerm ? '2.25rem' : '0.75rem' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button style={{ ...outlineBtn }} onClick={() => setIsFilterOpen(!isFilterOpen)}>
              <Filter style={{ width: 15, height: 15 }} />
              Filtrar por Categoria
              {selectedCategoryFilters.length > 0 && (
                <span style={inlineBadge()}>{selectedCategoryFilters.length}</span>
              )}
            </button>

            {isFilterOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 40, width: 260, background: '#111009', ...card, padding: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {categorias.map((cat) => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer' }} onClick={() => handleCategoryToggle(cat.name)}>
                      <CheckBox checked={selectedCategoryFilters.includes(cat.name)} onChange={() => handleCategoryToggle(cat.name)} />
                      <span style={{ color: '#fff', fontSize: '0.875rem' }}>{cat.name}</span>
                    </label>
                  ))}
                  {categorias.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>Nenhuma categoria cadastrada</p>}
                </div>
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem' }}>
                  <button style={{ ...outlineBtn, flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => setSelectedCategoryFilters([])}>Limpar</button>
                  <button style={{ ...goldBtn, flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem' }} onClick={() => setIsFilterOpen(false)}>Aplicar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      {filteredServices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Scissors style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum serviço cadastrado ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Clique em "Adicionar Serviço" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={spring}
              style={{ ...card, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${GOLD}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isManageMode && (
                  <div onClick={(e) => { e.stopPropagation(); handleServiceSelection(service.id) }}>
                    <CheckBox checked={selectedServices.has(service.id)} onChange={() => handleServiceSelection(service.id)} />
                  </div>
                )}
                <div onClick={() => !isManageMode && handleOpenModal(service)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ background: 'rgba(212,175,55,0.12)', padding: '0.75rem', borderRadius: '0.625rem', flexShrink: 0 }}>
                    <Scissors style={{ width: 20, height: 20, color: GOLD }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{service.name}</h3>
                      {service.category && <span style={inlineBadge()}>{service.category}</span>}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{service.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock style={{ width: 12, height: 12 }} />{service.duration} min</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><DollarSign style={{ width: 12, height: 12 }} />{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </div>
                {!isManageMode && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} onClick={() => handleOpenModal(service)}>
                    <Edit style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'} subtitle={editingService ? 'Atualize as informações do serviço abaixo' : 'Preencha as informações do novo serviço'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Nome do Serviço">
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Corte Masculino" style={inputStyle} />
          </FormField>
          <FormField label="Descrição">
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva o serviço..." style={textareaStyle} />
          </FormField>
          <FormField label="Categoria">
            <div style={{ position: 'relative' }}>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value })
                  if (!showCategoryHint) {
                    setShowCategoryHint(true)
                    setCategoryHintOpacity(1)
                    setTimeout(() => setCategoryHintOpacity(0), 6000)
                    setTimeout(() => setShowCategoryHint(false), 6500)
                  }
                }}
                style={{ ...inputStyle, appearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#111' }}>Selecione uma categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.name} style={{ background: '#111' }}>{cat.name}</option>
                ))}
              </select>
              {showCategoryHint && (
                <div style={{ marginTop: '0.375rem', padding: '0.5rem 0.75rem', background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.2)`, borderRadius: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', opacity: categoryHintOpacity, transition: 'opacity 0.5s ease-out' }}>
                  Caso não encontre a categoria desejada, vá na aba de Categorias e adicione para aparecer aqui!
                </div>
              )}
            </div>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Preço (R$)">
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0,00" step="0.01" style={inputStyle} />
            </FormField>
            <FormField label="Duração (HH:MM)">
              <input type="time" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="00:00" style={inputStyle} />
            </FormField>
          </div>
        </div>
        <ModalFooter onCancel={handleCloseModal} onSave={handleSaveService} saving={saving} saveLabel={editingService ? 'Salvar Alterações' : 'Adicionar Serviço'} />
      </Modal>
    </motion.div>
  )
}

// ─── CATEGORIAS TAB ──────────────────────────────────────────────
function CategoriasTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<CategoriaData[]>([])
  const [servicos, setServicos] = useState<ServicoData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<CategoriaData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryForm, setCategoryForm] = useState({ name: '' })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [categoriasData, servicosData] = await Promise.all([getCategorias(businessId), getServicos(businessId)])
      setCategorias(categoriasData)
      setServicos(servicosData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar categorias', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const filteredCategories = searchTerm.trim() ? categorias.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())) : categorias
  const getServiceCountForCategory = (name: string) => servicos.filter(s => s.category === name).length
  const getServicesForCategory = (name: string) => servicos.filter(s => s.category === name)

  const handleOpenModal = (category?: CategoriaData) => {
    if (category) { setEditingCategory(category); setCategoryForm({ name: category.name }) }
    else { setEditingCategory(null); setCategoryForm({ name: '' }) }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCategory(null); setCategoryForm({ name: '' }) }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) { toast({ title: 'Atenção', description: 'Preencha o nome da categoria', variant: 'destructive' }); return }
    try {
      setSaving(true)
      if (editingCategory) { await updateCategoria(businessId, editingCategory.id, { name: categoryForm.name }); toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso' }) }
      else { await addCategoria(businessId, { name: categoryForm.name }); toast({ title: 'Sucesso', description: 'Categoria adicionada com sucesso' }) }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar categoria', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => { setIsManageMode(!isManageMode); if (isManageMode) setSelectedCategories(new Set()) }

  const handleCategorySelection = (id: string) => {
    setSelectedCategories(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const handleDeleteSelected = async () => {
    try {
      setSaving(true)
      await deleteCategorias(businessId, Array.from(selectedCategories))
      toast({ title: 'Sucesso', description: `${selectedCategories.size} categoria(s) removida(s)` })
      setSelectedCategories(new Set())
      setIsManageMode(false)
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao deletar categorias', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button style={goldBtn} onClick={() => handleOpenModal()}>
            <Plus style={{ width: 16, height: 16 }} /> Adicionar Categoria
          </button>
          <button style={{ ...outlineBtn, background: isManageMode ? 'rgba(255,255,255,0.07)' : 'transparent' }} onClick={handleManageToggle}>
            <List style={{ width: 16, height: 16 }} /> {isManageMode ? 'Cancelar' : 'Gerenciar Categorias'}
          </button>
          {isManageMode && selectedCategories.size > 0 && (
            <button style={{ ...dangerBtn, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleDeleteSelected} disabled={saving}>
              <Trash2 style={{ width: 16, height: 16 }} /> Deletar ({selectedCategories.size})
            </button>
          )}
        </div>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" placeholder="Buscar categoria por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Tag style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma categoria cadastrada ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Clique em "Adicionar Categoria" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={spring}
              style={{ ...card, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${GOLD}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isManageMode && (
                  <div onClick={(e) => { e.stopPropagation(); handleCategorySelection(category.id) }}>
                    <CheckBox checked={selectedCategories.has(category.id)} onChange={() => handleCategorySelection(category.id)} />
                  </div>
                )}
                <div onClick={() => !isManageMode && handleOpenModal(category)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ background: 'rgba(212,175,55,0.12)', padding: '0.75rem', borderRadius: '0.625rem', flexShrink: 0 }}>
                    <Tag style={{ width: 20, height: 20, color: GOLD }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{category.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>{getServiceCountForCategory(category.name)} serviço(s)</p>
                  </div>
                </div>
                {!isManageMode && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} onClick={() => handleOpenModal(category)}>
                    <Edit style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'} subtitle={editingCategory ? 'Atualize o nome da categoria' : 'Digite o nome da nova categoria'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Nome da Categoria">
            <input value={categoryForm.name} onChange={(e) => setCategoryForm({ name: e.target.value })} placeholder="Ex: Cabelo, Barba, Tratamento..." style={inputStyle} />
          </FormField>

          {editingCategory && getServicesForCategory(editingCategory.name).length > 0 && (
            <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '0.75rem' }}>
                Serviços nesta categoria ({getServicesForCategory(editingCategory.name).length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
                {getServicesForCategory(editingCategory.name).map((service) => (
                  <div key={service.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem' }}>
                    <Scissors style={{ width: 15, height: 15, color: GOLD }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>{service.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{formatCurrency(service.price)} • {service.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <ModalFooter onCancel={handleCloseModal} onSave={handleSaveCategory} saving={saving} saveLabel={editingCategory ? 'Salvar Alterações' : 'Adicionar Categoria'} />
      </Modal>
    </motion.div>
  )
}

// ─── COMBOS TAB ──────────────────────────────────────────────────
function CombosTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [combos, setCombos] = useState<ComboData[]>([])
  const [servicos, setServicos] = useState<ServicoData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCombos, setSelectedCombos] = useState<Set<string>>(new Set())
  const [editingCombo, setEditingCombo] = useState<ComboData | null>(null)
  const [comboForm, setComboForm] = useState({ name: '', selectedServiceIds: [] as string[], comboPrice: '' })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [combosData, servicosData] = await Promise.all([getCombos(businessId), getServicos(businessId)])
      setCombos(combosData)
      setServicos(servicosData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar combos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const calculateOriginalPrice = (serviceIds: string[]) => serviceIds.reduce((total, id) => total + (servicos.find(s => s.id === id)?.price || 0), 0)
  const calculateTotalDuration = (serviceIds: string[]) => serviceIds.reduce((total, id) => total + (servicos.find(s => s.id === id)?.duration || 0), 0)

  const handleOpenModal = (combo?: ComboData) => {
    if (combo) { setEditingCombo(combo); setComboForm({ name: combo.name, selectedServiceIds: combo.serviceIds || [], comboPrice: combo.comboPrice.toString() }) }
    else { setEditingCombo(null); setComboForm({ name: '', selectedServiceIds: [], comboPrice: '' }) }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCombo(null); setComboForm({ name: '', selectedServiceIds: [], comboPrice: '' }) }

  const handleToggleService = (serviceId: string) => {
    setComboForm(prev => {
      const newIds = prev.selectedServiceIds.includes(serviceId) ? prev.selectedServiceIds.filter(id => id !== serviceId) : [...prev.selectedServiceIds, serviceId]
      const suggestedPrice = calculateOriginalPrice(newIds)
      return { ...prev, selectedServiceIds: newIds, comboPrice: suggestedPrice > 0 ? suggestedPrice.toString() : '' }
    })
  }

  const handleSaveCombo = async () => {
    if (!comboForm.name || comboForm.selectedServiceIds.length < 2 || !comboForm.comboPrice) {
      toast({ title: 'Atenção', description: 'Preencha o nome, selecione ao menos 2 serviços e defina o preço', variant: 'destructive' })
      return
    }
    const serviceNames = comboForm.selectedServiceIds.map(id => servicos.find(s => s.id === id)?.name || '')
    const originalPrice = calculateOriginalPrice(comboForm.selectedServiceIds)
    const duration = calculateTotalDuration(comboForm.selectedServiceIds)
    try {
      setSaving(true)
      if (editingCombo) {
        await updateCombo(businessId, editingCombo.id, { name: comboForm.name, serviceIds: comboForm.selectedServiceIds, serviceNames, originalPrice, comboPrice: parseFloat(comboForm.comboPrice), duration })
        toast({ title: 'Sucesso', description: 'Combo atualizado com sucesso' })
      } else {
        await addCombo(businessId, { name: comboForm.name, serviceIds: comboForm.selectedServiceIds, serviceNames, originalPrice, comboPrice: parseFloat(comboForm.comboPrice), duration })
        toast({ title: 'Sucesso', description: 'Combo adicionado com sucesso' })
      }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar combo', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => { setIsManageMode(!isManageMode); if (isManageMode) setSelectedCombos(new Set()) }
  const handleComboSelection = (id: string) => { setSelectedCombos(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s }) }

  const handleDeleteSelected = async () => {
    try {
      setSaving(true)
      await deleteCombos(businessId, Array.from(selectedCombos))
      toast({ title: 'Sucesso', description: `${selectedCombos.size} combo(s) removido(s)` })
      setSelectedCombos(new Set())
      setIsManageMode(false)
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao deletar combos', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button style={goldBtn} onClick={() => handleOpenModal()}><Plus style={{ width: 16, height: 16 }} /> Adicionar Combo</button>
        <button style={{ ...outlineBtn, background: isManageMode ? 'rgba(255,255,255,0.07)' : 'transparent' }} onClick={handleManageToggle}>
          <List style={{ width: 16, height: 16 }} /> {isManageMode ? 'Cancelar' : 'Gerenciar Combos'}
        </button>
        {isManageMode && selectedCombos.size > 0 && (
          <button style={{ ...dangerBtn, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleDeleteSelected} disabled={saving}>
            <Trash2 style={{ width: 16, height: 16 }} /> Deletar ({selectedCombos.size})
          </button>
        )}
      </div>

      {combos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum combo cadastrado ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Clique em "Adicionar Combo" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {combos.map((combo) => (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={spring}
              style={{ ...card, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${GOLD}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isManageMode && (
                  <div onClick={(e) => { e.stopPropagation(); handleComboSelection(combo.id) }}>
                    <CheckBox checked={selectedCombos.has(combo.id)} onChange={() => handleComboSelection(combo.id)} />
                  </div>
                )}
                <div onClick={() => !isManageMode && handleOpenModal(combo)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ background: 'rgba(168,85,247,0.12)', padding: '0.75rem', borderRadius: '0.625rem', flexShrink: 0 }}>
                    <Package style={{ width: 20, height: 20, color: '#a855f7' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{combo.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>{(combo.serviceNames || []).join(' + ')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatCurrency(combo.originalPrice)}</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4ade80' }}>{formatCurrency(combo.comboPrice)}</span>
                      {combo.originalPrice > 0 && (
                        <span style={inlineBadge('green')}>
                          -{Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)}%
                        </span>
                      )}
                      {((combo.duration || 0) > 0 || calculateTotalDuration(combo.serviceIds || []) > 0) && (
                        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock style={{ width: 12, height: 12 }} />
                          {(combo.duration || 0) > 0 ? combo.duration : calculateTotalDuration(combo.serviceIds || [])} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isManageMode && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} onClick={() => handleOpenModal(combo)}>
                    <Edit style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingCombo ? 'Editar Combo' : 'Adicionar Novo Combo'} subtitle={editingCombo ? 'Atualize as informações do combo' : 'Configure o novo combo de serviços'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Nome do Combo">
            <input value={comboForm.name} onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })} placeholder="Ex: Combo Completo" style={inputStyle} />
          </FormField>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '0.5rem' }}>Selecione os Serviços</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 192, overflowY: 'auto' }}>
              {servicos.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Cadastre serviços primeiro</p>
              ) : servicos.map((service) => (
                <label key={service.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', cursor: 'pointer' }} onClick={() => handleToggleService(service.id)}>
                  <CheckBox checked={comboForm.selectedServiceIds.includes(service.id)} onChange={() => handleToggleService(service.id)} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: '#fff' }}>{service.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{formatCurrency(service.price)}</p>
                  </div>
                </label>
              ))}
            </div>
            {comboForm.selectedServiceIds.length >= 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Preço original: {formatCurrency(calculateOriginalPrice(comboForm.selectedServiceIds))}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock style={{ width: 12, height: 12 }} /> Duração: {calculateTotalDuration(comboForm.selectedServiceIds)} min</span>
              </div>
            )}
          </div>

          <FormField label="Preço do Combo (R$)">
            <input type="number" value={comboForm.comboPrice} onChange={(e) => setComboForm({ ...comboForm, comboPrice: e.target.value })} placeholder="0,00" step="0.01" style={inputStyle} />
          </FormField>
        </div>
        <ModalFooter onCancel={handleCloseModal} onSave={handleSaveCombo} saving={saving} saveLabel={editingCombo ? 'Salvar Alterações' : 'Adicionar Combo'} />
      </Modal>
    </motion.div>
  )
}

// ─── CUPONS TAB ──────────────────────────────────────────────────
function CuponsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [cupons, setCupons] = useState<CupomData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCupons, setSelectedCupons] = useState<Set<string>>(new Set())
  const [editingCupom, setEditingCupom] = useState<CupomData | null>(null)
  const [cupomForm, setCupomForm] = useState({ code: '', discount: '', usageLimit: '', isActive: true })

  const loadData = useCallback(async () => {
    try { setLoading(true); setCupons(await getCupons(businessId)) }
    catch (error) { toast({ title: 'Erro', description: 'Erro ao carregar cupons', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenModal = (cupom?: CupomData) => {
    if (cupom) { setEditingCupom(cupom); setCupomForm({ code: cupom.code, discount: cupom.discount.toString(), usageLimit: cupom.usageLimit.toString(), isActive: cupom.isActive }) }
    else { setEditingCupom(null); setCupomForm({ code: '', discount: '', usageLimit: '', isActive: true }) }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCupom(null); setCupomForm({ code: '', discount: '', usageLimit: '', isActive: true }) }

  const handleSaveCupom = async () => {
    if (!cupomForm.code || !cupomForm.discount || !cupomForm.usageLimit) { toast({ title: 'Atenção', description: 'Preencha todos os campos', variant: 'destructive' }); return }
    try {
      setSaving(true)
      if (editingCupom) {
        await updateCupom(businessId, editingCupom.id, { code: cupomForm.code.toUpperCase(), discount: parseFloat(cupomForm.discount), usageLimit: parseInt(cupomForm.usageLimit), isActive: cupomForm.isActive })
        toast({ title: 'Sucesso', description: 'Cupom atualizado com sucesso' })
      } else {
        await addCupom(businessId, { code: cupomForm.code.toUpperCase(), discount: parseFloat(cupomForm.discount), usedCount: 0, usageLimit: parseInt(cupomForm.usageLimit), isActive: cupomForm.isActive })
        toast({ title: 'Sucesso', description: 'Cupom adicionado com sucesso' })
      }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar cupom', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => { setIsManageMode(!isManageMode); if (isManageMode) setSelectedCupons(new Set()) }
  const handleCupomSelection = (id: string) => { setSelectedCupons(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s }) }

  const handleDeleteSelected = async () => {
    try {
      setSaving(true)
      await deleteCupons(businessId, Array.from(selectedCupons))
      toast({ title: 'Sucesso', description: `${selectedCupons.size} cupom(ns) removido(s)` })
      setSelectedCupons(new Set())
      setIsManageMode(false)
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao deletar cupons', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button style={goldBtn} onClick={() => handleOpenModal()}><Plus style={{ width: 16, height: 16 }} /> Adicionar Cupom</button>
        <button style={{ ...outlineBtn, background: isManageMode ? 'rgba(255,255,255,0.07)' : 'transparent' }} onClick={handleManageToggle}>
          <List style={{ width: 16, height: 16 }} /> {isManageMode ? 'Cancelar' : 'Gerenciar Cupons'}
        </button>
        {isManageMode && selectedCupons.size > 0 && (
          <button style={{ ...dangerBtn, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleDeleteSelected} disabled={saving}>
            <Trash2 style={{ width: 16, height: 16 }} /> Deletar ({selectedCupons.size})
          </button>
        )}
      </div>

      {cupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Ticket style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhum cupom cadastrado ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Clique em "Adicionar Cupom" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cupons.map((cupom) => (
            <motion.div
              key={cupom.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={spring}
              style={{ ...card, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${GOLD}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isManageMode && (
                  <div onClick={(e) => { e.stopPropagation(); handleCupomSelection(cupom.id) }}>
                    <CheckBox checked={selectedCupons.has(cupom.id)} onChange={() => handleCupomSelection(cupom.id)} />
                  </div>
                )}
                <div onClick={() => !isManageMode && handleOpenModal(cupom)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ background: 'rgba(59,130,246,0.12)', padding: '0.75rem', borderRadius: '0.625rem', flexShrink: 0 }}>
                    <Ticket style={{ width: 20, height: 20, color: '#60a5fa' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{cupom.code}</h3>
                      <span style={inlineBadge(cupom.isActive ? 'green' : undefined)}>{cupom.isActive ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
                      <span>{cupom.discount}% de desconto</span>
                      <span>•</span>
                      <span>{cupom.usedCount}/{cupom.usageLimit} usados</span>
                    </div>
                  </div>
                </div>
                {!isManageMode && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} onClick={() => handleOpenModal(cupom)}>
                    <Edit style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingCupom ? 'Editar Cupom' : 'Adicionar Novo Cupom'} subtitle={editingCupom ? 'Atualize as informações do cupom' : 'Configure o novo cupom de desconto'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Código do Cupom">
            <input value={cupomForm.code} onChange={(e) => setCupomForm({ ...cupomForm, code: e.target.value.toUpperCase() })} placeholder="Ex: PRIMEIRAVISITA" style={{ ...inputStyle, textTransform: 'uppercase' as const }} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Desconto (%)">
              <input type="number" value={cupomForm.discount} onChange={(e) => setCupomForm({ ...cupomForm, discount: e.target.value })} placeholder="0" min="1" max="100" style={inputStyle} />
            </FormField>
            <FormField label="Limite de Uso">
              <input type="number" value={cupomForm.usageLimit} onChange={(e) => setCupomForm({ ...cupomForm, usageLimit: e.target.value })} placeholder="100" min="1" style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckBox checked={cupomForm.isActive} onChange={() => setCupomForm({ ...cupomForm, isActive: !cupomForm.isActive })} />
            <label style={{ fontSize: '0.875rem', color: '#fff', cursor: 'pointer' }} onClick={() => setCupomForm({ ...cupomForm, isActive: !cupomForm.isActive })}>Cupom ativo</label>
          </div>
        </div>
        <ModalFooter onCancel={handleCloseModal} onSave={handleSaveCupom} saving={saving} saveLabel={editingCupom ? 'Salvar Alterações' : 'Adicionar Cupom'} />
      </Modal>
    </motion.div>
  )
}

// ─── PROMOÇÕES TAB ───────────────────────────────────────────────
function PromocoesTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [promocoes, setPromocoes] = useState<PromocaoData[]>([])
  const [servicos, setServicos] = useState<ServicoData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedPromocoes, setSelectedPromocoes] = useState<Set<string>>(new Set())
  const [editingPromocao, setEditingPromocao] = useState<PromocaoData | null>(null)
  const [promoForm, setPromoForm] = useState({ serviceId: '', discount: '', validUntil: '', isActive: true })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [promoData, servicosData] = await Promise.all([getPromocoes(businessId), getServicos(businessId)])
      setPromocoes(promoData)
      setServicos(servicosData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar promoções', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenModal = (promo?: PromocaoData) => {
    if (promo) { setEditingPromocao(promo); setPromoForm({ serviceId: promo.serviceId || '', discount: promo.discount.toString(), validUntil: promo.validUntil, isActive: promo.isActive }) }
    else { setEditingPromocao(null); setPromoForm({ serviceId: '', discount: '', validUntil: '', isActive: true }) }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => { setIsModalOpen(false); setEditingPromocao(null); setPromoForm({ serviceId: '', discount: '', validUntil: '', isActive: true }) }

  const handleSavePromocao = async () => {
    if (!promoForm.serviceId || !promoForm.discount || !promoForm.validUntil) { toast({ title: 'Atenção', description: 'Preencha todos os campos', variant: 'destructive' }); return }
    const selectedService = servicos.find(s => s.id === promoForm.serviceId)
    if (!selectedService) return
    try {
      setSaving(true)
      if (editingPromocao) {
        await updatePromocao(businessId, editingPromocao.id, { serviceId: promoForm.serviceId, serviceName: selectedService.name, discount: parseFloat(promoForm.discount), originalPrice: selectedService.price, validUntil: promoForm.validUntil, isActive: promoForm.isActive })
        toast({ title: 'Sucesso', description: 'Promoção atualizada com sucesso' })
      } else {
        await addPromocao(businessId, { serviceId: promoForm.serviceId, serviceName: selectedService.name, discount: parseFloat(promoForm.discount), originalPrice: selectedService.price, validUntil: promoForm.validUntil, isActive: promoForm.isActive })
        toast({ title: 'Sucesso', description: 'Promoção adicionada com sucesso' })
      }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar promoção', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => { setIsManageMode(!isManageMode); if (isManageMode) setSelectedPromocoes(new Set()) }
  const handlePromocaoSelection = (id: string) => { setSelectedPromocoes(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s }) }

  const handleDeleteSelected = async () => {
    try {
      setSaving(true)
      await deletePromocoes(businessId, Array.from(selectedPromocoes))
      toast({ title: 'Sucesso', description: `${selectedPromocoes.size} promoção(ões) removida(s)` })
      setSelectedPromocoes(new Set())
      setIsManageMode(false)
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao deletar promoções', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Loader2 style={{ width: 32, height: 32, color: GOLD, animation: 'spin 1s linear infinite' }} /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button style={goldBtn} onClick={() => handleOpenModal()}><Plus style={{ width: 16, height: 16 }} /> Adicionar Promoção</button>
        <button style={{ ...outlineBtn, background: isManageMode ? 'rgba(255,255,255,0.07)' : 'transparent' }} onClick={handleManageToggle}>
          <List style={{ width: 16, height: 16 }} /> {isManageMode ? 'Cancelar' : 'Gerenciar Promoções'}
        </button>
        {isManageMode && selectedPromocoes.size > 0 && (
          <button style={{ ...dangerBtn, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none' }} onClick={handleDeleteSelected} disabled={saving}>
            <Trash2 style={{ width: 16, height: 16 }} /> Deletar ({selectedPromocoes.size})
          </button>
        )}
      </div>

      {promocoes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Percent style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.15)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma promoção cadastrada ainda</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Clique em "Adicionar Promoção" para começar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {promocoes.map((promo) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={spring}
              style={{ ...card, padding: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${GOLD}50`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isManageMode && (
                  <div onClick={(e) => { e.stopPropagation(); handlePromocaoSelection(promo.id) }}>
                    <CheckBox checked={selectedPromocoes.has(promo.id)} onChange={() => handlePromocaoSelection(promo.id)} />
                  </div>
                )}
                <div onClick={() => !isManageMode && handleOpenModal(promo)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ background: 'rgba(249,115,22,0.12)', padding: '0.75rem', borderRadius: '0.625rem', flexShrink: 0 }}>
                    <Percent style={{ width: 20, height: 20, color: '#fb923c' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{promo.serviceName}</h3>
                      <span style={inlineBadge(promo.isActive ? 'green' : undefined)}>{promo.isActive ? 'Ativa' : 'Inativa'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatCurrency(promo.originalPrice)}</span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4ade80' }}>{formatCurrency(promo.originalPrice * (1 - promo.discount / 100))}</span>
                      <span style={inlineBadge('red')}>-{promo.discount}%</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Válido até {new Date(promo.validUntil).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {!isManageMode && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD, padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} onClick={() => handleOpenModal(promo)}>
                    <Edit style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onClose={handleCloseModal} title={editingPromocao ? 'Editar Promoção' : 'Adicionar Nova Promoção'} subtitle={editingPromocao ? 'Atualize as informações da promoção' : 'Configure a nova promoção'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Serviço">
            <select
              value={promoForm.serviceId}
              onChange={(e) => setPromoForm({ ...promoForm, serviceId: e.target.value })}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#111' }}>Selecione um serviço</option>
              {servicos.map((service) => (
                <option key={service.id} value={service.id} style={{ background: '#111' }}>
                  {service.name} - {formatCurrency(service.price)}
                </option>
              ))}
            </select>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Desconto (%)">
              <input type="number" value={promoForm.discount} onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })} placeholder="0" min="1" max="100" style={inputStyle} />
            </FormField>
            <FormField label="Válido até">
              <input type="date" value={promoForm.validUntil} onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })} style={inputStyle} />
            </FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckBox checked={promoForm.isActive} onChange={() => setPromoForm({ ...promoForm, isActive: !promoForm.isActive })} />
            <label style={{ fontSize: '0.875rem', color: '#fff', cursor: 'pointer' }} onClick={() => setPromoForm({ ...promoForm, isActive: !promoForm.isActive })}>Promoção ativa</label>
          </div>
        </div>
        <ModalFooter onCancel={handleCloseModal} onSave={handleSavePromocao} saving={saving} saveLabel={editingPromocao ? 'Salvar Alterações' : 'Adicionar Promoção'} />
      </Modal>
    </motion.div>
  )
}

// ─── ROOT ────────────────────────────────────────────────────────
export function Servicos() {
  const [activeTab, setActiveTab] = useState<TabType>('servicos')
  const businessId = useBusinessId()
  if (!businessId) return null

  return (
    <OwnerPageLayout title="Gerenciar Serviços" subtitle="Gerencie serviços, categorias, combos, cupons e promoções">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '0.3rem', flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                border: 'none', cursor: 'pointer', transition: 'background 0.2s, color 0.2s',
                background: active ? 'linear-gradient(135deg,#D4AF37,#B8941E)' : 'transparent',
                color: active ? BG : 'rgba(255,255,255,0.5)',
                flex: '1 1 auto',
                justifyContent: 'center',
              }}
            >
              {tab.icon}
              <span style={{ display: 'none' }} className="sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={spring}
        >
          {activeTab === 'servicos' && <ServicosTab businessId={businessId} />}
          {activeTab === 'categorias' && <CategoriasTab businessId={businessId} />}
          {activeTab === 'combos' && <CombosTab businessId={businessId} />}
          {activeTab === 'cupons' && <CuponsTab businessId={businessId} />}
          {activeTab === 'promocoes' && <PromocoesTab businessId={businessId} />}
        </motion.div>
      </AnimatePresence>
    </OwnerPageLayout>
  )
}
