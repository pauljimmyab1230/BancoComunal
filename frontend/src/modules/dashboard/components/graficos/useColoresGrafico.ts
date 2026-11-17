import { useThemeStore } from '@/stores/themeStore'

/** Paleta de colores para los gráficos (marca + estados). */
export const PALETA_GRAFICOS = [
  '#6366f1',
  '#22d3ee',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
]

/**
 * Colores para Chart.js que siguen el tema claro/oscuro del sistema.
 * Se re-evalúan en cada render, así los gráficos se recolorean al alternar el tema.
 */
export function useColoresGrafico() {
  const tema = useThemeStore((estado) => estado.tema)
  const esOscuro = tema === 'dark'

  return {
    esOscuro,
    texto: esOscuro ? '#9aa5b8' : '#5b6472',
    grid: esOscuro ? '#263146' : '#e2e8f0',
    superficie: esOscuro ? '#131a2a' : '#ffffff',
    paleta: PALETA_GRAFICOS,
  }
}
