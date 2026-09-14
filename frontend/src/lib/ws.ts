export interface StartMessage {
  type: "start"
  filename: string
  duration_seconds: number
  sample_rate: number
  total_chunks: number
  waveform_preview: number[]
  pitch_contour: { t: number; f0: number | null }[]
  spectrogram: number[][]
}

export interface ChunkMessage {
  type: "chunk"
  start_time: number
  end_time: number
  risk_score: number
  verdict: "real" | "cloned"
}

export interface FeatureContribution {
  feature: string
  suspicion: number
  weight: number
  contribution: number
  explanation: string
}

export interface ModelStartMessage {
  type: "model_start"
}

export interface ModelResult {
  available: boolean
  name: string
  fake_probability: number
  real_probability: number
  label: string
  windows_scored: number
  window_probabilities: number[]
  short_clip_warning: boolean
  error: string | null
}

export interface CompleteMessage {
  type: "complete"
  result: {
    analysis_id: string
    record_id: number
    filename: string
    duration_seconds: number
    sample_rate: number
    risk_score: number
    verdict: "real" | "cloned"
    confidence: number
    detector: "trained_model" | "heuristic_fallback"
    model: ModelResult
    heuristic: {
      risk_score: number
      verdict: "real" | "cloned"
      confidence: number
    }
    contributions: FeatureContribution[]
    raw_features: {
      f0_mean_hz: number
      f0_jitter_pct: number
      shimmer_pct: number
      hnr_db: number
      spectral_flatness: number
      spectral_flux: number
      zcr_var: number
      mfcc_delta_var: number
      formant_bw_var: number
    }
  }
}

export interface ErrorMessage {
  type: "error"
  message: string
}

export type AnalysisMessage =
  | StartMessage
  | ChunkMessage
  | ModelStartMessage
  | CompleteMessage
  | ErrorMessage

export function openAnalysisSocket(
  url: string,
  handlers: {
    onMessage: (msg: AnalysisMessage) => void
    onClose?: () => void
    onError?: () => void
  }
): () => void {
  const ws = new WebSocket(url)
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as AnalysisMessage
      handlers.onMessage(data)
    } catch {
      // ignore malformed frame
    }
  }
  ws.onclose = () => handlers.onClose?.()
  ws.onerror = () => handlers.onError?.()
  return () => ws.close()
}
