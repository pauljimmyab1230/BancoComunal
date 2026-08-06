export function getFullUrl(
  req: { protocol: string; get: (name: string) => string | undefined },
  relativePath: string | null | undefined,
  token?: string | null,
): string | null {
  if (!relativePath) return null
  const host = req.get('host') || 'localhost:3000'
  const query = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${req.protocol}://${host}${relativePath}${query}`
}
