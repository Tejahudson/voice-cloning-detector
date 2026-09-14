import type { ComponentType, SVGProps } from "react"
import { cn } from "@/lib/utils"

export function StatTile({
  label,
  value,
  icon: Icon,
  suspicious,
  hint,
}: {
  label: string
  value: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  suspicious?: boolean
  hint?: string
}) {
  return (
    <div className="group relative rounded-md border border-hairline bg-canvas p-3.5">
      <div className="flex items-center justify-between">
        <Icon className={cn("text-base", suspicious ? "text-caution" : "text-accent")} />
        {suspicious && <span className="h-1.5 w-1.5 rounded-full bg-caution" />}
      </div>
      <p className="mt-2.5 text-[17px] font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[11px] text-faint">{label}</p>
      {hint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-2 hidden rounded border border-hairline bg-surface p-2 text-[11px] leading-snug text-muted group-hover:block">
          {hint}
        </div>
      )}
    </div>
  )
}
