import { useEffect, useState } from 'react'
import { BookOpen, CheckCircle2, Pencil, Plus, Receipt, Trash2, Wallet, X } from 'lucide-react'
import {
  Button,
  ChipsEstado,
  ConfirmDialog,
  DataTable,
  ErrorState,
  ExportMenu,
  ResumenCard,
  SearchInput,
  Select,
} from '@/components/ui'
import toast from 'react-hot-toast'
import { exportCsv, exportXlsx } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import { configuracionApi } from '../api/configuracionApi'
import {
  useConceptos,
  useCreateConcepto,
  useDeleteConcepto,
  useUpdateConcepto,
} from '../hooks/useConfiguracion'
import { useFiltrosUrl } from '../hooks/useFiltrosUrl'
import { recolectarPaginas } from '../utils/exportar'
import type { ConceptoCajaItem, ResumenConfiguracion } from '../types'
import type { CreateConceptoInput, UpdateConceptoInput } from '../api/configuracionApi'
import ConceptoFormModal from './ConceptoFormModal'
import { OPCIONES_TIPO_FILTRO, etiquetaAfectaSaldo, etiquetaEstado, etiquetaTipo } from './comunes'
import { AfectaSaldoTexto, EstadoBadge, TipoConceptoBadge } from './insignias'

interface ConceptosTabProps {
  resumen?: ResumenConfiguracion
  cargandoResumen: boolean
  errorResumen?: unknown
  recargarResumen: () => void
}

export default function ConceptosTab({
  resumen,
  cargandoResumen,
  errorResumen,
  recargarResumen,
}: ConceptosTabProps) {
  const { page, search, tipo, estado, actualizar, limpiar } = useFiltrosUrl('c')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCajaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConceptoCajaItem | null>(null)

  const { data, isLoading, isError, error, refetch } = useConceptos({
    page,
    limit: 15,
    search: search || undefined,
    tipo: tipo || undefined,
    estado: estado || undefined,
  })
  const createMutation = useCreateConcepto()
  const updateMutation = useUpdateConcepto()
  const deleteMutation = useDeleteConcepto()

  const hayFiltros = Boolean(search || tipo || estado)

  useEffect(() => {
    if (data && data.totalPages > 0 && page > data.totalPages) {
      actualizar({ page: data.totalPages })
    }
  }, [data, page, actualizar])

  const abrirCrear = () => {
    setEditingConcepto(null)
    setModalOpen(true)
  }

  const abrirEditar = (concepto: ConceptoCajaItem) => {
    setEditingConcepto(concepto)
    setModalOpen(true)
  }

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const conceptos = await recolectarPaginas((pagina, limite) =>
        configuracionApi.listConceptos({
          page: pagina,
          limit: limite,
          search: search || undefined,
          tipo: tipo || undefined,
          estado: estado || undefined,
        })
      )

      const headers = [
        'Código',
        'Nombre',
        'Tipo',
        'Afecta saldo',
        'Requiere comprobante',
        'Movimientos',
        'Orden',
        'Estado',
        'Descripción',
      ]
      const filas = conceptos.map((concepto) => [
        concepto.codigo,
        concepto.nombre,
        etiquetaTipo(concepto.tipo),
        etiquetaAfectaSaldo(concepto.afectaSaldo),
        concepto.requiereComprobante ? 'Sí' : 'No',
        concepto.movimientos ?? 0,
        concepto.orden,
        etiquetaEstado(concepto.estado),
        concepto.descripcion || '',
      ])

      if (formato === 'csv') exportCsv('conceptos-caja.csv', headers, filas)
      else exportXlsx('conceptos-caja.xlsx', headers, filas)
      toast.success(`Se exportaron ${conceptos.length} conceptos`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al exportar los conceptos'))
    }
  }

  const columnas = [
    {
      key: 'concepto',
      label: 'Concepto',
      render: (concepto: ConceptoCajaItem) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted">
              {concepto.codigo}
            </span>
            <p className="font-medium text-foreground">{concepto.nombre}</p>
          </div>
          {concepto.descripcion && (
            <p className="mt-0.5 max-w-[320px] truncate text-xs text-subtle">
              {concepto.descripcion}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (concepto: ConceptoCajaItem) => <TipoConceptoBadge tipo={concepto.tipo} />,
    },
    {
      key: 'afectaSaldo',
      label: 'Afecta saldo',
      render: (concepto: ConceptoCajaItem) => (
        <AfectaSaldoTexto afectaSaldo={concepto.afectaSaldo} />
      ),
    },
    {
      key: 'movimientos',
      label: 'Movimientos',
      render: (concepto: ConceptoCajaItem) => (
        <span
          className={
            (concepto.movimientos ?? 0) > 0 ? 'font-medium text-foreground' : 'text-sm text-subtle'
          }
        >
          {concepto.movimientos ?? 0}
        </span>
      ),
    },
    {
      key: 'requiereComprobante',
      label: 'Comprobante',
      render: (concepto: ConceptoCajaItem) =>
        concepto.requiereComprobante ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Receipt className="h-4 w-4 text-subtle" aria-hidden="true" />
            Requerido
          </span>
        ) : (
          <span className="text-sm text-subtle">Opcional</span>
        ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (concepto: ConceptoCajaItem) => <EstadoBadge estado={concepto.estado} />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      className: 'text-right',
      render: (concepto: ConceptoCajaItem) => {
        const conMovimientos = (concepto.movimientos ?? 0) > 0
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => abrirEditar(concepto)}
              aria-label={`Editar concepto ${concepto.nombre}`}
              title="Editar"
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(concepto)}
              disabled={conMovimientos}
              aria-label={
                conMovimientos
                  ? `No se puede eliminar ${concepto.nombre}: tiene movimientos`
                  : `Eliminar concepto ${concepto.nombre}`
              }
              title={
                conMovimientos ? 'No se puede eliminar: tiene movimientos registrados' : 'Eliminar'
              }
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const desde = ((data?.page ?? 1) - 1) * (data?.limit ?? 15) + 1
  const hasta = Math.min((data?.page ?? 1) * (data?.limit ?? 15), data?.total ?? 0)

  return (
    <div>
      {errorResumen ? (
        <div className="mb-4">
          <ErrorState
            error={errorResumen}
            onRetry={recargarResumen}
            title="No se pudieron cargar los conteos"
          />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          icono={BookOpen}
          etiqueta="Conceptos registrados"
          valor={resumen?.conceptos.total}
          detalle="Catálogo de caja"
          tono="indigo"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={CheckCircle2}
          etiqueta="Conceptos activos"
          valor={resumen?.conceptos.activos}
          detalle={`de ${resumen?.conceptos.total ?? 0} en total`}
          tono="green"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={Receipt}
          etiqueta="Requieren comprobante"
          valor={resumen?.conceptos.requierenComprobante}
          detalle="Sobre conceptos activos"
          tono="amber"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={Wallet}
          etiqueta="Afectan saldo"
          valor={resumen?.conceptos.afectanSaldo}
          detalle="Sobre conceptos activos"
          tono="purple"
          cargando={cargandoResumen}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(valor) => actualizar({ search: valor })}
          />
        </div>

        <ChipsEstado valor={estado} onChange={(valor) => actualizar({ estado: valor })} />

        <Select
          value={tipo}
          onChange={(evento) => actualizar({ tipo: evento.target.value })}
          options={OPCIONES_TIPO_FILTRO}
          placeholder="Todos los tipos"
          className="w-48"
        />

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar} iconLeft={<X className="h-4 w-4" />}>
            Limpiar
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ExportMenu onExportar={exportar} />
          <Button onClick={abrirCrear} iconLeft={<Plus className="h-4 w-4" />}>
            Nuevo concepto
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <DataTable
            columns={columnas}
            data={data?.data || []}
            loading={isLoading}
            keyField="id"
            emptyTitle="Sin conceptos"
            emptyDescription="No se encontraron conceptos con los filtros aplicados."
            currentPage={data && data.totalPages > 1 ? data.page : undefined}
            totalPages={data && data.totalPages > 1 ? data.totalPages : undefined}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total}{' '}
              {data.total === 1 ? 'concepto' : 'conceptos'}
            </p>
          )}
        </>
      )}

      <ConceptoFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingConcepto(null)
        }}
        editingConcepto={editingConcepto}
        onSave={async (datos) => {
          if (editingConcepto) {
            await updateMutation.mutateAsync({
              id: editingConcepto.id,
              data: datos as UpdateConceptoInput,
            })
          } else {
            await createMutation.mutateAsync(datos as CreateConceptoInput)
          }
          setModalOpen(false)
          setEditingConcepto(null)
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id)
          }
          setDeleteTarget(null)
        }}
        title="Eliminar concepto"
        message={`¿Está seguro de eliminar el concepto "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
