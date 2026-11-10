import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all resize-none
          ${
            error
              ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20'
              : 'border-gray-200 focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20'
          }
          placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
