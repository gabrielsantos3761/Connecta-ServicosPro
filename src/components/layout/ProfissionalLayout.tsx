import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ProfissionalSidebar } from './ProfissionalSidebar'

export function ProfissionalLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: '#050400', position: 'relative' }}>
      {/* Grain */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.025,
        }}
      />
      {/* Ambient glow teal */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(77,184,199,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <ProfissionalSidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
      />

      <main style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <Outlet context={{ setIsMobileMenuOpen, isDirty, setIsDirty }} />
      </main>
    </div>
  )
}
