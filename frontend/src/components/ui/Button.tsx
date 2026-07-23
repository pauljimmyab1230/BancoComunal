import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
}

type ButtonAsButton = ButtonBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & { as?: never; to?: never }
type ButtonAsLink = ButtonBaseProps & Omit<LinkProps, keyof ButtonBaseProps> & { as: 'link'; to: string }

type ButtonProps = ButtonAsButton | ButtonAsLink

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white shadow-md shadow-[#2563EB]/25 hover:shadow-lg hover:shadow-[#2563EB]/30 active:scale-[0.98]',
  secondary:
    'border-2 border-[#2563EB] text-[#2563EB] hover:bg-[#2563EB]/5 active:scale-[0.98]',
  ghost:
    'text-[#111827] hover:bg-gray-100',
  danger:
    'bg-red-600 text-white shadow-md shadow-red-600/25 hover:bg-red-700 active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-3 py-1.5 text-xs gap-1.5',
  md: 'rounded-xl px-5 py-2.5 text-sm gap-2',
  lg: 'rounded-xl px-7 py-3.5 text-base gap-2.5',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  )

  if ('to' in props && props.to) {
    return (
      <Link className={classes} {...(props as LinkProps)}>
        {content}
      </Link>
    )
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}
