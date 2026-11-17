import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Filtros y página que un listado puede persistir en la URL. */
export interface FiltrosListado {
  page: number
  search: string
  estado: string
  rol: string
  tipo: string
  periodo: string
}

const CLAVES_TEXTO = ['search', 'estado', 'rol', 'tipo', 'periodo'] as const

/**
 * Sincroniza los filtros y la página de un listado con la URL (claves con prefijo).
 * Así, al recargar o compartir el enlace se conservan los filtros.
 */
export function useFiltrosUrl(prefijo: string) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filtros = useMemo<FiltrosListado>(() => {
    const leer = (clave: string) => searchParams.get(`${prefijo}_${clave}`) ?? ''
    return {
      page: Math.max(1, Number(searchParams.get(`${prefijo}_page`)) || 1),
      search: leer('search'),
      estado: leer('estado'),
      rol: leer('rol'),
      tipo: leer('tipo'),
      periodo: leer('periodo'),
    }
  }, [searchParams, prefijo])

  const actualizar = useCallback(
    (cambios: Partial<FiltrosListado>) => {
      setSearchParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)

          for (const clave of CLAVES_TEXTO) {
            if (!(clave in cambios)) continue
            const valor = cambios[clave as keyof FiltrosListado]
            const nombre = `${prefijo}_${clave}`
            if (valor === undefined || valor === '') siguientes.delete(nombre)
            else siguientes.set(nombre, String(valor))
          }

          if ('page' in cambios) {
            const pagina = Number(cambios.page)
            if (!pagina || pagina <= 1) siguientes.delete(`${prefijo}_page`)
            else siguientes.set(`${prefijo}_page`, String(pagina))
          } else {
            // Al cambiar un filtro (no la página) se vuelve a la primera página.
            siguientes.delete(`${prefijo}_page`)
          }

          return siguientes
        },
        { replace: true }
      )
    },
    [prefijo, setSearchParams]
  )

  const limpiar = useCallback(() => {
    setSearchParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos)
        siguientes.delete(`${prefijo}_page`)
        for (const clave of CLAVES_TEXTO) siguientes.delete(`${prefijo}_${clave}`)
        return siguientes
      },
      { replace: true }
    )
  }, [prefijo, setSearchParams])

  return { ...filtros, actualizar, limpiar }
}
