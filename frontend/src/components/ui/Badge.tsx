import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-muted text-muted dark:text-foreground',
  blue: 'bg-secondary/12 text-secondary dark:bg-secondary/20 dark:text-indigo-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
  gray: 'bg-surface-muted text-muted dark:text-subtle',
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
