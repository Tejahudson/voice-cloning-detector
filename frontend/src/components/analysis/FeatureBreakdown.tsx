import type { FeatureContribution } from "@/lib/ws"
import { cn } from "@/lib/utils"

const FEATURE_LABELS: Record<string, string> = {
  f0_jitter_pct: "Pitch jitter",
  shimmer_pct: "Amplitude shimmer",
  mfcc_delta_var: "Timbre dynamics",
  spectral_flux: "Spectral flux",
  zcr_var: "Zero-crossing variance",
  formant_bw_var: "Formant stability",
  hnr_db: "Harmonics-to-noise ratio",
}

export function FeatureBreakdown({ contributions }: { contributions: FeatureContribution[] }) {
  return (
    <div className="space-y-3">
      {contributions.map((c) => {
        const pct = Math.round(c.suspicion * 100)
        return (
          <div key={c.feature}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-200">{FEATURE_LABELS[c.feature] ?? c.feature}</span>
              <span className={cn("tabular-nums", pct >= 60 ? "text-rose-400" : "text-gray-500")}>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  pct >= 60 ? "bg-gradient-to-r from-rose-500 to-amber-400" : "bg-gradient-to-r from-cyan-500 to-blue-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">{c.explanation}</p>
          </div>
        )
      })}
    </div>
  )
}
