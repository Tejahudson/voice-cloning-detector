export interface PendingUploadResponse {
  analysis_id: string
  filename: string
}

export interface HistoryItem {
  id: number
  filename: string
  duration_seconds: number
  risk_score: number
  verdict: "real" | "cloned"
  confidence: number
  detector: "trained_model" | "heuristic_fallback"
  created_at: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Where the API lives, resolved in priority order:
 *
 *   1. a runtime override saved in localStorage
 *   2. VITE_API_BASE_URL baked in at build time
 *   3. same origin — dev (Vite proxies /api and /ws) and single-container deploys
 *
 * The runtime override exists because a free Cloudflare quick-tunnel hands out
 * a new hostname every restart. Without it, a frontend hosted separately would
 * need rebuilding each time the tunnel comes back up.
 */
const STORAGE_KEY = "voiceguard.apiBase"
const BUILD_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")

const trim = (u: string) => u.trim().replace(/\/$/, "")

export function getApiBase(): string {
  try {
    const override = localStorage.getItem(STORAGE_KEY)
    if (override) return trim(override)
  } catch {
    // storage unavailable — fall through to the build-time value
  }
  return BUILD_BASE
}

export function setApiBase(url: string) {
  try {
    if (url.trim()) localStorage.setItem(STORAGE_KEY, trim(url))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // non-fatal: the override just won't survive a reload
  }
}

/** True when the frontend has to be told where the backend is. */
export function needsApiBase(): boolean {
  return !getApiBase() && !import.meta.env.DEV && window.location.port !== "7860"
}

export async function checkHealth(base?: string): Promise<boolean> {
  const target = base === undefined ? getApiBase() : trim(base)
  try {
    const res = await fetch(`${target}/api/health`, { method: "GET" })
    return res.ok
  } catch {
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(`${getApiBase()}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON; keep the status text
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  uploadForAnalysis: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return request<PendingUploadResponse>("/api/analyze/upload", { method: "POST", body: form })
  },

  history: () => request<HistoryItem[]>("/api/history"),

  deleteHistoryItem: (id: number) => request<void>(`/api/history/${id}`, { method: "DELETE" }),
}

export function analysisSocketUrl(analysisId: string): string {
  const base = getApiBase()
  const origin = base
    ? base.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
  return `${origin}/ws/analyze/${analysisId}`
}
