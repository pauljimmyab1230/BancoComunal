import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition-all resize-none placeholder:text-subtle
          ${
            error
              ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20'
              : 'border-border focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
