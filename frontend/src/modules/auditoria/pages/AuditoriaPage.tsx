import { useState } from 'react'
import { Plus, Pencil, Trash2, Activity, Eye } from 'lucide-react'
import { useAuditLogs, useAuditModules, useAuditStats } from '../hooks/useAuditoria'
import { Button, Card, FormField, Input, Select, SectionHeader, Badge, Modal, Pagination, LoadingSpinner, EmptyState } from '@/components/ui'
import type { AuditLogEntry } from '../types'

const operacionLabels: Record<AuditLogEntry['operacion'], { label: string; variant: 'green' | 'blue' | 'red'; icon: typeof Plus }> = {
  CREATE: { label: 'Creación', variant: 'green', icon: Plus },
  UPDATE: { label: 'Actualización', variant: 'blue', icon: Pencil },
  DELETE: { label: 'Eliminación', variant: 'red', icon: Trash2 },
}

const tablaLabels: Record<string, string> = {
  Socio: 'Socios',
  FondoRotatorio: 'Fondos',
  FondoSocio: 'Membresías',
  Aporte: 'Aportes',
  Prestamo: 'Préstamos',
  CuotaPrestamo: 'Cuotas',
  Caja: 'Cajas',
  MovimientoCaja: 'Mov. Caja',
  ConceptoCaja: 'Conceptos',
  ArqueoCaja: 'Arqueos',
  Usuario: 'Usuarios',
}

function StatsCards() {
  const { data: stats, isLoading } = useAuditStats()

  if (isLoading) return null
  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Activity className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Total Registros</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50"><Plus className="h-5 w-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Creaciones</p>
            <p className="text-lg font-bold text-green-600">{stats.byOperacion.CREATE || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Pencil className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Actualizaciones</p>
            <p className="text-lg font-bold text-blue-600">{stats.byOperacion.UPDATE || 0}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Eliminaciones</p>
            <p className="text-lg font-bold text-red-600">{stats.byOperacion.DELETE || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DetailModal({ entry, open, onClose }: { entry: AuditLogEntry | null; open: boolean; onClose: () => void }) {
  if (!entry) return null

  const op = operacionLabels[entry.operacion]
  const mod = tablaLabels[entry.tabla] || entry.tabla

  const renderJson = (obj: Record<string, any> | undefined) => {
    if (!obj) return <span className="text-gray-400 italic">N/A</span>
    const entries = Object.entries(obj)
    if (entries.length === 0) return <span className="text-gray-400 italic">Sin datos</span>
    return (
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
            <span className="text-gray-500 font-mono text-xs">{key}</span>
            <span className="text-gray-900 text-right max-w-[60%] truncate" title={String(value)}>{String(value ?? '—')}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Detalle del Registro" maxWidth="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Badge variant={op.variant}>{op.label}</Badge>
          <span className="text-sm font-medium text-gray-700">{mod}</span>
          <span className="text-xs text-gray-400">#{entry.registroId}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Fecha</p>
            <p className="text-gray-900">{new Date(entry.createdAt).toLocaleString('es-PE')}</p>
          </div>
        </div>

        {entry.operacion === 'UPDATE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Valores Anteriores</p>
              <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
                {renderJson(entry.datosAnteriores)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Valores Nuevos</p>
              <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
                {renderJson(entry.datosNuevos)}
              </div>
            </div>
          </div>
        )}

        {entry.operacion === 'CREATE' && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Datos Creados</p>
            <div className="bg-green-50/50 rounded-lg p-3 border border-green-100">
              {renderJson(entry.datosNuevos)}
            </div>
          </div>
        )}

        {entry.operacion === 'DELETE' && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Datos Eliminados</p>
            <div className="bg-red-50/50 rounded-lg p-3 border border-red-100">
              {renderJson(entry.datosAnteriores)}
            </div>
          </div>
        )}

        {entry.ip && (
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            IP: {entry.ip}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1)
  const [tabla, setTabla] = useState('')
  const [operacion, setOperacion] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null)

  const { data: modules } = useAuditModules()
  const { data, isLoading } = useAuditLogs({
    page,
    limit: 15,
    tabla: tabla || undefined,
    operacion: operacion || undefined,
    fechaInicio: fechaInicio || undefined,
    fechaFin: fechaFin || undefined,
  })

  return (
    <div>
      <SectionHeader title="Auditoría" description="Registro de actividades y cambios en el sistema" />

      <StatsCards />

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Módulo">
            <Select
              options={[
                { value: '', label: 'Todos' },
                ...(modules || []).map((m) => ({ value: m, label: tablaLabels[m] || m })),
              ]}
              value={tabla}
              onChange={(e) => { setTabla(e.target.value); setPage(1) }}
            />
          </FormField>
          <FormField label="Operación">
            <Select
              options={[
                { value: '', label: 'Todas' },
                { value: 'CREATE', label: 'Creación' },
                { value: 'UPDATE', label: 'Actualización' },
                { value: 'DELETE', label: 'Eliminación' },
              ]}
              value={operacion}
              onChange={(e) => { setOperacion(e.target.value); setPage(1) }}
            />
          </FormField>
          <FormField label="Desde">
            <Input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setPage(1) }} />
          </FormField>
          <FormField label="Hasta">
            <Input type="date" value={fechaFin} onChange={(e) => { setFechaFin(e.target.value); setPage(1) }} />
          </FormField>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner text="Cargando registros de auditoría..." /></div>
      ) : !data?.data?.length ? (
        <EmptyState title="Sin registros" description="No se encontraron registros de auditoría con los filtros aplicados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Fecha</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Operación</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Módulo</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Registro #</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((entry) => {
                  const op = operacionLabels[entry.operacion]
                  const mod = tablaLabels[entry.tabla] || entry.tabla
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('es-PE')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={op.variant}>{op.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{mod}</td>
                      <td className="px-5 py-3 text-center font-mono text-xs text-gray-500">#{entry.registroId}</td>
                      <td className="px-5 py-3 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setDetailEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3">
              <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      <DetailModal entry={detailEntry} open={!!detailEntry} onClose={() => setDetailEntry(null)} />
    </div>
  )
}
