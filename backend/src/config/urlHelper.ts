export function getFullUrl(req: { protocol: string; get: (name: string) => string | undefined }, relativePath: string | null | undefined): string | null {
  if (!relativePath) return null
  const host = req.get('host') || 'localhost:3000'
  return `${req.protocol}://${host}${relativePath}`
}
