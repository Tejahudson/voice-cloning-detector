import { NumberTicker } from "@/components/magicui/number-ticker"
import { cn } from "@/lib/utils"

interface RiskGaugeProps {
  score: number // 0-100
  verdict?: "real" | "cloned"
  className?: string
}

function colorFor(score: number) {
  if (score < 40) return { stroke: "#34d399", glow: "rgba(52,211,153,0.45)", label: "text-emerald-400" }
  if (score < 65) return { stroke: "#fbbf24", glow: "rgba(251,191,36,0.45)", label: "text-amber-400" }
  return { stroke: "#fb7185", glow: "rgba(251,113,133,0.45)", label: "text-rose-400" }
}

export function RiskGauge({ score, verdict, className }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score))
  const radius = 70
  const circumference = Math.PI * radius // half circle
  const offset = circumference * (1 - clamped / 100)
  const { stroke, glow, label } = colorFor(clamped)

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ filter: `drop-shadow(0 0 18px ${glow})` }}>
        <svg width="180" height="100" viewBox="0 0 180 100">
          <path
            d="M 10 90 A 70 70 0 0 1 170 90"
            fill="none"
            stroke="#1c2333"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 10 90 A 70 70 0 0 1 170 90"
            fill="none"
            stroke={stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1), stroke 0.5s" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
          <span className={cn("text-4xl font-bold tabular-nums text-white")}>
            <NumberTicker value={clamped} decimals={0} />
          </span>
          <span className="text-[11px] uppercase tracking-wider text-gray-500">risk score</span>
        </div>
      </div>
      {verdict && (
        <span className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", label)}>
          {verdict === "cloned" ? "Likely Cloned" : "Likely Real"}
        </span>
      )}
    </div>
  )
}
