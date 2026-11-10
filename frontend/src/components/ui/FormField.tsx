import { Children, cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'

type ControlesCampo = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: ReactNode | ((controles: ControlesCampo) => ReactNode)
  htmlFor?: string
  description?: string
  className?: string
}

export type { ControlesCampo }

export default function FormField({
  label,
  error,
  required,
  children,
  htmlFor,
  description,
  className = '',
}: FormFieldProps) {
  const idGenerado = useId()
  const esRenderProp = typeof children === 'function'
  const primerElemento = esRenderProp
    ? null
    : ((Children.toArray(children).find(isValidElement) as
        ReactElement<Record<string, unknown>> | undefined) ?? null)
  const idExistente =
    primerElemento && typeof primerElemento.props.id === 'string'
      ? primerElemento.props.id
      : undefined
  const idControl = htmlFor ?? idExistente ?? idGenerado
  const idError = `${idControl}-error`
  const idDescripcion = `${idControl}-descripcion`
  const descritoPor =
    [description && !error ? idDescripcion : null, error ? idError : null]
      .filter(Boolean)
      .join(' ') || undefined

  const controles: ControlesCampo = {
    id: idControl,
    'aria-describedby': descritoPor,
    'aria-invalid': error ? true : undefined,
  }

  let clonado = false
  const contenido = esRenderProp
    ? (children as (c: ControlesCampo) => ReactNode)(controles)
    : Children.map(children, (hijo) => {
        if (!clonado && isValidElement(hijo)) {
          clonado = true
          return cloneElement(hijo as ReactElement<Record<string, unknown>>, controles)
        }
        return hijo
      })

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={idControl} className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {contenido}
      {description && !error && (
        <p id={idDescripcion} className="text-xs text-gray-600">
          {description}
        </p>
      )}
      {error && (
        <p id={idError} className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
