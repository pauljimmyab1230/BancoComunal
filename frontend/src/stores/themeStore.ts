import { create } from 'zustand'

export type Tema = 'light' | 'dark'

const CLAVE_TEMA = 'banquito-tema'

function temaInicial(): Tema {
  if (typeof window === 'undefined') return 'light'
  const guardado = localStorage.getItem(CLAVE_TEMA)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  raiz.classList.toggle('dark', tema === 'dark')
  raiz.style.colorScheme = tema
}

interface ThemeState {
  tema: Tema
  alternarTema: () => void
  establecerTema: (tema: Tema) => void
}

// Aplica el tema de inmediato (antes del primer render para evitar parpadeo).
const temaActual = temaInicial()
aplicarTema(temaActual)

export const useThemeStore = create<ThemeState>((set, get) => ({
  tema: temaActual,

  alternarTema: () => {
    const siguiente: Tema = get().tema === 'dark' ? 'light' : 'dark'
    aplicarTema(siguiente)
    localStorage.setItem(CLAVE_TEMA, siguiente)
    set({ tema: siguiente })
  },

  establecerTema: (tema) => {
    aplicarTema(tema)
    localStorage.setItem(CLAVE_TEMA, tema)
    set({ tema })
  },
}))
