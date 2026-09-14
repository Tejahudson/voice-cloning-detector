import { NumberTicker } from "@/components/ui/number-ticker"
import { cn } from "@/lib/utils"

/**
 * Layered dial. Depth comes from stacked concentric arcs at decreasing opacity
 * plus a slight 3D tilt — not from shadow, which the design brief rules out.
 */
export function RiskGauge({
  score,
  verdict,
  className,
}: {
  score: number
  verdict?: "real" | "cloned"
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 70
  const circumference = Math.PI * radius
  const offset = circumference * (1 - clamped / 100)
  const tone = clamped >= 50 ? "var(--c-cloned)" : "var(--c-authentic)"

  return (
    <div className={cn("scene flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ transform: "rotateX(14deg)", transformStyle: "preserve-3d" }}
      >
        <svg width="190" height="108" viewBox="0 0 190 108">
          {/* depth plates */}
          <path
            d="M 15 95 A 70 70 0 0 1 175 95"
            fill="none"
            stroke="var(--c-hairline)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.45"
            transform="translate(0,6)"
          />
          <path
            d="M 15 95 A 70 70 0 0 1 175 95"
            fill="none"
            stroke="var(--c-hairline)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.75"
            transform="translate(0,3)"
          />
          {/* track */}
          <path
            d="M 15 95 A 70 70 0 0 1 175 95"
            fill="none"
            stroke="var(--c-raised)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* value */}
          <path
            d="M 15 95 A 70 70 0 0 1 175 95"
            fill="none"
            stroke={tone}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.4s" }}
          />
        </svg>

        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <span className="text-[34px] leading-none font-semibold tabular-nums text-ink">
            <NumberTicker value={clamped} />
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
            risk score
          </span>
        </div>
      </div>

      {verdict && (
        <span
          className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: tone }}
        >
          {verdict === "cloned" ? "Likely cloned" : "Likely authentic"}
        </span>
      )}
    </div>
  )
}
