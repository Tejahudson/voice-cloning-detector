export interface TokenResponse {
  access_token: string
  token_type: string
  email: string
}

export interface MeResponse {
  id: number
  email: string
}

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

const BASE = ""

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  signup: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) => request<MeResponse>("/api/auth/me", {}, token),

  uploadForAnalysis: (file: File, token: string) => {
    const form = new FormData()
    form.append("file", file)
    return request<PendingUploadResponse>("/api/analyze/upload", { method: "POST", body: form }, token)
  },

  history: (token: string) => request<HistoryItem[]>("/api/history", {}, token),

  deleteHistoryItem: (id: number, token: string) =>
    request<void>(`/api/history/${id}`, { method: "DELETE" }, token),
}

export function analysisSocketUrl(analysisId: string, token: string): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/ws/analyze/${analysisId}?token=${encodeURIComponent(token)}`
}
