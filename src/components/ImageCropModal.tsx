import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, RotateCw, Image as ImageIcon } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  imageSrc: string
  onClose: () => void
  onSave: (croppedImage: string) => void
  aspectRatio?: number
  title?: string
}

const SPRING = { type: 'spring', stiffness: 320, damping: 36 }

const iconBtnStyle: React.CSSProperties = {
  width: '2rem',
  height: '2rem',
  borderRadius: '0.5rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.15s',
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  aspectRatio = 1,
  title = 'Ajustar Imagem'
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.5)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    canvas.width = safeArea
    canvas.height = safeArea

    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-safeArea / 2, -safeArea / 2)

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    return canvas.toDataURL('image/jpeg', 0.9)
  }

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      onSave(croppedImage)
      onClose()
    } catch (e) {
      console.error(e)
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

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
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            onClick={onClose}
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
              maxWidth: '56rem',
              margin: '0 1rem',
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
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(212,175,55,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon style={{ width: '1.25rem', height: '1.25rem', color: '#D4AF37' }} />
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
                    {title}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    Ajuste o enquadramento e zoom da imagem
                  </p>
                </div>
              </div>
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
            </div>

            {/* Crop Area */}
            <div style={{ position: 'relative', height: '500px', background: '#000' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                objectFit="horizontal-cover"
                showGrid={true}
                restrictPosition={false}
                style={{
                  containerStyle: {
                    backgroundColor: '#000',
                  },
                  cropAreaStyle: {
                    border: '2px solid #D4AF37',
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Zoom Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ZoomIn style={{ width: '1rem', height: '1rem', color: '#D4AF37' }} />
                    Zoom
                  </label>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={handleZoomOut}
                    style={iconBtnStyle}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.1)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.05)')
                    }
                  >
                    <ZoomOut style={{ width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#D4AF37',
                      cursor: 'pointer',
                      height: '4px',
                    }}
                  />
                  <button
                    onClick={handleZoomIn}
                    style={iconBtnStyle}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.1)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.05)')
                    }
                  >
                    <ZoomIn style={{ width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              </div>

              {/* Rotation Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <RotateCw style={{ width: '1rem', height: '1rem', color: '#D4AF37' }} />
                    Rotação
                  </label>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                    {rotation}°
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={handleRotate}
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '0.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '0.875rem',
                      color: '#fff',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.1)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.05)')
                    }
                  >
                    <RotateCw style={{ width: '0.875rem', height: '0.875rem', color: '#D4AF37' }} />
                    Girar 90°
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: '#D4AF37',
                      cursor: 'pointer',
                      height: '4px',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  onClick={onClose}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
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
                  <X style={{ width: '1rem', height: '1rem' }} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg,#D4AF37,#B8941E)',
                    color: '#050400',
                    fontWeight: 600,
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.opacity = '1')
                  }
                >
                  <Check style={{ width: '1rem', height: '1rem' }} />
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
