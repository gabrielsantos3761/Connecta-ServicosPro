import { motion } from 'framer-motion'
import { Calendar, Clock, Scissors, LogOut, User, Star, History } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDate } from '@/lib/utils'

const GOLD = '#D4AF37'
const GOLD_DARK = '#B8941E'

const spring = { type: 'spring' as const, stiffness: 320, damping: 36 }

export function ClienteDashboard() {
  const { user, logout } = useAuth()

  const nextAppointment = {
    id: '1',
    service: 'Corte + Barba',
    professional: 'Carlos Silva',
    date: new Date(2024, 11, 20, 14, 30),
    duration: 60,
    price: 75,
    status: 'confirmed',
  }

  const appointmentHistory = [
    {
      id: '1',
      service: 'Corte Tradicional',
      professional: 'João Santos',
      date: new Date(2024, 10, 15),
      price: 50,
      rating: 5,
    },
    {
      id: '2',
      service: 'Corte + Barba',
      professional: 'Carlos Silva',
      date: new Date(2024, 10, 1),
      price: 75,
      rating: 5,
    },
    {
      id: '3',
      service: 'Barba',
      professional: 'Pedro Costa',
      date: new Date(2024, 9, 20),
      price: 35,
      rating: 4,
    },
  ]

  const favoriteServices = [
    { name: 'Corte + Barba', count: 5, price: 75 },
    { name: 'Corte Tradicional', count: 3, price: 50 },
    { name: 'Barba', count: 2, price: 35 },
  ]

  const stats = [
    { label: 'Próximos', value: '1', sublabel: 'agendamentos' },
    { label: 'Realizados', value: '24', sublabel: 'visitas' },
    { label: 'Investido', value: formatCurrency(1450), sublabel: 'no total' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#050400', fontFamily: 'system-ui, sans-serif' }}>
      {/* Grain texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.025,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Ambient glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(5,4,0,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem', height: '2.5rem',
                background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img
                  src="/Projeto-barbearia/assets/images/Logo.png"
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)' }}
                />
              </div>
              <div>
                <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                  Connecta
                </h1>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Área do Cliente</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right', display: 'none' }} className="sm:block">
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{user?.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.625rem',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <LogOut style={{ width: '0.875rem', height: '0.875rem' }} />
                Sair
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          style={{
            marginBottom: '2rem',
            padding: '2rem 2.5rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '1.125rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: '300px', height: '300px',
            background: `radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <p style={{ fontSize: '0.8rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
            Bem-vindo de volta
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 0.5rem',
            lineHeight: 1.2,
          }}>
            Olá, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.95rem' }}>
            Confira seus agendamentos e histórico abaixo.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 + i * 0.06 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: i === 2 ? '1.5rem' : '2.5rem',
                fontWeight: 700,
                color: GOLD,
                margin: '0 0 0.25rem',
                lineHeight: 1,
              }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.125rem' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{stat.sublabel}</p>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="lg:grid-cols-3-dashboard">
          <div style={{ display: 'grid', gap: '1.5rem', gridColumn: 'span 2' }}>
            {/* Next Appointment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.18 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: `3px solid ${GOLD}`,
                borderRadius: '1.125rem',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Calendar style={{ width: '1.125rem', height: '1.125rem', color: GOLD }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: '#fff', margin: 0 }}>
                  Próximo Agendamento
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>
                    {nextAppointment.service}
                  </h4>
                  <span style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                  }}>
                    Confirmado
                  </span>
                </div>

                <div style={{
                  background: `linear-gradient(135deg,rgba(212,175,55,0.15),rgba(184,148,30,0.08))`,
                  border: `1px solid rgba(212,175,55,0.2)`,
                  borderRadius: '0.75rem',
                  padding: '0.625rem 1rem',
                  textAlign: 'center',
                }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: GOLD, margin: 0, lineHeight: 1 }}>
                    {nextAppointment.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0 0' }}>
                    {formatDate(nextAppointment.date)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.25rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem',
                    background: `rgba(212,175,55,0.12)`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User style={{ width: '1rem', height: '1rem', color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.125rem' }}>Profissional</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>{nextAppointment.professional}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem',
                    background: `rgba(212,175,55,0.12)`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Clock style={{ width: '1rem', height: '1rem', color: GOLD }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.125rem' }}>Duração</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>{nextAppointment.duration} min</p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.125rem' }}>Valor</p>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.75rem', fontWeight: 700,
                    color: GOLD, margin: 0,
                  }}>
                    {formatCurrency(nextAppointment.price)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '0.5rem 1.125rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.625rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remarcar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '0.5rem 1.125rem',
                      background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`,
                      border: 'none',
                      borderRadius: '0.625rem',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ver Detalhes
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Appointment History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.24 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <History style={{ width: '1.125rem', height: '1.125rem', color: GOLD }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: '#fff', margin: 0 }}>
                  Histórico de Agendamentos
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointmentHistory.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: 0.28 + index * 0.06 }}
                    whileHover={{ x: 4 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '0.875rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onHoverStart={(e) => {
                      const el = e.target as HTMLElement
                      const card = el.closest('[data-history-card]') as HTMLElement
                      if (card) card.style.borderColor = `rgba(212,175,55,0.35)`
                    }}
                    onHoverEnd={(e) => {
                      const el = e.target as HTMLElement
                      const card = el.closest('[data-history-card]') as HTMLElement
                      if (card) card.style.borderColor = 'rgba(255,255,255,0.07)'
                    }}
                    data-history-card
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem',
                        background: 'rgba(212,175,55,0.1)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Scissors style={{ width: '1.125rem', height: '1.125rem', color: GOLD }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: '0 0 0.125rem' }}>
                          {appointment.service}
                        </h4>
                        <p style={{ fontSize: '0.775rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.25rem' }}>
                          {appointment.professional} · {formatDate(appointment.date)}
                        </p>
                        <div style={{ display: 'flex', gap: '0.125rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              style={{
                                width: '0.75rem', height: '0.75rem',
                                color: i < appointment.rating ? GOLD : 'rgba(255,255,255,0.15)',
                                fill: i < appointment.rating ? GOLD : 'none',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
                        {formatCurrency(appointment.price)}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '0.25rem 0.625rem',
                          background: 'transparent',
                          border: `1px solid rgba(212,175,55,0.3)`,
                          borderRadius: '0.375rem',
                          color: GOLD,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reagendar
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.3 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: '#fff', margin: '0 0 1rem' }}>
                Ações Rápidas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.75rem 1rem',
                    background: `linear-gradient(135deg,${GOLD},${GOLD_DARK})`,
                    border: 'none', borderRadius: '0.75rem',
                    color: '#000', fontSize: '0.875rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Calendar style={{ width: '1rem', height: '1rem' }} />
                  Agendar Agora
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                    color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <User style={{ width: '1rem', height: '1rem' }} />
                  Meu Perfil
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    width: '100%', padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem',
                    color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  <History style={{ width: '1rem', height: '1rem' }} />
                  Ver Histórico Completo
                </motion.button>
              </div>
            </motion.div>

            {/* Favorite Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.36 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Star style={{ width: '1.125rem', height: '1.125rem', color: GOLD, fill: GOLD }} />
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: '#fff', margin: 0 }}>
                  Serviços Favoritos
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {favoriteServices.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: 0.38 + index * 0.06 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 0.875rem',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', margin: '0 0 0.125rem' }}>
                        {service.name}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {service.count}x agendado
                      </p>
                    </div>
                    <p style={{ fontWeight: 700, color: GOLD, margin: 0, fontSize: '0.9rem' }}>
                      {formatCurrency(service.price)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Member since */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.42 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '1.125rem',
                padding: '1.5rem',
              }}
            >
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.125rem', color: '#fff', margin: '0 0 1rem' }}>
                Sua Jornada
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>
                    Total de Agendamentos
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0 }}>24</p>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>
                    Total Investido
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: GOLD, margin: 0 }}>
                    {formatCurrency(1450)}
                  </p>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>
                    Membro desde
                  </p>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Janeiro 2024</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap');
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3-dashboard {
            grid-template-columns: 1fr 1fr 1fr !important;
          }
          .lg\\:grid-cols-3-dashboard > *:first-child {
            grid-column: span 2 !important;
          }
        }
      `}</style>
    </div>
  )
}
