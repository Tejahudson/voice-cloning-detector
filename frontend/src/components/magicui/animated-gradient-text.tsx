import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AnimatedGradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-shimmer bg-[linear-gradient(110deg,#22d3ee,35%,#a78bfa,65%,#22d3ee)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  )
}
