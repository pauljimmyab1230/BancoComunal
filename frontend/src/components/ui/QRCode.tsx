import { useEffect, useState } from 'react'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export default function QRCode({ value, size = 200, className }: QRCodeProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCodeLib.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setSrc(url)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!src) return null

  return <img src={src} alt="Código QR" width={size} height={size} className={className} />
}
