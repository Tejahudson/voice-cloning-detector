import type { FeatureContribution } from "@/lib/ws"

const LABELS: Record<string, string> = {
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
    <div className="divide-y divide-hairline">
      {contributions.map((c) => {
        const pct = Math.round(c.suspicion * 100)
        return (
          <div key={c.feature} className="py-3 first:pt-0 last:pb-0">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
              <span className="font-medium text-ink">{LABELS[c.feature] ?? c.feature}</span>
              <span className="tabular-nums text-muted">{pct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-raised">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= 60 ? "var(--c-caution)" : "var(--c-accent)",
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{c.explanation}</p>
          </div>
        )
      })}
    </div>
  )
}
