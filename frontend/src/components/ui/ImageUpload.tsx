import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (file: File | null, preview: string) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export default function ImageUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  className = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState(value || '')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback(
    (file: File): boolean => {
      setError('')
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen')
        return false
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`El archivo supera ${maxSizeMB}MB`)
        return false
      }
      return true
    },
    [maxSizeMB],
  )

  const handleFile = (file: File) => {
    if (!validate(file)) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      onChange(file, result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview('')
    setError('')
    onChange(null, '')
    if (inputRef.current) inputRef.current.value = ''
  }

  if (preview) {
    return (
      <div className={`relative inline-block overflow-hidden rounded-xl border border-gray-200 ${className}`}>
        <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A]/70 text-white transition-colors hover:bg-[#0F172A]"
          aria-label="Eliminar imagen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all ${
          dragOver
            ? 'border-[#2563EB] bg-[#2563EB]/5'
            : 'border-gray-300 bg-gray-50/50 hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5'
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
          {dragOver ? <Upload className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
        </div>
        <p className="text-sm font-medium text-[#111827]">
          Arrastra una imagen o haz clic para subir
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PNG, JPG, WEBP (máx. {maxSizeMB}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
