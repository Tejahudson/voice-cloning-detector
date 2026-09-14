import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Activity, BarChart3, Cpu, Fingerprint, Pause, Play, Radio, Volume2, Waves } from "lucide-react"
import { Waveform } from "@/components/analysis/Waveform"
import { Spectrogram } from "@/components/analysis/Spectrogram"
import { PitchChart } from "@/components/analysis/PitchChart"
import { RiskGauge } from "@/components/analysis/RiskGauge"
import { VerdictCard } from "@/components/analysis/VerdictCard"
import { FeatureBreakdown } from "@/components/analysis/FeatureBreakdown"
import { ChunkTimeline } from "@/components/analysis/ChunkTimeline"
import { StatTile } from "@/components/analysis/StatTile"
import { MagicCard } from "@/components/magicui/magic-card"
import { formatDuration } from "@/lib/utils"
import type { ClipState } from "@/types/clip"

export function AnalysisPanel({ clip }: { clip: ClipState }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  function handleSeek(p: number) {
    const audio = audioRef.current
    if (!audio || !duration) return
    audio.currentTime = p * duration
    setProgress(p)
  }

  const suspicionByFeature: Record<string, number> = {}
  clip.result?.contributions.forEach((c) => (suspicionByFeature[c.feature] = c.suspicion))
  const raw = clip.result?.raw_features

  return (
    <div className="space-y-5">
      <audio
        ref={audioRef}
        src={clip.objectUrl}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <MagicCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-white"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
            </button>
            <div>
              <p className="text-sm font-medium text-gray-200">{clip.file.name}</p>
              <p className="text-[11px] text-gray-500">
                {duration ? formatDuration(duration) : "…"} · {clip.start?.sample_rate ?? "—"} Hz
              </p>
            </div>
          </div>
          {(clip.status === "analyzing" || clip.status === "modeling") && (
            <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-cyan-400" />
              {clip.status === "modeling" ? "Running deep model…" : "Analyzing signal…"}
            </span>
          )}
        </div>

        {clip.start && (
          <Waveform data={clip.start.waveform_preview} progress={progress} onSeek={handleSeek} className="mb-2" />
        )}

        {clip.status !== "done" && clip.start && (
          <div className="mt-2">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-500">
              Streaming risk per ~1s chunk ({clip.chunks.length}/{clip.start.total_chunks})
            </p>
            <ChunkTimeline chunks={clip.chunks} totalChunks={clip.start.total_chunks} />
          </div>
        )}
      </MagicCard>

      {clip.status === "error" && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {clip.errorMessage ?? "Something went wrong analyzing this file."}
        </div>
      )}

      {clip.start && (
        <MagicCard className="p-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">Spectrogram</p>
          <Spectrogram data={clip.start.spectrogram} progress={progress} />
        </MagicCard>
      )}

      {clip.start && clip.start.pitch_contour.length > 0 && (
        <MagicCard className="p-5">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-gray-500">Pitch (F0) contour</p>
          <PitchChart data={clip.start.pitch_contour} />
        </MagicCard>
      )}

      {clip.result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-2">
          <MagicCard className="flex flex-col items-center justify-center gap-4 p-6">
            <RiskGauge score={clip.result.risk_score} verdict={clip.result.verdict} />
            <VerdictCard verdict={clip.result.verdict} confidence={clip.result.confidence} className="w-full" />

            <div className="w-full space-y-1.5 border-t border-white/10 pt-3 text-[11px] text-gray-500">
              {clip.result.detector === "trained_model" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Cpu className="h-3 w-3 text-cyan-400" />
                      Trained model verdict
                    </span>
                    <span className="tabular-nums text-gray-300">
                      {(clip.result.model.fake_probability * 100).toFixed(1)}% AI-generated
                    </span>
                  </div>
                  <p className="truncate text-gray-600" title={clip.result.model.name}>
                    {clip.result.model.name} · {clip.result.model.windows_scored} window
                    {clip.result.model.windows_scored === 1 ? "" : "s"} scored
                  </p>
                  {clip.result.model.short_clip_warning && (
                    <p className="text-amber-400/80">
                      Clip is under 2.5s — the model is less reliable on very short audio.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-amber-400/80">
                  Trained model unavailable — fell back to the heuristic scorer, which is much less reliable.
                  {clip.result.model.error ? ` (${clip.result.model.error})` : ""}
                </p>
              )}
            </div>
          </MagicCard>

          <MagicCard className="p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Signal characteristics</p>
              <p className="text-[11px] text-gray-600">secondary · heuristic</p>
            </div>
            <p className="mb-3 text-[11px] leading-snug text-gray-500">
              Classic forensics features shown for explainability. They did not decide the verdict above —
              this heuristic scored{" "}
              <span className="text-gray-400">
                {clip.result.heuristic.risk_score.toFixed(0)}/100 ({clip.result.heuristic.verdict})
              </span>{" "}
              and is unreliable against high-quality modern clones.
            </p>
            <FeatureBreakdown contributions={clip.result.contributions} />
          </MagicCard>

          {raw && (
            <div className="grid grid-cols-2 gap-3 lg:col-span-2 sm:grid-cols-4">
              <StatTile
                label="Pitch jitter"
                value={`${raw.f0_jitter_pct.toFixed(2)}%`}
                icon={Activity}
                suspicious={(suspicionByFeature.f0_jitter_pct ?? 0) >= 0.6}
                hint="Cycle-to-cycle pitch instability. Very low = suspicious."
              />
              <StatTile
                label="Amplitude shimmer"
                value={`${raw.shimmer_pct.toFixed(2)}%`}
                icon={Volume2}
                suspicious={(suspicionByFeature.shimmer_pct ?? 0) >= 0.6}
                hint="Frame-to-frame loudness variation. Very low = suspicious."
              />
              <StatTile
                label="Harmonics-to-noise"
                value={`${raw.hnr_db.toFixed(1)} dB`}
                icon={Waves}
                suspicious={(suspicionByFeature.hnr_db ?? 0) >= 0.6}
                hint="Unusually clean (high) signal can indicate synthesis."
              />
              <StatTile
                label="Timbre dynamics"
                value={raw.mfcc_delta_var.toFixed(2)}
                icon={Fingerprint}
                suspicious={(suspicionByFeature.mfcc_delta_var ?? 0) >= 0.6}
                hint="Frame-to-frame timbre (MFCC) variation. Very low = over-smoothed."
              />
              <StatTile
                label="Spectral flux"
                value={raw.spectral_flux.toFixed(3)}
                icon={BarChart3}
                suspicious={(suspicionByFeature.spectral_flux ?? 0) >= 0.6}
                hint="How much the spectrum shifts frame-to-frame."
              />
              <StatTile
                label="ZCR variance"
                value={raw.zcr_var.toFixed(4)}
                icon={Radio}
                suspicious={(suspicionByFeature.zcr_var ?? 0) >= 0.6}
                hint="Zero-crossing rate irregularity, typical of real mic noise."
              />
              <StatTile
                label="Formant stability"
                value={raw.formant_bw_var.toFixed(0)}
                icon={Fingerprint}
                suspicious={(suspicionByFeature.formant_bw_var ?? 0) >= 0.6}
                hint="Vocal-tract resonance bandwidth variance across frames."
              />
              <StatTile
                label="Mean pitch"
                value={raw.f0_mean_hz ? `${raw.f0_mean_hz.toFixed(0)} Hz` : "—"}
                icon={Activity}
                hint="Average fundamental frequency across voiced frames."
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
