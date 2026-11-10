import { useEffect, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

const SELECTOR_FOCO =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const disparadorRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const tituloId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    disparadorRef.current = document.activeElement as HTMLElement | null

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const focables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_FOCO)
      ).filter((el) => el.getClientRects().length > 0)

      const primero = focables[0]
      const ultimo = focables[focables.length - 1]
      if (!primero || !ultimo) {
        e.preventDefault()
        panelRef.current.focus()
        return
      }

      const activo = document.activeElement
      const dentroDelPanel = panelRef.current.contains(activo)

      if (e.shiftKey) {
        if (!dentroDelPanel || activo === primero) {
          e.preventDefault()
          ultimo.focus()
        }
      } else if (!dentroDelPanel || activo === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTecla)
    document.body.style.overflow = 'hidden'

    const focoInicial =
      panelRef.current?.querySelector<HTMLElement>(SELECTOR_FOCO) ?? panelRef.current
    focoInicial?.focus()

    return () => {
      document.removeEventListener('keydown', manejarTecla)
      document.body.style.overflow = ''
      if (disparadorRef.current && document.contains(disparadorRef.current)) {
        disparadorRef.current.focus()
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? tituloId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative flex max-h-[85vh] w-full ${widthMap[maxWidth]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none`}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 id={tituloId} className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
