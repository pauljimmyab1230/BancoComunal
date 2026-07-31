import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'options'> {
  error?: string
  options: SelectOption[]
  placeholder?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const makeChangeEvent = (name: string | undefined, value: string): React.ChangeEvent<HTMLSelectElement> =>
  ({ target: { name: name ?? '', value } } as unknown as React.ChangeEvent<HTMLSelectElement>)

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      error,
      options,
      placeholder,
      onChange,
      onBlur,
      disabled,
      value: valueProp,
      defaultValue,
      name,
      required,
      ...props
    },
    ref
  ) => {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = useState<string>(String(defaultValue ?? ''))
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null)
    const hiddenRef = useRef<HTMLSelectElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const panelRef = useRef<HTMLDivElement | null>(null)

    const currentValue = isControlled ? String(valueProp ?? '') : internalValue
    const selectedOption = options.find((o) => String(o.value) === currentValue)

    const syncRef = (node: HTMLSelectElement | null) => {
      hiddenRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    // Modo no controlado: seguir el valor del <select> oculto (react-hook-form lo escribe via ref)
    useEffect(() => {
      if (!isControlled && hiddenRef.current && hiddenRef.current.value !== internalValue) {
        setInternalValue(hiddenRef.current.value)
      }
    })

    useEffect(() => {
      if (!open) return
      const close = () => setOpen(false)
      const onDocMouseDown = (e: MouseEvent) => {
        const target = e.target as Node
        const inside =
          (containerRef.current && containerRef.current.contains(target)) ||
          (panelRef.current && panelRef.current.contains(target))
        if (!inside) setOpen(false)
      }
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      document.addEventListener('mousedown', onDocMouseDown)
      return () => {
        window.removeEventListener('scroll', close, true)
        window.removeEventListener('resize', close)
        document.removeEventListener('mousedown', onDocMouseDown)
      }
    }, [open])

    const openPanel = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPanelPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(0, Math.min(rect.width, window.innerWidth - rect.left - 16)),
      })
      setOpen(true)
    }

    const selectValue = (val: string) => {
      setOpen(false)
      if (!isControlled) {
        if (hiddenRef.current) hiddenRef.current.value = val
        setInternalValue(val)
      }
      onChange?.(makeChangeEvent(name, val))
      onBlur?.({} as React.FocusEvent<HTMLSelectElement>)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setActiveIndex(Math.max(0, options.findIndex((o) => String(o.value) === currentValue)))
          openPanel()
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (options[activeIndex]) selectValue(String(options[activeIndex].value))
        return
      }
      if (e.key === 'Tab') setOpen(false)
    }

    const triggerStyles = `flex w-full items-center justify-between gap-2 rounded-xl border bg-gray-50/50 px-4 py-2.5 text-left text-sm outline-none transition-all
      ${error
        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
      }
      ${open ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20' : ''}
      disabled:opacity-50 disabled:cursor-not-allowed`

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openPanel())}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={triggerStyles}
        >
          <span className={`truncate ${selectedOption ? 'text-[#111827]' : 'text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder || 'Seleccionar'}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Select nativo oculto: mantiene la integración con formularios (register/valueAsNumber/submit) */}
        <select
          ref={syncRef}
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
          value={isControlled ? currentValue : undefined}
          {...props}
        >
          {placeholder && <option value="" />}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {open &&
          panelPos &&
          createPortal(
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[120] rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl shadow-gray-200/60"
              style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
            >
              <ul role="listbox" className="max-h-60 overflow-auto">
                {options.length === 0 && (
                  <li className="px-4 py-2.5 text-sm text-gray-400">Sin opciones</li>
                )}
                {options.map((opt, i) => {
                  const selected = String(opt.value) === currentValue
                  const active = i === activeIndex
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectValue(String(opt.value))}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-sm transition-colors ${
                        selected
                          ? 'bg-[#2563EB]/10 font-medium text-[#2563EB]'
                          : active
                            ? 'bg-gray-100 text-[#111827]'
                            : 'text-[#111827]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {selected && <Check className="h-4 w-4 shrink-0" />}
                    </li>
                  )
                })}
              </ul>
            </motion.div>,
            document.body
          )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
