interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  )
}
