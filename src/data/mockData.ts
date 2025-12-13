import { Appointment, Service, Professional, DashboardStats, PaymentMethod, Expense, ExpenseCategory, Business, CategoryInfo, BusinessHours } from '@/types'

// Função auxiliar para gerar agendamentos
const generateAppointments = (): Appointment[] => {
  const today = new Date()

  // Apenas 3 agendamentos de exemplo, um de cada status principal
  return [
    {
      id: '1',
      businessId: 'biz-1',
      clientId: '1',
      clientName: 'Ana Paula Silva',
      serviceId: '1',
      service: 'Corte Masculino',
      professionalId: '1',
      professional: 'João Santos',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      time: '14:00',
      price: 35,
      status: 'confirmed',
      duration: 30,
      paymentMethod: undefined,
    },
    {
      id: '2',
      businessId: 'biz-1',
      clientId: '2',
      clientName: 'Lucas Ferreira',
      serviceId: '3',
      service: 'Corte + Barba',
      professionalId: '2',
      professional: 'Mariana Costa',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
      time: '15:30',
      price: 55,
      status: 'pending',
      duration: 45,
      paymentMethod: undefined,
    },
    {
      id: '3',
      businessId: 'biz-1',
      clientId: '3',
      clientName: 'Pedro Alves',
      serviceId: '2',
      service: 'Barba Completa',
      professionalId: '1',
      professional: 'João Santos',
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 10, 0),
      time: '10:00',
      price: 25,
      status: 'completed',
      duration: 20,
      paymentMethod: 'pix',
    },
  ]
}

export const mockAppointments: Appointment[] = generateAppointments()

export const mockServices: Service[] = [
  // BarberPro Premium (biz-1)
  {
    id: '1',
    businessId: 'biz-1',
    name: 'Corte Masculino',
    description: 'Corte moderno e estiloso com acabamento premium',
    price: 35.00,
    duration: 30,
    category: 'hair',
  },
  {
    id: '2',
    businessId: 'biz-1',
    name: 'Barba Completa',
    description: 'Design de barba com navalha e toalha quente',
    price: 25.00,
    duration: 20,
    category: 'beard',
  },
  {
    id: '3',
    businessId: 'biz-1',
    name: 'Corte + Barba',
    description: 'Combo completo de corte e design de barba',
    price: 55.00,
    duration: 45,
    category: 'hair',
  },
  // Estilo & Charme (biz-4)
  {
    id: '4',
    businessId: 'biz-4',
    name: 'Corte Feminino',
    description: 'Corte personalizado com técnicas avançadas',
    price: 50.00,
    duration: 45,
    category: 'hair',
  },
  {
    id: '5',
    businessId: 'biz-4',
    name: 'Coloração',
    description: 'Coloração profissional com produtos de alta qualidade',
    price: 80.00,
    duration: 60,
    category: 'color',
  },
  {
    id: '6',
    businessId: 'biz-4',
    name: 'Luzes',
    description: 'Mechas e luzes com técnicas personalizadas',
    price: 150.00,
    duration: 120,
    category: 'color',
  },
  {
    id: '7',
    businessId: 'biz-4',
    name: 'Hidratação Capilar',
    description: 'Tratamento intensivo para reconstrução capilar',
    price: 120.00,
    duration: 90,
    category: 'treatment',
  },
  {
    id: '8',
    businessId: 'biz-4',
    name: 'Progressiva',
    description: 'Escova progressiva para alisamento natural',
    price: 200.00,
    duration: 180,
    category: 'treatment',
  },
  // Barbearia Clássica (biz-2)
  {
    id: '9',
    businessId: 'biz-2',
    name: 'Corte Tradicional',
    description: 'Corte clássico com técnicas tradicionais',
    price: 30.00,
    duration: 30,
    category: 'hair',
  },
  {
    id: '10',
    businessId: 'biz-2',
    name: 'Barba',
    description: 'Aparar e modelar barba',
    price: 20.00,
    duration: 20,
    category: 'beard',
  },
  // The Barber Shop (biz-3)
  {
    id: '11',
    businessId: 'biz-3',
    name: 'American Cut',
    description: 'Corte estilo americano com acabamento profissional',
    price: 40.00,
    duration: 35,
    category: 'hair',
  },
  {
    id: '12',
    businessId: 'biz-3',
    name: 'Beard Grooming',
    description: 'Tratamento completo de barba',
    price: 30.00,
    duration: 25,
    category: 'beard',
  },
]

export const mockProfessionals: Professional[] = [
  // BarberPro Premium (biz-1)
  {
    id: '1',
    businessId: 'biz-1',
    name: 'João Santos',
    role: 'Barbeiro Master',
    specialties: ['Corte Masculino', 'Barba', 'Design de Sobrancelha'],
    rating: 4.9,
    totalAppointments: 1250,
    available: true,
  },
  {
    id: '2',
    businessId: 'biz-1',
    name: 'Carlos Silva',
    role: 'Barbeiro',
    specialties: ['Corte Masculino', 'Barba', 'Pigmentação'],
    rating: 4.7,
    totalAppointments: 750,
    available: true,
  },
  // Estilo & Charme (biz-4)
  {
    id: '3',
    businessId: 'biz-4',
    name: 'Mariana Costa',
    role: 'Cabeleireira',
    specialties: ['Coloração', 'Corte Feminino', 'Mechas'],
    rating: 4.8,
    totalAppointments: 980,
    available: true,
  },
  {
    id: '4',
    businessId: 'biz-4',
    name: 'Juliana Lima',
    role: 'Hair Stylist',
    specialties: ['Hidratação', 'Reconstrução', 'Tratamentos'],
    rating: 5.0,
    totalAppointments: 620,
    available: true,
  },
  // Barbearia Clássica (biz-2)
  {
    id: '5',
    businessId: 'biz-2',
    name: 'Ricardo Mendes',
    role: 'Barbeiro',
    specialties: ['Corte Masculino', 'Barba', 'Design'],
    rating: 4.6,
    totalAppointments: 540,
    available: true,
  },
  // The Barber Shop (biz-3)
  {
    id: '6',
    businessId: 'biz-3',
    name: 'Mike Johnson',
    role: 'Barber',
    specialties: ['American Cuts', 'Fade', 'Beard Grooming'],
    rating: 4.9,
    totalAppointments: 890,
    available: true,
  },
]

export const mockDashboardStats: DashboardStats = {
  todayAppointments: 12,
  monthlyRevenue: 8500.00,
  activeProfessionals: 5,
  availableServices: 8,
}

// Função auxiliar para gerar despesas
const generateExpenses = (): Expense[] => {
  const expenses: Expense[] = []
  const today = new Date()

  const expenseTemplates = [
    { description: 'Aluguel do imóvel', category: 'rent' as ExpenseCategory, amount: 3500, recurring: true, dayOfMonth: 5 },
    { description: 'Conta de luz', category: 'utilities' as ExpenseCategory, amount: 450, recurring: true, dayOfMonth: 10 },
    { description: 'Conta de água', category: 'utilities' as ExpenseCategory, amount: 120, recurring: true, dayOfMonth: 15 },
    { description: 'Internet e telefone', category: 'utilities' as ExpenseCategory, amount: 200, recurring: true, dayOfMonth: 8 },
    { description: 'Salário - João Santos', category: 'salaries' as ExpenseCategory, amount: 3200, recurring: true, dayOfMonth: 1 },
    { description: 'Salário - Mariana Costa', category: 'salaries' as ExpenseCategory, amount: 2800, recurring: true, dayOfMonth: 1 },
    { description: 'Salário - Carlos Silva', category: 'salaries' as ExpenseCategory, amount: 2500, recurring: true, dayOfMonth: 1 },
    { description: 'Salário - Juliana Lima', category: 'salaries' as ExpenseCategory, amount: 2900, recurring: true, dayOfMonth: 1 },
    { description: 'Salário - Ricardo Mendes', category: 'salaries' as ExpenseCategory, amount: 2400, recurring: true, dayOfMonth: 1 },
  ]

  const oneTimeExpenses = [
    { description: 'Produtos para coloração', category: 'supplies' as ExpenseCategory, amount: 680 },
    { description: 'Toalhas e capas', category: 'supplies' as ExpenseCategory, amount: 350 },
    { description: 'Navalhas e tesouras profissionais', category: 'supplies' as ExpenseCategory, amount: 890 },
    { description: 'Produtos de limpeza', category: 'supplies' as ExpenseCategory, amount: 180 },
    { description: 'Shampoos e condicionadores', category: 'supplies' as ExpenseCategory, amount: 520 },
    { description: 'Anúncios Google Ads', category: 'marketing' as ExpenseCategory, amount: 450 },
    { description: 'Anúncios Instagram/Facebook', category: 'marketing' as ExpenseCategory, amount: 380 },
    { description: 'Manutenção ar condicionado', category: 'maintenance' as ExpenseCategory, amount: 280 },
    { description: 'Reparo cadeira de barbeiro', category: 'maintenance' as ExpenseCategory, amount: 320 },
    { description: 'Material de escritório', category: 'other' as ExpenseCategory, amount: 150 },
  ]

  let id = 1

  // Gerar despesas recorrentes dos últimos 3 meses
  for (let monthOffset = 3; monthOffset >= 0; monthOffset--) {
    expenseTemplates.forEach(template => {
      const expenseDate = new Date(today.getFullYear(), today.getMonth() - monthOffset, template.dayOfMonth)

      if (expenseDate <= today) {
        const isPaid = expenseDate < today || Math.random() > 0.3

        expenses.push({
          id: String(id++),
          businessId: 'biz-1',
          description: template.description,
          category: template.category,
          amount: template.amount,
          date: expenseDate,
          paymentMethod: isPaid ? (['pix', 'credit', 'debit', 'boleto'] as PaymentMethod[])[Math.floor(Math.random() * 4)] : undefined,
          isPaid,
          recurring: template.recurring
        })
      }
    })
  }

  // Gerar despesas únicas nos últimos 3 meses
  const startDate = new Date(today)
  startDate.setMonth(startDate.getMonth() - 3)

  for (let i = 0; i < 15; i++) {
    const randomDays = Math.floor(Math.random() * 90)
    const expenseDate = new Date(startDate)
    expenseDate.setDate(expenseDate.getDate() + randomDays)

    if (expenseDate <= today) {
      const template = oneTimeExpenses[Math.floor(Math.random() * oneTimeExpenses.length)]
      const isPaid = expenseDate < today || Math.random() > 0.4
      const variation = 0.8 + Math.random() * 0.4 // ±20% variation

      expenses.push({
        id: String(id++),
        businessId: 'biz-1',
        description: template.description,
        category: template.category,
        amount: Math.round(template.amount * variation),
        date: expenseDate,
        paymentMethod: isPaid ? (['pix', 'credit', 'debit', 'boleto'] as PaymentMethod[])[Math.floor(Math.random() * 4)] : undefined,
        isPaid,
        recurring: false
      })
    }
  }

  return expenses.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export const mockExpenses: Expense[] = generateExpenses()

// Categorias de negócios
export const businessCategories: CategoryInfo[] = [
  {
    id: 'barbearia',
    name: 'Barbearia',
    description: 'Cortes masculinos, barba e acabamentos',
    icon: 'Scissors',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'salao',
    name: 'Salão de Beleza',
    description: 'Cortes, coloração e tratamentos capilares',
    icon: 'Sparkles',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  {
    id: 'estetica',
    name: 'Estética',
    description: 'Tratamentos faciais e corporais',
    icon: 'Heart',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'spa',
    name: 'Spa',
    description: 'Relaxamento e bem-estar',
    icon: 'Waves',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  {
    id: 'manicure',
    name: 'Manicure & Pedicure',
    description: 'Cuidados com unhas e pés',
    icon: 'Hand',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  {
    id: 'massagem',
    name: 'Massagem',
    description: 'Massagens terapêuticas e relaxantes',
    icon: 'Activity',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'depilacao',
    name: 'Depilação',
    description: 'Depilação a cera e laser',
    icon: 'Zap',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'maquiagem',
    name: 'Maquiagem',
    description: 'Maquiagem profissional',
    icon: 'Palette',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50'
  }
]

// Horários padrão de funcionamento
const defaultBusinessHours: BusinessHours[] = [
  { dayOfWeek: 0, open: '10:00', close: '16:00', isClosed: false }, // Domingo
  { dayOfWeek: 1, open: '09:00', close: '19:00', isClosed: false }, // Segunda
  { dayOfWeek: 2, open: '09:00', close: '19:00', isClosed: false }, // Terça
  { dayOfWeek: 3, open: '09:00', close: '19:00', isClosed: false }, // Quarta
  { dayOfWeek: 4, open: '09:00', close: '19:00', isClosed: false }, // Quinta
  { dayOfWeek: 5, open: '09:00', close: '20:00', isClosed: false }, // Sexta
  { dayOfWeek: 6, open: '09:00', close: '18:00', isClosed: false }, // Sábado
]

// Empresas mockadas
export const mockBusinesses: Business[] = [
  // Barbearias
  {
    id: 'biz-1',
    name: 'BarberPro Premium',
    category: 'barbearia',
    description: 'Barbearia premium com profissionais especializados em cortes modernos e tradicionais',
    address: {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    phone: '(11) 98765-4321',
    email: 'contato@barberpro.com',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',
    rating: 4.8,
    totalReviews: 245,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },
  {
    id: 'biz-2',
    name: 'Barbearia Clássica',
    category: 'barbearia',
    description: 'Tradição e qualidade em cortes masculinos desde 1995',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    phone: '(11) 91234-5678',
    email: 'contato@classica.com',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop',
    rating: 4.6,
    totalReviews: 189,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },
  {
    id: 'biz-3',
    name: 'The Barber Shop',
    category: 'barbearia',
    description: 'Estilo americano com atendimento personalizado',
    address: {
      street: 'Rua Augusta',
      number: '456',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000'
    },
    phone: '(11) 99876-5432',
    email: 'hello@thebarbershop.com',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',
    rating: 4.9,
    totalReviews: 312,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Salões de Beleza
  {
    id: 'biz-4',
    name: 'Estilo & Charme',
    category: 'salao',
    description: 'Salão completo com serviços de cabelo, maquiagem e estética',
    address: {
      street: 'Rua dos Pinheiros',
      number: '789',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05422-001'
    },
    phone: '(11) 97777-8888',
    email: 'contato@estilocharme.com',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',
    rating: 4.7,
    totalReviews: 423,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },
  {
    id: 'biz-5',
    name: 'Beleza Pura',
    category: 'salao',
    description: 'Especialistas em coloração e tratamentos capilares',
    address: {
      street: 'Av. Faria Lima',
      number: '2000',
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01452-000'
    },
    phone: '(11) 96666-7777',
    email: 'atendimento@belezapura.com',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',
    rating: 4.9,
    totalReviews: 567,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Estética
  {
    id: 'biz-6',
    name: 'Clínica Estética Renove',
    category: 'estetica',
    description: 'Tratamentos estéticos faciais e corporais com tecnologia de ponta',
    address: {
      street: 'Rua Oscar Freire',
      number: '300',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-001'
    },
    phone: '(11) 95555-4444',
    email: 'contato@renove.com',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',
    rating: 4.8,
    totalReviews: 298,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Spa
  {
    id: 'biz-7',
    name: 'Spa Serenity',
    category: 'spa',
    description: 'Relaxamento e bem-estar em ambiente tranquilo',
    address: {
      street: 'Rua da Paz',
      number: '500',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-020'
    },
    phone: '(11) 94444-3333',
    email: 'relax@serenity.com',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',
    rating: 4.9,
    totalReviews: 412,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Manicure
  {
    id: 'biz-8',
    name: 'Nails Art Studio',
    category: 'manicure',
    description: 'Nail art e cuidados com unhas e pés',
    address: {
      street: 'Rua Haddock Lobo',
      number: '600',
      neighborhood: 'Cerqueira César',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01414-001'
    },
    phone: '(11) 93333-2222',
    email: 'contato@nailsart.com',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop',
    rating: 4.7,
    totalReviews: 334,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Massagem
  {
    id: 'biz-9',
    name: 'Massagem & Terapia',
    category: 'massagem',
    description: 'Massagens terapêuticas e relaxantes com profissionais certificados',
    address: {
      street: 'Rua Pamplona',
      number: '700',
      neighborhood: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01405-001'
    },
    phone: '(11) 92222-1111',
    email: 'info@massagemterapia.com',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    rating: 4.8,
    totalReviews: 267,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Depilação
  {
    id: 'biz-10',
    name: 'Depil Laser',
    category: 'depilacao',
    description: 'Depilação a laser e cera com tecnologia avançada',
    address: {
      street: 'Rua Bela Cintra',
      number: '800',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01415-000'
    },
    phone: '(11) 91111-0000',
    email: 'contato@depillaser.com',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',
    rating: 4.6,
    totalReviews: 198,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },

  // Maquiagem
  {
    id: 'biz-11',
    name: 'Make Up Pro',
    category: 'maquiagem',
    description: 'Maquiagem profissional para eventos e dia a dia',
    address: {
      street: 'Rua Estados Unidos',
      number: '900',
      neighborhood: 'Jardim América',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01427-001'
    },
    phone: '(11) 90000-9999',
    email: 'atendimento@makeuppro.com',
    image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&h=600&fit=crop',
    rating: 4.9,
    totalReviews: 389,
    businessHours: defaultBusinessHours,
    ownerId: '1'
  },
]
