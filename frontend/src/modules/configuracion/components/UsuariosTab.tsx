import { useEffect, useState } from 'react'
import { Key, Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserX, Users, X } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  ExportMenu,
  ChipsEstado,
  ResumenCard,
  SearchInput,
  Select,
} from '@/components/ui'
import toast from 'react-hot-toast'
import {
  exportCsv,
  exportXlsx,
  formatShortDate,
  getClaseAvatar,
  getSocioIniciales,
} from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { configuracionApi } from '../api/configuracionApi'
import {
  useCreateUsuario,
  useDeleteUsuario,
  useUpdatePassword,
  useUpdateUsuario,
  useUsuarios,
} from '../hooks/useConfiguracion'
import { useFiltrosUrl } from '../hooks/useFiltrosUrl'
import { recolectarPaginas } from '../utils/exportar'
import type { ResumenConfiguracion, Usuario } from '../types'
import type { CreateUsuarioInput, UpdateUsuarioInput } from '../api/configuracionApi'
import UsuarioFormModal from './UsuarioFormModal'
import PasswordModal from './PasswordModal'
import { OPCIONES_ROL_FILTRO, etiquetaEstado, etiquetaRol } from './comunes'
import { EstadoBadge, RolBadge } from './insignias'

interface UsuariosTabProps {
  resumen?: ResumenConfiguracion
  cargandoResumen: boolean
  errorResumen?: unknown
  recargarResumen: () => void
}

export default function UsuariosTab({
  resumen,
  cargandoResumen,
  errorResumen,
  recargarResumen,
}: UsuariosTabProps) {
  const { page, search, rol, estado, actualizar, limpiar } = useFiltrosUrl('u')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(null)

  const usuarioActual = useAuthStore((estadoSesion) => estadoSesion.user)

  const { data, isLoading, isError, error, refetch } = useUsuarios({
    page,
    limit: 10,
    search: search || undefined,
    rol: rol || undefined,
    estado: estado || undefined,
  })
  const createMutation = useCreateUsuario()
  const updateMutation = useUpdateUsuario()
  const deleteMutation = useDeleteUsuario()
  const passwordMutation = useUpdatePassword()

  const hayFiltros = Boolean(search || rol || estado)

  // Si la página actual deja de existir (por filtros o bajas), retrocede a la última válida.
  useEffect(() => {
    if (data && data.totalPages > 0 && page > data.totalPages) {
      actualizar({ page: data.totalPages })
    }
  }, [data, page, actualizar])

  const abrirCrear = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const abrirEditar = (usuario: Usuario) => {
    setEditingUser(usuario)
    setModalOpen(true)
  }

  const esUsuarioActual = (usuario: Usuario) =>
    usuarioActual?.id === usuario.id || usuarioActual?.username === usuario.username

  const esUltimoAdmin = (usuario: Usuario) =>
    usuario.rol === 'ADMIN' && usuario.estado === 'ACTIVO' && (resumen?.usuarios.admins ?? 0) <= 1

  const exportar = async (formato: 'csv' | 'xlsx') => {
    try {
      const usuarios = await recolectarPaginas((pagina, limite) =>
        configuracionApi.listUsuarios({
          page: pagina,
          limit: limite,
          search: search || undefined,
          rol: rol || undefined,
          estado: estado || undefined,
        })
      )

      const headers = [
        'Usuario',
        'Nombres',
        'Apellido paterno',
        'Apellido materno',
        'Correo',
        'Teléfono',
        'Rol',
        'Estado',
        'Último acceso',
        'Creado',
      ]
      const filas = usuarios.map((usuario) => [
        usuario.username,
        usuario.nombres,
        usuario.apellidoPaterno,
        usuario.apellidoMaterno || '',
        usuario.correo || '',
        usuario.telefono || '',
        etiquetaRol(usuario.rol),
        etiquetaEstado(usuario.estado),
        usuario.ultimoAcceso ? formatShortDate(usuario.ultimoAcceso) : 'Nunca',
        formatShortDate(usuario.createdAt),
      ])

      if (formato === 'csv') exportCsv('usuarios.csv', headers, filas)
      else exportXlsx('usuarios.xlsx', headers, filas)
      toast.success(`Se exportaron ${usuarios.length} usuarios`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al exportar los usuarios'))
    }
  }

  const columnas = [
    {
      key: 'usuario',
      label: 'Usuario',
      render: (usuario: Usuario) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClaseAvatar(usuario.username)}`}
          >
            {getSocioIniciales(usuario.nombres, usuario.apellidoPaterno)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">
                {usuario.nombres} {usuario.apellidoPaterno}
              </p>
              {esUsuarioActual(usuario) && (
                <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                  Tú
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-subtle">@{usuario.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      label: 'Contacto',
      render: (usuario: Usuario) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{usuario.correo || '—'}</p>
          {usuario.telefono && <p className="text-xs text-subtle">{usuario.telefono}</p>}
        </div>
      ),
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (usuario: Usuario) => <RolBadge rol={usuario.rol} />,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (usuario: Usuario) => <EstadoBadge estado={usuario.estado} />,
    },
    {
      key: 'ultimoAcceso',
      label: 'Último acceso',
      render: (usuario: Usuario) =>
        usuario.ultimoAcceso ? (
          <span className="text-sm text-muted">{formatShortDate(usuario.ultimoAcceso)}</span>
        ) : (
          <span className="text-sm text-subtle">Nunca</span>
        ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      className: 'text-right',
      render: (usuario: Usuario) => {
        const propio = esUsuarioActual(usuario)
        const ultimoAdmin = esUltimoAdmin(usuario)
        const eliminarBloqueado = propio || ultimoAdmin
        const motivo = propio
          ? 'No puedes desactivar tu propia cuenta'
          : ultimoAdmin
            ? 'Debe existir al menos un administrador activo'
            : 'Desactivar usuario'

        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => abrirEditar(usuario)}
              aria-label={`Editar usuario ${usuario.username}`}
              title="Editar"
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-secondary/10 hover:text-secondary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPasswordModalUser(usuario)}
              aria-label={`Cambiar contraseña de ${usuario.username}`}
              title="Cambiar contraseña"
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-300"
            >
              <Key className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(usuario)}
              disabled={eliminarBloqueado}
              aria-label={
                eliminarBloqueado
                  ? `${motivo}: ${usuario.username}`
                  : `Desactivar usuario ${usuario.username}`
              }
              title={motivo}
              className="rounded-lg p-2 text-subtle transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  const desde = ((data?.page ?? 1) - 1) * (data?.limit ?? 10) + 1
  const hasta = Math.min((data?.page ?? 1) * (data?.limit ?? 10), data?.total ?? 0)

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
          icono={Users}
          etiqueta="Usuarios registrados"
          valor={resumen?.usuarios.total}
          detalle="Cuentas en el sistema"
          tono="indigo"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={UserCheck}
          etiqueta="Usuarios activos"
          valor={resumen?.usuarios.activos}
          detalle={`de ${resumen?.usuarios.total ?? 0} en total`}
          tono="green"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={UserX}
          etiqueta="Usuarios inactivos"
          valor={resumen?.usuarios.inactivos}
          detalle="Sin acceso al sistema"
          tono="amber"
          cargando={cargandoResumen}
        />
        <ResumenCard
          icono={ShieldCheck}
          etiqueta="Administradores"
          valor={resumen?.usuarios.admins}
          detalle="Acceso total"
          tono="purple"
          cargando={cargandoResumen}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] max-w-md flex-1">
          <SearchInput
            placeholder="Buscar por nombre, usuario o correo..."
            value={search}
            onChange={(valor) => actualizar({ search: valor })}
          />
        </div>

        <ChipsEstado valor={estado} onChange={(valor) => actualizar({ estado: valor })} />

        <Select
          value={rol}
          onChange={(evento) => actualizar({ rol: evento.target.value })}
          options={OPCIONES_ROL_FILTRO}
          placeholder="Todos los roles"
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
            Nuevo usuario
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
            emptyTitle="Sin usuarios"
            emptyDescription="No se encontraron usuarios con los filtros aplicados."
            currentPage={data && data.totalPages > 1 ? data.page : undefined}
            totalPages={data && data.totalPages > 1 ? data.totalPages : undefined}
            onPageChange={(pagina) => actualizar({ page: pagina })}
          />
          {data && data.total > 0 && (
            <p className="mt-3 text-center text-xs text-muted">
              Mostrando {desde}–{hasta} de {data.total} {data.total === 1 ? 'usuario' : 'usuarios'}
            </p>
          )}
        </>
      )}

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingUser(null)
        }}
        editingUser={editingUser}
        esPropio={editingUser ? esUsuarioActual(editingUser) : false}
        onSave={async (datos) => {
          if (editingUser) {
            await updateMutation.mutateAsync({
              id: editingUser.id,
              data: datos as UpdateUsuarioInput,
            })
          } else {
            await createMutation.mutateAsync(datos as CreateUsuarioInput)
          }
          setModalOpen(false)
          setEditingUser(null)
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <PasswordModal
        open={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        usuario={passwordModalUser}
        onSave={async (password) => {
          if (passwordModalUser) {
            await passwordMutation.mutateAsync({ id: passwordModalUser.id, password })
            await refetch()
          }
          setPasswordModalUser(null)
        }}
        loading={passwordMutation.isPending}
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
        title="Desactivar usuario"
        message={`¿Está seguro de desactivar al usuario "${deleteTarget?.username}"? Conservará su historial, pero no podrá iniciar sesión.`}
        confirmText="Desactivar"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
