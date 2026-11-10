import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
  'aria-label'?: string
}

export default function SearchInput({
  placeholder = 'Buscar...',
  value = '',
  onChange,
  debounceMs = 300,
  className = '',
  'aria-label': ariaLabel,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (prevValue !== value) {
    setPrevValue(value)
    setLocalValue(value)
  }

  const handleChange = (val: string) => {
    setLocalValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(val), debounceMs)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20"
      />
    </div>
  )
}
