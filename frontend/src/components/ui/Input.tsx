import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border bg-gray-50/50 px-4 py-2.5 text-sm text-[#111827] outline-none transition-all
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20'
          }
          placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
