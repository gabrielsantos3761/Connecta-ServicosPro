import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import { Menu } from 'lucide-react'

type LayoutContext = {
  setIsMobileMenuOpen: (value: boolean) => void
}

interface OwnerPageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function OwnerPageLayout({ title, subtitle, children }: OwnerPageLayoutProps) {
  const { setIsMobileMenuOpen } = useOutletContext<LayoutContext>()

  return (
    <div className="min-h-screen text-white">
      {/* Menu button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-30 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #D4AF37, #B8941E)',
          boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
        }}
      >
        <Menu className="w-5 h-5 text-black" />
      </motion.button>

      <div className="px-6 md:px-10 pt-16 pb-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1
            className="text-3xl md:text-4xl font-bold text-white leading-none mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {(() => {
              const words = title.split(' ')
              if (words.length === 1) return title
              return (
                <>
                  {words.slice(0, -1).join(' ')}{' '}
                  <span style={{ color: '#D4AF37' }}>{words[words.length - 1]}</span>
                </>
              )
            })()}
          </h1>
          {subtitle && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {subtitle}
            </p>
          )}
          <div
            className="mt-5"
            style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }}
          />
        </motion.div>

        {children}
      </div>
    </div>
  )
}
