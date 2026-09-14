import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Marquee({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("group flex overflow-hidden [--gap:2rem]", className)}>
      <div className="flex shrink-0 animate-marquee items-center gap-[var(--gap)] group-hover:[animation-play-state:paused]">
        {children}
      </div>
      <div
        className="flex shrink-0 animate-marquee items-center gap-[var(--gap)] group-hover:[animation-play-state:paused]"
        aria-hidden
      >
        {children}
      </div>
    </div>
  )
}
