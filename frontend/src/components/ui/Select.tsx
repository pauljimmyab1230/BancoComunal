import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)

Select.displayName = 'Select'

export default Select
