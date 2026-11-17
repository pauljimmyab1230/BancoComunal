export const LONGITUD_MINIMA_PASSWORD = 10

export const MENSAJE_POLITICA_PASSWORD =
  'Mínimo 10 caracteres, con al menos una letra, un número y un símbolo.'

/** Comprueba la política de contraseñas usada por el backend. */
export function esPasswordSegura(valor: string): boolean {
  return (
    valor.length >= LONGITUD_MINIMA_PASSWORD &&
    /[a-zA-Z]/.test(valor) &&
    /\d/.test(valor) &&
    /[^a-zA-Z0-9]/.test(valor)
  )
}
