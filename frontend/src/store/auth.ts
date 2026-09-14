import { create } from "zustand"
import { api } from "@/lib/api"

interface AuthState {
  token: string | null
  email: string | null
  status: "idle" | "loading" | "error"
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const STORAGE_KEY = "voiceguard.auth"

function loadStored(): { token: string; email: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persist(token: string | null, email: string | null) {
  try {
    if (token && email) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable — session-only auth for this tab
  }
}

const stored = loadStored()

export const useAuthStore = create<AuthState>((set) => ({
  token: stored?.token ?? null,
  email: stored?.email ?? null,
  status: "idle",
  error: null,

  login: async (email, password) => {
    set({ status: "loading", error: null })
    try {
      const res = await api.login(email, password)
      persist(res.access_token, res.email)
      set({ token: res.access_token, email: res.email, status: "idle" })
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Login failed" })
      throw err
    }
  },

  signup: async (email, password) => {
    set({ status: "loading", error: null })
    try {
      const res = await api.signup(email, password)
      persist(res.access_token, res.email)
      set({ token: res.access_token, email: res.email, status: "idle" })
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Signup failed" })
      throw err
    }
  },

  logout: () => {
    persist(null, null)
    set({ token: null, email: null })
  },

  clearError: () => set({ error: null }),
}))
