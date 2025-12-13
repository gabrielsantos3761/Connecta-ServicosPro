import { motion } from 'framer-motion'
import { useState } from 'react'
import { Scissors, Clock, DollarSign, Plus, Edit, Trash2, Percent, X, Power, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockServices } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { theme, pageClasses } from '@/styles/theme'

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

interface Category {
  id: string
  value: string
  label: string
}

interface Promotion {
  serviceId: string
  discount: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  isActive: boolean
}

interface Coupon {
  id: string
  code: string
  discount: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  isActive: boolean
  serviceIds: string[]
  usageLimit: number
  usedCount: number
}

export function Servicos() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false)
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false)
  const [isCouponListDialogOpen, setIsCouponListDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [selectedServiceForPromotion, setSelectedServiceForPromotion] = useState<any>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [disabledServices, setDisabledServices] = useState<Set<string>>(new Set())
  const [newCategoryName, setNewCategoryName] = useState('')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [selectedCouponServices, setSelectedCouponServices] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', value: 'hair', label: 'Cabelo' },
    { id: '2', value: 'beard', label: 'Barba' },
    { id: '3', value: 'color', label: 'Coloração' },
    { id: '4', value: 'treatment', label: 'Tratamento' },
    { id: '5', value: 'spa', label: 'Spa' }
  ])
  const [promotions, setPromotions] = useState<Record<string, Promotion>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: ''
  })
  const [promotionData, setPromotionData] = useState({
    discount: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isActive: true
  })
  const [couponData, setCouponData] = useState({
    code: '',
    discount: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isActive: true,
    usageLimit: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você pode adicionar a lógica para salvar/editar o serviço
    if (isEditMode) {
      console.log('Editando serviço:', editingServiceId, formData)
    } else {
      console.log('Novo serviço:', formData)
    }
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingServiceId(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      duration: ''
    })
  }

  const handleEditService = (service: any) => {
    setIsEditMode(true)
    setEditingServiceId(service.id)
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      duration: service.duration.toString()
    })
    setIsDialogOpen(true)
  }

  const handleOpenPromotion = (service: any) => {
    setSelectedServiceForPromotion(service)
    const existingPromotion = promotions[service.id]
    if (existingPromotion) {
      setPromotionData({
        discount: existingPromotion.discount.toString(),
        startDate: existingPromotion.startDate,
        endDate: existingPromotion.endDate,
        startTime: existingPromotion.startTime,
        endTime: existingPromotion.endTime,
        isActive: existingPromotion.isActive
      })
    } else {
      setPromotionData({
        discount: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isActive: true
      })
    }
    setIsPromotionDialogOpen(true)
  }

  const handleSubmitPromotion = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedServiceForPromotion) {
      const promotion: Promotion = {
        serviceId: selectedServiceForPromotion.id,
        discount: parseFloat(promotionData.discount),
        startDate: promotionData.startDate,
        endDate: promotionData.endDate,
        startTime: promotionData.startTime,
        endTime: promotionData.endTime,
        isActive: promotionData.isActive
      }
      setPromotions({ ...promotions, [selectedServiceForPromotion.id]: promotion })
      setIsPromotionDialogOpen(false)
      setSelectedServiceForPromotion(null)
      setPromotionData({
        discount: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        isActive: true
      })
    }
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
        label: newCategoryName
      }
      setCategories([...categories, newCategory])
      setNewCategoryName('')
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId))
  }

  const toggleServiceSelection = (serviceId: string) => {
    const newSelection = new Set(selectedServices)
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId)
    } else {
      newSelection.add(serviceId)
    }
    setSelectedServices(newSelection)
  }

  const handleDeleteSelected = () => {
    // Aqui você implementaria a lógica para deletar os serviços selecionados
    console.log('Deletando serviços:', Array.from(selectedServices))
    setSelectedServices(new Set())
    setSelectionMode(false)
  }

  const handleDisableSelected = () => {
    // Adiciona ou remove os serviços selecionados do conjunto de desabilitados
    const newDisabled = new Set(disabledServices)
    selectedServices.forEach(serviceId => {
      if (newDisabled.has(serviceId)) {
        newDisabled.delete(serviceId)
      } else {
        newDisabled.add(serviceId)
      }
    })
    setDisabledServices(newDisabled)
    console.log('Alternando status dos serviços:', Array.from(selectedServices))
    setSelectedServices(new Set())
    setSelectionMode(false)
  }

  const handleCancelSelection = () => {
    setSelectedServices(new Set())
    setSelectionMode(false)
  }

  const handleSubmitCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const newCoupon: Coupon = {
      id: Date.now().toString(),
      code: couponData.code,
      discount: parseFloat(couponData.discount),
      startDate: couponData.startDate,
      endDate: couponData.endDate,
      startTime: couponData.startTime,
      endTime: couponData.endTime,
      isActive: couponData.isActive,
      serviceIds: Array.from(selectedCouponServices),
      usageLimit: parseInt(couponData.usageLimit) || 0,
      usedCount: 0
    }
    setCoupons([...coupons, newCoupon])
    setIsCouponDialogOpen(false)
    setSelectedCouponServices(new Set())
    setCouponData({
      code: '',
      discount: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isActive: true,
      usageLimit: ''
    })
  }

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons(coupons.filter(c => c.id !== couponId))
  }

  const toggleCouponService = (serviceId: string) => {
    const newSelection = new Set(selectedCouponServices)
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId)
    } else {
      newSelection.add(serviceId)
    }
    setSelectedCouponServices(newSelection)
  }

  // Filtrar serviços baseado na pesquisa
  const filteredServices = mockServices.filter((service) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.description.toLowerCase().includes(searchLower) ||
      categoryLabels[service.category].toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen text-white">
      <div className={pageClasses.content()}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">Serviços</h1>
          <p className="text-sm text-gray-400">Gerencie seu catálogo de serviços</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-80"
          />
        </div>

        {/* Actions Bar */}
        {!selectionMode ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className={`text-lg md:text-xl font-semibold ${theme.colors.text.primary}`}>
                {filteredServices.length} Serviços {searchQuery && `(${mockServices.length} total)`}
              </h2>
              <p className={`text-xs md:text-sm ${theme.colors.text.secondary} mt-1`}>
                {searchQuery ? `Resultados para "${searchQuery}"` : 'Organize e atualize seus serviços'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="gold"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Serviço
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setIsCategoryDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Categoria
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setSelectionMode(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Gerenciar Serviços
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-purple-500 text-purple-600 hover:bg-purple-50"
                onClick={() => setIsCouponListDialogOpen(true)}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Cupons ({coupons.length})
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-white/10 p-4 rounded-lg border-2 border-white/20">
            <div>
              <h2 className={`text-lg md:text-xl font-semibold ${theme.colors.text.primary}`}>
                {selectedServices.size} Serviço(s) Selecionado(s)
              </h2>
              <p className={`text-xs md:text-sm ${theme.colors.text.secondary} mt-1`}>
                Selecione os serviços que deseja remover
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleCancelSelection}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={handleDisableSelected}
                disabled={selectedServices.size === 0}
              >
                <Power className="w-4 h-4 mr-2" />
                Desativar/Ativar ({selectedServices.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                onClick={handleDeleteSelected}
                disabled={selectedServices.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir ({selectedServices.size})
              </Button>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Scissors className={`w-16 h-16 mx-auto ${theme.colors.text.tertiary} mb-4`} />
              <h3 className={`text-lg font-semibold ${theme.colors.text.secondary} mb-2`}>
                Nenhum serviço encontrado
              </h3>
              <p className={`text-sm ${theme.colors.text.tertiary}`}>
                {searchQuery
                  ? `Não encontramos serviços que correspondam a "${searchQuery}"`
                  : 'Adicione serviços para começar'
                }
              </p>
            </div>
          ) : (
            filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card
                className={`h-full ${theme.colors.card.base} hover:shadow-xl transition-all duration-300 group border-l-4 border-l-gold relative ${
                  selectionMode && selectedServices.has(service.id) ? 'ring-2 ring-gold bg-gold/5' : ''
                } ${disabledServices.has(service.id) ? 'opacity-50 grayscale' : ''} ${
                  selectionMode ? 'cursor-pointer' : ''
                }`}
                onClick={() => selectionMode && toggleServiceSelection(service.id)}
              >
                {selectionMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedServices.has(service.id)}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold cursor-pointer pointer-events-none"
                    />
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${categoryColors[service.category]} p-3 rounded-lg`}>
                      <Scissors className="w-6 h-6 text-white" />
                    </div>
                    {!selectionMode && (
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="outline">
                          {categoryLabels[service.category]}
                        </Badge>
                        {disabledServices.has(service.id) && (
                          <Badge className="bg-orange-500 text-white">
                            Desativado
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <CardTitle className={`text-lg ${theme.colors.text.primary} group-hover:text-gold transition-colors`}>
                    {service.name}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <p className={`text-sm ${theme.colors.text.secondary} mb-4 line-clamp-2`}>
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`flex items-center gap-2 ${theme.colors.text.secondary}`}>
                        <Clock className="w-4 h-4 text-gold" />
                        Duração
                      </span>
                      <span className={`font-semibold ${theme.colors.text.primary}`}>
                        {service.duration} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`flex items-center gap-2 ${theme.colors.text.secondary}`}>
                        <DollarSign className="w-4 h-4 text-gold" />
                        Preço
                      </span>
                      <div className="text-right">
                        {promotions[service.id]?.isActive ? (
                          <>
                            <span className="font-bold text-sm text-gray-400 line-through block">
                              {formatCurrency(service.price)}
                            </span>
                            <span className="font-bold text-lg text-green-600">
                              {formatCurrency(
                                service.price * (1 - promotions[service.id].discount / 100)
                              )}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg text-gold">
                            {formatCurrency(service.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!selectionMode && (
                    <div className={`space-y-2 pt-4 border-t ${theme.colors.border.light}`}>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditService(service)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <Button
                        variant={promotions[service.id]?.isActive ? "gold" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenPromotion(service)}
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        Promoção
                        {promotions[service.id] && (
                          <Badge
                            variant={promotions[service.id].isActive ? "default" : "outline"}
                            className={`ml-2 text-xs ${
                              promotions[service.id].isActive
                                ? "bg-green-500 hover:bg-green-600 shadow-sm"
                                : ""
                            }`}
                          >
                            <span className={promotions[service.id].isActive ? "drop-shadow-sm" : ""}>
                              {promotions[service.id].isActive ? "Ativa" : "Inativa"}
                            </span>
                          </Badge>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
          )}
        </motion.div>
      </div>

      {/* Dialog para adicionar/editar serviço */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte Masculino"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição do Serviço</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o serviço..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  setIsEditMode(false)
                  setEditingServiceId(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="gold">
                {isEditMode ? 'Salvar Alterações' : 'Adicionar Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar categorias */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>

          {/* Formulário para adicionar categoria */}
          <form onSubmit={handleAddCategory} className="mb-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <div className="flex gap-2">
                  <Input
                    id="categoryName"
                    placeholder="Ex: Massagem"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="gold" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Lista de categorias existentes */}
          <div className={`border-t ${theme.colors.border.light} pt-4`}>
            <h3 className={`text-sm font-semibold ${theme.colors.text.primary} mb-3`}>Categorias Existentes</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className={`text-sm ${theme.colors.text.secondary} text-center py-4`}>
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className={`font-medium ${theme.colors.text.primary}`}>{category.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para gerenciar promoção */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Promoção</DialogTitle>
          </DialogHeader>

          {selectedServiceForPromotion && (
            <form onSubmit={handleSubmitPromotion}>
              <div className="grid gap-4 py-4">
                {/* Informações do serviço */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className={`font-semibold text-sm ${theme.colors.text.primary} mb-2`}>Serviço Selecionado</h3>
                  <p className={`text-lg font-bold ${theme.colors.text.primary}`}>{selectedServiceForPromotion.name}</p>
                  <p className={`text-sm ${theme.colors.text.secondary} mt-1`}>
                    Valor Original: <span className="font-semibold text-gold">
                      {formatCurrency(selectedServiceForPromotion.price)}
                    </span>
                  </p>
                </div>

                {/* Desconto */}
                <div className="grid gap-2">
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ex: 20"
                    value={promotionData.discount}
                    onChange={(e) => setPromotionData({ ...promotionData, discount: e.target.value })}
                    required
                  />
                  {promotionData.discount && (
                    <p className={`text-sm ${theme.colors.text.secondary}`}>
                      Valor com desconto: <span className="font-semibold text-green-600">
                        {formatCurrency(
                          selectedServiceForPromotion.price * (1 - parseFloat(promotionData.discount) / 100)
                        )}
                      </span>
                    </p>
                  )}
                </div>

                {/* Período */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={promotionData.startDate}
                        onChange={(e) => setPromotionData({ ...promotionData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Hora de Início</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={promotionData.startTime}
                        onChange={(e) => setPromotionData({ ...promotionData, startTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">Data de Término</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={promotionData.endDate}
                        onChange={(e) => setPromotionData({ ...promotionData, endDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">Hora de Término</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={promotionData.endTime}
                        onChange={(e) => setPromotionData({ ...promotionData, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Status da promoção */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                  <div>
                    <Label htmlFor="isActive" className={`text-base font-semibold ${theme.colors.text.primary}`}>
                      Status da Promoção
                    </Label>
                    <p className={`text-sm ${theme.colors.text.secondary} mt-1`}>
                      {promotionData.isActive ? 'Promoção ativa' : 'Promoção desativada'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={promotionData.isActive}
                    onCheckedChange={(checked) => setPromotionData({ ...promotionData, isActive: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPromotionDialogOpen(false)
                    setSelectedServiceForPromotion(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="gold">
                  Salvar Promoção
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para criar cupom */}
      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitCoupon}>
            <div className="grid gap-4 py-4">
              {/* Código do Cupom */}
              <div className="grid gap-2">
                <Label htmlFor="couponCode">Código do Cupom</Label>
                <Input
                  id="couponCode"
                  type="text"
                  placeholder="Ex: PRIMEIRAVISITA"
                  value={couponData.code}
                  onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              {/* Desconto e Limite de Uso */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="couponDiscount">Desconto (%)</Label>
                  <Input
                    id="couponDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ex: 15"
                    value={couponData.discount}
                    onChange={(e) => setCouponData({ ...couponData, discount: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="usageLimit">Limite de Uso</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Ex: 100"
                    value={couponData.usageLimit}
                    onChange={(e) => setCouponData({ ...couponData, usageLimit: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Período de Validade */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="couponStartDate">Data de Início</Label>
                    <Input
                      id="couponStartDate"
                      type="date"
                      value={couponData.startDate}
                      onChange={(e) => setCouponData({ ...couponData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="couponStartTime">Hora de Início</Label>
                    <Input
                      id="couponStartTime"
                      type="time"
                      value={couponData.startTime}
                      onChange={(e) => setCouponData({ ...couponData, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="couponEndDate">Data de Término</Label>
                    <Input
                      id="couponEndDate"
                      type="date"
                      value={couponData.endDate}
                      onChange={(e) => setCouponData({ ...couponData, endDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="couponEndTime">Hora de Término</Label>
                    <Input
                      id="couponEndTime"
                      type="time"
                      value={couponData.endTime}
                      onChange={(e) => setCouponData({ ...couponData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status do cupom */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                <div>
                  <Label htmlFor="couponActive" className={`text-base font-semibold ${theme.colors.text.primary}`}>
                    Status do Cupom
                  </Label>
                  <p className={`text-sm ${theme.colors.text.secondary} mt-1`}>
                    {couponData.isActive ? 'Cupom ativo' : 'Cupom desativado'}
                  </p>
                </div>
                <Switch
                  id="couponActive"
                  checked={couponData.isActive}
                  onCheckedChange={(checked) => setCouponData({ ...couponData, isActive: checked })}
                />
              </div>

              {/* Serviços Vinculados */}
              <div className="grid gap-2">
                <Label className={`text-base font-semibold ${theme.colors.text.primary}`}>Serviços Vinculados</Label>
                <p className={`text-sm ${theme.colors.text.secondary} mb-2`}>
                  Selecione os serviços onde este cupom poderá ser utilizado
                </p>
                <div className="border border-white/10 rounded-lg p-4 max-h-[250px] overflow-y-auto space-y-2">
                  {mockServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`coupon-service-${service.id}`}
                        checked={selectedCouponServices.has(service.id)}
                        onChange={() => toggleCouponService(service.id)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label
                        htmlFor={`coupon-service-${service.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className={`font-medium ${theme.colors.text.primary}`}>{service.name}</span>
                        <span className={`text-sm ${theme.colors.text.secondary} ml-2`}>
                          ({formatCurrency(service.price)})
                        </span>
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[service.category]}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className={`text-xs ${theme.colors.text.tertiary} mt-2`}>
                  {selectedCouponServices.size} serviço(s) selecionado(s)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCouponDialogOpen(false)
                  setSelectedCouponServices(new Set())
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={selectedCouponServices.size === 0}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Criar Cupom
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para listar cupons */}
      <Dialog open={isCouponListDialogOpen} onOpenChange={setIsCouponListDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Cupons</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Botão para adicionar novo cupom */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mb-4 border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => {
                setIsCouponListDialogOpen(false)
                setIsCouponDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Cupom
            </Button>

            {/* Lista de cupons */}
            <div className="space-y-3">
              {coupons.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className={`w-12 h-12 mx-auto ${theme.colors.text.tertiary} mb-3`} />
                  <p className={`text-sm ${theme.colors.text.secondary}`}>Nenhum cupom cadastrado</p>
                  <p className={`text-xs ${theme.colors.text.tertiary} mt-1`}>
                    Crie seu primeiro cupom para começar
                  </p>
                </div>
              ) : (
                coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="border border-white/10 rounded-lg p-4 bg-white/5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-purple-400">{coupon.code}</h3>
                          <Badge
                            className={
                              coupon.isActive
                                ? "bg-green-500 hover:bg-green-600 shadow-sm"
                                : "bg-gray-400"
                            }
                          >
                            <span className={coupon.isActive ? "drop-shadow-sm" : ""}>
                              {coupon.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </Badge>
                        </div>
                        <div className={`grid grid-cols-2 gap-2 text-sm ${theme.colors.text.secondary}`}>
                          <div>
                            <span className="font-semibold">Desconto:</span> {coupon.discount}%
                          </div>
                          <div>
                            <span className="font-semibold">Uso:</span> {coupon.usedCount}/{coupon.usageLimit}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Período de validade */}
                    <div className={`text-xs ${theme.colors.text.tertiary} mb-3 bg-white/5 p-2 rounded`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Válido de {new Date(coupon.startDate).toLocaleDateString('pt-BR')} {coupon.startTime}
                          {' até '}
                          {new Date(coupon.endDate).toLocaleDateString('pt-BR')} {coupon.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Serviços vinculados */}
                    <div className={`border-t ${theme.colors.border.light} pt-3`}>
                      <p className={`text-xs font-semibold ${theme.colors.text.primary} mb-2`}>
                        Serviços Vinculados ({coupon.serviceIds.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {coupon.serviceIds.map((serviceId) => {
                          const service = mockServices.find((s) => s.id === serviceId)
                          return service ? (
                            <Badge key={serviceId} variant="outline" className="text-xs">
                              {service.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCouponListDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
