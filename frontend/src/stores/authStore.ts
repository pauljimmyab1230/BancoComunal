import { create } from 'zustand'

const URL_API = import.meta.env.VITE_API_URL || '/api'

export interface UsuarioSesion {
  name: string
  email: string
  role?: string
  cambiarPassword?: boolean
}

interface AuthState {
  user: UsuarioSesion | null
  isAuthenticated: boolean
  verificandoSesion: boolean
  login: (user: UsuarioSesion) => void
  actualizarUsuario: (user: UsuarioSesion) => void
  restaurarSesion: () => Promise<boolean>
  logout: () => Promise<void>
}

function cargarUsuario(): UsuarioSesion | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null
  } catch {
    return null
  }
}

function guardarUsuario(user: UsuarioSesion): void {
  localStorage.setItem('user', JSON.stringify(user))
}

function mapearUsuario(data: Record<string, unknown> | undefined): UsuarioSesion | null {
  if (!data) return null
  return {
    name: String(data.nombres ?? data.name ?? ''),
    email: String(data.correo ?? data.email ?? ''),
    role: data.rol as string | undefined,
    cambiarPassword: Boolean(data.cambiarPassword),
  }
}

async function llamarSesion(ruta: string, method: string): Promise<UsuarioSesion | null> {
  // fetch directo: usar el cliente api dispararia el interceptor 401 en bucle
  const res = await fetch(`${URL_API}/configuracion/${ruta}`, {
    method,
    credentials: 'include',
  })
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  return mapearUsuario(body?.data?.user)
}

export const useAuthStore = create<AuthState>((set) => ({
  user: cargarUsuario(),
  isAuthenticated: !!cargarUsuario(),
  verificandoSesion: false,

  login: (user) => {
    guardarUsuario(user)
    set({ user, isAuthenticated: true })
  },

  actualizarUsuario: (user) => {
    guardarUsuario(user)
    set({ user })
  },

  restaurarSesion: async () => {
    const actual = cargarUsuario()
    if (actual) {
      set({ user: actual, isAuthenticated: true, verificandoSesion: false })
      return true
    }
    set({ verificandoSesion: true })
    try {
      // Las cookies httpOnly viajan solas: si hay una sesión viva, esto la restaura.
      const user = await llamarSesion('refresh-token', 'POST')
      if (user) {
        guardarUsuario(user)
        set({ user, isAuthenticated: true, verificandoSesion: false })
        return true
      }
    } catch {
      // Sin sesión: se cierra abajo
    }
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false, verificandoSesion: false })
    return false
  },

  logout: async () => {
    try {
      await llamarSesion('logout', 'POST')
    } catch {
      // Sin sesión activa: el cierre se ignora
    }
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false, verificandoSesion: false })
  },
}))
