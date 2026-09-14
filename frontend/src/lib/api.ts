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
 * Empty in development (Vite proxies /api and /ws to the backend) and in
 * same-origin deployments where a reverse proxy fronts both. Set
 * VITE_API_BASE_URL at build time to point the bundle at a backend on
 * another origin, e.g. https://api.example.com
 */
const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
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
  const origin = BASE
    ? BASE.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`
  return `${origin}/ws/analyze/${analysisId}`
}
