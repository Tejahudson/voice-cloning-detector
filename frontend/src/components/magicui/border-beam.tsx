import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  duration?: number
  colorFrom?: string
  colorTo?: string
}

export function BorderBeam({
  className,
  duration = 6,
  colorFrom = "#22d3ee",
  colorTo = "#a78bfa",
}: BorderBeamProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-[inherit] [mask:linear-gradient(#fff,#fff)_content-box,linear-gradient(#fff,#fff)] [mask-composite:exclude] p-px"
        style={{
          background: `conic-gradient(from 0deg, transparent, ${colorFrom}, ${colorTo}, transparent 30%)`,
          animation: `spin ${duration}s linear infinite`,
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
