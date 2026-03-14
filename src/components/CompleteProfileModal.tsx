import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRequireCompleteProfile } from '../hooks/useRequireCompleteProfile';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Se true, não permite fechar o modal (obriga completar perfil)
   * Se false, permite fechar e completar depois
   */
  requireImmediate?: boolean;
}

const SPRING = { type: 'spring', stiffness: 320, damping: 36 };

export function CompleteProfileModal({
  isOpen,
  onClose,
  requireImmediate = false,
}: CompleteProfileModalProps) {
  const navigate = useNavigate();
  const { completeness, missingFieldsLabels, totalRequired, totalFilled } =
    useRequireCompleteProfile();

  const handleCompleteNow = () => {
    onClose();
    navigate('/profile/complete');
  };

  const handleCompleteLater = () => {
    if (!requireImmediate) {
      onClose();
    }
  };

  // Bloqueia o scroll quando o modal está aberto
  useEffect(() => {
    if (isOpen) {
      // Salva a posição atual do scroll
      const scrollY = window.scrollY;

      // Adiciona estilos para bloquear o scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Remove os estilos quando o modal fecha
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        // Restaura a posição do scroll
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            onClick={requireImmediate ? undefined : onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={SPRING}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '28rem',
              background: '#0a0900',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '1.125rem',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(212,175,55,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#D4AF37' }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#fff',
                      margin: 0,
                    }}
                  >
                    Complete seu perfil
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    {completeness}% completo
                  </p>
                </div>
              </div>
              {!requireImmediate && (
                <button
                  onClick={onClose}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.05)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                  }
                >
                  <X style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255,255,255,0.5)' }} />
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: '9999px',
                    height: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                  {totalFilled} de {totalRequired} campos preenchidos
                </p>
              </div>

              {/* Message */}
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                {requireImmediate
                  ? 'Para continuar, precisamos que você complete algumas informações do seu perfil.'
                  : 'Para aproveitar melhor nossa plataforma, complete seu perfil com as informações abaixo:'}
              </p>

              {/* Missing Fields */}
              <div
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                }}
              >
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#D4AF37',
                    marginBottom: '0.75rem',
                    marginTop: 0,
                  }}
                >
                  Campos necessários:
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {missingFieldsLabels.map((label, index) => (
                    <li
                      key={index}
                      style={{
                        fontSize: '0.875rem',
                        color: 'rgba(212,175,55,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span
                        style={{
                          width: '0.375rem',
                          height: '0.375rem',
                          borderRadius: '50%',
                          background: '#D4AF37',
                          flexShrink: 0,
                        }}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              {!requireImmediate && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                      marginBottom: '0.75rem',
                      marginTop: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle style={{ width: '1.125rem', height: '1.125rem', color: '#D4AF37' }} />
                    Benefícios de completar seu perfil:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      'Agendar serviços nas melhores barbearias',
                      'Receber ofertas e promoções exclusivas',
                      'Histórico completo de agendamentos',
                    ].map((benefit) => (
                      <li
                        key={benefit}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        <span style={{ color: '#D4AF37', marginTop: '0.0625rem', flexShrink: 0 }}>✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                padding: '0 1.5rem 1.5rem',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              <button
                onClick={handleCompleteNow}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
                  color: '#050400',
                  fontWeight: 600,
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9375rem',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                <UserCircle style={{ width: '1.25rem', height: '1.25rem' }} />
                Completar agora
              </button>
              {!requireImmediate && (
                <button
                  onClick={handleCompleteLater}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.5rem',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.05)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')
                  }
                >
                  Fazer depois
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
