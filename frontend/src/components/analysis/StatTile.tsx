import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  value: string
  icon: LucideIcon
  suspicious?: boolean
  hint?: string
}

export function StatTile({ label, value, icon: Icon, suspicious, hint }: StatTileProps) {
  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", suspicious ? "text-rose-400" : "text-cyan-400")} />
        {suspicious && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
      </div>
      <p className="mt-2 text-lg font-semibold text-white tabular-nums">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 hidden rounded-lg border border-white/10 bg-[#0b0f1a] p-2 text-[11px] leading-snug text-gray-300 shadow-xl group-hover:block">
          {hint}
        </div>
      )}
    </div>
  )
}
