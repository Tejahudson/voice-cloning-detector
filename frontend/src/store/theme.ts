import { create } from "zustand"

export type Theme = "light" | "dark"

const STORAGE_KEY = "voiceguard.theme"

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // storage unavailable — fall through to system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // non-fatal: theme just won't persist across reloads
  }
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  set: (theme: Theme) => void
}

const startingTheme = initialTheme()
applyTheme(startingTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: startingTheme,
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark"
    applyTheme(next)
    set({ theme: next })
  },
  set: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
}))
