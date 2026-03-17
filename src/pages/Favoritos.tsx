import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Heart, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getFavorites, removeFavorite, type Favorite } from '@/services/favoritesService'

const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '1.125rem',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

function BusinessImagePlaceholder({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      style={{
        width: '100%',
        paddingTop: '60%',
        position: 'relative',
        background: 'linear-gradient(135deg, #B8941E 0%, #D4AF37 50%, #8a6d14 100%)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 700,
          fontFamily: "'Playfair Display', serif",
          color: '#050400',
          letterSpacing: '0.05em',
        }}
      >
        {initials}
      </span>
    </div>
  )
}

export default function Favoritos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getFavorites(user.id)
      .then(setFavorites)
      .finally(() => setLoading(false))
  }, [user])

  async function handleRemove(businessId: string) {
    if (!user || removing) return
    setRemoving(businessId)
    try {
      await removeFavorite(user.id, businessId)
      setFavorites(prev => prev.filter(f => f.businessId !== businessId))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050400',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          opacity: 0.5,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '0 1.25rem 4rem' }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem 0 2rem',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '0.625rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: '1.75rem',
              fontWeight: 400,
              fontFamily: "'Playfair Display', serif",
              color: '#fff',
              letterSpacing: '-0.01em',
            }}
          >
            Meus{' '}
            <span style={{ color: '#D4AF37' }}>Favoritos</span>
          </h1>
        </motion.header>

        {/* Loading */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '40vh',
                gap: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={24} />
              </motion.div>
              <span style={{ fontSize: '0.9375rem' }}>Carregando favoritos…</span>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && favorites.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                gap: '1.25rem',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={32} color="#D4AF37" />
              </div>
              <div>
                <p
                  style={{
                    margin: '0 0 0.25rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    fontFamily: "'Playfair Display', serif",
                    color: '#fff',
                  }}
                >
                  Nenhum favorito ainda
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
                  Explore estabelecimentos e salve os que você mais gosta
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.625rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #B8941E, #D4AF37)',
                  color: '#050400',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                Explorar estabelecimentos
              </button>
            </motion.div>
          )}

          {/* Grid */}
          {!loading && favorites.length > 0 && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {favorites.map((fav, i) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...spring, delay: i * 0.05 }}
                  style={cardBase}
                >
                  {/* Image */}
                  {fav.businessImage ? (
                    <div style={{ width: '100%', paddingTop: '60%', position: 'relative', flexShrink: 0 }}>
                      <img
                        src={fav.businessImage}
                        alt={fav.businessName}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  ) : (
                    <BusinessImagePlaceholder name={fav.businessName} />
                  )}

                  {/* Content */}
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', flex: 1 }}>
                    <div>
                      <p
                        style={{
                          margin: '0 0 0.25rem',
                          fontSize: '1rem',
                          fontWeight: 600,
                          fontFamily: "'Playfair Display', serif",
                          color: '#fff',
                          lineHeight: 1.3,
                        }}
                      >
                        {fav.businessName}
                      </p>
                      {fav.businessCategory && (
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>
                          {fav.businessCategory}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.625rem', marginTop: 'auto' }}>
                      <button
                        onClick={() => navigate('/empresas/' + fav.businessId)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          padding: '0.625rem',
                          borderRadius: '0.625rem',
                          border: '1px solid rgba(212,175,55,0.35)',
                          background: 'rgba(212,175,55,0.06)',
                          color: '#D4AF37',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          letterSpacing: '0.02em',
                        }}
                      >
                        <ExternalLink size={14} />
                        Ver
                      </button>
                      <button
                        onClick={() => handleRemove(fav.businessId)}
                        disabled={removing === fav.businessId}
                        style={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.625rem',
                          border: '1px solid rgba(248,113,113,0.25)',
                          background: 'rgba(248,113,113,0.06)',
                          color: '#f87171',
                          cursor: removing === fav.businessId ? 'wait' : 'pointer',
                          flexShrink: 0,
                          transition: 'opacity 0.2s',
                          opacity: removing === fav.businessId ? 0.5 : 1,
                        }}
                        title="Remover dos favoritos"
                      >
                        <Heart size={16} fill="#f87171" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
