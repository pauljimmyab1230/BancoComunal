import { useEffect, useState } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Key, Save, ShieldCheck, UserCog } from 'lucide-react'
import { Button, ConfirmDialog, FormField, Input, Modal, Select } from '@/components/ui'
import { usuarioFormSchema, type UsuarioFormValues } from '../schemas/configuracionSchema'
import type { Usuario } from '../types'
import type { CreateUsuarioInput, UpdateUsuarioInput } from '../api/configuracionApi'
import { OPCIONES_ROL, VALORES_USUARIO_INICIALES } from './comunes'

interface UsuarioFormModalProps {
  open: boolean
  onClose: () => void
  editingUser: Usuario | null
  onSave: (datos: CreateUsuarioInput | UpdateUsuarioInput) => Promise<void>
  loading: boolean
  esPropio?: boolean
}

export default function UsuarioFormModal({
  open,
  onClose,
  editingUser,
  onSave,
  loading,
  esPropio = false,
}: UsuarioFormModalProps) {
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: VALORES_USUARIO_INICIALES,
  })

  const { field: rolField } = useController({ control, name: 'rol' })
  const { field: estadoField } = useController({ control, name: 'estado' })

  useEffect(() => {
    if (!open) return
    reset(
      editingUser
        ? {
            nombres: editingUser.nombres,
            apellidoPaterno: editingUser.apellidoPaterno,
            apellidoMaterno: editingUser.apellidoMaterno || '',
            username: editingUser.username,
            password: '',
            correo: editingUser.correo || '',
            telefono: editingUser.telefono || '',
            rol: editingUser.rol as UsuarioFormValues['rol'],
            estado: editingUser.estado,
          }
        : VALORES_USUARIO_INICIALES
    )
  }, [open, editingUser, reset])

  const cerrar = () => {
    setMostrarPassword(false)
    setConfirmarCierre(false)
    onClose()
  }

  const solicitarCierre = () => {
    if (isDirty && !loading) setConfirmarCierre(true)
    else cerrar()
  }

  const enviar = async (valores: UsuarioFormValues) => {
    if (!editingUser && !valores.password) {
      setError('password', { message: 'La contraseña es obligatoria al crear un usuario' })
      return
    }

    const datosBase = {
      nombres: valores.nombres.trim(),
      apellidoPaterno: valores.apellidoPaterno.trim(),
      apellidoMaterno: valores.apellidoMaterno?.trim() || '',
      username: valores.username.trim(),
      correo: valores.correo || '',
      telefono: valores.telefono || '',
      rol: valores.rol,
      estado: valores.estado,
    }

    try {
      if (editingUser) {
        await onSave(datosBase)
      } else {
        await onSave({ ...datosBase, password: valores.password ?? '' })
      }
      setMostrarPassword(false)
    } catch {
      // Los hooks de mutación ya muestran el mensaje de error.
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={solicitarCierre}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-6">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserCog className="h-4 w-4 text-secondary" aria-hidden="true" />
              Datos personales
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nombres" required error={errors.nombres?.message}>
                <Input
                  autoComplete="given-name"
                  error={errors.nombres?.message}
                  {...register('nombres')}
                />
              </FormField>
              <FormField label="Apellido paterno" required error={errors.apellidoPaterno?.message}>
                <Input
                  autoComplete="family-name"
                  error={errors.apellidoPaterno?.message}
                  {...register('apellidoPaterno')}
                />
              </FormField>
              <FormField label="Apellido materno" error={errors.apellidoMaterno?.message}>
                <Input
                  autoComplete="additional-name"
                  error={errors.apellidoMaterno?.message}
                  {...register('apellidoMaterno')}
                />
              </FormField>
              <FormField label="Correo electrónico" error={errors.correo?.message}>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@organizacion.com"
                  error={errors.correo?.message}
                  {...register('correo')}
                />
              </FormField>
              <FormField label="Teléfono" error={errors.telefono?.message}>
                <Input
                  autoComplete="tel"
                  placeholder="999 999 999"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
              </FormField>
              <FormField
                label="Nombre de usuario"
                required
                error={errors.username?.message}
                description="Se usa para iniciar sesión. Sin espacios."
              >
                <Input
                  autoComplete="username"
                  placeholder="ej: jperez"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </FormField>
            </div>
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-secondary" aria-hidden="true" />
              Acceso y rol
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Rol"
                error={errors.rol?.message}
                description={esPropio ? 'No puedes cambiarte el rol a ti mismo.' : undefined}
              >
                <Select
                  options={OPCIONES_ROL}
                  value={rolField.value}
                  onChange={rolField.onChange}
                  disabled={esPropio}
                />
              </FormField>
              <FormField
                label="Estado"
                error={errors.estado?.message}
                description={esPropio ? 'No puedes desactivar tu propia cuenta.' : undefined}
              >
                <Select
                  options={[
                    { value: 'ACTIVO', label: 'Activo' },
                    { value: 'INACTIVO', label: 'Inactivo' },
                  ]}
                  value={estadoField.value}
                  onChange={estadoField.onChange}
                  disabled={esPropio}
                />
              </FormField>

              {!editingUser ? (
                <div className="sm:col-span-2">
                  <FormField
                    label="Contraseña"
                    required
                    error={errors.password?.message}
                    description="Mínimo 10 caracteres, con una letra, un número y un símbolo."
                  >
                    {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
                      <div className="relative">
                        <Input
                          id={id}
                          aria-describedby={descritoPor}
                          aria-invalid={invalido}
                          type={mostrarPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className="pr-11"
                          error={errors.password?.message}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassword((previo) => !previo)}
                          aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-subtle transition-colors hover:text-foreground"
                        >
                          {mostrarPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </FormField>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface-muted/60 p-3 sm:col-span-2">
                  <Key className="mt-0.5 h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
                  <p className="text-xs text-muted">
                    Para cambiar la contraseña de este usuario, usa el botón de llave en la lista.
                    El usuario deberá cambiarla en su próximo inicio de sesión.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={solicitarCierre} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} iconLeft={<Save className="h-4 w-4" />}>
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        onConfirm={cerrar}
        title="Descartar cambios"
        message="Hay cambios sin guardar en este usuario. ¿Deseas cerrar y descartarlos?"
        confirmText="Descartar"
        cancelText="Seguir editando"
      />
    </>
  )
}
