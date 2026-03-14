import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { grainStyle } from '@/styles/theme'

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen relative" style={{ background: '#050400' }}>
      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] z-0" style={grainStyle} />

      {/* Ambient glows */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 10% 10%, rgba(212,175,55,0.06) 0%, transparent 60%)' }}
      />
      <div
        className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle at 90% 90%, rgba(212,175,55,0.03) 0%, transparent 60%)' }}
      />

      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="min-h-screen relative z-10">
        <Outlet context={{ setIsMobileMenuOpen }} />
      </main>
    </div>
  )
}
