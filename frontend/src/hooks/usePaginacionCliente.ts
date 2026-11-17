import { useMemo, useState } from 'react'

/**
 * Paginación en cliente para listas que ya llegan completas del backend.
 * Devuelve la página actual (ajustada al rango), el subconjunto de datos
 * y los totales para el componente <Pagination>.
 */
export function usePaginacionCliente<T>(datos: T[], pageSize = 15) {
  const [pagina, setPagina] = useState(1)

  const totalPaginas = Math.max(1, Math.ceil(datos.length / pageSize))
  const paginaSegura = Math.min(pagina, totalPaginas)

  const datosPagina = useMemo(
    () => datos.slice((paginaSegura - 1) * pageSize, paginaSegura * pageSize),
    [datos, paginaSegura, pageSize]
  )

  const desde = datos.length === 0 ? 0 : (paginaSegura - 1) * pageSize + 1
  const hasta = Math.min(paginaSegura * pageSize, datos.length)

  return { pagina: paginaSegura, setPagina, datosPagina, totalPaginas, desde, hasta }
}
