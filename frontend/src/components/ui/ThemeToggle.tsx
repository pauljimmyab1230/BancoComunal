import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const tema = useThemeStore((s) => s.tema)
  const alternarTema = useThemeStore((s) => s.alternarTema)

  const esOscuro = tema === 'dark'

  return (
    <button
      type="button"
      onClick={alternarTema}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-all hover:bg-surface-hover hover:text-foreground ${className}`}
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {esOscuro ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  )
}
