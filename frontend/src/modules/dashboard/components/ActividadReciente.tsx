import { Activity } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DashboardData } from '../types'
import { operacionColor, operacionIcon, operacionLabel, tablaLabel, getTimeAgo } from './comunes'
import VerTodosLink from './VerTodosLink'

export default function ActividadReciente({
  actividad,
}: {
  actividad: DashboardData['actividadReciente']
}) {
  if (!actividad.length) return null

  return (
    <Card padding="md">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted">
              <Activity className="h-5 w-5 text-muted" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Actividad Reciente</h3>
              <p className="text-xs text-muted">Últimas operaciones</p>
            </div>
          </div>
          <VerTodosLink to="/auditoria" label="Ver auditoría" />
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {actividad.slice(0, 5).map((a) => {
          const Icon = operacionIcon[a.operacion] || Activity
          const color = operacionColor[a.operacion] || 'bg-surface-muted text-muted'
          const label = operacionLabel[a.operacion] || a.operacion
          const modulo = tablaLabel[a.tabla] || a.tabla
          const timeAgo = getTimeAgo(a.createdAt)
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-surface-hover"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {label} {modulo}
                  </span>
                </p>
                <p className="text-xs text-subtle">{timeAgo}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
