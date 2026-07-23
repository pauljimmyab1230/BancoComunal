import { useState } from 'react'
import { Users, Key, BookOpen, Building2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  useUsuarios,
  useUsuario,
  useCreateUsuario,
  useUpdateUsuario,
  useUpdatePassword,
  useDeleteUsuario,
  useLogin,
  useConceptos,
  useCreateConcepto,
  useUpdateConcepto,
  useDeleteConcepto,
  useOrganizacion,
  useUpdateOrganizacion,
} from '../hooks/useConfiguracion'
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  SectionHeader,
  Badge,
  Modal,
  ConfirmDialog,
  LoadingSpinner,
  EmptyState,
  Pagination,
  SearchInput,
} from '@/components/ui'
import type { Usuario, ConceptoCajaItem } from '../types'

const tabs = [
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'login', label: 'Login', icon: Key },
  { id: 'conceptos', label: 'Conceptos de Caja', icon: BookOpen },
  { id: 'organizacion', label: 'Organización', icon: Building2 },
]

// ──────────────────────────────────────────────────────────────────────────────
// USUARIOS TAB
// ──────────────────────────────────────────────────────────────────────────────
function UsuariosTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rolFilter, setRolFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [passwordModalUser, setPasswordModalUser] = useState<Usuario | null>(null)

  const { data, isLoading } = useUsuarios({ page, limit: 10, search: search || undefined, rol: rolFilter || undefined, estado: estadoFilter || undefined })
  const createMutation = useCreateUsuario()
  const updateMutation = useUpdateUsuario()
  const deleteMutation = useDeleteUsuario()
  const passwordMutation = useUpdatePassword()

  const openCreate = () => { setEditingUser(null); setModalOpen(true) }
  const openEdit = (u: Usuario) => { setEditingUser(u); setModalOpen(true) }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <SearchInput placeholder="Buscar por nombre, usuario o correo..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <FormField label="Rol">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'CAJERO', label: 'Cajero' },
                { value: 'CONTADOR', label: 'Contador' },
                { value: 'PRESIDENTE', label: 'Presidente' },
                { value: 'TESORERO', label: 'Tesorero' },
              ]}
              value={rolFilter}
              onChange={(e) => { setRolFilter(e.target.value); setPage(1) }}
            />
          </FormField>
          <FormField label="Estado">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' },
              ]}
              value={estadoFilter}
              onChange={(e) => { setEstadoFilter(e.target.value); setPage(1) }}
            />
          </FormField>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner text="Cargando usuarios..." /></div>
      ) : !data?.data?.length ? (
        <EmptyState title="Sin usuarios" description="No se encontraron usuarios con los filtros aplicados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Nombres</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Correo</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Rol</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs">{u.username}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{u.nombres} {u.apellidoPaterno}</div>
                      {u.apellidoMaterno && <div className="text-xs text-gray-500">{u.apellidoMaterno}</div>}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.correo || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={u.rol === 'ADMIN' ? 'purple' : u.rol === 'CAJERO' ? 'blue' : 'gray'}>{u.rol}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={u.estado === 'ACTIVO' ? 'green' : 'gray'}>{u.estado}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setPasswordModalUser(u)}><Key className="h-4 w-4" /></Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null) }}
        editingUser={editingUser}
        onSave={async (data) => {
          if (editingUser) {
            await updateMutation.mutateAsync({ id: editingUser.id, data })
          } else {
            await createMutation.mutateAsync(data)
          }
          setModalOpen(false)
          setEditingUser(null)
        }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <PasswordModal
        open={!!passwordModalUser}
        onClose={() => setPasswordModalUser(null)}
        onSave={async (password) => {
          if (passwordModalUser) {
            await passwordMutation.mutateAsync({ id: passwordModalUser.id, password })
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
        title="Eliminar Usuario"
        message={`¿Está seguro de eliminar al usuario "${deleteTarget?.username}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function UsuarioFormModal({ open, onClose, editingUser, onSave, loading }: {
  open: boolean
  onClose: () => void
  editingUser: Usuario | null
  onSave: (data: any) => Promise<void>
  loading: boolean
}) {
  const [form, setForm] = useState({
    nombres: '', apellidoPaterno: '', apellidoMaterno: '',
    username: '', password: '', correo: '', telefono: '',
    rol: 'CAJERO', estado: 'ACTIVO',
  })

  const initForm = () => {
    if (editingUser) {
      setForm({
        nombres: editingUser.nombres, apellidoPaterno: editingUser.apellidoPaterno,
        apellidoMaterno: editingUser.apellidoMaterno || '', username: editingUser.username,
        password: '', correo: editingUser.correo || '', telefono: editingUser.telefono || '',
        rol: editingUser.rol, estado: editingUser.estado,
      })
    } else {
      setForm({ nombres: '', apellidoPaterno: '', apellidoMaterno: '', username: '', password: '', correo: '', telefono: '', rol: 'CAJERO', estado: 'ACTIVO' })
    }
  }

  if (open) initForm()

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'} maxWidth="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Nombres" required>
          <Input value={form.nombres} onChange={(e) => field('nombres', e.target.value)} />
        </FormField>
        <FormField label="Apellido Paterno" required>
          <Input value={form.apellidoPaterno} onChange={(e) => field('apellidoPaterno', e.target.value)} />
        </FormField>
        <FormField label="Apellido Materno">
          <Input value={form.apellidoMaterno} onChange={(e) => field('apellidoMaterno', e.target.value)} />
        </FormField>
        <FormField label="Username" required>
          <Input value={form.username} onChange={(e) => field('username', e.target.value)} />
        </FormField>
        {!editingUser && (
          <FormField label="Contraseña" required>
            <Input type="password" value={form.password} onChange={(e) => field('password', e.target.value)} />
          </FormField>
        )}
        <FormField label="Correo">
          <Input type="email" value={form.correo} onChange={(e) => field('correo', e.target.value)} />
        </FormField>
        <FormField label="Teléfono">
          <Input value={form.telefono} onChange={(e) => field('telefono', e.target.value)} />
        </FormField>
        <FormField label="Rol">
          <Select
            options={[
              { value: 'ADMIN', label: 'Admin' },
              { value: 'CAJERO', label: 'Cajero' },
              { value: 'CONTADOR', label: 'Contador' },
              { value: 'PRESIDENTE', label: 'Presidente' },
              { value: 'TESORERO', label: 'Tesorero' },
            ]}
            value={form.rol}
            onChange={(e) => field('rol', e.target.value)}
          />
        </FormField>
        <FormField label="Estado">
          <Select
            options={[
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'INACTIVO', label: 'Inactivo' },
            ]}
            value={form.estado}
            onChange={(e) => field('estado', e.target.value)}
          />
        </FormField>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(form)} loading={loading}>{editingUser ? 'Guardar' : 'Crear'}</Button>
      </div>
    </Modal>
  )
}

function PasswordModal({ open, onClose, onSave, loading }: {
  open: boolean
  onClose: () => void
  onSave: (password: string) => Promise<void>
  loading: boolean
}) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Cambiar Contraseña" maxWidth="sm">
      <FormField label="Nueva Contraseña" required>
        <div className="relative">
          <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShow(!show)}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FormField>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { if (password) onSave(password) }} loading={loading} disabled={!password}>Guardar</Button>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN TAB
// ──────────────────────────────────────────────────────────────────────────────
function LoginTab() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const loginMutation = useLogin()

  const handleLogin = async () => {
    if (!username || !password) return
    const result = await loginMutation.mutateAsync({ username, password })
    if (result?.success) {
      alert('Login exitoso! Bienvenido ' + (result.data?.usuario?.nombres || username))
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Iniciar Sesión</h3>
        <div className="space-y-4">
          <FormField label="Usuario" required>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ingrese su usuario" />
          </FormField>
          <FormField label="Contraseña" required>
            <div className="relative">
              <Input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingrese su contraseña" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <Button className="w-full" onClick={handleLogin} loading={loginMutation.isPending} disabled={!username || !password}>
            Iniciar Sesión
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// CONCEPTOS DE CAJA TAB
// ──────────────────────────────────────────────────────────────────────────────
function ConceptosTab() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCajaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConceptoCajaItem | null>(null)

  const { data, isLoading } = useConceptos({ page, limit: 20, search: search || undefined, tipo: tipoFilter || undefined, estado: estadoFilter || undefined })
  const createMutation = useCreateConcepto()
  const updateMutation = useUpdateConcepto()
  const deleteMutation = useDeleteConcepto()

  const openCreate = () => { setEditingConcepto(null); setModalOpen(true) }
  const openEdit = (c: ConceptoCajaItem) => { setEditingConcepto(c); setModalOpen(true) }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <SearchInput placeholder="Buscar por código o nombre..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <FormField label="Tipo">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'INGRESO', label: 'Ingreso' },
                { value: 'EGRESO', label: 'Egreso' },
                { value: 'APORTE', label: 'Aporte' },
                { value: 'AHORRO', label: 'Ahorro' },
                { value: 'CREDITO', label: 'Crédito' },
                { value: 'OTRO', label: 'Otro' },
              ]}
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1) }}
            />
          </FormField>
          <FormField label="Estado">
            <Select
              options={[
                { value: '', label: 'Todos' },
                { value: 'ACTIVO', label: 'Activos' },
                { value: 'INACTIVO', label: 'Inactivos' },
              ]}
              value={estadoFilter}
              onChange={(e) => { setEstadoFilter(e.target.value); setPage(1) }}
            />
          </FormField>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner text="Cargando conceptos..." /></div>
      ) : !data?.data?.length ? (
        <EmptyState title="Sin conceptos" description="No se encontraron conceptos con los filtros aplicados." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Código</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Nombre</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Tipo</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Afecta Saldo</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Comprobante</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs">{c.codigo}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{c.nombre}</div>
                      {c.descripcion && <div className="text-xs text-gray-500 max-w-[300px] truncate">{c.descripcion}</div>}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={c.tipo === 'INGRESO' ? 'green' : c.tipo === 'EGRESO' ? 'red' : c.tipo === 'APORTE' ? 'blue' : c.tipo === 'AHORRO' ? 'purple' : c.tipo === 'CREDITO' ? 'yellow' : 'gray'}>{c.tipo}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center text-sm text-gray-600">{c.afectaSaldo}</td>
                    <td className="px-5 py-3 text-center text-sm">{c.requiereComprobante ? 'Sí' : 'No'}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={c.estado === 'ACTIVO' ? 'green' : 'gray'}>{c.estado}</Badge>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="border-t border-gray-100 px-5 py-3">
              <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      <ConceptoFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingConcepto(null) }}
        editingConcepto={editingConcepto}
        onSave={async (formData) => {
          if (editingConcepto) {
            await updateMutation.mutateAsync({ id: editingConcepto.id, data: formData })
          } else {
            await createMutation.mutateAsync(formData)
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
        title="Eliminar Concepto"
        message={`¿Está seguro de eliminar el concepto "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function ConceptoFormModal({ open, onClose, editingConcepto, onSave, loading }: {
  open: boolean
  onClose: () => void
  editingConcepto: ConceptoCajaItem | null
  onSave: (data: any) => Promise<void>
  loading: boolean
}) {
  const [form, setForm] = useState({
    codigo: '', nombre: '', tipo: 'INGRESO', afectaSaldo: 'AUMENTA',
    descripcion: '', requiereComprobante: 'NO', orden: '0', estado: 'ACTIVO',
  })

  const initForm = () => {
    if (editingConcepto) {
      setForm({
        codigo: editingConcepto.codigo, nombre: editingConcepto.nombre,
        tipo: editingConcepto.tipo, afectaSaldo: editingConcepto.afectaSaldo,
        descripcion: editingConcepto.descripcion || '', requiereComprobante: editingConcepto.requiereComprobante ? 'SI' : 'NO',
        orden: String(editingConcepto.orden), estado: editingConcepto.estado,
      })
    } else {
      setForm({ codigo: '', nombre: '', tipo: 'INGRESO', afectaSaldo: 'AUMENTA', descripcion: '', requiereComprobante: 'NO', orden: '0', estado: 'ACTIVO' })
    }
  }

  if (open) initForm()

  const field = (key: keyof typeof form, value: string) => setForm((p) => ({ ...p, [key]: value }))

  return (
    <Modal open={open} onClose={onClose} title={editingConcepto ? 'Editar Concepto' : 'Nuevo Concepto'} maxWidth="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Código" required>
          <Input value={form.codigo} onChange={(e) => field('codigo', e.target.value)} placeholder="Ej: ING-001" />
        </FormField>
        <FormField label="Nombre" required>
          <Input value={form.nombre} onChange={(e) => field('nombre', e.target.value)} />
        </FormField>
        <FormField label="Tipo">
          <Select
            options={[
              { value: 'INGRESO', label: 'Ingreso' },
              { value: 'EGRESO', label: 'Egreso' },
              { value: 'APORTE', label: 'Aporte' },
              { value: 'AHORRO', label: 'Ahorro' },
              { value: 'CREDITO', label: 'Crédito' },
              { value: 'OTRO', label: 'Otro' },
            ]}
            value={form.tipo}
            onChange={(e) => field('tipo', e.target.value)}
          />
        </FormField>
        <FormField label="Afecta Saldo">
          <Select
            options={[
              { value: 'AUMENTA', label: 'Aumenta' },
              { value: 'DISMINUYE', label: 'Disminuye' },
              { value: 'NO_AFECTA', label: 'No Afecta' },
            ]}
            value={form.afectaSaldo}
            onChange={(e) => field('afectaSaldo', e.target.value)}
          />
        </FormField>
        <FormField label="Requiere Comprobante">
          <Select
            options={[
              { value: 'NO', label: 'No' },
              { value: 'SI', label: 'Sí' },
            ]}
            value={form.requiereComprobante}
            onChange={(e) => field('requiereComprobante', e.target.value)}
          />
        </FormField>
        <FormField label="Orden">
          <Input type="number" value={form.orden} onChange={(e) => field('orden', e.target.value)} />
        </FormField>
        <FormField label="Estado">
          <Select
            options={[
              { value: 'ACTIVO', label: 'Activo' },
              { value: 'INACTIVO', label: 'Inactivo' },
            ]}
            value={form.estado}
            onChange={(e) => field('estado', e.target.value)}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Descripción">
            <Input value={form.descripcion} onChange={(e) => field('descripcion', e.target.value)} placeholder="Descripción del concepto" />
          </FormField>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ ...form, orden: Number(form.orden), requiereComprobante: form.requiereComprobante === 'SI' })} loading={loading}>{editingConcepto ? 'Guardar' : 'Crear'}</Button>
      </div>
    </Modal>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// ORGANIZACIÓN TAB
// ──────────────────────────────────────────────────────────────────────────────
function OrganizacionTab() {
  const { data: organizacion, isLoading } = useOrganizacion()
  const updateMutation = useUpdateOrganizacion()

  const [orgName, setOrgName] = useState('')
  const [moneda, setMoneda] = useState('')
  const [initialized, setInitialized] = useState(false)

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner text="Cargando organización..." /></div>

  if (organizacion && !initialized) {
    setOrgName(organizacion.organizacion || '')
    setMoneda(organizacion.monedaDefault || 'PEN')
    setInitialized(true)
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({ organizacion: orgName, monedaDefault: moneda })
  }

  return (
    <div className="max-w-xl">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Organización</h3>
        <div className="space-y-4">
          <FormField label="Nombre de la Organización" required>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </FormField>
          <FormField label="Moneda por Defecto">
            <Select
              options={[
                { value: 'PEN', label: 'Soles (PEN)' },
                { value: 'USD', label: 'Dólares (USD)' },
                { value: 'EUR', label: 'Euros (EUR)' },
              ]}
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Guardar</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('usuarios')

  return (
    <div>
      <SectionHeader title="Configuración" description="Gestión de usuarios, catálogos y parámetros del sistema" />

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'usuarios' && <UsuariosTab />}
      {activeTab === 'login' && <LoginTab />}
      {activeTab === 'conceptos' && <ConceptosTab />}
      {activeTab === 'organizacion' && <OrganizacionTab />}
    </div>
  )
}
