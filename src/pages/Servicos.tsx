import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

type TabType = 'servicos' | 'categorias' | 'combos' | 'cupons' | 'promocoes'

function useBusinessId() {
  const navigate = useNavigate()
  const businessId = localStorage.getItem('selected_business_id')

  useEffect(() => {
    if (!businessId) {
      navigate('/selecionar-empresa')
    }
  }, [businessId, navigate])

  return businessId
}

export function Servicos() {
  const [activeTab, setActiveTab] = useState<TabType>('servicos')
  const businessId = useBusinessId()

  if (!businessId) return null

  return (
    <OwnerPageLayout title="Gerenciar Serviços" subtitle="Gerencie serviços, categorias, combos, cupons e promoções">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
        <TabsList className="w-full justify-start mb-8 grid grid-cols-5 sm:inline-flex gap-1 sm:gap-0 h-auto bg-white/5 border border-white/10">
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Serviços</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="combos" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Combos</span>
          </TabsTrigger>
          <TabsTrigger value="cupons" className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">Cupons</span>
          </TabsTrigger>
          <TabsTrigger value="promocoes" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <span className="hidden sm:inline">Promoções</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicos">
          <ServicosTab businessId={businessId} />
        </TabsContent>
        <TabsContent value="categorias">
          <CategoriasTab businessId={businessId} />
        </TabsContent>
        <TabsContent value="combos">
          <CombosTab businessId={businessId} />
        </TabsContent>
        <TabsContent value="cupons">
          <CuponsTab businessId={businessId} />
        </TabsContent>
        <TabsContent value="promocoes">
          <PromocoesTab businessId={businessId} />
        </TabsContent>
      </Tabs>
    </OwnerPageLayout>
  )
}

// ============================================
// COMPONENTE: ABA SERVIÇOS
// ============================================

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: ''
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [servicosData, categoriasData] = await Promise.all([
        getServicos(businessId),
        getCategorias(businessId),
      ])
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
  if (selectedCategoryFilters.length > 0) {
    filteredServices = filteredServices.filter(s => selectedCategoryFilters.includes(s.category))
  }
  if (searchTerm.trim()) {
    filteredServices = filteredServices.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategoryFilters(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const handleOpenModal = (service?: ServicoData) => {
    if (service) {
      setEditingService(service)
      const hours = Math.floor(service.duration / 60)
      const minutes = service.duration % 60
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price.toString(),
        duration: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      })
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
        await updateServico(businessId, editingService.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          duration: durationMinutes,
        })
        toast({ title: 'Sucesso', description: 'Serviço atualizado com sucesso' })
      } else {
        await addServico(businessId, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          duration: durationMinutes,
        })
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

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) setSelectedServices(new Set())
  }

  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) newSet.delete(serviceId)
      else newSet.add(serviceId)
      return newSet
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <Button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
          <Button
            onClick={handleManageToggle}
            variant="outline"
            className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}
          >
            <List className="w-4 h-4 mr-2" />
            {isManageMode ? 'Cancelar' : 'Gerenciar Serviços'}
          </Button>
          {isManageMode && selectedServices.size > 0 && (
            <Button onClick={handleDeleteSelected} variant="destructive" className="bg-red-500 hover:bg-red-600" disabled={saving}>
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar ({selectedServices.size})
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Button onClick={() => setIsFilterOpen(!isFilterOpen)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar por Categoria
              {selectedCategoryFilters.length > 0 && (
                <Badge className="ml-2 bg-gold text-black">{selectedCategoryFilters.length}</Badge>
              )}
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-xl p-3">
                <div className="space-y-2">
                  {categorias.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                      onClick={() => handleCategoryToggle(cat.name)}
                    >
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        selectedCategoryFilters.includes(cat.name) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}>
                        {selectedCategoryFilters.includes(cat.name) && <Check className="w-4 h-4 text-black" />}
                      </div>
                      <span className="text-white">{cat.name}</span>
                    </label>
                  ))}
                  {categorias.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-2">Nenhuma categoria cadastrada</p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                  <Button size="sm" onClick={() => setSelectedCategoryFilters([])} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                    Limpar
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)} className="flex-1 bg-gold text-black hover:bg-gold/80">
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Serviços */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16">
          <Scissors className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum serviço cadastrado ainda</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Serviço" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {isManageMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleServiceSelection(service.id) }}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                        selectedServices.has(service.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}
                    >
                      {selectedServices.has(service.id) && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div onClick={() => !isManageMode && handleOpenModal(service)} className="flex items-center gap-4 flex-1">
                    <div className="bg-gold/20 p-3 rounded-lg">
                      <Scissors className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{service.name}</h3>
                        {service.category && (
                          <Badge variant="outline" className="text-xs">{service.category}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1">{service.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isManageMode && (
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80" onClick={() => handleOpenModal(service)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Serviço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingService ? 'Atualize as informações do serviço abaixo' : 'Preencha as informações do novo serviço'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-white">Nome do Serviço</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Ex: Corte Masculino"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1 min-h-[100px]"
                placeholder="Descreva o serviço..."
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-white">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                onOpenChange={(open) => {
                  if (open) {
                    setShowCategoryHint(true)
                    setCategoryHintOpacity(1)
                    setTimeout(() => setCategoryHintOpacity(0), 6000)
                    setTimeout(() => setShowCategoryHint(false), 6500)
                  }
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {showCategoryHint && (
                    <div
                      className="px-3 py-2 mx-1 mb-1 rounded-md bg-white text-gray-900 text-xs leading-relaxed"
                      style={{ opacity: categoryHintOpacity, transition: 'opacity 0.5s ease-out' }}
                    >
                      Caso não encontre a categoria desejada, vá na aba ao lado de Categorias e adicione para aparecer aqui!
                    </div>
                  )}
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                  {categorias.length === 0 && (
                    <SelectItem value="_empty" disabled className="text-gray-500">
                      Cadastre categorias primeiro
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-white">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="duration" className="text-white">Duração (HH:MM)</Label>
                <Input
                  id="duration"
                  type="time"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="00:00"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button onClick={handleCloseModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveService}
              disabled={saving}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingService ? 'Salvar Alterações' : 'Adicionar Serviço'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA CATEGORIAS
// ============================================

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
      const [categoriasData, servicosData] = await Promise.all([
        getCategorias(businessId),
        getServicos(businessId),
      ])
      setCategorias(categoriasData)
      setServicos(servicosData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar categorias', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const filteredCategories = searchTerm.trim()
    ? categorias.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : categorias

  const getServiceCountForCategory = (categoryName: string) => {
    return servicos.filter(s => s.category === categoryName).length
  }

  const getServicesForCategory = (categoryName: string) => {
    return servicos.filter(s => s.category === categoryName)
  }

  const handleOpenModal = (category?: CategoriaData) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setCategoryForm({ name: '' })
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: 'Atenção', description: 'Preencha o nome da categoria', variant: 'destructive' })
      return
    }
    try {
      setSaving(true)
      if (editingCategory) {
        await updateCategoria(businessId, editingCategory.id, { name: categoryForm.name })
        toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso' })
      } else {
        await addCategoria(businessId, { name: categoryForm.name })
        toast({ title: 'Sucesso', description: 'Categoria adicionada com sucesso' })
      }
      handleCloseModal()
      await loadData()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar categoria', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) setSelectedCategories(new Set())
  }

  const handleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) newSet.delete(categoryId)
      else newSet.add(categoryId)
      return newSet
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Categoria
          </Button>
          <Button onClick={handleManageToggle} variant="outline" className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}>
            <List className="w-4 h-4 mr-2" />
            {isManageMode ? 'Cancelar' : 'Gerenciar Categorias'}
          </Button>
          {isManageMode && selectedCategories.size > 0 && (
            <Button onClick={handleDeleteSelected} variant="destructive" className="bg-red-500 hover:bg-red-600" disabled={saving}>
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar ({selectedCategories.size})
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar categoria por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-500"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma categoria cadastrada ainda</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Categoria" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {isManageMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleCategorySelection(category.id) }}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                        selectedCategories.has(category.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}
                    >
                      {selectedCategories.has(category.id) && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div onClick={() => !isManageMode && handleOpenModal(category)} className="flex items-center gap-4 flex-1">
                    <div className="bg-gold/20 p-3 rounded-lg">
                      <Tag className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{getServiceCountForCategory(category.name)} serviço(s)</p>
                    </div>
                  </div>
                  {!isManageMode && (
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80" onClick={() => handleOpenModal(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Categoria */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingCategory ? 'Atualize o nome da categoria' : 'Digite o nome da nova categoria'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category-name" className="text-white">Nome da Categoria</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Ex: Cabelo, Barba, Tratamento..."
              />
            </div>

            {editingCategory && getServicesForCategory(editingCategory.name).length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <Label className="text-white mb-3 block">
                  Serviços nesta categoria ({getServicesForCategory(editingCategory.name).length})
                </Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getServicesForCategory(editingCategory.name).map((service) => (
                    <div key={service.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Scissors className="w-4 h-4 text-gold" />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{service.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(service.price)} • {service.duration} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button onClick={handleCloseModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={saving}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? 'Salvar Alterações' : 'Adicionar Categoria'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA COMBOS
// ============================================

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
  const [comboForm, setComboForm] = useState({
    name: '',
    selectedServiceIds: [] as string[],
    comboPrice: '',
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [combosData, servicosData] = await Promise.all([
        getCombos(businessId),
        getServicos(businessId),
      ])
      setCombos(combosData)
      setServicos(servicosData)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar combos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const calculateOriginalPrice = (serviceIds: string[]) => {
    return serviceIds.reduce((total, id) => {
      const service = servicos.find(s => s.id === id)
      return total + (service?.price || 0)
    }, 0)
  }

  const calculateTotalDuration = (serviceIds: string[]) => {
    return serviceIds.reduce((total, id) => {
      const service = servicos.find(s => s.id === id)
      return total + (service?.duration || 0)
    }, 0)
  }

  const handleOpenModal = (combo?: ComboData) => {
    if (combo) {
      setEditingCombo(combo)
      setComboForm({
        name: combo.name,
        selectedServiceIds: combo.serviceIds || [],
        comboPrice: combo.comboPrice.toString(),
      })
    } else {
      setEditingCombo(null)
      setComboForm({ name: '', selectedServiceIds: [], comboPrice: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCombo(null)
    setComboForm({ name: '', selectedServiceIds: [], comboPrice: '' })
  }

  const handleToggleService = (serviceId: string) => {
    setComboForm(prev => {
      const newIds = prev.selectedServiceIds.includes(serviceId)
        ? prev.selectedServiceIds.filter(id => id !== serviceId)
        : [...prev.selectedServiceIds, serviceId]
      const suggestedPrice = calculateOriginalPrice(newIds)
      return {
        ...prev,
        selectedServiceIds: newIds,
        comboPrice: suggestedPrice > 0 ? suggestedPrice.toString() : '',
      }
    })
  }

  const handleSaveCombo = async () => {
    if (!comboForm.name || comboForm.selectedServiceIds.length < 2 || !comboForm.comboPrice) {
      toast({ title: 'Atenção', description: 'Preencha o nome, selecione ao menos 2 serviços e defina o preço', variant: 'destructive' })
      return
    }
    const serviceNames = comboForm.selectedServiceIds.map(id => {
      const s = servicos.find(srv => srv.id === id)
      return s?.name || ''
    })
    const originalPrice = calculateOriginalPrice(comboForm.selectedServiceIds)

    try {
      setSaving(true)
      const duration = calculateTotalDuration(comboForm.selectedServiceIds)

      if (editingCombo) {
        await updateCombo(businessId, editingCombo.id, {
          name: comboForm.name,
          serviceIds: comboForm.selectedServiceIds,
          serviceNames,
          originalPrice,
          comboPrice: parseFloat(comboForm.comboPrice),
          duration,
        })
        toast({ title: 'Sucesso', description: 'Combo atualizado com sucesso' })
      } else {
        await addCombo(businessId, {
          name: comboForm.name,
          serviceIds: comboForm.selectedServiceIds,
          serviceNames,
          originalPrice,
          comboPrice: parseFloat(comboForm.comboPrice),
          duration,
        })
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

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) setSelectedCombos(new Set())
  }

  const handleComboSelection = (comboId: string) => {
    setSelectedCombos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(comboId)) newSet.delete(comboId)
      else newSet.add(comboId)
      return newSet
    })
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex gap-3 mb-6">
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Combo
        </Button>
        <Button onClick={handleManageToggle} variant="outline" className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}>
          <List className="w-4 h-4 mr-2" />
          {isManageMode ? 'Cancelar' : 'Gerenciar Combos'}
        </Button>
        {isManageMode && selectedCombos.size > 0 && (
          <Button onClick={handleDeleteSelected} variant="destructive" className="bg-red-500 hover:bg-red-600" disabled={saving}>
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar ({selectedCombos.size})
          </Button>
        )}
      </div>

      {combos.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum combo cadastrado ainda</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Combo" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combos.map((combo) => (
            <Card key={combo.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {isManageMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleComboSelection(combo.id) }}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                        selectedCombos.has(combo.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}
                    >
                      {selectedCombos.has(combo.id) && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div onClick={() => !isManageMode && handleOpenModal(combo)} className="flex items-center gap-4 flex-1">
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{combo.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{(combo.serviceNames || []).join(' + ')}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(combo.originalPrice)}</span>
                        <span className="text-lg font-bold text-green-500">{formatCurrency(combo.comboPrice)}</span>
                        {combo.originalPrice > 0 && (
                          <Badge className="bg-green-500 text-white">
                            -{Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)}%
                          </Badge>
                        )}
                        {((combo.duration || 0) > 0 || calculateTotalDuration(combo.serviceIds || []) > 0) && (
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(combo.duration || 0) > 0 ? combo.duration : calculateTotalDuration(combo.serviceIds || [])} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isManageMode && (
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80" onClick={() => handleOpenModal(combo)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Combo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingCombo ? 'Editar Combo' : 'Adicionar Novo Combo'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingCombo ? 'Atualize as informações do combo' : 'Configure o novo combo de serviços'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="combo-name" className="text-white">Nome do Combo</Label>
              <Input
                id="combo-name"
                value={comboForm.name}
                onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Ex: Combo Completo"
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Selecione os Serviços</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {servicos.length === 0 ? (
                  <p className="text-gray-500 text-sm">Cadastre serviços primeiro</p>
                ) : (
                  servicos.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"
                      onClick={() => handleToggleService(service.id)}
                    >
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        comboForm.selectedServiceIds.includes(service.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}>
                        {comboForm.selectedServiceIds.includes(service.id) && <Check className="w-4 h-4 text-black" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{service.name}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(service.price)}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {comboForm.selectedServiceIds.length >= 2 && (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-sm text-gray-400">
                    Preço original: {formatCurrency(calculateOriginalPrice(comboForm.selectedServiceIds))}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Duração total: {calculateTotalDuration(comboForm.selectedServiceIds)} min
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="combo-price" className="text-white">Preço do Combo (R$)</Label>
              <Input
                id="combo-price"
                type="number"
                value={comboForm.comboPrice}
                onChange={(e) => setComboForm({ ...comboForm, comboPrice: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="0,00"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button onClick={handleCloseModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCombo}
              disabled={saving}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCombo ? 'Salvar Alterações' : 'Adicionar Combo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA CUPONS
// ============================================

function CuponsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast()
  const [cupons, setCupons] = useState<CupomData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCupons, setSelectedCupons] = useState<Set<string>>(new Set())
  const [editingCupom, setEditingCupom] = useState<CupomData | null>(null)
  const [cupomForm, setCupomForm] = useState({
    code: '',
    discount: '',
    usageLimit: '',
    isActive: true,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCupons(businessId)
      setCupons(data)
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar cupons', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [businessId, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenModal = (cupom?: CupomData) => {
    if (cupom) {
      setEditingCupom(cupom)
      setCupomForm({
        code: cupom.code,
        discount: cupom.discount.toString(),
        usageLimit: cupom.usageLimit.toString(),
        isActive: cupom.isActive,
      })
    } else {
      setEditingCupom(null)
      setCupomForm({ code: '', discount: '', usageLimit: '', isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCupom(null)
    setCupomForm({ code: '', discount: '', usageLimit: '', isActive: true })
  }

  const handleSaveCupom = async () => {
    if (!cupomForm.code || !cupomForm.discount || !cupomForm.usageLimit) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    try {
      setSaving(true)
      if (editingCupom) {
        await updateCupom(businessId, editingCupom.id, {
          code: cupomForm.code.toUpperCase(),
          discount: parseFloat(cupomForm.discount),
          usageLimit: parseInt(cupomForm.usageLimit),
          isActive: cupomForm.isActive,
        })
        toast({ title: 'Sucesso', description: 'Cupom atualizado com sucesso' })
      } else {
        await addCupom(businessId, {
          code: cupomForm.code.toUpperCase(),
          discount: parseFloat(cupomForm.discount),
          usedCount: 0,
          usageLimit: parseInt(cupomForm.usageLimit),
          isActive: cupomForm.isActive,
        })
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

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) setSelectedCupons(new Set())
  }

  const handleCupomSelection = (cupomId: string) => {
    setSelectedCupons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cupomId)) newSet.delete(cupomId)
      else newSet.add(cupomId)
      return newSet
    })
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex gap-3 mb-6">
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cupom
        </Button>
        <Button onClick={handleManageToggle} variant="outline" className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}>
          <List className="w-4 h-4 mr-2" />
          {isManageMode ? 'Cancelar' : 'Gerenciar Cupons'}
        </Button>
        {isManageMode && selectedCupons.size > 0 && (
          <Button onClick={handleDeleteSelected} variant="destructive" className="bg-red-500 hover:bg-red-600" disabled={saving}>
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar ({selectedCupons.size})
          </Button>
        )}
      </div>

      {cupons.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum cupom cadastrado ainda</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Cupom" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cupons.map((cupom) => (
            <Card key={cupom.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {isManageMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleCupomSelection(cupom.id) }}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                        selectedCupons.has(cupom.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}
                    >
                      {selectedCupons.has(cupom.id) && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div onClick={() => !isManageMode && handleOpenModal(cupom)} className="flex items-center gap-4 flex-1">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <Ticket className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white">{cupom.code}</h3>
                        <Badge className={cupom.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {cupom.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{cupom.discount}% de desconto</span>
                        <span>•</span>
                        <span>{cupom.usedCount}/{cupom.usageLimit} usados</span>
                      </div>
                    </div>
                  </div>
                  {!isManageMode && (
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80" onClick={() => handleOpenModal(cupom)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Cupom */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingCupom ? 'Editar Cupom' : 'Adicionar Novo Cupom'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingCupom ? 'Atualize as informações do cupom' : 'Configure o novo cupom de desconto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cupom-code" className="text-white">Código do Cupom</Label>
              <Input
                id="cupom-code"
                value={cupomForm.code}
                onChange={(e) => setCupomForm({ ...cupomForm, code: e.target.value.toUpperCase() })}
                className="bg-white/5 border-white/10 text-white mt-1 uppercase"
                placeholder="Ex: PRIMEIRAVISITA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cupom-discount" className="text-white">Desconto (%)</Label>
                <Input
                  id="cupom-discount"
                  type="number"
                  value={cupomForm.discount}
                  onChange={(e) => setCupomForm({ ...cupomForm, discount: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="0"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="cupom-limit" className="text-white">Limite de Uso</Label>
                <Input
                  id="cupom-limit"
                  type="number"
                  value={cupomForm.usageLimit}
                  onChange={(e) => setCupomForm({ ...cupomForm, usageLimit: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                onClick={() => setCupomForm({ ...cupomForm, isActive: !cupomForm.isActive })}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer ${
                  cupomForm.isActive ? 'bg-gold border-gold' : 'border-white/30'
                }`}
              >
                {cupomForm.isActive && <Check className="w-4 h-4 text-black" />}
              </div>
              <Label className="text-white cursor-pointer" onClick={() => setCupomForm({ ...cupomForm, isActive: !cupomForm.isActive })}>
                Cupom ativo
              </Label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button onClick={handleCloseModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCupom}
              disabled={saving}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCupom ? 'Salvar Alterações' : 'Adicionar Cupom'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA PROMOÇÕES
// ============================================

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
  const [promoForm, setPromoForm] = useState({
    serviceId: '',
    discount: '',
    validUntil: '',
    isActive: true,
  })

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [promoData, servicosData] = await Promise.all([
        getPromocoes(businessId),
        getServicos(businessId),
      ])
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
    if (promo) {
      setEditingPromocao(promo)
      setPromoForm({
        serviceId: promo.serviceId || '',
        discount: promo.discount.toString(),
        validUntil: promo.validUntil,
        isActive: promo.isActive,
      })
    } else {
      setEditingPromocao(null)
      setPromoForm({ serviceId: '', discount: '', validUntil: '', isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPromocao(null)
    setPromoForm({ serviceId: '', discount: '', validUntil: '', isActive: true })
  }

  const handleSavePromocao = async () => {
    if (!promoForm.serviceId || !promoForm.discount || !promoForm.validUntil) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    const selectedService = servicos.find(s => s.id === promoForm.serviceId)
    if (!selectedService) return

    try {
      setSaving(true)
      if (editingPromocao) {
        await updatePromocao(businessId, editingPromocao.id, {
          serviceId: promoForm.serviceId,
          serviceName: selectedService.name,
          discount: parseFloat(promoForm.discount),
          originalPrice: selectedService.price,
          validUntil: promoForm.validUntil,
          isActive: promoForm.isActive,
        })
        toast({ title: 'Sucesso', description: 'Promoção atualizada com sucesso' })
      } else {
        await addPromocao(businessId, {
          serviceId: promoForm.serviceId,
          serviceName: selectedService.name,
          discount: parseFloat(promoForm.discount),
          originalPrice: selectedService.price,
          validUntil: promoForm.validUntil,
          isActive: promoForm.isActive,
        })
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

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) setSelectedPromocoes(new Set())
  }

  const handlePromocaoSelection = (promoId: string) => {
    setSelectedPromocoes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(promoId)) newSet.delete(promoId)
      else newSet.add(promoId)
      return newSet
    })
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex gap-3 mb-6">
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Promoção
        </Button>
        <Button onClick={handleManageToggle} variant="outline" className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}>
          <List className="w-4 h-4 mr-2" />
          {isManageMode ? 'Cancelar' : 'Gerenciar Promoções'}
        </Button>
        {isManageMode && selectedPromocoes.size > 0 && (
          <Button onClick={handleDeleteSelected} variant="destructive" className="bg-red-500 hover:bg-red-600" disabled={saving}>
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar ({selectedPromocoes.size})
          </Button>
        )}
      </div>

      {promocoes.length === 0 ? (
        <div className="text-center py-16">
          <Percent className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma promoção cadastrada ainda</p>
          <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Promoção" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promocoes.map((promo) => (
            <Card key={promo.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {isManageMode && (
                    <div
                      onClick={(e) => { e.stopPropagation(); handlePromocaoSelection(promo.id) }}
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                        selectedPromocoes.has(promo.id) ? 'bg-gold border-gold' : 'border-white/30'
                      }`}
                    >
                      {selectedPromocoes.has(promo.id) && <Check className="w-4 h-4 text-black" />}
                    </div>
                  )}
                  <div onClick={() => !isManageMode && handleOpenModal(promo)} className="flex items-center gap-4 flex-1">
                    <div className="bg-orange-500/20 p-3 rounded-lg">
                      <Percent className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-white">{promo.serviceName}</h3>
                        <Badge className={promo.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {promo.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mb-1">
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(promo.originalPrice)}</span>
                        <span className="text-lg font-bold text-green-500">
                          {formatCurrency(promo.originalPrice * (1 - promo.discount / 100))}
                        </span>
                        <Badge className="bg-red-500 text-white">-{promo.discount}%</Badge>
                      </div>
                      <p className="text-xs text-gray-500">Válido até {new Date(promo.validUntil).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {!isManageMode && (
                    <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80" onClick={() => handleOpenModal(promo)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Adicionar/Editar Promoção */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingPromocao ? 'Editar Promoção' : 'Adicionar Nova Promoção'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingPromocao ? 'Atualize as informações da promoção' : 'Configure a nova promoção'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="promo-service" className="text-white">Serviço</Label>
              <Select value={promoForm.serviceId} onValueChange={(value) => setPromoForm({ ...promoForm, serviceId: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {servicos.map((service) => (
                    <SelectItem key={service.id} value={service.id} className="text-white">
                      {service.name} - {formatCurrency(service.price)}
                    </SelectItem>
                  ))}
                  {servicos.length === 0 && (
                    <SelectItem value="_empty" disabled className="text-gray-500">
                      Cadastre serviços primeiro
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo-discount" className="text-white">Desconto (%)</Label>
                <Input
                  id="promo-discount"
                  type="number"
                  value={promoForm.discount}
                  onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                  placeholder="0"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="promo-valid" className="text-white">Válido até</Label>
                <Input
                  id="promo-valid"
                  type="date"
                  value={promoForm.validUntil}
                  onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                onClick={() => setPromoForm({ ...promoForm, isActive: !promoForm.isActive })}
                className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer ${
                  promoForm.isActive ? 'bg-gold border-gold' : 'border-white/30'
                }`}
              >
                {promoForm.isActive && <Check className="w-4 h-4 text-black" />}
              </div>
              <Label className="text-white cursor-pointer" onClick={() => setPromoForm({ ...promoForm, isActive: !promoForm.isActive })}>
                Promoção ativa
              </Label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button onClick={handleCloseModal} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleSavePromocao}
              disabled={saving}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPromocao ? 'Salvar Alterações' : 'Adicionar Promoção'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
