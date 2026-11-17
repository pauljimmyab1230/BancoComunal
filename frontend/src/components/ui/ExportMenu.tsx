import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'
import Button from './Button'

interface ExportMenuProps {
  onExportar: (formato: 'csv' | 'xlsx') => void
  etiqueta?: string
}

/** Menú desplegable de exportación con cierre por Escape y clic exterior. */
export default function ExportMenu({ onExportar, etiqueta = 'Exportar' }: ExportMenuProps) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const primerItemRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const enfocarBoton = () => {
    contenedorRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  useEffect(() => {
    if (!abierto) return

    const cerrarConClic = (evento: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }
    const cerrarConTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAbierto(false)
        enfocarBoton()
      }
    }

    document.addEventListener('mousedown', cerrarConClic)
    document.addEventListener('keydown', cerrarConTecla)
    primerItemRef.current?.focus()

    return () => {
      document.removeEventListener('mousedown', cerrarConClic)
      document.removeEventListener('keydown', cerrarConTecla)
    }
  }, [abierto])

  const seleccionar = (formato: 'csv' | 'xlsx') => {
    setAbierto(false)
    enfocarBoton()
    onExportar(formato)
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <Button
        variant="secondary"
        onClick={() => setAbierto((previo) => !previo)}
        iconLeft={<Download className="h-4 w-4" />}
        iconRight={<ChevronDown className="h-4 w-4" />}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? menuId : undefined}
      >
        {etiqueta}
      </Button>
      {abierto && (
        <div
          id={menuId}
          role="menu"
          aria-label="Formatos de exportación"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[var(--shadow-pop)]"
        >
          <button
            ref={primerItemRef}
            type="button"
            role="menuitem"
            onClick={() => seleccionar('csv')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
          >
            <FileText className="h-4 w-4 text-subtle" aria-hidden="true" />
            CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => seleccionar('xlsx')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
          >
            <FileSpreadsheet className="h-4 w-4 text-subtle" aria-hidden="true" />
            Excel
          </button>
        </div>
      )}
    </div>
  )
}
