import { useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  IconChip,
  IconPause,
  IconPlay,
  IconWaveform,
} from "@/components/icons"
import { Waveform } from "@/components/analysis/Waveform"
import { Spectrogram } from "@/components/analysis/Spectrogram"
import { PitchChart } from "@/components/analysis/PitchChart"
import { RiskGauge } from "@/components/analysis/RiskGauge"
import { VerdictCard } from "@/components/analysis/VerdictCard"
import { FeatureBreakdown } from "@/components/analysis/FeatureBreakdown"
import { ChunkTimeline } from "@/components/analysis/ChunkTimeline"
import { StatTile } from "@/components/analysis/StatTile"
import { Card, CardLabel, TiltCard } from "@/components/ui/card"
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

  const suspicion: Record<string, number> = {}
  clip.result?.contributions.forEach((c) => (suspicion[c.feature] = c.suspicion))
  const raw = clip.result?.raw_features
  const busy = clip.status === "analyzing" || clip.status === "modeling"

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        src={clip.objectUrl}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) =>
          setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)
        }
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <Card className="p-5" data-tour="player">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={togglePlay}
              className="press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-base text-[var(--c-accent-ink)] transition hover:brightness-110"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{clip.file.name}</p>
              <p className="text-[11px] text-faint">
                {duration ? formatDuration(duration) : "—"} · {clip.start?.sample_rate ?? "—"} Hz
              </p>
            </div>
          </div>

          {busy && (
            <span className="flex shrink-0 items-center gap-2 rounded border border-hairline px-2.5 py-1 text-[11px] font-medium text-muted">
              <span className="h-1.5 w-1.5 animate-ring-pulse rounded-full bg-accent" />
              {clip.status === "modeling" ? "Running model" : "Reading signal"}
            </span>
          )}
        </div>

        {clip.start && (
          <Waveform data={clip.start.waveform_preview} progress={progress} onSeek={handleSeek} />
        )}

        {clip.status !== "done" && clip.start && (
          <div className="mt-4">
            <CardLabel className="mb-2">
              Streaming risk · {clip.chunks.length}/{clip.start.total_chunks} chunks
            </CardLabel>
            <ChunkTimeline chunks={clip.chunks} totalChunks={clip.start.total_chunks} />
          </div>
        )}
      </Card>

      {clip.status === "error" && (
        <div className="rounded-md border border-cloned px-4 py-3 text-[13px] text-cloned">
          {clip.errorMessage ?? "Something went wrong analysing this file."}
        </div>
      )}

      {clip.result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <TiltCard className="flex flex-col items-center justify-center gap-4 p-6" data-tour="verdict">
            <RiskGauge score={clip.result.risk_score} verdict={clip.result.verdict} />
            <VerdictCard
              verdict={clip.result.verdict}
              confidence={clip.result.confidence}
              className="w-full"
            />

            <div className="w-full space-y-1.5 border-t border-hairline pt-3 text-[11px]">
              {clip.result.detector === "trained_model" ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-muted">
                      <IconChip className="text-sm text-accent" />
                      Trained model
                    </span>
                    <span className="tabular-nums text-ink">
                      {(clip.result.model.fake_probability * 100).toFixed(1)}% AI-generated
                    </span>
                  </div>
                  <p className="truncate text-faint" title={clip.result.model.name}>
                    {clip.result.model.name} · {clip.result.model.windows_scored} window
                    {clip.result.model.windows_scored === 1 ? "" : "s"}
                  </p>
                  {clip.result.model.short_clip_warning && (
                    <p className="text-caution">
                      Under 2.5s — the model is less reliable on very short audio.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-caution">
                  Trained model unavailable — fell back to the heuristic, which is much less reliable.
                </p>
              )}
            </div>
          </TiltCard>

          <TiltCard className="p-5" data-tour="explain">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <CardLabel>Signal characteristics</CardLabel>
              <span className="text-[11px] text-faint">secondary</span>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-faint">
              Forensic measurements shown for explanation. They did not set the verdict — the
              heuristic that combines them scored this{" "}
              <span className="text-muted">
                {clip.result.heuristic.risk_score.toFixed(0)}/100 ({clip.result.heuristic.verdict})
              </span>
              .
            </p>
            <FeatureBreakdown contributions={clip.result.contributions} />
          </TiltCard>

          {raw && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-2">
              <StatTile
                label="Pitch jitter"
                value={`${raw.f0_jitter_pct.toFixed(2)}%`}
                icon={IconWaveform}
                suspicious={(suspicion.f0_jitter_pct ?? 0) >= 0.6}
                hint="Cycle-to-cycle pitch instability. Very low reads as synthetic."
              />
              <StatTile
                label="Amplitude shimmer"
                value={`${raw.shimmer_pct.toFixed(2)}%`}
                icon={IconWaveform}
                suspicious={(suspicion.shimmer_pct ?? 0) >= 0.6}
                hint="Frame-to-frame loudness variation. Very low reads as synthetic."
              />
              <StatTile
                label="Harmonics-to-noise"
                value={`${raw.hnr_db.toFixed(1)} dB`}
                icon={IconWaveform}
                suspicious={(suspicion.hnr_db ?? 0) >= 0.6}
                hint="An unusually clean signal can indicate synthesis."
              />
              <StatTile
                label="Timbre dynamics"
                value={raw.mfcc_delta_var.toFixed(2)}
                icon={IconChip}
                suspicious={(suspicion.mfcc_delta_var ?? 0) >= 0.6}
                hint="MFCC variation between frames. Very low means over-smoothed."
              />
              <StatTile
                label="Spectral flux"
                value={raw.spectral_flux.toFixed(3)}
                icon={IconChip}
                suspicious={(suspicion.spectral_flux ?? 0) >= 0.6}
                hint="How much the spectrum shifts frame to frame."
              />
              <StatTile
                label="ZCR variance"
                value={raw.zcr_var.toFixed(4)}
                icon={IconChip}
                suspicious={(suspicion.zcr_var ?? 0) >= 0.6}
                hint="Zero-crossing irregularity, typical of a real microphone signal."
              />
              <StatTile
                label="Formant stability"
                value={raw.formant_bw_var.toFixed(0)}
                icon={IconChip}
                suspicious={(suspicion.formant_bw_var ?? 0) >= 0.6}
                hint="Vocal-tract resonance bandwidth variance across frames."
              />
              <StatTile
                label="Mean pitch"
                value={raw.f0_mean_hz ? `${raw.f0_mean_hz.toFixed(0)} Hz` : "—"}
                icon={IconWaveform}
                hint="Average fundamental frequency across voiced frames."
              />
            </div>
          )}
        </motion.div>
      )}

      {clip.start && (
        <Card className="p-5">
          <CardLabel className="mb-2">Spectrogram</CardLabel>
          <Spectrogram data={clip.start.spectrogram} progress={progress} />
        </Card>
      )}

      {clip.start && clip.start.pitch_contour.length > 0 && (
        <Card className="p-5">
          <CardLabel className="mb-1">Pitch (F0) contour</CardLabel>
          <PitchChart data={clip.start.pitch_contour} />
        </Card>
      )}
    </div>
  )
}
