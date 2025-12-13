import { useState } from 'react'
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
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockServices } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'

type TabType = 'servicos' | 'categorias' | 'combos' | 'cupons' | 'promocoes'

const categoryLabels: Record<string, string> = {
  hair: 'Cabelo',
  beard: 'Barba',
  color: 'Coloração',
  treatment: 'Tratamento',
  spa: 'Spa'
}

const categoryColors: Record<string, string> = {
  hair: 'bg-blue-500',
  beard: 'bg-green-500',
  color: 'bg-purple-500',
  treatment: 'bg-gold',
  spa: 'bg-pink-500'
}

export function Servicos() {
  const [activeTab, setActiveTab] = useState<TabType>('servicos')

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Gerenciar Serviços</h1>
          <p className="text-sm text-gray-400">Gerencie serviços, categorias, combos, cupons e promoções</p>
        </div>

        {/* Tabs */}
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

          {/* Aba Serviços */}
          <TabsContent value="servicos">
            <ServicosTab />
          </TabsContent>

          {/* Aba Categorias */}
          <TabsContent value="categorias">
            <CategoriasTab />
          </TabsContent>

          {/* Aba Combos */}
          <TabsContent value="combos">
            <CombosTab />
          </TabsContent>

          {/* Aba Cupons */}
          <TabsContent value="cupons">
            <CuponsTab />
          </TabsContent>

          {/* Aba Promoções */}
          <TabsContent value="promocoes">
            <PromocoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: ABA SERVIÇOS
// ============================================
interface Service {
  id: string
  name: string
  description: string
  category: string
  price: number
  duration: number
}

function ServicosTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '' // Formato HH:MM
  })

  // Filtrar serviços por categorias selecionadas e busca por nome
  let filteredServices = mockServices

  // Filtro por categoria
  if (selectedCategories.length > 0) {
    filteredServices = filteredServices.filter(service =>
      selectedCategories.includes(service.category)
    )
  }

  // Filtro por busca de nome
  if (searchTerm.trim()) {
    filteredServices = filteredServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Categorias disponíveis
  const availableCategories = Object.keys(categoryLabels).map(key => ({
    value: key,
    label: categoryLabels[key]
  }))

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      const hours = Math.floor(service.duration / 60)
      const minutes = service.duration % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price.toString(),
        duration: timeString
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        duration: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      duration: ''
    })
  }

  const handleSaveService = () => {
    // Aqui você implementaria a lógica para salvar o serviço no Firebase
    console.log('Salvando serviço:', formData)
    handleCloseModal()
  }

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) {
      setSelectedServices(new Set())
    }
  }

  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const handleDeleteSelected = () => {
    // Aqui você implementaria a lógica para deletar os serviços selecionados
    console.log('Deletando serviços:', Array.from(selectedServices))
    setSelectedServices(new Set())
    setIsManageMode(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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

          {/* Botão de Deletar (aparece no modo de gerenciar) */}
          {isManageMode && selectedServices.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar ({selectedServices.size})
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          {/* Busca por nome */}
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
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por categoria */}
          <div className="relative">
            <Button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrar por Categoria
              {selectedCategories.length > 0 && (
                <Badge className="ml-2 bg-gold text-black">{selectedCategories.length}</Badge>
              )}
            </Button>

            {/* Dropdown de Filtro */}
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-gray-900 border border-white/10 rounded-lg shadow-xl p-3">
                <div className="space-y-2">
                  {availableCategories.map((cat) => (
                    <label
                      key={cat.value}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                      onClick={() => handleCategoryToggle(cat.value)}
                    >
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        selectedCategories.includes(cat.value)
                          ? 'bg-gold border-gold'
                          : 'border-white/30'
                      }`}>
                        {selectedCategories.includes(cat.value) && (
                          <Check className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <span className="text-white">{cat.label}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 bg-gold text-black hover:bg-gold/80"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Serviços */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <Card
            key={service.id}
            className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Checkbox (modo gerenciar) */}
                {isManageMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleServiceSelection(service.id)
                    }}
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                      selectedServices.has(service.id)
                        ? 'bg-gold border-gold'
                        : 'border-white/30'
                    }`}
                  >
                    {selectedServices.has(service.id) && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                )}

                <div
                  onClick={() => !isManageMode && handleOpenModal(service as Service)}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className={`${categoryColors[service.category]} p-3 rounded-lg`}>
                    <Scissors className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white">{service.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[service.category]}
                      </Badge>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gold hover:text-gold/80"
                    onClick={() => handleOpenModal(service as Service)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Adicionar/Editar Serviço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingService
                ? 'Atualize as informações do serviço abaixo'
                : 'Preencha as informações do novo serviço'}
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
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Preço */}
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

              {/* Duração */}
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
            <Button
              onClick={handleCloseModal}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveService}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
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
interface Category {
  id: string
  name: string
  count: number
}

function CategoriasTab() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryForm, setCategoryForm] = useState({
    name: ''
  })

  const categories = [
    { id: '1', name: 'Cabelo', count: 5 },
    { id: '2', name: 'Barba', count: 3 },
    { id: '3', name: 'Coloração', count: 2 },
    { id: '4', name: 'Tratamento', count: 4 },
  ]

  // Filtrar categorias por busca de nome
  const filteredCategories = searchTerm.trim()
    ? categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : categories

  // Serviços da categoria sendo editada
  const servicesInCategory = editingCategory
    ? mockServices.filter(service => categoryLabels[service.category] === editingCategory.name)
    : []

  const handleOpenModal = (category?: Category) => {
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

  const handleSaveCategory = () => {
    console.log('Salvando categoria:', categoryForm)
    handleCloseModal()
  }

  const handleManageToggle = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) {
      setSelectedCategories(new Set())
    }
  }

  const handleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleDeleteSelected = () => {
    console.log('Deletando categorias:', Array.from(selectedCategories))
    setSelectedCategories(new Set())
    setIsManageMode(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <Button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Categoria
          </Button>
          <Button
            onClick={handleManageToggle}
            variant="outline"
            className={`border-white/20 text-white hover:bg-white/10 ${isManageMode ? 'bg-white/10' : ''}`}
          >
            <List className="w-4 h-4 mr-2" />
            {isManageMode ? 'Cancelar' : 'Gerenciar Categorias'}
          </Button>

          {/* Botão de Deletar */}
          {isManageMode && selectedCategories.size > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar ({selectedCategories.size})
            </Button>
          )}
        </div>

        {/* Busca */}
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
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Categorias */}
      <div className="space-y-3">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Checkbox (modo gerenciar) */}
                {isManageMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCategorySelection(category.id)
                    }}
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center mr-3 cursor-pointer ${
                      selectedCategories.has(category.id)
                        ? 'bg-gold border-gold'
                        : 'border-white/30'
                    }`}
                  >
                    {selectedCategories.has(category.id) && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                )}

                <div
                  onClick={() => !isManageMode && handleOpenModal(category)}
                  className="flex items-center gap-4 flex-1"
                >
                  <div className="bg-gold/20 p-3 rounded-lg">
                    <Tag className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <p className="text-sm text-gray-400">{category.count} serviço(s)</p>
                  </div>
                </div>

                {!isManageMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gold hover:text-gold/80"
                    onClick={() => handleOpenModal(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Adicionar/Editar Categoria */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gold">
              {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingCategory
                ? 'Atualize o nome da categoria'
                : 'Digite o nome da nova categoria'}
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

            {/* Mostrar serviços desta categoria quando editando */}
            {editingCategory && servicesInCategory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <Label className="text-white mb-3 block">
                  Serviços nesta categoria ({servicesInCategory.length})
                </Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {servicesInCategory.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <Scissors className="w-4 h-4 text-gold" />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{service.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(service.price)} • {service.duration} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              onClick={handleCloseModal}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCategory}
              className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold"
            >
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
function CombosTab() {
  const combos = [
    {
      id: '1',
      name: 'Combo Completo',
      services: ['Corte + Barba'],
      originalPrice: 80,
      comboPrice: 65,
    },
    {
      id: '2',
      name: 'Pacote Premium',
      services: ['Corte + Barba + Sobrancelha'],
      originalPrice: 110,
      comboPrice: 90,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botões de Ação */}
      <div className="flex gap-3 mb-6">
        <Button className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Combo
        </Button>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <List className="w-4 h-4 mr-2" />
          Gerenciar Combos
        </Button>
      </div>

      {/* Lista de Combos */}
      <div className="space-y-3">
        {combos.map((combo) => (
          <Card
            key={combo.id}
            className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Package className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{combo.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{combo.services.join(' + ')}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(combo.originalPrice)}
                      </span>
                      <span className="text-lg font-bold text-green-500">
                        {formatCurrency(combo.comboPrice)}
                      </span>
                      <Badge className="bg-green-500 text-white">
                        -{ Math.round(((combo.originalPrice - combo.comboPrice) / combo.originalPrice) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA CUPONS
// ============================================
function CuponsTab() {
  const cupons = [
    {
      id: '1',
      code: 'PRIMEIRAVISITA',
      discount: 15,
      usedCount: 5,
      usageLimit: 100,
      isActive: true,
    },
    {
      id: '2',
      code: 'VERAO2025',
      discount: 20,
      usedCount: 12,
      usageLimit: 50,
      isActive: true,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botões de Ação */}
      <div className="flex gap-3 mb-6">
        <Button className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cupom
        </Button>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <List className="w-4 h-4 mr-2" />
          Gerenciar Cupons
        </Button>
      </div>

      {/* Lista de Cupons */}
      <div className="space-y-3">
        {cupons.map((cupom) => (
          <Card
            key={cupom.id}
            className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
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
                <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

// ============================================
// COMPONENTE: ABA PROMOÇÕES
// ============================================
function PromocoesTab() {
  const promocoes = [
    {
      id: '1',
      serviceName: 'Corte Masculino',
      discount: 20,
      originalPrice: 45,
      isActive: true,
      validUntil: '2025-12-31',
    },
    {
      id: '2',
      serviceName: 'Barba Completa',
      discount: 15,
      originalPrice: 35,
      isActive: false,
      validUntil: '2025-12-15',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Botões de Ação */}
      <div className="flex gap-3 mb-6">
        <Button className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Promoção
        </Button>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <List className="w-4 h-4 mr-2" />
          Gerenciar Promoções
        </Button>
      </div>

      {/* Lista de Promoções */}
      <div className="space-y-3">
        {promocoes.map((promo) => (
          <Card
            key={promo.id}
            className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-gold/50 transition-all cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
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
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(promo.originalPrice)}
                      </span>
                      <span className="text-lg font-bold text-green-500">
                        {formatCurrency(promo.originalPrice * (1 - promo.discount / 100))}
                      </span>
                      <Badge className="bg-red-500 text-white">-{promo.discount}%</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Válido até {new Date(promo.validUntil).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-gold hover:text-gold/80">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
