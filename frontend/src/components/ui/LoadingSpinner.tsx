interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}

export default function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${sizeMap[size]} animate-spin rounded-full border-4 border-[#2563EB]/20 border-t-[#2563EB]`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}
