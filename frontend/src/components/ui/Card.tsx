import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-300 ${
        hover
          ? 'hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-[var(--shadow-pop)]'
          : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  )
}
