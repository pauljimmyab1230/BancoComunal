interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export default function SectionHeader({
  title,
  description,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
}
