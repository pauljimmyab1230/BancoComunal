interface OpcionChip {
  value: string
  label: string
}

const OPCIONES_ESTADO: OpcionChip[] = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
]

interface ChipsEstadoProps {
  valor: string
  onChange: (valor: string) => void
  opciones?: OpcionChip[]
  etiqueta?: string
}

/** Grupo de chips para filtrar por estado. */
export default function ChipsEstado({
  valor,
  onChange,
  opciones = OPCIONES_ESTADO,
  etiqueta = 'Filtrar por estado',
}: ChipsEstadoProps) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1"
    >
      {opciones.map((opcion) => {
        const activa = valor === opcion.value
        return (
          <button
            key={opcion.value}
            type="button"
            onClick={() => onChange(opcion.value)}
            aria-pressed={activa}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activa
                ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                : 'text-muted hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}
