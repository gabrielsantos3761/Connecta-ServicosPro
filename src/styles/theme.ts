/**
 * Sistema de Design - BarberPro
 *
 * Tema escuro com detalhes dourados para todas as páginas do proprietário
 */

export const theme = {
  // Cores principais
  colors: {
    // Background
    background: {
      primary: '',
      page: 'min-h-screen text-white',
    },

    // Cards
    card: {
      base: 'bg-white/5 backdrop-blur-sm border-white/10',
      hover: 'hover:bg-white/5 transition-colors',

      // Variantes com bordas coloridas
      blue: 'bg-white/5 backdrop-blur-sm border-blue-500/30 hover:border-blue-500/50 transition-all',
      green: 'bg-white/5 backdrop-blur-sm border-green-500/30 hover:border-green-500/50 transition-all',
      red: 'bg-white/5 backdrop-blur-sm border-red-500/30 hover:border-red-500/50 transition-all',
      purple: 'bg-white/5 backdrop-blur-sm border-purple-500/30 hover:border-purple-500/50 transition-all',
      yellow: 'bg-white/5 backdrop-blur-sm border-yellow-500/30 hover:border-yellow-500/50 transition-all',
      gold: 'bg-white/5 backdrop-blur-sm border-gold/30 hover:border-gold/50 transition-all',

      // Card especial com gradiente dourado
      goldGradient: 'bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-gold/30',
    },

    // Texto
    text: {
      primary: 'text-white',
      secondary: 'text-gray-400',
      tertiary: 'text-gray-500',
      muted: 'text-gray-600',
    },

    // Bordas
    border: {
      light: 'border-white/10',
      gold: 'border-gold/20',
      goldStrong: 'border-gold/30',
    },

    // Divisores
    divider: {
      light: 'divide-white/10',
      border: 'border-b border-white/10',
    },

    // Ícones em fundos coloridos
    iconBackground: {
      blue: 'bg-blue-500/20',
      green: 'bg-green-500/20',
      red: 'bg-red-500/20',
      purple: 'bg-purple-500/20',
      yellow: 'bg-yellow-500/20',
      gold: 'bg-gold/20',
      emerald: 'bg-emerald-500/20',
      orange: 'bg-orange-500/20',
    },

    // Cores dos ícones
    icon: {
      blue: 'text-blue-400',
      green: 'text-green-400',
      red: 'text-red-400',
      purple: 'text-purple-400',
      yellow: 'text-yellow-400',
      gold: 'text-gold',
      emerald: 'text-emerald-400',
      orange: 'text-orange-400',
      white: 'text-white',
    },

    // Cores de status
    status: {
      success: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
      info: 'text-blue-400',
    },
  },

  // Componentes
  components: {
    // Header de cards
    cardHeader: 'border-b border-white/10',
    cardTitle: 'text-white',

    // Tables
    table: {
      header: 'bg-white/5',
      headerCell: 'px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider',
      body: 'divide-y divide-white/10',
      row: 'hover:bg-white/5 transition-colors',
      cell: 'px-6 py-4',
    },

    // Inputs
    input: {
      base: 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gold/50',
      label: 'text-gray-300',
    },

    // Botões
    button: {
      primary: 'bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-black font-semibold',
      secondary: 'bg-white/10 hover:bg-white/20 text-white',
      ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    },
  },

  // Animações
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    container: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 },
    },
  },
} as const

/**
 * Classes utilitárias para componentes comuns
 */
export const cardClasses = {
  // Container do card
  container: (variant: keyof typeof theme.colors.card = 'base') =>
    theme.colors.card[variant],

  // Header do card
  header: () =>
    `${theme.components.cardHeader}`,

  // Título do card
  title: () =>
    `${theme.components.cardTitle}`,

  // Card com ícone estatístico
  statCard: (color: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gold') =>
    theme.colors.card[color],

  // Card com hover
  interactive: () =>
    `${theme.colors.card.base} ${theme.colors.card.hover}`,
}

/**
 * Classes para ícones com background
 */
export const iconClasses = {
  // Container do ícone
  container: (color: keyof typeof theme.colors.iconBackground, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    }
    return `${theme.colors.iconBackground[color]} ${sizes[size]} rounded-lg flex items-center justify-center`
  },

  // Ícone dentro do container
  icon: (color: keyof typeof theme.colors.icon, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    }
    return `${theme.colors.icon[color]} ${sizes[size]}`
  },
}

/**
 * Classes para textos
 */
export const textClasses = {
  // Títulos
  h1: () =>
    'text-4xl font-bold bg-gradient-to-r from-gold to-yellow-600 bg-clip-text text-transparent',
  h2: () =>
    'text-3xl font-bold text-white',
  h3: () =>
    'text-2xl font-bold text-white',
  h4: () =>
    'text-xl font-semibold text-white',

  // Parágrafos
  primary: () => theme.colors.text.primary,
  secondary: () => theme.colors.text.secondary,
  tertiary: () => theme.colors.text.tertiary,
  muted: () => theme.colors.text.muted,

  // Labels
  label: () => 'text-sm font-medium text-gray-400',

  // Descrições
  description: () => 'text-sm text-gray-500',
}

/**
 * Classes para containers de página
 */
export const pageClasses = {
  // Container principal da página
  container: () =>
    theme.colors.background.page,

  // Container de conteúdo
  content: () =>
    'p-4 md:p-8',

  // Grid de cards (estatísticas)
  statsGrid: () =>
    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8',

  // Grid de 3 colunas
  grid3: () =>
    'grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8',

  // Grid de 2 colunas
  grid2: () =>
    'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8',
}

/**
 * Classes para tabelas
 */
export const tableClasses = {
  header: () => theme.components.table.header,
  headerCell: () => theme.components.table.headerCell,
  body: () => theme.components.table.body,
  row: () => theme.components.table.row,
  cell: () => theme.components.table.cell,
}

/**
 * Classes para formulários
 */
export const formClasses = {
  input: () => theme.components.input.base,
  label: () => theme.components.input.label,
  textarea: () => `${theme.components.input.base} min-h-[120px]`,
}
