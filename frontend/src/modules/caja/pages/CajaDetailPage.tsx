import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Plus,
  Pencil,
  ArrowRightLeft,
  ClipboardCheck,
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  Download,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  ListChecks,
  Clock,
  ShieldCheck,
  Lock,
  BookOpen,
  RotateCcw,
  Search,
  CalendarDays,
  Scale,
  X,
} from 'lucide-react'
import {
  useCaja,
  useCajaResumen,
  useCajas,
  useConceptos,
  useMovimientos,
  useArqueos,
  useFlujoProyectado,
  useLibroCaja,
  useCreateMovimiento,
  useCreateArqueo,
  useAprobarArqueo,
  useTransferir,
  useAnularMovimiento,
} from '../hooks/useCajas'
import {
  movimientoCreateSchema,
  arqueoCreateSchema,
  transferirSchema,
  type MovimientoCreateInput,
  type ArqueoCreateInput,
  type TransferirInput,
} from '../validations'
import {
  Button,
  Card,
  DataTable,
  FormField,
  Input,
  SearchInput,
  Select,
  SectionHeader,
  Badge,
  Modal,
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
  ErrorState,
} from '@/components/ui'
import { cajaApi } from '../api/cajaApi'
import { formatCurrency, exportCsv, exportXlsx, formatShortDate } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import toast from 'react-hot-toast'
import type { MovimientoCaja, ArqueoCaja, ConceptoCaja, Caja, FilaLibroCaja } from '../types'

type Pestana = 'movimientos' | 'arqueos' | 'libro' | 'flujo'

const filtroTipoOptions = [
  { value: 'TODOS', label: 'Todos los tipos' },
  { value: 'INGRESO', label: 'Ingresos' },
  { value: 'EGRESO', label: 'Egresos' },
  { value: 'TRANSFERENCIA', label: 'Traspasos' },
]

const filtroEstadoOptions = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'REGISTRADO', label: 'Registrados' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'ANULADO', label: 'Anulados' },
]

const tipoMovimientoOptions = [
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'TRANSFERENCIA', label: 'Traspaso' },
]

const metodoPagoOptions = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'OTRO', label: 'Otro' },
]

const tipoCajaEtiqueta: Record<string, string> = {
  PRINCIPAL: 'Caja principal',
  SECUNDARIA: 'Caja secundaria',
  CAJA_CHICA: 'Caja chica',
}

const tipoMovimientoBadge = (tipo: string) => {
  switch (tipo) {
    case 'INGRESO':
      return <Badge variant="green">Ingreso</Badge>
    case 'EGRESO':
      return <Badge variant="red">Egreso</Badge>
    case 'TRANSFERENCIA':
      return <Badge variant="blue">Traspaso</Badge>
    case 'AJUSTE':
      return <Badge variant="purple">Ajuste</Badge>
    default:
      return <Badge>{tipo}</Badge>
  }
}

export default function CajaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cajaId = Number(id)

  const { data: caja, isLoading: loadingCaja } = useCaja(cajaId)
  const { data: resumen } = useCajaResumen(cajaId)
  const { data: cajas } = useCajas({ limit: 100 })
  const { data: conceptos } = useConceptos()

  // Filtros y paginación de movimientos en el servidor.
  const [movPagina, setMovPagina] = useState(1)
  const [movBusqueda, setMovBusqueda] = useState('')
  const [movTipo, setMovTipo] = useState('TODOS')
  const [movEstado, setMovEstado] = useState('TODOS')
  const [movDesde, setMovDesde] = useState('')
  const [movHasta, setMovHasta] = useState('')

  // Rango del libro de caja.
  const [libroDesde, setLibroDesde] = useState('')
  const [libroHasta, setLibroHasta] = useState('')

  const {
    data: movimientos,
    isLoading: loadingMovimientos,
    isError: errorMovimientos,
    error: errorMovimientosDetalle,
    refetch: refetchMovimientos,
  } = useMovimientos({
    cajaId,
    page: movPagina,
    limit: 15,
    search: movBusqueda || undefined,
    tipo: movTipo === 'TODOS' ? undefined : movTipo,
    estado: movEstado === 'TODOS' ? undefined : movEstado,
    fechaInicio: movDesde || undefined,
    fechaFin: movHasta || undefined,
  })
  const { data: arqueos, isLoading: loadingArqueos } = useArqueos({ cajaId, limit: 50 })
  const { data: flujo } = useFlujoProyectado({ cajaId })

  const [pestana, setPestana] = useState<Pestana>('movimientos')
  const {
    data: libro,
    isLoading: loadingLibro,
    isError: errorLibro,
    error: errorLibroDetalle,
    refetch: refetchLibro,
  } = useLibroCaja(
    cajaId,
    { fechaInicio: libroDesde || undefined, fechaFin: libroHasta || undefined },
    pestana === 'libro'
  )

  const createMovimiento = useCreateMovimiento()
  const createArqueo = useCreateArqueo()
  const aprobarArqueo = useAprobarArqueo()
  const transferir = useTransferir()
  const anularMovimiento = useAnularMovimiento()

  const [showMovimientoModal, setShowMovimientoModal] = useState(false)
  const [showArqueoModal, setShowArqueoModal] = useState(false)
  const [showAprobarModal, setShowAprobarModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedArqueoId, setSelectedArqueoId] = useState<number | null>(null)
  const [anularId, setAnularId] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const movimientoForm = useForm<
    z.input<typeof movimientoCreateSchema>,
    unknown,
    z.output<typeof movimientoCreateSchema>
  >({
    resolver: zodResolver(movimientoCreateSchema),
    defaultValues: {
      cajaId,
      conceptoId: 0,
      tipo: 'INGRESO',
      monto: 0,
      descripcion: '',
      comprobante: '',
      metodoPago: 'EFECTIVO',
      referencia: '',
    },
  })

  const transferForm = useForm<
    z.input<typeof transferirSchema>,
    unknown,
    z.output<typeof transferirSchema>
  >({
    resolver: zodResolver(transferirSchema),
    defaultValues: {
      cajaOrigenId: cajaId,
      cajaDestinoId: 0,
      monto: 0,
      descripcion: '',
    },
  })

  const arqueoForm = useForm<
    z.input<typeof arqueoCreateSchema>,
    unknown,
    z.output<typeof arqueoCreateSchema>
  >({
    resolver: zodResolver(arqueoCreateSchema),
    defaultValues: {
      cajaId,
      saldoFisico: 0,
      observacion: '',
    },
  })

  const aprobarForm = useForm<{ observacion?: string }>({
    defaultValues: { observacion: '' },
  })

  const tipoSeleccionado = useWatch({ control: movimientoForm.control, name: 'tipo' })
  const conceptoSeleccionadoId = useWatch({ control: movimientoForm.control, name: 'conceptoId' })
  const metodoPagoSeleccionado = useWatch({ control: movimientoForm.control, name: 'metodoPago' })
  const montoMovimiento = useWatch({ control: movimientoForm.control, name: 'monto' })
  const saldoFisicoContado = useWatch({ control: arqueoForm.control, name: 'saldoFisico' })
  const montoTraspaso = useWatch({ control: transferForm.control, name: 'monto' })
  const cajaDestinoId = useWatch({ control: transferForm.control, name: 'cajaDestinoId' })

  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  if (loadingCaja) {
    return <LoadingSpinner text="Cargando caja..." />
  }

  if (!caja) {
    return (
      <EmptyState
        title="Caja no encontrada"
        description="La caja que buscas no existe o fue eliminada."
        actionLabel="Volver al listado"
        actionTo="/caja"
      />
    )
  }

  const cajaActiva = caja.estado === 'ACTIVA'

  const estadoArqueoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge variant="yellow">Pendiente</Badge>
      case 'APROBADO':
        return <Badge variant="green">Aprobado</Badge>
      case 'RECHAZADO':
        return <Badge variant="red">Rechazado</Badge>
      case 'CERRADO':
        return <Badge variant="gray">Cerrado</Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const estadoMovimientoBadge = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADO':
        return <Badge variant="green">Confirmado</Badge>
      case 'ANULADO':
        return <Badge variant="red">Anulado</Badge>
      case 'PENDIENTE':
        return <Badge variant="yellow">Pendiente</Badge>
      default:
        return <Badge variant="gray">Registrado</Badge>
    }
  }

  const conceptoOptions = (conceptos || [])
    .filter((c: ConceptoCaja) => c.estado === 'ACTIVO' && c.tipo === tipoSeleccionado)
    .map((c: ConceptoCaja) => ({ value: String(c.id), label: c.nombre }))

  const conceptoSeleccionado = (conceptos || []).find(
    (c: ConceptoCaja) => c.id === Number(conceptoSeleccionadoId)
  )
  const requiereComprobante = !!conceptoSeleccionado?.requiereComprobante

  const cajasDestinoOptions = (cajas?.data || [])
    .filter((c: Caja) => c.id !== cajaId && c.estado === 'ACTIVA' && c.moneda === caja.moneda)
    .map((c: Caja) => ({ value: String(c.id), label: `${c.codigo} - ${c.nombre}` }))

  const hayFiltrosMovimiento =
    !!movBusqueda || movTipo !== 'TODOS' || movEstado !== 'TODOS' || !!movDesde || !!movHasta

  const limpiarFiltrosMovimiento = () => {
    setMovBusqueda('')
    setMovTipo('TODOS')
    setMovEstado('TODOS')
    setMovDesde('')
    setMovHasta('')
    setMovPagina(1)
  }

  const movDesdeTexto = ((movimientos?.page ?? 1) - 1) * (movimientos?.limit ?? 15) + 1
  const movHastaTexto = Math.min(
    (movimientos?.page ?? 1) * (movimientos?.limit ?? 15),
    movimientos?.total ?? 0
  )

  const formatFechaHora = (fecha: string) =>
    new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  // Fechas en horario local para que el rango del libro coincida con el día elegido.
  const fechaIso = (fecha: Date) => {
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
  }

  // Muestra una fecha `YYYY-MM-DD` sin convertirla a UTC.
  const fechaEtiqueta = (valor: string) => {
    const [anio, mes, dia] = valor.slice(0, 10).split('-')
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor
  }

  const aplicarRangoLibro = (desde: string, hasta: string) => {
    setLibroDesde(desde)
    setLibroHasta(hasta)
  }

  const aplicarLibroHoy = () => {
    const hoy = fechaIso(new Date())
    aplicarRangoLibro(hoy, hoy)
  }

  const aplicarLibroMes = () => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    aplicarRangoLibro(fechaIso(inicioMes), fechaIso(ahora))
  }

  const rangoLibroEtiqueta =
    libroDesde || libroHasta
      ? `${libroDesde ? fechaEtiqueta(libroDesde) : 'Inicio'} — ${
          libroHasta ? fechaEtiqueta(libroHasta) : 'Hoy'
        }`
      : 'Todo el historial'

  const conceptoNombre = (movimiento: MovimientoCaja) =>
    movimiento.concepto?.nombre ||
    (conceptos || []).find((c: ConceptoCaja) => c.id === movimiento.conceptoId)?.nombre ||
    `Concepto #${movimiento.conceptoId}`

  // Los movimientos de aportes, préstamos y cuotas se anulan desde su propio módulo.
  const esMovimientoVinculado = (movimiento: MovimientoCaja) =>
    !!movimiento.referencia && /^(APORTE-|PRESTAMO-|CUOTA-)/.test(movimiento.referencia)

  const onChangeTipoMovimiento = (tipo: string) => {
    movimientoForm.setValue('tipo', tipo as 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE')
    movimientoForm.setValue('conceptoId', 0, { shouldValidate: true })
  }

  const onSubmitMovimiento = (data: MovimientoCreateInput) => {
    createMovimiento.mutate(data, {
      onSuccess: () => {
        setShowMovimientoModal(false)
        movimientoForm.reset()
      },
    })
  }

  const onSubmitArqueo = (data: ArqueoCreateInput) => {
    createArqueo.mutate(data, {
      onSuccess: () => {
        setShowArqueoModal(false)
        arqueoForm.reset()
      },
    })
  }

  const onAprobarArqueo = (data: { observacion?: string }) => {
    if (!selectedArqueoId) return
    aprobarArqueo.mutate(
      { id: selectedArqueoId, data: { estado: 'APROBADO', observacion: data.observacion } },
      {
        onSuccess: () => {
          setShowAprobarModal(false)
          setSelectedArqueoId(null)
          aprobarForm.reset()
        },
      }
    )
  }

  const onSubmitTransferir = (data: TransferirInput) => {
    transferir.mutate(
      {
        cajaOrigenId: data.cajaOrigenId,
        cajaDestinoId: data.cajaDestinoId,
        monto: data.monto,
        descripcion: data.descripcion,
      },
      {
        onSuccess: () => {
          setShowTransferModal(false)
          transferForm.reset()
        },
      }
    )
  }

  const abrirArqueo = () => {
    arqueoForm.reset({
      cajaId,
      saldoFisico: Number(caja.saldoActual),
      observacion: '',
    })
    setShowArqueoModal(true)
  }

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      if (pestana === 'arqueos') {
        const result = await cajaApi.listArqueos({ cajaId, limit: 1000 })
        const headers = [
          'Código',
          'Fecha',
          'Saldo sistema',
          'Saldo físico',
          'Diferencia',
          'Estado',
          'Observación',
        ]
        const filas = result.data.map((a: ArqueoCaja) => [
          a.codigo,
          a.fechaArqueo,
          a.saldoSistema,
          a.saldoFisico,
          a.diferencia,
          a.estado,
          a.observacion || '',
        ])
        if (formato === 'csv') exportCsv(`arqueos-${caja.codigo}.csv`, headers, filas)
        else exportXlsx(`arqueos-${caja.codigo}.xlsx`, headers, filas)
      } else if (pestana === 'libro') {
        const datos = await cajaApi.getLibroCaja(cajaId, {
          fechaInicio: libroDesde || undefined,
          fechaFin: libroHasta || undefined,
        })
        const headers = [
          'Fecha',
          'Código',
          'Concepto',
          'Descripción',
          'Comprobante',
          'Ingreso',
          'Egreso',
          'Saldo',
        ]
        const filas: (string | number)[][] = [
          ['', '', 'Saldo de apertura', '', '', '', '', datos.saldoApertura],
          ...datos.movimientos.map((fila: FilaLibroCaja) => [
            formatFechaHora(fila.fechaMovimiento),
            fila.codigo,
            fila.concepto,
            fila.descripcion,
            fila.comprobante,
            fila.ingreso || '',
            fila.egreso || '',
            fila.saldo,
          ]),
          [
            '',
            '',
            'Totales del período',
            '',
            '',
            datos.totalIngresos,
            datos.totalEgresos,
            datos.saldoCierre,
          ],
        ]
        const sufijo = `${libroDesde || 'inicio'}_${libroHasta || 'hoy'}`
        if (formato === 'csv') exportCsv(`libro-caja-${caja.codigo}-${sufijo}.csv`, headers, filas)
        else exportXlsx(`libro-caja-${caja.codigo}-${sufijo}.xlsx`, headers, filas)
      } else {
        const result = await cajaApi.listMovimientos({
          cajaId,
          page: 1,
          limit: 1000,
          search: movBusqueda || undefined,
          tipo: movTipo === 'TODOS' ? undefined : movTipo,
          estado: movEstado === 'TODOS' ? undefined : movEstado,
          fechaInicio: movDesde || undefined,
          fechaFin: movHasta || undefined,
        })
        const headers = [
          'Código',
          'Fecha',
          'Tipo',
          'Concepto',
          'Descripción',
          'Monto',
          'Método de pago',
          'Estado',
        ]
        const filas = result.data.map((m: MovimientoCaja) => [
          m.codigo,
          m.fechaMovimiento,
          m.tipo,
          conceptoNombre(m),
          m.descripcion || '',
          m.monto,
          m.metodoPago,
          m.estado,
        ])
        if (formato === 'csv') exportCsv(`movimientos-${caja.codigo}.csv`, headers, filas)
        else exportXlsx(`movimientos-${caja.codigo}.xlsx`, headers, filas)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al exportar los datos de la caja'))
    } finally {
      setExportOpen(false)
    }
  }

  const saldoProyectado =
    tipoSeleccionado === 'EGRESO' || tipoSeleccionado === 'TRANSFERENCIA'
      ? Number(caja.saldoActual) - (Number(montoMovimiento) || 0)
      : Number(caja.saldoActual) + (Number(montoMovimiento) || 0)
  const saldoInsuficiente =
    (tipoSeleccionado === 'EGRESO' || tipoSeleccionado === 'TRANSFERENCIA') &&
    Number(montoMovimiento) > Number(caja.saldoActual)

  const diferenciaArqueo = Number(saldoFisicoContado || 0) - Number(caja.saldoActual)
  const cajaDestino = (cajas?.data || []).find((c: Caja) => c.id === Number(cajaDestinoId))
  const excedeSaldo = Number(montoTraspaso) > Number(caja.saldoActual)

  const pestanas: { key: Pestana; label: string; icono: typeof ListChecks; total?: number }[] = [
    {
      key: 'movimientos',
      label: 'Movimientos',
      icono: ListChecks,
      total: movimientos?.total ?? 0,
    },
    { key: 'arqueos', label: 'Arqueos', icono: ShieldCheck, total: arqueos?.total ?? 0 },
    { key: 'libro', label: 'Libro de caja', icono: BookOpen },
    { key: 'flujo', label: 'Flujo proyectado', icono: Clock, total: flujo?.length ?? 0 },
  ]

  const columnasMovimientos = [
    {
      key: 'fechaMovimiento',
      label: 'Fecha',
      render: (mov: MovimientoCaja) => (
        <span className="whitespace-nowrap text-muted">{formatShortDate(mov.fechaMovimiento)}</span>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (mov: MovimientoCaja) => tipoMovimientoBadge(mov.tipo),
    },
    {
      key: 'concepto',
      label: 'Concepto',
      render: (mov: MovimientoCaja) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{conceptoNombre(mov)}</p>
          <p className="max-w-[280px] truncate text-xs text-subtle">
            {mov.descripcion || mov.comprobante || mov.metodoPago}
          </p>
        </div>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      className: 'text-right',
      render: (mov: MovimientoCaja) => (
        <span
          className={`whitespace-nowrap font-semibold ${
            mov.tipo === 'INGRESO'
              ? 'text-emerald-600 dark:text-emerald-400'
              : mov.tipo === 'EGRESO'
                ? 'text-red-600 dark:text-red-400'
                : 'text-secondary'
          }`}
        >
          {mov.tipo === 'INGRESO' ? '+' : mov.tipo === 'EGRESO' ? '-' : ''}
          {formatCurrency(Number(mov.monto), caja.moneda)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (mov: MovimientoCaja) => estadoMovimientoBadge(mov.estado),
    },
    {
      key: 'acciones',
      label: '',
      className: 'text-right',
      render: (mov: MovimientoCaja) =>
        mov.estado !== 'ANULADO' &&
        (esMovimientoVinculado(mov) ? (
          <span
            title="Se anula desde el módulo de aportes o créditos"
            className="inline-flex rounded-lg p-2 text-subtle"
          >
            <Lock className="h-4 w-4" />
          </span>
        ) : (
          <button
            onClick={() => setAnularId(mov.id)}
            title="Anular movimiento"
            aria-label={`Anular movimiento ${mov.codigo}`}
            className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <Ban className="h-4 w-4" />
          </button>
        )),
    },
  ]

  const columnasLibro = [
    {
      key: 'fechaMovimiento',
      label: 'Fecha',
      render: (fila: FilaLibroCaja) => (
        <span className="whitespace-nowrap text-muted">
          {formatFechaHora(fila.fechaMovimiento)}
        </span>
      ),
    },
    {
      key: 'concepto',
      label: 'Detalle',
      render: (fila: FilaLibroCaja) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{fila.concepto}</p>
          <p className="max-w-[280px] truncate text-xs text-subtle">
            {[fila.descripcion, fila.comprobante, fila.codigo].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      key: 'ingreso',
      label: 'Ingreso',
      className: 'text-right',
      render: (fila: FilaLibroCaja) =>
        fila.ingreso > 0 ? (
          <span className="whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(fila.ingreso, caja.moneda)}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: 'egreso',
      label: 'Egreso',
      className: 'text-right',
      render: (fila: FilaLibroCaja) =>
        fila.egreso > 0 ? (
          <span className="whitespace-nowrap font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(fila.egreso, caja.moneda)}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: 'saldo',
      label: 'Saldo',
      className: 'text-right',
      render: (fila: FilaLibroCaja) => (
        <span className="whitespace-nowrap font-semibold text-foreground">
          {formatCurrency(fila.saldo, caja.moneda)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/caja')}
            iconLeft={<ArrowLeft className="h-4 w-4" />}
          >
            Volver
          </Button>
          <SectionHeader
            title={caja.nombre}
            description={`${tipoCajaEtiqueta[caja.tipo] ?? caja.tipo} · ${caja.codigo}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {cajaActiva && (
            <Button
              onClick={() => {
                movimientoForm.reset()
                setShowMovimientoModal(true)
              }}
              iconLeft={<Plus className="h-4 w-4" />}
            >
              Nuevo Movimiento
            </Button>
          )}
          <Button
            as="link"
            to={`/caja/${cajaId}/editar`}
            variant="secondary"
            iconLeft={<Pencil className="h-4 w-4" />}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Portada */}
      <Card padding="none" className="overflow-hidden">
        <div className="bg-gradient-to-br from-secondary via-secondary-strong to-accent px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40">
                <Wallet className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">{caja.codigo}</p>
                <h1 className="text-2xl font-bold text-white">{caja.nombre}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {tipoCajaEtiqueta[caja.tipo] ?? caja.tipo}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {caja.estado === 'ACTIVA'
                      ? 'Activa'
                      : caja.estado === 'INACTIVA'
                        ? 'Inactiva'
                        : 'Cerrada'}
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {caja.moneda}
                  </span>
                  {caja.fondo && (
                    <Link
                      to={`/fondos/${caja.fondo.id}`}
                      className="inline-flex items-center gap-1 text-sm text-white/80 transition-colors hover:text-white"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {caja.fondo.nombre}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Saldo actual
              </p>
              <p className="text-3xl font-bold text-white sm:text-4xl">
                {formatCurrency(Number(caja.saldoActual), caja.moneda)}
              </p>
              <p className="mt-1 text-sm text-white/80">
                Inicial: {formatCurrency(Number(caja.saldoInicial), caja.moneda)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Resumen del día */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <ArrowUpCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(resumen?.hoy?.ingresos ?? 0, caja.moneda)}
              </p>
              <p className="text-xs text-muted">Ingresos hoy</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(resumen?.hoy?.egresos ?? 0, caja.moneda)}
              </p>
              <p className="text-xs text-muted">Egresos hoy</p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
              {(resumen?.hoy?.neto ?? 0) >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
            </div>
            <div>
              <p
                className={`text-xl font-bold ${
                  (resumen?.hoy?.neto ?? 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(resumen?.hoy?.neto ?? 0, caja.moneda)}
              </p>
              <p className="text-xs text-muted">
                Neto hoy · {resumen?.hoy?.movimientos ?? 0} movimientos
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{resumen?.arqueosPendientes ?? 0}</p>
              <p className="text-xs text-muted">Arqueos pendientes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pestañas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Secciones de la caja"
          className="inline-flex flex-wrap rounded-xl border border-border bg-surface p-1"
        >
          {pestanas.map((item) => {
            const Icono = item.icono
            const activa = pestana === item.key
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setPestana(item.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activa
                    ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                    : 'text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <Icono className="h-4 w-4" />
                {item.label}
                {item.total !== undefined && (
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      activa ? 'bg-white/20 text-white' : 'bg-surface-muted text-subtle'
                    }`}
                  >
                    {item.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cajaActiva && pestana === 'movimientos' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  transferForm.reset()
                  setShowTransferModal(true)
                }}
                iconLeft={<ArrowRightLeft className="h-4 w-4" />}
              >
                Traspasar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={abrirArqueo}
                iconLeft={<ClipboardCheck className="h-4 w-4" />}
              >
                Arqueo
              </Button>
            </>
          )}

          {pestana !== 'flujo' && (
            <div className="relative" ref={exportRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExportOpen(!exportOpen)}
                iconLeft={<Download className="h-4 w-4" />}
                iconRight={<ChevronDown className="h-4 w-4" />}
              >
                Exportar
              </Button>
              {exportOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[var(--shadow-pop)]">
                  <button
                    type="button"
                    onClick={() => exportar('csv')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                  >
                    <FileText className="h-4 w-4 text-subtle" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportar('xlsx')}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-subtle" />
                    Excel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {pestana === 'movimientos' && (
        <div className="space-y-4">
          <Card padding="md" hover={false}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted">Buscar</label>
                <SearchInput
                  placeholder="Código, descripción, comprobante o referencia..."
                  value={movBusqueda}
                  onChange={(valor) => {
                    setMovBusqueda(valor)
                    setMovPagina(1)
                  }}
                  aria-label="Buscar movimientos"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Tipo</label>
                <Select
                  options={filtroTipoOptions}
                  value={movTipo}
                  onChange={(e) => {
                    setMovTipo(e.target.value)
                    setMovPagina(1)
                  }}
                  className="w-44"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Estado</label>
                <Select
                  options={filtroEstadoOptions}
                  value={movEstado}
                  onChange={(e) => {
                    setMovEstado(e.target.value)
                    setMovPagina(1)
                  }}
                  className="w-48"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Desde</label>
                <Input
                  type="date"
                  value={movDesde}
                  max={movHasta || undefined}
                  onChange={(e) => {
                    setMovDesde(e.target.value)
                    setMovPagina(1)
                  }}
                  className="w-40"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Hasta</label>
                <Input
                  type="date"
                  value={movHasta}
                  min={movDesde || undefined}
                  onChange={(e) => {
                    setMovHasta(e.target.value)
                    setMovPagina(1)
                  }}
                  className="w-40"
                />
              </div>

              {hayFiltrosMovimiento && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarFiltrosMovimiento}
                  iconLeft={<X className="h-4 w-4" />}
                >
                  Limpiar
                </Button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Search className="h-3.5 w-3.5 text-subtle" />
              {movimientos?.total ?? 0}{' '}
              {(movimientos?.total ?? 0) === 1 ? 'movimiento' : 'movimientos'}
              {hayFiltrosMovimiento ? ' con los filtros aplicados' : ' registrados'}
            </div>
          </Card>

          {errorMovimientos ? (
            <ErrorState error={errorMovimientosDetalle} onRetry={() => refetchMovimientos()} />
          ) : (
            <>
              <DataTable
                columns={columnasMovimientos}
                data={movimientos?.data || []}
                loading={loadingMovimientos}
                keyField="id"
                emptyTitle={
                  hayFiltrosMovimiento ? 'Sin resultados con esos filtros' : 'No hay movimientos'
                }
                emptyDescription={
                  hayFiltrosMovimiento
                    ? 'Prueba con otro rango de fechas, tipo o búsqueda.'
                    : 'Registra el primer movimiento de esta caja.'
                }
                currentPage={movimientos?.page}
                totalPages={movimientos?.totalPages}
                onPageChange={setMovPagina}
              />
              {(movimientos?.total ?? 0) > 0 && (
                <p className="text-center text-xs text-muted">
                  Mostrando {movDesdeTexto}–{movHastaTexto} de {movimientos?.total} movimientos
                </p>
              )}
            </>
          )}
        </div>
      )}

      {pestana === 'arqueos' && (
        <Card padding="none">
          {loadingArqueos ? (
            <div className="py-16">
              <LoadingSpinner text="Cargando arqueos..." />
            </div>
          ) : !arqueos?.data || arqueos.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No hay arqueos"
                description="Registra el primer arqueo para conciliar el efectivo."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-muted/60">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Fecha
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Saldo sistema
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Saldo físico
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Diferencia
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Estado
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {arqueos.data.map((arqueo: ArqueoCaja) => (
                    <tr key={arqueo.id} className="transition-colors hover:bg-surface-muted/60">
                      <td className="whitespace-nowrap px-5 py-4 text-muted">
                        {formatShortDate(arqueo.fechaArqueo)}
                      </td>
                      <td className="px-5 py-4 text-right text-muted">
                        {formatCurrency(Number(arqueo.saldoSistema), caja.moneda)}
                      </td>
                      <td className="px-5 py-4 text-right text-muted">
                        {formatCurrency(Number(arqueo.saldoFisico), caja.moneda)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          Number(arqueo.diferencia) !== 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(Number(arqueo.diferencia), caja.moneda)}
                      </td>
                      <td className="px-5 py-4">{estadoArqueoBadge(arqueo.estado)}</td>
                      <td className="px-5 py-4 text-right">
                        {arqueo.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedArqueoId(arqueo.id)
                              setShowAprobarModal(true)
                            }}
                          >
                            Procesar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {pestana === 'libro' && (
        <div className="space-y-4">
          <Card padding="md" hover={false}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Desde</label>
                <Input
                  type="date"
                  value={libroDesde}
                  max={libroHasta || undefined}
                  onChange={(e) => setLibroDesde(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Hasta</label>
                <Input
                  type="date"
                  value={libroHasta}
                  min={libroDesde || undefined}
                  onChange={(e) => setLibroHasta(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={aplicarLibroHoy}
                  iconLeft={<CalendarDays className="h-4 w-4" />}
                >
                  Hoy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={aplicarLibroMes}
                  iconLeft={<CalendarDays className="h-4 w-4" />}
                >
                  Este mes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => aplicarRangoLibro('', '')}
                  iconLeft={<RotateCcw className="h-4 w-4" />}
                >
                  Todo
                </Button>
              </div>
              <p className="ml-auto flex items-center gap-2 text-xs text-muted">
                <BookOpen className="h-3.5 w-3.5 text-subtle" />
                {rangoLibroEtiqueta}
              </p>
            </div>
          </Card>

          {errorLibro ? (
            <ErrorState error={errorLibroDetalle} onRetry={() => refetchLibro()} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card padding="md" hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <Scale className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-foreground">
                        {loadingLibro
                          ? '—'
                          : formatCurrency(libro?.saldoApertura ?? 0, caja.moneda)}
                      </p>
                      <p className="text-xs text-muted">Saldo de apertura</p>
                    </div>
                  </div>
                </Card>
                <Card padding="md" hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <ArrowUpCircle className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {loadingLibro
                          ? '—'
                          : formatCurrency(libro?.totalIngresos ?? 0, caja.moneda)}
                      </p>
                      <p className="text-xs text-muted">Ingresos del período</p>
                    </div>
                  </div>
                </Card>
                <Card padding="md" hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
                      <ArrowDownCircle className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-red-600 dark:text-red-400">
                        {loadingLibro ? '—' : formatCurrency(libro?.totalEgresos ?? 0, caja.moneda)}
                      </p>
                      <p className="text-xs text-muted">Egresos del período</p>
                    </div>
                  </div>
                </Card>
                <Card padding="md" hover={false}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-xl font-bold ${
                          (libro?.saldoCierre ?? 0) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-foreground'
                        }`}
                      >
                        {loadingLibro ? '—' : formatCurrency(libro?.saldoCierre ?? 0, caja.moneda)}
                      </p>
                      <p className="text-xs text-muted">Saldo de cierre</p>
                    </div>
                  </div>
                </Card>
              </div>

              <DataTable
                columns={columnasLibro}
                data={libro?.movimientos || []}
                loading={loadingLibro}
                keyField="id"
                emptyTitle="Sin movimientos en el período"
                emptyDescription="Ajusta el rango de fechas para ver otros movimientos de la caja."
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
                <div className="text-sm">
                  <p className="font-semibold text-foreground">Saldo de cierre del período</p>
                  <p className="text-xs text-muted">
                    {formatCurrency(libro?.saldoApertura ?? 0, caja.moneda)} +{' '}
                    {formatCurrency(libro?.totalIngresos ?? 0, caja.moneda)} −{' '}
                    {formatCurrency(libro?.totalEgresos ?? 0, caja.moneda)} ·{' '}
                    {libro?.movimientos.length ?? 0} movimientos
                  </p>
                </div>
                <p
                  className={`text-xl font-bold ${
                    (libro?.saldoCierre ?? 0) < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-foreground'
                  }`}
                >
                  {formatCurrency(libro?.saldoCierre ?? 0, caja.moneda)}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {pestana === 'flujo' && (
        <Card padding="none">
          {!flujo || flujo.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Sin flujo proyectado"
                description="No hay ingresos ni egresos previstos para esta caja."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-muted/60">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Fecha
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Concepto
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Tipo
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">
                      Monto proyectado
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {flujo.map((item) => {
                    const esIngreso = item.tipo.startsWith('INGRESO')
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-surface-muted/60">
                        <td className="whitespace-nowrap px-5 py-4 text-muted">
                          {formatShortDate(item.fecha)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{item.concepto}</p>
                          {item.descripcion && (
                            <p className="text-xs text-subtle">{item.descripcion}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {esIngreso ? (
                            <Badge variant="green">Ingreso</Badge>
                          ) : (
                            <Badge variant="red">Egreso</Badge>
                          )}
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-semibold ${
                            esIngreso
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(Number(item.montoProyectado), caja.moneda)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={item.estado === 'PROYECTADO' ? 'yellow' : 'green'}>
                            {item.estado === 'PROYECTADO' ? 'Proyectado' : item.estado}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal: nuevo movimiento */}
      <Modal
        open={showMovimientoModal}
        onClose={() => setShowMovimientoModal(false)}
        title="Nuevo Movimiento"
        maxWidth="md"
      >
        <form onSubmit={movimientoForm.handleSubmit(onSubmitMovimiento)} className="space-y-4 p-6">
          <div className="rounded-xl bg-surface-muted/60 p-3 text-sm">
            <span className="text-muted">Saldo actual: </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(Number(caja.saldoActual), caja.moneda)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tipo" error={movimientoForm.formState.errors.tipo?.message}>
              <Select
                options={tipoMovimientoOptions}
                value={tipoSeleccionado}
                onChange={(e) => onChangeTipoMovimiento(e.target.value)}
              />
            </FormField>

            <FormField
              label="Método de pago"
              error={movimientoForm.formState.errors.metodoPago?.message}
            >
              <Select
                options={metodoPagoOptions}
                value={metodoPagoSeleccionado || 'EFECTIVO'}
                {...movimientoForm.register('metodoPago')}
              />
            </FormField>
          </div>

          <FormField
            label="Concepto"
            required
            error={movimientoForm.formState.errors.conceptoId?.message}
          >
            <Select
              options={conceptoOptions}
              value={Number(conceptoSeleccionadoId) ? String(conceptoSeleccionadoId) : ''}
              placeholder={
                conceptoOptions.length === 0
                  ? 'Sin conceptos para este tipo'
                  : 'Seleccionar concepto'
              }
              {...movimientoForm.register('conceptoId', { valueAsNumber: true })}
              error={movimientoForm.formState.errors.conceptoId?.message}
            />
          </FormField>

          <FormField label="Monto" required error={movimientoForm.formState.errors.monto?.message}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              {...movimientoForm.register('monto', { valueAsNumber: true })}
              error={movimientoForm.formState.errors.monto?.message}
              placeholder="0.00"
            />
          </FormField>

          {Number(montoMovimiento) > 0 && (
            <p
              className={`text-xs ${
                saldoInsuficiente ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted'
              }`}
            >
              Saldo resultante: {formatCurrency(saldoProyectado, caja.moneda)}
              {saldoInsuficiente && ' · saldo insuficiente'}
            </p>
          )}

          <FormField
            label="Descripción"
            error={movimientoForm.formState.errors.descripcion?.message}
          >
            <Input
              {...movimientoForm.register('descripcion')}
              placeholder="Descripción del movimiento"
            />
          </FormField>

          <FormField
            label={`Comprobante${requiereComprobante ? '' : ' (opcional)'}`}
            required={requiereComprobante}
            error={movimientoForm.formState.errors.comprobante?.message}
          >
            <Input
              {...movimientoForm.register('comprobante')}
              placeholder="N° de recibo, boleta u otro documento"
            />
          </FormField>

          <FormField
            label="Referencia (opcional)"
            error={movimientoForm.formState.errors.referencia?.message}
          >
            <Input {...movimientoForm.register('referencia')} placeholder="Referencia interna" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowMovimientoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMovimiento.isPending}>
              Registrar Movimiento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: arqueo */}
      <Modal
        open={showArqueoModal}
        onClose={() => setShowArqueoModal(false)}
        title="Registrar Arqueo"
        maxWidth="md"
      >
        <form onSubmit={arqueoForm.handleSubmit(onSubmitArqueo)} className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted/60 p-3">
              <p className="text-xs text-muted">Saldo del sistema</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(Number(caja.saldoActual), caja.moneda)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-muted/60 p-3">
              <p className="text-xs text-muted">Diferencia</p>
              <p
                className={`text-lg font-bold ${
                  diferenciaArqueo === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(diferenciaArqueo, caja.moneda)}
              </p>
            </div>
          </div>

          <FormField
            label="Saldo Físico (contado)"
            required
            error={arqueoForm.formState.errors.saldoFisico?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              {...arqueoForm.register('saldoFisico', { valueAsNumber: true })}
              error={arqueoForm.formState.errors.saldoFisico?.message}
              placeholder="0.00"
            />
          </FormField>

          <FormField label="Observaciones" error={arqueoForm.formState.errors.observacion?.message}>
            <Input {...arqueoForm.register('observacion')} placeholder="Observaciones del arqueo" />
          </FormField>

          <p className="text-xs text-subtle">
            Si la diferencia no es cero, al aprobar el arqueo se registrará un ajuste automático.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowArqueoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createArqueo.isPending}>
              Registrar Arqueo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: aprobar arqueo */}
      <Modal
        open={showAprobarModal}
        onClose={() => {
          setShowAprobarModal(false)
          setSelectedArqueoId(null)
        }}
        title="Procesar Arqueo"
        maxWidth="sm"
      >
        <form onSubmit={aprobarForm.handleSubmit(onAprobarArqueo)} className="space-y-4 p-6">
          <p className="text-sm text-muted">
            ¿Deseas aprobar este arqueo? La diferencia se ajustará automáticamente en la caja.
          </p>

          <FormField label="Observaciones (opcional)">
            <Input
              {...aprobarForm.register('observacion')}
              placeholder="Observaciones de aprobación"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAprobarModal(false)
                setSelectedArqueoId(null)
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={aprobarArqueo.isPending}>
              Aprobar Arqueo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: traspaso */}
      <Modal
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Traspaso entre cajas"
        maxWidth="md"
      >
        <form onSubmit={transferForm.handleSubmit(onSubmitTransferir)} className="space-y-4 p-6">
          <p className="text-sm text-muted">
            {formatCurrency(Number(caja.saldoActual), caja.moneda)} disponibles en{' '}
            <strong className="text-foreground">{caja.nombre}</strong>. Solo se muestran cajas
            activas de la misma moneda.
          </p>

          <FormField
            label="Caja destino"
            required
            error={transferForm.formState.errors.cajaDestinoId?.message}
          >
            <Select
              options={cajasDestinoOptions}
              value={Number(cajaDestinoId) ? String(cajaDestinoId) : ''}
              placeholder={
                cajasDestinoOptions.length === 0
                  ? 'No hay otra caja activa en esta moneda'
                  : 'Seleccionar caja destino'
              }
              {...transferForm.register('cajaDestinoId', { valueAsNumber: true })}
              error={transferForm.formState.errors.cajaDestinoId?.message}
            />
          </FormField>

          <FormField label="Monto" required error={transferForm.formState.errors.monto?.message}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={Number(caja.saldoActual)}
              {...transferForm.register('monto', { valueAsNumber: true })}
              error={transferForm.formState.errors.monto?.message}
              placeholder="0.00"
            />
          </FormField>

          {Number(montoTraspaso) > 0 && (
            <p
              className={`text-xs ${
                excedeSaldo ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted'
              }`}
            >
              Saldo restante en esta caja:{' '}
              {formatCurrency(Number(caja.saldoActual) - Number(montoTraspaso), caja.moneda)}
              {excedeSaldo && ' · el monto supera el saldo disponible'}
            </p>
          )}

          {cajaDestino && Number(montoTraspaso) > 0 && (
            <p className="text-xs text-muted">
              Saldo destino resultante:{' '}
              {formatCurrency(
                Number(cajaDestino.saldoActual) + Number(montoTraspaso),
                cajaDestino.moneda
              )}
            </p>
          )}

          <FormField
            label="Descripción (opcional)"
            error={transferForm.formState.errors.descripcion?.message}
          >
            <Input {...transferForm.register('descripcion')} placeholder="Motivo del traspaso" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={transferir.isPending}>
              Transferir
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={anularId !== null}
        onClose={() => setAnularId(null)}
        onConfirm={() => {
          if (anularId) {
            anularMovimiento.mutate(anularId, { onSuccess: () => setAnularId(null) })
          }
        }}
        title="Anular Movimiento"
        message="¿Estás seguro de anular este movimiento? El saldo de la caja se revertirá y la acción no se puede deshacer."
        confirmText="Anular"
        variant="danger"
        loading={anularMovimiento.isPending}
      />
    </div>
  )
}
