import { IconShieldAlert, IconShieldCheck } from "@/components/icons"
import { cn } from "@/lib/utils"

export function VerdictCard({
  verdict,
  confidence,
  className,
}: {
  verdict: "real" | "cloned"
  confidence: number
  className?: string
}) {
  const cloned = verdict === "cloned"
  const tone = cloned ? "var(--c-cloned)" : "var(--c-authentic)"

  return (
    <div
      className={cn("flex items-center gap-3.5 rounded-md border px-4 py-3.5", className)}
      style={{ borderColor: tone, backgroundColor: `color-mix(in srgb, ${tone} 8%, transparent)` }}
    >
      <span className="text-xl" style={{ color: tone }}>
        {cloned ? <IconShieldAlert /> : <IconShieldCheck />}
      </span>
      <div>
        <p className="text-[14px] font-semibold" style={{ color: tone }}>
          {cloned ? "Likely AI-cloned voice" : "Likely authentic voice"}
        </p>
        <p className="text-[12px] text-muted">{confidence.toFixed(0)}% confidence in this verdict</p>
      </div>
    </div>
  )
}
