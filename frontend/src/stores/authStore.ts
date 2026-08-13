import { create } from 'zustand'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: { name: string; email: string; role?: string } | null
  isAuthenticated: boolean
  login: (token: string, user: { name: string; email: string; role?: string }, refreshToken?: string) => void
  setTokens: (token: string, refreshToken?: string) => void
  logout: () => void
}

function loadUser(): { name: string; email: string; role?: string } | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: loadUser(),
  isAuthenticated: !!localStorage.getItem('token'),
  login: (token, user, refreshToken) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    set({ token, user, refreshToken: refreshToken || null, isAuthenticated: true })
  },
  setTokens: (token, refreshToken) => {
    localStorage.setItem('token', token)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    set({ token, refreshToken: refreshToken || null })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
  },
}))
