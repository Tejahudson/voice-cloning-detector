import { ShieldAlert, ShieldCheck } from "lucide-react"
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
  const isCloned = verdict === "cloned"
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border px-5 py-4",
        isCloned ? "border-rose-500/30 bg-rose-500/10" : "border-emerald-500/30 bg-emerald-500/10",
        className
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          isCloned ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
        )}
      >
        {isCloned ? <ShieldAlert className="h-5.5 w-5.5" /> : <ShieldCheck className="h-5.5 w-5.5" />}
      </div>
      <div>
        <p className={cn("font-semibold", isCloned ? "text-rose-300" : "text-emerald-300")}>
          {isCloned ? "Likely AI-Cloned Voice" : "Likely Authentic Voice"}
        </p>
        <p className="text-xs text-gray-400">{confidence.toFixed(0)}% confidence in this verdict</p>
      </div>
    </div>
  )
}
