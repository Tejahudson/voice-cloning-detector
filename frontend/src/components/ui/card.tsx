import { useRef, type HTMLAttributes, type MouseEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Flat panel. Depth comes from a hairline border and a tonal step, never shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-hairline bg-surface", className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-5", className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[15px] font-semibold text-ink", className)} {...props} />
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[11px] font-medium uppercase tracking-[0.09em] text-faint", className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />
}

/**
 * Card that tilts toward the cursor in real 3D. The perspective lives on the
 * wrapper so the rotation reads as depth rather than a flat skew.
 */
export function TiltCard({
  children,
  className,
  intensity = 5,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${px * intensity}deg) rotateX(${-py * intensity}deg) translateZ(4px)`
  }

  function reset() {
    const el = ref.current
    if (el) el.style.transform = ""
  }

  return (
    <div className="scene" {...rest}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        className={cn("tilt rounded-lg border border-hairline bg-surface", className)}
      >
        {children}
      </div>
    </div>
  )
}
