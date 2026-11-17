import type { PaginatedResponse } from '../types'

const TAMANO_PAGINA_EXPORTACION = 200

/**
 * Recorre todas las páginas del endpoint para exportar el conjunto completo,
 * no solo la página visible.
 */
export async function recolectarPaginas<T>(
  cargar: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit = TAMANO_PAGINA_EXPORTACION
): Promise<T[]> {
  const primera = await cargar(1, limit)
  const datos = [...primera.data]

  if (primera.totalPages > 1) {
    const paginas = Array.from({ length: primera.totalPages - 1 }, (_, indice) => indice + 2)
    const restantes = await Promise.all(paginas.map((pagina) => cargar(pagina, limit)))
    for (const respuesta of restantes) datos.push(...respuesta.data)
  }

  return datos
}
