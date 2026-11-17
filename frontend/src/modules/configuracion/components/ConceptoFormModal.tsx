import { useEffect, useState } from 'react'
import { useForm, useController, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Save } from 'lucide-react'
import { Button, ConfirmDialog, FormField, Input, Modal, Select, Textarea } from '@/components/ui'
import { conceptoFormSchema, type ConceptoFormValues } from '../schemas/configuracionSchema'
import type { ConceptoCajaItem } from '../types'
import type { CreateConceptoInput, UpdateConceptoInput } from '../api/configuracionApi'
import { OPCIONES_AFECTA_SALDO, OPCIONES_TIPO, VALORES_CONCEPTO_INICIALES } from './comunes'

interface ConceptoFormModalProps {
  open: boolean
  onClose: () => void
  editingConcepto: ConceptoCajaItem | null
  onSave: (datos: CreateConceptoInput | UpdateConceptoInput) => Promise<void>
  loading: boolean
}

export default function ConceptoFormModal({
  open,
  onClose,
  editingConcepto,
  onSave,
  loading,
}: ConceptoFormModalProps) {
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ConceptoFormValues>({
    resolver: zodResolver(conceptoFormSchema),
    defaultValues: VALORES_CONCEPTO_INICIALES,
  })

  const { field: tipoField } = useController({ control, name: 'tipo' })
  const { field: afectaSaldoField } = useController({ control, name: 'afectaSaldo' })
  const { field: estadoField } = useController({ control, name: 'estado' })
  const requiereComprobante = useWatch({ control, name: 'requiereComprobante' })

  const tieneMovimientos = (editingConcepto?.movimientos ?? 0) > 0

  useEffect(() => {
    if (!open) return
    reset(
      editingConcepto
        ? {
            codigo: editingConcepto.codigo,
            nombre: editingConcepto.nombre,
            tipo: editingConcepto.tipo as ConceptoFormValues['tipo'],
            afectaSaldo: editingConcepto.afectaSaldo as ConceptoFormValues['afectaSaldo'],
            descripcion: editingConcepto.descripcion || '',
            requiereComprobante: Boolean(editingConcepto.requiereComprobante),
            orden: editingConcepto.orden,
            estado: editingConcepto.estado as ConceptoFormValues['estado'],
          }
        : VALORES_CONCEPTO_INICIALES
    )
  }, [open, editingConcepto, reset])

  const cerrar = () => {
    setConfirmarCierre(false)
    onClose()
  }

  const solicitarCierre = () => {
    if (isDirty && !loading) setConfirmarCierre(true)
    else cerrar()
  }

  const enviar = async (valores: ConceptoFormValues) => {
    const datos = {
      ...valores,
      codigo: valores.codigo.trim(),
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion || '',
    }
    try {
      await onSave(datos)
      setConfirmarCierre(false)
    } catch {
      // Los hooks de mutación ya muestran el mensaje de error.
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={solicitarCierre}
        title={editingConcepto ? 'Editar concepto' : 'Nuevo concepto'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-4">
          {tieneMovimientos && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="text-xs">
                Este concepto tiene {editingConcepto?.movimientos} movimiento(s) registrado(s). Por
                integridad, el código, el tipo y el efecto sobre el saldo no se pueden modificar.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Código"
              required
              error={errors.codigo?.message}
              description={
                tieneMovimientos
                  ? 'Bloqueado porque el concepto ya tiene movimientos.'
                  : 'Identificador corto y único.'
              }
            >
              <Input
                placeholder="Ej: ING-001"
                className="font-mono uppercase"
                error={errors.codigo?.message}
                disabled={tieneMovimientos}
                {...register('codigo')}
              />
            </FormField>
            <FormField label="Nombre" required error={errors.nombre?.message}>
              <Input
                placeholder="Ej: Cuota de apertura"
                error={errors.nombre?.message}
                {...register('nombre')}
              />
            </FormField>
            <FormField
              label="Tipo"
              error={errors.tipo?.message}
              description={tieneMovimientos ? 'Bloqueado por tener movimientos.' : undefined}
            >
              <Select
                options={OPCIONES_TIPO}
                value={tipoField.value}
                onChange={tipoField.onChange}
                disabled={tieneMovimientos}
              />
            </FormField>
            <FormField
              label="Afecta saldo"
              error={errors.afectaSaldo?.message}
              description={tieneMovimientos ? 'Bloqueado por tener movimientos.' : undefined}
            >
              <Select
                options={OPCIONES_AFECTA_SALDO}
                value={afectaSaldoField.value}
                onChange={afectaSaldoField.onChange}
                disabled={tieneMovimientos}
              />
            </FormField>
            <FormField
              label="Orden"
              error={errors.orden?.message}
              description="Menor número aparece primero."
            >
              <Input
                type="number"
                min={0}
                error={errors.orden?.message}
                {...register('orden', { valueAsNumber: true })}
              />
            </FormField>
            <FormField label="Estado" error={errors.estado?.message}>
              <Select
                options={[
                  { value: 'ACTIVO', label: 'Activo' },
                  { value: 'INACTIVO', label: 'Inactivo' },
                ]}
                value={estadoField.value}
                onChange={estadoField.onChange}
              />
            </FormField>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Requiere comprobante</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Obliga a adjuntar o registrar un comprobante al usar este concepto.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(requiereComprobante)}
                  aria-label="Requiere comprobante"
                  onClick={() =>
                    setValue('requiereComprobante', !requiereComprobante, { shouldDirty: true })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    requiereComprobante ? 'bg-secondary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      requiereComprobante ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <FormField label="Descripción" error={errors.descripcion?.message}>
                <Textarea
                  rows={3}
                  placeholder="Detalle opcional del concepto"
                  error={errors.descripcion?.message}
                  {...register('descripcion')}
                />
              </FormField>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={solicitarCierre} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} iconLeft={<Save className="h-4 w-4" />}>
              {editingConcepto ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        onConfirm={cerrar}
        title="Descartar cambios"
        message="Hay cambios sin guardar en este concepto. ¿Deseas cerrar y descartarlos?"
        confirmText="Descartar"
        cancelText="Seguir editando"
      />
    </>
  )
}
