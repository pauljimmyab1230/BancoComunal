import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Key, ShieldAlert } from 'lucide-react'
import { Button, ConfirmDialog, FormField, Input, Modal } from '@/components/ui'
import { passwordFormSchema, type PasswordFormValues } from '../schemas/configuracionSchema'
import type { Usuario } from '../types'
import { calcularFuerza } from './comunes'

interface PasswordModalProps {
  open: boolean
  onClose: () => void
  usuario: Usuario | null
  onSave: (password: string) => Promise<void>
  loading: boolean
}

export default function PasswordModal({
  open,
  onClose,
  usuario,
  onSave,
  loading,
}: PasswordModalProps) {
  const [mostrar, setMostrar] = useState(false)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: '', confirmacion: '' },
  })

  const contrasena = useWatch({ control, name: 'password' }) ?? ''
  const fuerza = calcularFuerza(contrasena)

  useEffect(() => {
    if (!open) return
    reset({ password: '', confirmacion: '' })
  }, [open, reset])

  const cerrar = () => {
    setMostrar(false)
    setConfirmarCierre(false)
    onClose()
  }

  const solicitarCierre = () => {
    if (isDirty && !loading) setConfirmarCierre(true)
    else cerrar()
  }

  const enviar = async ({ password }: PasswordFormValues) => {
    try {
      await onSave(password)
      setMostrar(false)
      setConfirmarCierre(false)
    } catch {
      // Los hooks de mutación ya muestran el mensaje de error.
    }
  }

  return (
    <>
      <Modal open={open} onClose={solicitarCierre} title="Cambiar contraseña" maxWidth="md">
        <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-muted/60 p-3">
            <Key className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
            <p className="text-sm text-muted">
              Nueva contraseña para{' '}
              <span className="font-medium text-foreground">
                {usuario ? `${usuario.nombres} ${usuario.apellidoPaterno}` : 'el usuario'}
              </span>
              .
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-xs">
              El usuario deberá cambiar esta contraseña en su próximo inicio de sesión y se cerrarán
              todas sus sesiones activas.
            </p>
          </div>

          <FormField label="Nueva contraseña" required error={errors.password?.message}>
            {({ id, 'aria-describedby': descritoPor, 'aria-invalid': invalido }) => (
              <div className="relative">
                <Input
                  id={id}
                  aria-describedby={descritoPor}
                  aria-invalid={invalido}
                  type={mostrar ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="pr-11"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setMostrar((previo) => !previo)}
                  aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-subtle transition-colors hover:text-foreground"
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
          </FormField>

          {contrasena && (
            <div>
              <div className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((indice) => (
                  <span
                    key={indice}
                    className={`h-1.5 flex-1 rounded-full ${
                      indice < fuerza.nivel ? fuerza.barra : 'bg-surface-muted'
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1.5 text-xs font-medium ${fuerza.texto}`}>
                Seguridad: {fuerza.etiqueta}
              </p>
            </div>
          )}

          <FormField
            label="Confirmar contraseña"
            required
            error={errors.confirmacion?.message}
            description="Mínimo 10 caracteres, con una letra, un número y un símbolo."
          >
            <Input
              type={mostrar ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.confirmacion?.message}
              {...register('confirmacion')}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={solicitarCierre} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} iconLeft={<Key className="h-4 w-4" />}>
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        onConfirm={cerrar}
        title="Descartar cambios"
        message="Hay una contraseña escrita sin guardar. ¿Deseas cerrar y descartarla?"
        confirmText="Descartar"
        cancelText="Seguir editando"
      />
    </>
  )
}
