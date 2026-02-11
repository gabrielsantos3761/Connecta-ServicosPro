import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { Menu } from 'lucide-react'

type LayoutContext = {
  setIsMobileMenuOpen: (value: boolean) => void
}

interface ProfissionalPageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function ProfissionalPageLayout({ title, subtitle, children }: ProfissionalPageLayoutProps) {
  const { setIsMobileMenuOpen } = useOutletContext<LayoutContext>()

  return (
    <div className="min-h-screen text-white">
      {/* Menu Button - Fixed Position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 md:top-6 md:left-6 z-30 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl backdrop-blur-xl border-2 border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1a333a, #2a4f58)' }}
      >
        <Menu className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </motion.button>

      <div className="p-6 md:p-8">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#4db8c7' }}>{title}</h1>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
