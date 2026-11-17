import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/** Enlace "Ver todos" que aparece en la cabecera de cada sección del dashboard. */
export default function VerTodosLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-secondary transition-colors hover:text-secondary-strong hover:underline"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}
